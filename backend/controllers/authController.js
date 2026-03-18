// backend/controllers/authController.js
// Handles registration, login, logout, and profile fetch

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateRegistration, validateEmail } = require("../utils/validateInput");

// ─── Helper: Generate JWT token ───────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { userId },                          // Payload — keep minimal (never put password here)
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

// ─── Helper: Format a consistent success response ────────────────────────────
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Create a new user account
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Step 1 — Validate input fields
    const validation = validateRegistration({ name, email, password });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0], // Return first error to user
        errors: validation.errors,
      });
    }

    // Step 2 — Check if email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Step 3 — Create user (password is hashed automatically via pre-save hook in User model)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // Step 4 — Return JWT token + user info
    sendTokenResponse(user, 201, res, "Account created successfully! Welcome to Sahanubhuti.");

  } catch (error) {
    // Handle MongoDB unique index violation (race condition safety net)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user and return JWT
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1 — Check fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    // Step 2 — Validate email format
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.message });
    }

    // Step 3 — Find user (explicitly select password since it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user) {
      // Use a generic message to avoid revealing whether the email exists
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Step 4 — Compare entered password with bcrypt hash
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Step 5 — Credentials valid → issue JWT
    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
// Note: JWTs are stateless — the real logout happens client-side by deleting
// the token from localStorage. This endpoint is a clean server acknowledgement.
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get the currently logged-in user's profile
// @access  Private (requires valid JWT via authMiddleware)
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { register, login, logout, getMe };
