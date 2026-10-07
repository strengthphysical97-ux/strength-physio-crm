const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

<<<<<<< HEAD
function period(req) {
  const now = new Date();
  const year = Number.isFinite(Number(req.query.year)) ? Number(req.query.year) : now.getFullYear();
  const monthParam = req.query.month;
  const month = monthParam === undefined || monthParam === "all" || monthParam === "" ? null : Number(monthParam);
  const start = new Date(year, month === null ? 0 : month, 1);
  const end = month === null ? new Date(year + 1, 0, 1) : new Date(year, month + 1, 1);
  return { year, month, start, end };
}

function ownerOrCreated(userId) {
  return { $or: [{ assignedTo: userId }, { assignedTo: { $in: [null] }, createdBy: userId }] };
}

function sales(orderList) {
  return orderList.reduce((sum, x) => sum + Number(x.amountPaid || 0), 0);
}
function pending(orderList) {
  return orderList.reduce((sum, x) => sum + Math.max(0, Number(x.totalAmount || 0) - Number(x.amountPaid || 0)), 0);
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { year, month, start, end } = period(req);
    const isAdmin = req.user.role === "admin";
    const owner = isAdmin ? {} : ownerOrCreated(req.user.userId);
    const leadFilter = { ...owner, createdAt: { $gte: start, $lt: end } };
    const orderFilter = { ...owner, orderDate: { $gte: start, $lt: end } };
    const customerFilter = isAdmin ? {} : { assignedTo: req.user.userId };

    const [leads, orders, customerCount, users] = await Promise.all([
      Lead.find(leadFilter).populate("createdBy", "name email role").populate("assignedTo", "name email role").sort({ createdAt: -1 }),
      Order.find(orderFilter).populate("createdBy", "name email role").populate("assignedTo", "name email role").populate("customer", "name phone").sort({ orderDate: -1 }),
      Customer.countDocuments(customerFilter),
      isAdmin ? User.find({ role: "staff" }).select("name email role createdAt").sort({ name: 1 }) : []
    ]);

    const dailyMap = {};
    if (month !== null) {
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        dailyMap[key] = { date: key, sale: 0, pending: 0, orders: 0 };
      }
      orders.forEach(o => {
        const d = new Date(o.orderDate || o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!dailyMap[key]) return;
        const billing = Number(o.totalAmount || 0), sale = Number(o.amountPaid || 0);
        dailyMap[key].orders += 1; dailyMap[key].sale += sale; dailyMap[key].pending += Math.max(0, billing - sale);
      });
    }

=======
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

>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
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
<<<<<<< HEAD
      totalSales: sales(orders),
      pendingPayments: pending(orders),
      orderValue: orders.reduce((sum, x) => sum + Number(x.totalAmount || 0), 0)
    };

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const upcomingEnd = new Date(todayStart); upcomingEnd.setDate(upcomingEnd.getDate() + 14);
    const followUpFilter = isAdmin
      ? { followUpDate: { $gte: todayStart, $lte: upcomingEnd } }
      : { ...ownerOrCreated(req.user.userId), followUpDate: { $gte: todayStart, $lte: upcomingEnd } };
    const followUps = await Lead.find(followUpFilter).populate("createdBy", "name").populate("assignedTo", "name").sort({ followUpDate: 1 }).limit(10);

    const performanceUsers = isAdmin ? users : [{ _id: req.user.userId, name: req.user.name, role: "staff" }];
    const staffPerformance = await Promise.all(performanceUsers.map(async user => {
      const filter = ownerOrCreated(user._id);
      const [staffLeads, staffOrders, customers] = await Promise.all([
        Lead.find({ ...filter, createdAt: { $gte: start, $lt: end } }).select("status"),
        Order.find({ ...filter, orderDate: { $gte: start, $lt: end } }).select("totalAmount amountPaid"),
        Customer.countDocuments({ assignedTo: user._id })
      ]);
      return {
        id: String(user._id), name: user.name, customers,
        leads: staffLeads.length,
        converted: staffLeads.filter(x => x.status === "Converted").length,
        followUps: staffLeads.filter(x => x.status === "Follow-up").length,
        orders: staffOrders.length,
        orderValue: staffOrders.reduce((s, x) => s + Number(x.totalAmount || 0), 0),
        sales: sales(staffOrders),
        pending: pending(staffOrders)
      };
    }));

    res.json({ success: true, year, month, stats, daily: Object.values(dailyMap), followUps, staffPerformance, role: req.user.role });
=======
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
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

<<<<<<< HEAD
// Detailed staff performance. Admin can select any staff; staff can only select themselves.
router.get("/performance", authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const requested = req.query.staffId;
    const staffId = isAdmin && requested ? requested : req.user.userId;
    if (!isAdmin && requested && String(requested) !== String(req.user.userId)) {
      return res.status(403).json({ success: false, message: "You can only view your own performance" });
    }
    const staff = await User.findOne({ _id: staffId, role: "staff" }).select("name email role");
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });

    const { year, month, start, end } = period(req);
    const filter = ownerOrCreated(staff._id);
    const [leads, orders, customerCount] = await Promise.all([
      Lead.find({ ...filter, createdAt: { $gte: start, $lt: end } }).select("status createdAt"),
      Order.find({ ...filter, orderDate: { $gte: start, $lt: end } }).select("totalAmount amountPaid orderDate product customer paymentStatus").populate("customer", "name"),
      Customer.countDocuments({ assignedTo: staff._id })
    ]);

    const buckets = {};
    const ensure = key => buckets[key] ||= { period: key, leads: 0, customers: 0, orders: 0, sales: 0, pending: 0 };
    leads.forEach(l => ensure(makeKey(new Date(l.createdAt))).leads++);
    orders.forEach(o => { const b=ensure(makeKey(new Date(o.orderDate))); b.orders++; b.sales+=Number(o.amountPaid||0); b.pending+=Math.max(0,Number(o.totalAmount||0)-Number(o.amountPaid||0)); });

    res.json({ success: true, staff, year, month, summary: { customers: customerCount, leads: leads.length, converted: leads.filter(x=>x.status==="Converted").length, orders: orders.length, orderValue: orders.reduce((s,x)=>s+Number(x.totalAmount||0),0), sales: sales(orders), pending: pending(orders) }, timeline: Object.values(buckets).sort((a,b)=>a.period.localeCompare(b.period)), orders });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

=======
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128
module.exports = router;
