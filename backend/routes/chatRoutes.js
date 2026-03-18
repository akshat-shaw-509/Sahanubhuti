// backend/routes/chatRoutes.js
// All chat routes are protected — requires valid JWT

const express = require("express");
const router = express.Router();

const { sendMessage, verifySession, getHistory, getThreads, createThread } = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes below this line require a valid token
router.use(authMiddleware);

// POST /api/chat/message  → Send a message to the chatbot
router.post("/message", sendMessage);

// GET  /api/chat/verify   → Check if session is still valid (called on chat page load)
router.get("/verify", verifySession);

// GET  /api/chat/history  → Load previous chat messages
router.get("/history", getHistory);

// GET  /api/chat/threads  → List threads
router.get("/threads", getThreads);

// POST /api/chat/threads  → Create a new thread
router.post("/threads", createThread);

module.exports = router;
