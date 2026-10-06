const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const { authMiddleware } = require("../middleware/auth");

// ===============================
// ADD NEW ORDER
// ===============================

router.post("/", authMiddleware, async (req, res) => {

    try {

        const order = new Order({
            ...req.body,
            createdBy: req.user.userId
        });

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

router.get("/", authMiddleware, async (req, res) => {

    try {

        const filter = req.user.role === "admin"
            ? {}
            : { $or: [{ createdBy: req.user.userId }, { createdBy: { $exists: false } }] };

        const orders = await Order
            .find(filter)
            .populate("customer")
            .populate("createdBy", "name email role")
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

router.put("/:id", authMiddleware, async (req, res) => {

    try {

        const filter = req.user.role === "admin"
            ? { _id: req.params.id }
            : { _id: req.params.id, $or: [{ createdBy: req.user.userId }, { createdBy: { $exists: false } }] };

        const updatedOrder = await Order.findOneAndUpdate(
            filter,
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

router.delete("/:id", authMiddleware, async (req, res) => {

    try {

        const filter = req.user.role === "admin"
            ? { _id: req.params.id }
            : { _id: req.params.id, $or: [{ createdBy: req.user.userId }, { createdBy: { $exists: false } }] };

        const deletedOrder =
            await Order.findOneAndDelete(filter);

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