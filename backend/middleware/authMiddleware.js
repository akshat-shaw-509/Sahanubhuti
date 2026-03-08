// backend/middleware/authMiddleware.js
// Protects routes — request must carry a valid JWT token

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * authMiddleware
 * ─────────────
 * Expects header:  Authorization: Bearer <token>
 *
 * On success → attaches req.user = { id, name, email }
 * On failure → 401 Unauthorized
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in to continue.",
      });
    }

    const token = authHeader.split(" ")[1]; // "Bearer <token>" → "<token>"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token found.",
      });
    }

    // 2. Verify the token's signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if the user still exists in DB (handles deleted accounts)
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists. Please sign up again.",
      });
    }

    // 4. Attach user info to request object for downstream handlers
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    next(); // ✅ Token valid — proceed to the route handler

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error. Please try again.",
    });
  }
};

module.exports = authMiddleware;
