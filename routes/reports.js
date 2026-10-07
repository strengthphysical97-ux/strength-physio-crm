const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

function parseDateOnly(value, fallback) {
  if (!value) return fallback;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function nextDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); }
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function dateLabel(d) { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function scope(req) {
  if (req.user.role !== 'admin') return { assignedTo: req.user.userId };
  if (req.query.staffId) return { assignedTo: req.query.staffId };
  return {};
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = parseDateOnly(req.query.start, defaultStart);
    const end = parseDateOnly(req.query.end, defaultEnd);
    if (!start || !end) return res.status(400).json({ success: false, message: 'Please select valid From and To dates.' });
    if (end < start) return res.status(400).json({ success: false, message: 'To date cannot be before From date.' });
    const rangeStart = dayStart(start);
    const rangeEndExclusive = nextDay(dayStart(end));
    const staffScope = scope(req);

    const [leads, orders, customers, users] = await Promise.all([
      Lead.find({ ...staffScope, createdAt: { $gte: rangeStart, $lt: rangeEndExclusive } }).populate('assignedTo', 'name'),
      Order.find({ ...staffScope, orderDate: { $gte: rangeStart, $lt: rangeEndExclusive } })
        .populate('customer', 'name phone')
        .populate('assignedTo', 'name'),
      Customer.find({ ...staffScope, createdAt: { $gte: rangeStart, $lt: rangeEndExclusive } }).populate('assignedTo', 'name'),
      req.user.role === 'admin' ? User.find({ role: 'staff' }).select('name email').sort({ name: 1 }) : []
    ]);

    const summary = {
      leads: leads.length,
      converted: leads.filter(x => x.status === 'Converted').length,
      customers: customers.length,
      orders: orders.length,
      billing: orders.reduce((s, x) => s + Number(x.totalAmount || 0), 0),
      received: orders.reduce((s, x) => s + Number(x.amountPaid || 0), 0),
      pending: orders.reduce((s, x) => s + Math.max(0, Number(x.totalAmount || 0) - Number(x.amountPaid || 0)), 0)
    };

    const dailyMap = {};
    for (let d = new Date(rangeStart); d < rangeEndExclusive; d.setDate(d.getDate() + 1)) {
      dailyMap[dateKey(d)] = { date: dateKey(d), label: dateLabel(d), orders: 0, billing: 0, sale: 0, pending: 0 };
    }
    orders.forEach(order => {
      const d = new Date(order.orderDate || order.createdAt);
      const key = dateKey(d);
      if (!dailyMap[key]) return;
      const billing = Number(order.totalAmount || 0);
      const sale = Number(order.amountPaid || 0);
      dailyMap[key].orders += 1;
      dailyMap[key].billing += billing;
      dailyMap[key].sale += sale;
      dailyMap[key].pending += Math.max(0, billing - sale);
    });

    const daily = Object.values(dailyMap);
    const staffMap = {};
    orders.forEach(order => {
      const name = order.assignedTo?.name || 'Unassigned';
      if (!staffMap[name]) staffMap[name] = { staff: name, orders: 0, billing: 0, sale: 0, pending: 0 };
      const billing = Number(order.totalAmount || 0);
      const sale = Number(order.amountPaid || 0);
      staffMap[name].orders += 1;
      staffMap[name].billing += billing;
      staffMap[name].sale += sale;
      staffMap[name].pending += Math.max(0, billing - sale);
    });

    res.json({
      success: true,
      start: dateKey(rangeStart),
      end: dateKey(dayStart(end)),
      summary,
      orders,
      leads,
      customers,
      staff: users,
      daily,
      staffSummary: Object.values(staffMap)
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});
module.exports = router;
