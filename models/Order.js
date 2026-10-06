const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },

        product: {
            type: String,
            required: true,
            trim: true
        },

        quantity: {
            type: Number,
            default: 1,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Partial",
                "Paid"
            ],
            default: "Pending"
        },

        orderStatus: {
            type: String,
            enum: [
                "New",
                "Processing",
                "Dispatched",
                "Delivered",
                "Cancelled"
            ],
            default: "New"
        },

        orderDate: {
            type: Date,
            default: Date.now
        },

        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);