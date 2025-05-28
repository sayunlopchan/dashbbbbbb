import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import { startAllCronJobs } from "./cron/index.js";

// Middlewares
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { protectRoute } from "./middlewares/protect.middleware.js";

// Routes
import applicationRoutes from "./routes/applications.routes.js";
import memberRoutes from "./routes/members.routes.js";
import authRoutes from "./routes/auth.routes.js";
import trainerRoutes from "./routes/trainer.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";
import eventRoutes from "./routes/events.routes.js";
import participantRoutes from "./routes/participants.routes.js";
import announcementRoutes from "./routes/announcements.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import applicationHistoryRoutes from "./routes/applicationHistory.routes.js";
import paymentRoutes from "./routes/payments.routes.js";
import productRoutes from "./routes/product.routes.js";

// Load env and connect DB
loadEnv();
connectDB();

// Start cron jobs
startAllCronJobs();
console.log('🕒 Cron jobs initialized');

dotenv.config();

// Initialize app
const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientPath = path.resolve(__dirname, '../client/dashboard');

// Core middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://127.0.0.1:5501",
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Serve static files from client directory
app.use(express.static(clientPath));
app.use(express.static(path.join(__dirname, 'public')));

// Routes without .html extension
const htmlPages = [
  'dashboard', 'events', 'members', 'finance', 'membership', 
  'attendance', 'employee', 'trainers', 'notifications', 'login', 'unauthorized', 
  'spinner', 'membership', 'trainers', 'product','application-form','application'
];

// Unprotected pages
const unprotectedPages = ['login', 'unauthorized'];

// Apply routes with protection
htmlPages.forEach(page => {
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

// Default route to serve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'login.html'));
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
app.use('/api/products', productRoutes);

// Debug route for authentication
app.get('/debug-auth', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    token: req.cookies.token ? 'Present' : 'Not Present'
  });
});

// Middleware for 404 and error handling
app.use(notFound);
app.use(errorHandler);

export default app;
