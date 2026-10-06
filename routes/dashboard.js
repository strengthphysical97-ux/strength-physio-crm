const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const year = Number.isInteger(Number(req.query.year)) ? Number(req.query.year) : now.getFullYear();
    const monthParam = req.query.month;
    const month = monthParam === undefined || monthParam === "all" || monthParam === "" ? null : Number(monthParam);

    const start = new Date(year, month === null ? 0 : month, 1);
    const end = month === null ? new Date(year + 1, 0, 1) : new Date(year, month + 1, 1);

    const leadFilter = { createdAt: { $gte: start, $lt: end } };
    const orderFilter = { orderDate: { $gte: start, $lt: end } };

    if (req.user.role !== "admin") {
      leadFilter.createdBy = req.user.userId;
      orderFilter.$or = [
        { createdBy: req.user.userId },
        { createdBy: { $exists: false } }
      ];
    }

    const [leads, orders, customerCount, users] = await Promise.all([
      Lead.find(leadFilter).populate("createdBy", "name email role").sort({ createdAt: -1 }),
      Order.find(orderFilter).populate("createdBy", "name email role").populate("customer", "name phone").sort({ orderDate: -1 }),
      Customer.countDocuments(),
      req.user.role === "admin" ? User.find().select("name email role createdAt").sort({ role: 1, name: 1 }) : []
    ]);

    const stats = {
      totalLeads: leads.length,
      newLeads: leads.filter(x => x.status === "New").length,
      contactedLeads: leads.filter(x => x.status === "Contacted").length,
      interestedLeads: leads.filter(x => x.status === "Interested").length,
      followUpLeads: leads.filter(x => x.status === "Follow-up").length,
      convertedLeads: leads.filter(x => x.status === "Converted").length,
      lostLeads: leads.filter(x => x.status === "Lost").length,
      totalCustomers: customerCount,
      totalOrders: orders.length,
      totalSales: orders.filter(x => x.paymentStatus === "Paid").reduce((s, x) => s + Number(x.totalAmount || 0), 0),
      pendingPayments: orders.filter(x => x.paymentStatus !== "Paid").reduce((s, x) => s + Number(x.totalAmount || 0), 0)
    };

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const upcomingEnd = new Date(todayStart); upcomingEnd.setDate(upcomingEnd.getDate() + 14);
    const followUpFilter = req.user.role === "admin"
      ? { followUpDate: { $gte: todayStart, $lte: upcomingEnd } }
      : { createdBy: req.user.userId, followUpDate: { $gte: todayStart, $lte: upcomingEnd } };
    const followUps = await Lead.find(followUpFilter).populate("createdBy", "name").sort({ followUpDate: 1 }).limit(10);

    let staffPerformance = [];
    if (req.user.role === "admin") {
      staffPerformance = await Promise.all(users.filter(u => u.role === "staff").map(async user => {
        const staffLeads = await Lead.find({ createdBy: user._id, createdAt: { $gte: start, $lt: end } }).select("status");
        const staffOrders = await Order.find({ createdBy: user._id, orderDate: { $gte: start, $lt: end } }).select("totalAmount paymentStatus");
        return {
          id: user._id,
          name: user.name,
          leads: staffLeads.length,
          converted: staffLeads.filter(x => x.status === "Converted").length,
          followUps: staffLeads.filter(x => x.status === "Follow-up").length,
          sales: staffOrders.filter(x => x.paymentStatus === "Paid").reduce((s, x) => s + Number(x.totalAmount || 0), 0)
        };
      }));
    }

    res.json({ success: true, year, month, stats, followUps, staffPerformance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
