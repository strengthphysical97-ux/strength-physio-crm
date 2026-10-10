const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const User = require("../models/User");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");

// ADD LEAD
router.post("/", authMiddleware, async (req, res) => {
  try {
    let assignedTo = req.user.role === "admin" ? null : req.user.userId;

    if (req.user.role === "admin" && req.body.assignedTo) {
      const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
      if (!staff) return res.status(400).json({ success: false, message: "Selected staff member not found" });
      assignedTo = staff._id;
    }

    const lead = new Lead({
      name: req.body.name,
      phone: req.body.phone,
      ...(String(req.body.email || "").trim() ? { email: String(req.body.email).trim() } : {}),
      product: req.body.product,
      source: req.body.source,
      sourceType: req.body.sourceType || "",
      campaignName: req.body.campaignName || "",
      status: req.body.status,
      followUpDate: req.body.followUpDate,
      notes: req.body.notes,
      createdBy: req.user.userId,
      assignedTo,
      assignedAt: new Date()
    });

    const savedLead = await lead.save();
    const populated = await Lead.findById(savedLead._id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    await AuditLog.create({action:"CREATE",entity:"Lead",entityId:populated._id,user:req.user.userId,details:`Lead ${populated.name}`});
    res.status(201).json({ success: true, message: "Lead added successfully", lead: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET LEADS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? {}
      : { $or: [{ assignedTo: req.user.userId }, { assignedTo: { $in: [null] }, createdBy: req.user.userId }] };

    const leads = await Lead.find(filter)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE LEAD
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const existing = await Lead.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Lead not found" });

    const canEdit = req.user.role === "admin" ||
      String(existing.assignedTo || existing.createdBy) === String(req.user.userId) ||
      String(existing.createdBy) === String(req.user.userId);

    if (!canEdit) return res.status(403).json({ success: false, message: "Access denied" });

    const update = {
      name: req.body.name,
      phone: req.body.phone,
      ...(String(req.body.email || "").trim() ? { email: String(req.body.email).trim() } : {}),
      product: req.body.product,
      source: req.body.source,
      sourceType: req.body.sourceType || "",
      campaignName: req.body.campaignName || "",
      status: req.body.status,
      followUpDate: req.body.followUpDate,
      notes: req.body.notes
    };

    if (req.user.role === "admin" && req.body.assignedTo !== undefined) {
      if (!req.body.assignedTo) {
        update.assignedTo = null;
        update.assignedAt = null;
      } else {
        const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
        if (!staff) return res.status(400).json({ success: false, message: "Selected staff member not found" });
        update.assignedTo = staff._id;
        update.assignedAt = new Date();
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    await AuditLog.create({action:"UPDATE",entity:"Lead",entityId:updatedLead._id,user:req.user.userId,details:"Lead details updated"});
    res.json({ success: true, message: "Lead updated successfully", lead: updatedLead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN: QUICK REASSIGN
router.patch("/:id/assign", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
    if (!staff) return res.status(400).json({ success: false, message: "Staff member not found" });

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedTo: staff._id, assignedAt: new Date() },
      { new: true }
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    await AuditLog.create({action:"ASSIGN",entity:"Lead",entityId:lead._id,user:req.user.userId,details:`Lead assigned to ${staff.name}`});
    res.json({ success: true, message: `Lead assigned to ${staff.name}`, lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE LEAD
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    let deletedLead;
    if (req.user.role === "admin") {
      deletedLead = await Lead.findByIdAndDelete(req.params.id);
    } else {
      deletedLead = await Lead.findOneAndDelete({
        _id: req.params.id,
        $or: [{ assignedTo: req.user.userId }, { createdBy: req.user.userId }]
      });
    }

    if (!deletedLead) return res.status(404).json({ success: false, message: "Lead not found or access denied" });
    await AuditLog.create({action:"DELETE",entity:"Lead",entityId:deletedLead._id,user:req.user.userId,details:"Lead deleted"});
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
