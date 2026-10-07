const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// ===============================
// IMPORT ROUTES
// ===============================

const leadRoutes = require("./routes/leads");
const customerRoutes = require("./routes/customers");
// console.log("Customer Routes:", typeof customerRoutes);
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
<<<<<<< HEAD
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const auditRoutes = require("./routes/audit"); 
=======
const dashboardRoutes = require("./routes/dashboard"); 
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());


// ===============================
// FRONTEND FILES
// ===============================

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});



// ===============================
// LEAD ROUTES
// ===============================

app.use("/api/leads", leadRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
<<<<<<< HEAD
app.use("/api/reports", reportRoutes);
app.use("/api/audit", auditRoutes);
=======
>>>>>>> 1758c5154ccdcf1e7d054296ee602a49ff258128


// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
  .connect(process.env.MONGO_URL) 
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });


// ===============================
// TEST API
// ===============================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "CRM API is working"
  });
});


// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CRM Server running on port ${PORT}`);
});