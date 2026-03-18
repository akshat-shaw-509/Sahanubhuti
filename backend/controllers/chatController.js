// backend/controllers/chatController.js
// Handles chat — calls Claude via OpenRouter for real empathetic responses

const ChatMessage = require("../models/ChatMessage");
const ChatThread = require("../models/ChatThread");

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
const HISTORY_LIMIT = 40; // ~20 turns

const loadHistory = async (userId, threadId) => {
  const query = { user: userId };
  if (threadId) query.thread = threadId;
  const docs = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .lean();
  return docs.reverse().map((d) => ({
    role: d.role,
    content: d.content,
    createdAt: d.createdAt,
  }));
};

const getOrCreateDefaultThread = async (userId) => {
  let thread = await ChatThread.findOne({ user: userId }).sort({ updatedAt: -1 });
  if (!thread) {
    thread = await ChatThread.create({ user: userId, title: "New chat" });
  }
  return thread;
};

const sendMessage = async (req, res) => {
  let thread = null;
  try {
    const { message, threadId } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    thread = threadId
      ? await ChatThread.findOne({ _id: threadId, user: req.user.id })
      : await getOrCreateDefaultThread(req.user.id);

    if (!thread) {
      return res.status(404).json({ success: false, message: "Thread not found." });
    }

    // Store the user message first
    await ChatMessage.create({
      user: req.user.id,
      thread: thread._id,
      role: "user",
      content: message.trim(),
    });

    // Build messages array (OpenAI-compatible format used by OpenRouter)
    const history = await loadHistory(req.user.id, thread._id);
    const promptHistory = history.map((h) => ({ role: h.role, content: h.content }));
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...promptHistory,
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
        model: "arcee-ai/trinity-mini:free",
        max_tokens: 500,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", JSON.stringify(data));
      throw new Error(data.error?.message || "OpenRouter API error");
    }

    const botResponse = data.choices?.[0]?.message?.content || "I'm here for you. 🌸";

    // Store assistant reply
    await ChatMessage.create({
      user: req.user.id,
      thread: thread._id,
      role: "assistant",
      content: botResponse,
    });

    // If thread is still a generic title, update it based on first message
    if (thread.title === "New chat") {
      const title = message.trim().slice(0, 60);
      if (title) {
        thread.title = title;
      }
    }
    thread.updatedAt = new Date();
    await thread.save();

    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        botResponse,
        timestamp: new Date().toISOString(),
        threadId: thread._id,
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

    // Store assistant fallback reply too
    try {
      await ChatMessage.create({
        user: req.user.id,
        thread: thread._id,
        role: "assistant",
        content: fallback,
      });
    } catch {
      // If DB write fails, still return response
    }

    res.status(200).json({
      success: true,
      data: {
        userMessage: req.body.message,
        botResponse: fallback,
        timestamp: new Date().toISOString(),
        threadId: thread?._id,
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

const getHistory = async (req, res) => {
  try {
    const threadId = req.query.threadId;
    const history = await loadHistory(req.user.id, threadId);
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("History error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load history." });
  }
};

const getThreads = async (req, res) => {
  try {
    const threads = await ChatThread.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: threads });
  } catch (error) {
    console.error("Threads error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load threads." });
  }
};

const createThread = async (req, res) => {
  try {
    const title = (req.body?.title || "New chat").toString().trim().slice(0, 80) || "New chat";
    const thread = await ChatThread.create({ user: req.user.id, title });
    res.status(201).json({ success: true, data: thread });
  } catch (error) {
    console.error("Create thread error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create thread." });
  }
};

module.exports = { sendMessage, verifySession, getHistory, getThreads, createThread };


