// backend/routes/authRoutes.js
// Defines all authentication-related API endpoints

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { register, login, logout, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// ─── Rate limiting — prevent brute-force attacks ──────────────────────────────
// Limits each IP to 10 login/register attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ────────────────────────────────────────────────────────────
// POST /api/auth/register  → Create new account
router.post("/register", authLimiter, register);

// POST /api/auth/login     → Sign in + get token
router.post("/login", authLimiter, login);

// ─── Protected Routes ─────────────────────────────────────────────────────────
// POST /api/auth/logout    → Acknowledge logout (token removed client-side)
router.post("/logout", authMiddleware, logout);

// GET  /api/auth/me        → Get current user's profile
router.get("/me", authMiddleware, getMe);

module.exports = router;
