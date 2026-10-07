const express = require("express");
const router = express.Router();
<<<<<<< HEAD
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const User = require("../models/User");
const { adminMiddleware } = require("../middleware/auth");
const { authMiddleware } = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");

function normalizePayment(body = {}) {
    const total = Number(body.totalAmount || 0);
    let amountPaid = Number(body.amountPaid || 0);

    if (!Number.isFinite(total) || total < 0) {
        throw new Error("Total amount must be a valid non-negative number");
    }
    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
        throw new Error("Paid amount must be a valid non-negative number");
    }
    if (amountPaid > total) amountPaid = total;

    return { total, amountPaid };
}

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { total, amountPaid } = normalizePayment(req.body);
        const customer = await Customer.findById(req.body.customer);
        if (!customer) return res.status(400).json({ success: false, message: "Customer not found" });
        let assignedTo = customer.assignedTo || req.user.userId;
        if (req.user.role === "staff" && customer.assignedTo && String(customer.assignedTo) !== String(req.user.userId)) {
            return res.status(403).json({ success: false, message: "You can only create orders for your assigned customers" });
        }
        if (req.user.role === "admin" && req.body.assignedTo) {
            const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
            if (!staff) return res.status(400).json({ success: false, message: "Selected staff member not found" });
            assignedTo = staff._id;
        }
        const order = new Order({
            ...req.body,
            totalAmount: total,
            amountPaid,
            createdBy: req.user.userId,
            assignedTo,
            assignedAt: new Date()
        });
        const savedOrder = await order.save();
        await savedOrder.populate("customer");

        await AuditLog.create({action:"CREATE",entity:"Order",entityId:savedOrder._id,user:req.user.userId,details:`Order for ${savedOrder.product}`});
        res.status(201).json({ success: true, message: "Order added successfully", order: savedOrder });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? {} : { $or: [{ assignedTo: req.user.userId }, { assignedTo: { $in: [null] }, createdBy: req.user.userId }] };
        const orders = await Order.find(filter)
            .populate("customer")
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { total, amountPaid } = normalizePayment(req.body);
        const existing = await Order.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Order not found" });
        if (req.user.role !== "admin" && String(existing.assignedTo || existing.createdBy) !== String(req.user.userId)) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const update = { ...req.body, totalAmount: total, amountPaid };
        if (req.user.role === "admin" && req.body.assignedTo !== undefined) {
            const staff = req.body.assignedTo ? await User.findOne({ _id: req.body.assignedTo, role: "staff" }) : null;
            if (req.body.assignedTo && !staff) return res.status(400).json({ success: false, message: "Selected staff member not found" });
            update.assignedTo = staff ? staff._id : null;
            update.assignedAt = staff ? new Date() : null;
        }
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        ).populate("customer").populate("assignedTo", "name email role").populate("createdBy", "name email role");

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        await AuditLog.create({action:"UPDATE",entity:"Order",entityId:updatedOrder._id,user:req.user.userId,details:"Order details updated"});
        res.json({ success: true, message: "Order updated successfully", order: updatedOrder });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.patch("/:id/payment", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (req.user.role !== "admin" && String(order.assignedTo || order.createdBy) !== String(req.user.userId)) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const paid = Number(req.body.amountPaid);
        if (!Number.isFinite(paid) || paid < 0 || paid > Number(order.totalAmount || 0)) {
            return res.status(400).json({ success: false, message: "Invalid payment amount" });
        }

        order.amountPaid = paid;
        await order.save();
        await order.populate("customer");

        await AuditLog.create({action:"PAYMENT",entity:"Order",entityId:order._id,user:req.user.userId,details:`Payment updated to ₹${paid}`});
        res.json({ success: true, message: "Payment updated successfully", order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});


router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const deleteFilter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, $or: [{ assignedTo: req.user.userId }, { createdBy: req.user.userId }] };
        const deletedOrder = await Order.findOneAndDelete(deleteFilter);
        if (!deletedOrder) return res.status(404).json({ success: false, message: "Order not found" });
        await AuditLog.create({action:"DELETE",entity:"Order",entityId:deletedOrder._id,user:req.user.userId,details:"Order deleted"});
        res.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;


router.patch("/:id/assign", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const staff = await User.findOne({ _id: req.body.assignedTo, role: "staff" });
        if (!staff) return res.status(400).json({ success: false, message: "Staff member not found" });
        const order = await Order.findByIdAndUpdate(req.params.id, { assignedTo: staff._id, assignedAt: new Date() }, { new: true })
            .populate("customer").populate("assignedTo", "name email role").populate("createdBy", "name email role");
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        await AuditLog.create({action:"ASSIGN",entity:"Order",entityId:order._id,user:req.user.userId,details:`Order assigned to ${staff.name}`});
        res.json({ success: true, message: `Order assigned to ${staff.name}`, order });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
=======

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
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
