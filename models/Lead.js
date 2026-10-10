const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    product: { type: String, trim: true },
    source: {
      type: String,
      enum: ["Website", "WhatsApp", "Instagram", "IndiaMART", "Justdial", "Meta Ads", "Facebook", "Google", "Referral", "Other"],
      default: "Other"
    },
    sourceType: {
      type: String,
      enum: ["", "Post", "Reel / Video", "Paid Advertisement", "Story", "Direct Message", "Call", "Organic", "Other"],
      default: ""
    },
    campaignName: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["New", "Contacted", "Interested", "Follow-up", "Converted", "Lost"],
      default: "New"
    },
    followUpDate: { type: Date },
    notes: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
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
