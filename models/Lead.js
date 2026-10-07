const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
<<<<<<< HEAD
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    product: { type: String, trim: true },
    source: {
      type: String,
      enum: ["Website", "WhatsApp", "Instagram", "Facebook", "Google", "Other"],
      default: "Other"
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Interested", "Follow-up", "Converted", "Lost"],
      default: "New"
    },
    followUpDate: { type: Date },
    notes: { type: String, trim: true },
=======
    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true
    },

    product: {
      type: String,
      trim: true
    },

    source: {
      type: String,
      enum: [
        "Website",
        "WhatsApp",
        "Instagram",
        "Facebook",
        "Google",
        "Other"
      ],
      default: "Other"
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Interested",
        "Follow-up",
        "Converted",
        "Lost"
      ],
      default: "New"
    },

    followUpDate: {
      type: Date
    },

    notes: {
      type: String,
      trim: true
    },

    // ==========================================
    // LEAD CREATED BY
    // ==========================================

>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
<<<<<<< HEAD
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    assignedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
=======
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Lead", leadSchema);
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
