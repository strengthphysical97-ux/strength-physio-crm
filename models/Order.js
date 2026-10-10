const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        assignedAt: { type: Date },
        product: { type: String, required: true, trim: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        gstEnabled: { type: Boolean, default: false },
        gstPercent: { type: Number, default: 0, min: 0, max: 100 },
        gstAmount: { type: Number, default: 0, min: 0 },
        deliveryCharge: { type: Number, default: 0, min: 0 },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Partial", "Paid"],
            default: "Pending"
        },
        amountPaid: { type: Number, default: 0, min: 0 },
        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Bank Transfer", "Razorpay", "Card", "Other", ""],
            default: ""
        },
        paymentDate: { type: Date },
        transactionId: { type: String, trim: true },
        payments: [{
            amount: { type: Number, min: 0 },
            method: { type: String, trim: true },
            date: { type: Date, default: Date.now },
            transactionId: { type: String, trim: true },
            note: { type: String, trim: true },
            receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
        }],

        orderStatus: {
            type: String,
            enum: ["New", "Processing", "Dispatched", "Delivered", "Cancelled"],
            default: "New"
        },
        orderDate: { type: Date, default: Date.now },
        source: { type: String, trim: true, default: "Other" },
        sourceType: { type: String, trim: true, default: "" },
        campaignName: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true }
    },
    { timestamps: true }
);

orderSchema.pre("validate", function () {
    const total = Number(this.totalAmount || 0);
    let paid = Number(this.amountPaid || 0);

    if (paid < 0) paid = 0;
    if (paid > total) paid = total;
    this.amountPaid = paid;

    if (total === 0 || paid === 0) {
        this.paymentStatus = paid === total && total === 0 ? "Paid" : "Pending";
    } else if (paid >= total) {
        this.paymentStatus = "Paid";
    } else {
        this.paymentStatus = "Partial";
    }

});

orderSchema.virtual("remainingAmount").get(function () {
    return Math.max(0, Number(this.totalAmount || 0) - Number(this.amountPaid || 0));
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
