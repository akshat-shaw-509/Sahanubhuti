// backend/routes/chatRoutes.js
// All chat routes are protected — requires valid JWT

const express = require("express");
const router = express.Router();

const { sendMessage, verifySession } = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes below this line require a valid token
router.use(authMiddleware);

// POST /api/chat/message  → Send a message to the chatbot
router.post("/message", sendMessage);

// GET  /api/chat/verify   → Check if session is still valid (called on chat page load)
router.get("/verify", verifySession);

module.exports = router;
