const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const User = require("../models/User");
const { adminMiddleware } = require("../middleware/auth");
const { authMiddleware } = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");

function normalizePayment(body = {}) {
    const quantity = Math.max(1, Number(body.quantity || 1));
    const price = Number(body.price || 0);
    const deliveryCharge = Math.max(0, Number(body.deliveryCharge || 0));
    const gstEnabled = Boolean(body.gstEnabled);
    const gstPercent = gstEnabled ? Math.max(0, Math.min(100, Number(body.gstPercent || 0))) : 0;
    const baseAmount = quantity * price;
    const gstAmount = gstEnabled ? (baseAmount * gstPercent) / 100 : 0;
    const total = Number((baseAmount + deliveryCharge + gstAmount).toFixed(2));
    let amountPaid = Number(body.amountPaid || 0);

    if (!Number.isFinite(price) || price < 0) {
        throw new Error("Price must be a valid non-negative number");
    }
    if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
        throw new Error("Delivery charge must be a valid non-negative number");
    }
    if (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100) {
        throw new Error("GST must be between 0 and 100 percent");
    }
    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
        throw new Error("Paid amount must be a valid non-negative number");
    }
    if (amountPaid > total) amountPaid = total;

    return { total, amountPaid, deliveryCharge, gstEnabled, gstPercent, gstAmount: Number(gstAmount.toFixed(2)) };
}

router.post("/", authMiddleware, async (req, res) => {
    try {
        const payment = normalizePayment(req.body);
        const { total, amountPaid, deliveryCharge, gstEnabled, gstPercent, gstAmount } = payment;
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
            deliveryCharge,
            gstEnabled,
            gstPercent,
            gstAmount,
            amountPaid,
            payments: amountPaid > 0 ? [{ amount: amountPaid, method: req.body.paymentMethod || "", date: req.body.paymentDate || new Date(), note: "Initial payment" }] : [],
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

router.get("/customer-history/:customerId", authMiddleware, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId).populate("assignedTo", "name email role");
        if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
        const access = req.user.role === "admin" || String(customer.assignedTo?._id || customer.assignedTo || "") === String(req.user.userId);
        if (!access) return res.status(403).json({ success: false, message: "Access denied" });
        const filter = { customer: customer._id };
        if (req.user.role !== "admin") filter.$or = [{ assignedTo: req.user.userId }, { assignedTo: { $in: [null] }, createdBy: req.user.userId }];
        const orders = await Order.find(filter).populate("assignedTo", "name email role").sort({ orderDate: 1, createdAt: 1 });
        const totalBilling = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const totalPaid = orders.reduce((sum, o) => sum + Number(o.amountPaid || 0), 0);
        const payments = [];
        for (const order of orders) {
            const entries = Array.isArray(order.payments) ? order.payments : [];
            if (entries.length) {
                entries.forEach(p => payments.push({ orderId: order._id, product: order.product, date: p.date || order.createdAt, amount: Number(p.amount || 0), method: p.method || order.paymentMethod || "", note: p.note || "" }));
            } else if (Number(order.amountPaid || 0) > 0) {
                payments.push({ orderId: order._id, product: order.product, date: order.paymentDate || order.createdAt, amount: Number(order.amountPaid || 0), method: order.paymentMethod || "", note: "Recorded total (older order; individual payment history was not saved)" });
            }
        }
        payments.sort((a,b) => new Date(a.date) - new Date(b.date));
        res.json({ success: true, customer, orders, payments, summary: { totalOrders: orders.length, totalBilling, totalPaid, totalPending: Math.max(0, totalBilling-totalPaid) } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const existing = await Order.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Order not found" });
        if (req.user.role !== "admin" && String(existing.assignedTo || existing.createdBy) !== String(req.user.userId)) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        // GST is fixed at order creation; only product/quantity/price/delivery may change.
        const payment = normalizePayment({ ...req.body, gstEnabled: existing.gstEnabled, gstPercent: existing.gstPercent });
        const { total, amountPaid, deliveryCharge } = payment;
        const gstAmount = Number((existing.gstEnabled ? (Number(req.body.quantity || existing.quantity) * Number(req.body.price || existing.price) * Number(existing.gstPercent || 0) / 100) : 0).toFixed(2));
        const update = { ...req.body, totalAmount: total, amountPaid, deliveryCharge, gstEnabled: existing.gstEnabled, gstPercent: existing.gstPercent, gstAmount };
        delete update.payments;
        const oldPaid = Number(existing.amountPaid || 0);
        if (amountPaid > oldPaid) {
            update.$push = { payments: { amount: Number((amountPaid - oldPaid).toFixed(2)), method: req.body.paymentMethod || existing.paymentMethod || "", date: new Date(), note: "Additional payment" } };
        }
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

        const previousPaid = Number(order.amountPaid || 0);
        if (paid > previousPaid) {
            order.payments.push({ amount: Number((paid - previousPaid).toFixed(2)), method: req.body.paymentMethod || order.paymentMethod || "", date: new Date(), note: req.body.note || "Additional payment" });
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
