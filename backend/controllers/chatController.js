// backend/controllers/chatController.js
// Handles chat API calls — only accessible after authentication

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/chat/message
// @desc    Process a chat message from the authenticated user
// @access  Private (authMiddleware required)
// ─────────────────────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user; // Injected by authMiddleware

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    // ── Plug your existing chatbot / AI logic here ──────────────────────────
    // For now, we echo back a placeholder response.
    // Replace this block with your actual Sahanubhuti chatbot response logic.
    const botResponse = `Hello ${user.name}, you said: "${message}". (Replace this with real bot logic)`;
    // ────────────────────────────────────────────────────────────────────────

    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        botResponse,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing your message.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/chat/verify
// @desc    Verify that the user's token is still valid (used on page load)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const verifySession = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Session is active.",
    user: req.user,
  });
};

module.exports = { sendMessage, verifySession };