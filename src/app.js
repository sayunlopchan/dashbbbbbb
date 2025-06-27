const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// /////////////
const { loadEnv } = require("./config/env");
const { connectDB } = require("./config/db");
const { startAllCronJobs } = require("./cron/index");

// Middlewares
const { notFound } = require("./middlewares/notFound.middleware");
const { errorHandler } = require("./middlewares/error.middleware");
const { protectRoute } = require("./middlewares/protect.middleware");

// Routes
const applicationRoutes = require("./routes/applications.routes");
const memberRoutes = require("./routes/members.routes");
const authRoutes = require("./routes/auth.routes");
const trainerRoutes = require("./routes/trainer.routes");
const notificationRoutes = require("./routes/notifications.routes");
const eventRoutes = require("./routes/events.routes");
const participantRoutes = require("./routes/participants.routes");
const announcementRoutes = require("./routes/announcements.routes");
const employeeRoutes = require("./routes/employee.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const membershipRoutes = require("./routes/membership.routes");
const applicationHistoryRoutes = require("./routes/applicationHistory.routes");
const paymentRoutes = require("./routes/payments.routes");
const productRoutes = require("./routes/product.routes");
const newsletterRoutes = require('./routes/newsletter.routes');
const contactRoutes = require('./routes/contact.routes');

// Load env and connect DB
loadEnv();
connectDB();

// Start cron jobs
startAllCronJobs();
console.log("🕒 Cron jobs initialized");

dotenv.config();

// Initialize app
const app = express();
app.set("trust proxy", 1);

// Get __dirname (already available in CommonJS)
const clientPath = path.resolve(__dirname, "../client/dashboard");

// Core middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Serve static files from client directory
app.use(express.static(clientPath));
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));



// to access Routes without .html extension
const htmlPages = [
  "dashboard",
  "events",
  "members",
  "finance",
  "membership",
  "attendance",
  "employee",
  "trainers",
  "notifications",
  "login",
  "unauthorized",
  "spinner",
  "membership",
  "trainers",
  "product",
  "application-form",
  "application",
  "locker",
  "member-detail",
  "trainer-detail",
];

// Unprotected pages
const unprotectedPages = ["login", "unauthorized"];

// Apply routes with protection
htmlPages.forEach((page) => {
  // If page is not in unprotected list, apply protection
  if (!unprotectedPages.includes(page)) {
    app.get(`/${page}`, protectRoute, (req, res) => {
      res.sendFile(path.join(clientPath, `${page}.html`));
    });
  } else {
    // Unprotected routes
    app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(clientPath, `${page}.html`));
    });
  }
});

// Default route with authentication check
app.get("/", protectRoute, (req, res) => {
  res.sendFile(path.join(clientPath, "dashboard.html"));
});

// Optionally, redirect /dashboard to /
app.get("/dashboard", (req, res) => {
  res.redirect("/");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/application-history", applicationHistoryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);

// Debug route for authentication
app.get("/debug-auth", (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    token: req.cookies.token ? "Present" : "Not Present",
  });
});

// Middleware for 404 and error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
