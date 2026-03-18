// backend/server.js
// Main entry point — sets up Express, connects to MongoDB, registers routes
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

// ─── Initialise Express ───────────────────────────────────────────────────────
const app = express();
app.set("trust proxy", 1); // Required for rate limiting behind Render's proxy

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  "http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5500,https://akshat-shaw-509.github.io"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🌿 Sahanubhuti API is running",
    version: "1.0.0",
    endpoints: { auth: "/api/auth", chat: "/api/chat" },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

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

// ─── Start Server FIRST, then connect to DB ───────────────────────────────────
// Render requires the port to be bound quickly — DB connection happens after.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log(`📌  Environment: ${process.env.NODE_ENV || "development"}`);

  // Connect to MongoDB after server is already listening
  connectDB();
});
