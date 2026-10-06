const express = require("express");
const router = express.Router();

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