const express = require("express");
const router = express.Router();

const Lead = require("../models/Lead");

const {
  authMiddleware
} = require("../middleware/auth");


// ==========================================
// ADD NEW LEAD
// ==========================================

router.post("/", authMiddleware, async (req, res) => {

  try {

    const lead = new Lead({

      name: req.body.name,

      phone: req.body.phone,

      email: req.body.email,

      product: req.body.product,

      source: req.body.source,

      status: req.body.status,

      followUpDate: req.body.followUpDate,

      notes: req.body.notes,

      // Logged-in user automatically becomes owner
      createdBy: req.user.userId

    });


    const savedLead = await lead.save();


    res.status(201).json({

      success: true,

      message: "Lead added successfully",

      lead: savedLead

    });


  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


// ==========================================
// GET ALL LEADS
// ==========================================

router.get("/", authMiddleware, async (req, res) => {

  try {

    let leads;


    // ======================================
    // ADMIN → ALL LEADS
    // ======================================

    if (req.user.role === "admin") {

      leads = await Lead
        .find()
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 });

    }


    // ======================================
    // STAFF → ONLY THEIR OWN LEADS
    // ======================================

    else {

      leads = await Lead
        .find({
          createdBy: req.user.userId
        })
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 });

    }


    res.json({

      success: true,

      leads: leads

    });


  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


// ==========================================
// UPDATE LEAD
// ==========================================

router.put("/:id", authMiddleware, async (req, res) => {

  try {

    let updatedLead;


    // ======================================
    // ADMIN → CAN UPDATE ANY LEAD
    // ======================================

    if (req.user.role === "admin") {

      updatedLead = await Lead.findByIdAndUpdate(

        req.params.id,

        req.body,

        {
          new: true,
          runValidators: true
        }

      );

    }


    // ======================================
    // STAFF → CAN UPDATE ONLY THEIR LEAD
    // ======================================

    else {

      updatedLead = await Lead.findOneAndUpdate(

        {
          _id: req.params.id,

          createdBy: req.user.userId

        },

        req.body,

        {
          new: true,
          runValidators: true
        }

      );

    }


    if (!updatedLead) {

      return res.status(404).json({

        success: false,

        message: "Lead not found or access denied"

      });

    }


    res.json({

      success: true,

      message: "Lead updated successfully",

      lead: updatedLead

    });


  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


// ==========================================
// DELETE LEAD
// ==========================================

router.delete("/:id", authMiddleware, async (req, res) => {

  try {

    let deletedLead;


    // ======================================
    // ADMIN → CAN DELETE ANY LEAD
    // ======================================

    if (req.user.role === "admin") {

      deletedLead =
        await Lead.findByIdAndDelete(req.params.id);

    }


    // ======================================
    // STAFF → CAN DELETE ONLY THEIR LEAD
    // ======================================

    else {

      deletedLead =
        await Lead.findOneAndDelete({

          _id: req.params.id,

          createdBy: req.user.userId

        });

    }


    if (!deletedLead) {

      return res.status(404).json({

        success: false,

        message: "Lead not found or access denied"

      });

    }


    res.json({

      success: true,

      message: "Lead deleted successfully"

    });


  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


module.exports = router;