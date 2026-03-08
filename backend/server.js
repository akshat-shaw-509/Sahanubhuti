// backend/server.js
// Main entry point — sets up Express, connects to MongoDB, registers routes

require("dotenv").config(); // Load .env variables first
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Initialise Express ───────────────────────────────────────────────────────
const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
// Allow requests from your frontend origin (Live Server / deployed URL)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "10kb" })); // Limit body size for safety

// Parse URL-encoded bodies (e.g. from HTML forms)
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🌿 Sahanubhuti API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      chat: "/api/chat",
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes); // /api/auth/register, /api/auth/login, etc.
app.use("/api/chat", chatRoutes); // /api/chat/message, /api/chat/verify

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on our end. Please try again.",
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log(`📌  Environment: ${process.env.NODE_ENV || "development"}`);
});
