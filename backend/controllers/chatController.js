// backend/controllers/chatController.js
// Handles chat — calls Claude via OpenRouter for real empathetic responses

const SYSTEM_PROMPT = `You are Sahanubhuti, a warm, compassionate emotional support companion.
Your name means "empathy" or "fellow-feeling" in Sanskrit.

Your role:
- Listen deeply and respond with genuine care and empathy
- Validate the user's feelings without judgment
- Ask gentle follow-up questions to help them open up
- Offer comfort, not clinical advice
- Never diagnose or replace professional mental health care
- If someone is in crisis or mentions self-harm, gently encourage them to contact a professional or crisis line (iCall: 9820466726, Emergency: 112)

Your tone:
- Warm, gentle, and human — like a trusted friend
- Use soft language: "I hear you", "that sounds really hard", "you're not alone"
- Occasionally use gentle emojis (🌸 💛 🫂 🌿 💙) but don't overdo it
- Keep responses concise — 2 to 4 sentences usually, unless they need more
- Never say you are an AI unless directly asked

Remember: You are Sahanubhuti. The user has come to you for comfort.`;

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/chat/message
// @desc    Send message to Claude via OpenRouter and return response
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    // Build messages array (OpenAI-compatible format used by OpenRouter)
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-20),
      { role: "user", content: message },
    ];

    // Call Claude via OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.CLIENT_ORIGIN || "https://akshat-shaw-509.github.io",
        "X-Title": "Sahanubhuti",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 300,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", JSON.stringify(data));
      throw new Error(data.error?.message || "OpenRouter API error");
    }

    const botResponse = data.choices?.[0]?.message?.content || "I'm here for you. 🌸";

    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        botResponse,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Chat error:", error.message);

    const fallbacks = [
      "I'm here for you. 💛 Could you tell me more about how you're feeling?",
      "Thank you for sharing that with me. 🌸 I'm listening — please go on.",
      "You're not alone in this. 🫂 What's been on your heart lately?",
    ];
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    res.status(200).json({
      success: true,
      data: {
        userMessage: req.body.message,
        botResponse: fallback,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/chat/verify
// @desc    Verify session is still valid
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
