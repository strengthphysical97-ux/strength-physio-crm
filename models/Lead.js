const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Lead", leadSchema);