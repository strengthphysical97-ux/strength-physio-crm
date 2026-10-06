const express = require("express");
const router = express.Router();

const Order = require("../models/Order");

// ===============================
// ADD NEW ORDER
// ===============================

router.post("/", async (req, res) => {

    try {

        const order = new Order(req.body);

        const savedOrder = await order.save();

        res.status(201).json({
            success: true,
            message: "Order added successfully",
            order: savedOrder
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ===============================
// GET ALL ORDERS
// ===============================

router.get("/", async (req, res) => {

    try {

        const orders = await Order
            .find()
            .populate("customer")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ===============================
// UPDATE ORDER
// ===============================

router.put("/:id", async (req, res) => {

    try {

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedOrder) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        res.json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ===============================
// DELETE ORDER
// ===============================

router.delete("/:id", async (req, res) => {

    try {

        const deletedOrder =
            await Order.findByIdAndDelete(req.params.id);

        if (!deletedOrder) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        res.json({
            success: true,
            message: "Order deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


module.exports = router;