const express = require("express");
const router = express.Router();
<<<<<<< HEAD
const Customer = require("../models/Customer");
const User = require("../models/User");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");

function ownerFilter(req) {
    return req.user.role === "admin" ? {} : { assignedTo: req.user.userId };
}

router.post("/", authMiddleware, async (req, res) => {
    try {
        let assignedTo = req.user.userId;
        if (req.user.role === "admin" && req.body.assignedTo) {
            const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
            if (!staff) return res.status(400).json({ success: false, message: "Selected staff member not found" });
            assignedTo = staff._id;
        }
        const customerPayload = { ...req.body };
        if (!String(customerPayload.email || "").trim()) delete customerPayload.email;
        const customer = new Customer({
            ...customerPayload,
            assignedTo,
            assignedAt: new Date()
        });
        const savedCustomer = await customer.save();
        await savedCustomer.populate("assignedTo", "name email role");
        await AuditLog.create({action:"CREATE",entity:"Customer",entityId:savedCustomer._id,user:req.user.userId,details:`Customer ${savedCustomer.name}`});
        res.status(201).json({ success: true, message: "Customer added successfully", customer: savedCustomer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const customers = await Customer.find(ownerFilter(req))
            .populate("assignedTo", "name email role")
            .sort({ createdAt: -1 });
        res.json({ success: true, customers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await Customer.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Customer not found" });
        if (req.user.role !== "admin" && String(existing.assignedTo || existing.createdBy) !== String(req.user.userId)) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const update = { ...req.body };
        if (!String(update.email || "").trim()) delete update.email;
        delete update.createdBy;
        if (req.user.role === "admin" && req.body.assignedTo !== undefined) {
            if (!req.body.assignedTo) update.assignedTo = null;
            else {
                const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
                if (!staff) return res.status(400).json({ success: false, message: "Selected staff member not found" });
                update.assignedTo = staff._id;
                update.assignedAt = new Date();
            }
        } else if (req.user.role !== "admin") {
            update.assignedTo = req.user.userId;
        }
        const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
            .populate("assignedTo", "name email role");
        await AuditLog.create({action:"UPDATE",entity:"Customer",entityId:updatedCustomer._id,user:req.user.userId,details:"Customer details updated"});
        res.json({ success: true, message: "Customer updated successfully", customer: updatedCustomer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, assignedTo: req.user.userId };
        const deletedCustomer = await Customer.findOneAndDelete(filter);
        if (!deletedCustomer) return res.status(404).json({ success: false, message: "Customer not found or access denied" });
        await AuditLog.create({action:"DELETE",entity:"Customer",entityId:deletedCustomer._id,user:req.user.userId,details:"Customer deleted"});
        res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.patch("/:id/assign", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
        if (!staff) return res.status(400).json({ success: false, message: "Staff member not found" });
        const customer = await Customer.findByIdAndUpdate(req.params.id, { assignedTo: staff._id, assignedAt: new Date() }, { new: true })
            .populate("assignedTo", "name email role");
        if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
        await AuditLog.create({action:"ASSIGN",entity:"Customer",entityId:customer._id,user:req.user.userId,details:`Customer assigned to ${staff.name}`});
        res.json({ success: true, message: `Customer assigned to ${staff.name}`, customer });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
=======

const Customer = require("../models/Customer");
const { authMiddleware } = require("../middleware/auth");

// ===============================
// ADD NEW CUSTOMER
// ===============================

router.post("/", authMiddleware, async (req, res) => {

    try {

        const customer = new Customer(req.body);

        const savedCustomer = await customer.save();

        res.status(201).json({
            success: true,
            message: "Customer added successfully",
            customer: savedCustomer
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

// ===============================
// GET ALL CUSTOMERS
// ===============================

router.get("/", authMiddleware, async (req, res) => {

    try {

        const customers = await Customer
            .find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            customers: customers
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

// ===============================
// UPDATE CUSTOMER
// ===============================

router.put("/:id", authMiddleware, async (req, res) => {

    try {

        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedCustomer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });

        }

        res.json({
            success: true,
            message: "Customer updated successfully",
            customer: updatedCustomer
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

// ===============================
// DELETE CUSTOMER
// ===============================

router.delete("/:id", authMiddleware, async (req, res) => {

    try {

        const deletedCustomer =
            await Customer.findByIdAndDelete(req.params.id);

        if (!deletedCustomer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });

        }

        res.json({
            success: true,
            message: "Customer deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

module.exports = router;
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
