const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
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

        company: {
            type: String,
            trim: true
        },

        address: {
            type: String,
            trim: true
        },

        city: {
            type: String,
            trim: true
        },

        notes: {
            type: String,
            trim: true
<<<<<<< HEAD
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        assignedAt: { type: Date }
=======
        }
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Customer", customerSchema);