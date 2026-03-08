/* ===================================
   SAHANUBHUTI – Chat Page JS
   Wired to real Claude AI backend.
   Falls back to local responses for
   guest users (not logged in).
   =================================== */

const API_URL = "https://sahanubhuti.onrender.com/api";

/* ══════════════════════════════════════
   AUTH HELPERS
   ══════════════════════════════════════ */

function getToken() {
  return localStorage.getItem("sahanubhuti_token");
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("sahanubhuti_user"));
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem("sahanubhuti_token");
  localStorage.removeItem("sahanubhuti_user");
}

/* ══════════════════════════════════════
   LOCAL FALLBACK RESPONSES
   (shown when user is not logged in)
   ══════════════════════════════════════ */
const AI_RESPONSES = {
  calm: [
    "That's wonderful to hear. 🌿 A calm mind is such a gift. What's been helping you feel this way today?",
    "Peaceful moments are precious. 🌸 I'm glad you're feeling calm. Would you like to talk about anything on your mind?",
  ],
  sad: [
    "I hear you, and I want you to know it's completely okay to feel sad. Your feelings are valid. 💙 Can you tell me more about what's weighing on your heart?",
    "Sadness can feel so heavy sometimes. I'm right here with you, dear friend. 🫂 You don't have to carry this alone.",
  ],
  anxious: [
    "Anxiety can feel overwhelming, but you're not alone in this. 💛 Let's take a gentle breath together. What's been on your mind?",
    "I can sense you might be carrying some worry. That's okay — this is a safe space. 🌼 Tell me what's been troubling you.",
  ],
  angry: [
    "It's completely okay to feel angry. Your feelings deserve to be heard and respected. 💪 Would you like to share what happened?",
    "Anger often tells us something important. I'm here to listen without judgment. 🧡 What's been going on?",
  ],
  tired: [
    "Exhaustion is your body and mind asking for care. 🌙 You deserve rest and gentleness. How long have you been feeling this way?",
    "Being tired goes beyond just sleep sometimes, doesn't it? 💜 I'm here. Let's talk about what's been draining your energy.",
  ],
  default: [
    "I'm here for you, always. 💕 Please share whatever is on your mind — this is a safe, judgment-free space.",
    "Thank you for trusting me with your thoughts. 🌸 I'm listening with my whole heart. How can I support you today?",
    "You've taken a brave step by reaching out. 🌿 I'm here to listen and walk alongside you. What would you like to talk about?",
    "Every feeling you have matters, and so do you. 💛 I'm right here — tell me what's going on.",
    "This is your safe space. 🫂 Whatever you're feeling, you don't have to face it alone. I'm listening.",
    "I want you to know — you are seen, heard, and valued. 🌸 What's been on your heart lately?",
  ],
};

const QUICK_RESPONSES = {
  "I feel overwhelmed":
    "Feeling overwhelmed is exhausting, and it takes courage to acknowledge it. 🌿 Let's slow down together. Can you tell me — is there one specific thing that feels like the biggest weight right now? Sometimes naming it helps us understand it better.",
  "I need someone to talk to":
    "I'm so glad you reached out. 💕 That alone took courage. I'm right here, and I have all the time in the world for you. Please share whatever is on your heart — no judgment, just care.",
  "I'm struggling with anxiety":
    "Anxiety can feel like a storm inside your chest. 💙 You're not alone in this feeling. Let's try something — take one slow, deep breath with me. In through the nose... and gently out. You're safe here. Tell me more about what's been triggering this for you.",
  "I can't sleep lately":
    "Sleep struggles can make everything feel so much harder. 🌙 Your mind and body are clearly asking for something. Have you noticed any patterns — like racing thoughts, worries, or restlessness? I'd love to help you explore what might be underneath this.",
};

/* ══════════════════════════════════════
   STATE
   ══════════════════════════════════════ */

let selectedMood = null;
let isTyping = false;
let messageCount = 0;

// Multi-turn conversation history sent to backend
// Format: [{ role: 'user'|'assistant', content: string }]
let conversationHistory = [];

/* ══════════════════════════════════════
   INIT
   ══════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  fadeInPage();
  initNavbarScroll();
  initMoodButtons();
  initChatInput();
  initSupportButton();
  initPromptChips();
  autoResizeTextarea();
  checkAuthAndInit(); // Check session → update UI accordingly
});

function fadeInPage() {
  const done = () => document.body.classList.add("loaded");
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
}

function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  const h = () => navbar.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", h, { passive: true });
  h();
}

/* ══════════════════════════════════════
   AUTH CHECK & NAVBAR UPDATE
   ══════════════════════════════════════ */

async function checkAuthAndInit() {
  const token = getToken();
  const user = getStoredUser();

  if (token && user) {
    // Verify the token is still valid server-side
    try {
      const res = await fetch(`${API_URL}/chat/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Session valid — show AI badge and update navbar
        updateNavbarForAuth(user);
        showAIBadge();
        focusChatInput();
        return;
      }
    } catch {
      /* network error — treat as guest */
    }

    // Token rejected — clear stale session
    clearAuth();
  }

  // Guest mode — show login prompt banner
  showGuestBanner();
  focusChatInput();
}

function updateNavbarForAuth(user) {
  const authEl = document.querySelector(".navbar__auth");
  if (!authEl) return;

  authEl.innerHTML = `
    <span style="
      font-size: 0.85rem;
      color: var(--text-muted, #a08880);
      font-family: var(--font-accent, serif);
      font-style: italic;
    ">Hi, ${user.name.split(" ")[0]} 🌸</span>
    <button class="btn-login" id="logoutBtn" aria-label="Log out">Log Out</button>
  `;

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    const t = getToken();
    if (t) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${t}` },
        });
      } catch {}
    }
    clearAuth();
    conversationHistory = [];
    location.reload();
  });
}

/**
 * Adds a small "✨ AI-powered" pill near the chat header
 */
function showAIBadge() {
  const header = document.querySelector(".chat-header__status");
  if (!header) return;
  header.innerHTML = `
    <div class="status-dot" aria-hidden="true"></div>
    <span>Active now &nbsp;·&nbsp; ✨ AI-powered</span>
  `;
}

/**
 * Shows a soft banner prompting login — chat still works with local responses
 */
function showGuestBanner() {
  const inputWrap = document.querySelector(".chat-input-wrap");
  if (!inputWrap) return;

  const existing = document.getElementById("guestBanner");
  if (existing) return;

  const banner = document.createElement("div");
  banner.id = "guestBanner";
  banner.setAttribute("role", "status");
  banner.style.cssText = `
    background: linear-gradient(135deg, #fdf6ee, #fef3f0);
    border: 1px solid rgba(212,149,106,0.25);
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 0.8rem;
    color: #a07060;
    font-family: var(--font-accent, serif);
    font-style: italic;
    text-align: center;
    margin-bottom: 8px;
  `;
  banner.innerHTML = `
    🌸 You're chatting as a guest. 
    <a href="/index.html" style="color: var(--accent, #d4956a); text-decoration: underline; font-weight: 500;">
      Log in
    </a> for personalised, Claude AI-powered responses.
  `;

  inputWrap.insertBefore(banner, inputWrap.firstChild);
}

function focusChatInput() {
  setTimeout(() => document.getElementById("chatInput")?.focus(), 400);
}

/* ══════════════════════════════════════
   MOOD BUTTONS
   ══════════════════════════════════════ */

const MOOD_DATA = {
  calm: {
    emoji: "😌",
    response:
      "Thank you for sharing. A calm heart is a gift — hold onto it. 💚\nYour feelings are valid and important.",
  },
  sad: {
    emoji: "😢",
    response:
      "Thank you for sharing how you feel.\nYour sadness is real and valid. I'm here with you. 💙",
  },
  anxious: {
    emoji: "😰",
    response:
      "Thank you for sharing how you feel.\nAnxiety can be hard. You're brave for naming it. 💛",
  },
  angry: {
    emoji: "😠",
    response:
      "Thank you for sharing how you feel.\nYour anger is valid. I hear you. 🧡",
  },
  tired: {
    emoji: "😴",
    response:
      "Thank you for sharing how you feel.\nRest is important. Be gentle with yourself. 💜",
  },
};

function initMoodButtons() {
  const btns = document.querySelectorAll(".mood-btn");
  const responseEl = document.getElementById("moodResponse");

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mood = btn.dataset.mood;

      btns.forEach((b) =>
        b.classList.remove(
          "active--calm",
          "active--sad",
          "active--anxious",
          "active--angry",
          "active--tired"
        )
      );

      if (selectedMood === mood) {
        selectedMood = null;
        if (responseEl) {
          responseEl.style.opacity = "0";
          setTimeout(() => {
            responseEl.textContent =
              "Thank you for sharing how you feel.\nYour feelings are valid and important. 💕";
            responseEl.style.opacity = "1";
          }, 200);
        }
        return;
      }

      selectedMood = mood;
      btn.classList.add(`active--${mood}`);

      if (responseEl) {
        responseEl.style.opacity = "0";
        setTimeout(() => {
          responseEl.textContent = MOOD_DATA[mood]?.response || "";
          responseEl.style.opacity = "1";
        }, 200);
      }

      const moodMsg = `I'm feeling ${mood} right now ${MOOD_DATA[mood]?.emoji}`;
      setTimeout(() => sendMessage(moodMsg, true), 350);
    });
  });
}

/* ══════════════════════════════════════
   CHAT INPUT
   ══════════════════════════════════════ */

function initChatInput() {
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  if (!input || !sendBtn) return;

  sendBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    sendMessage(text);
    input.value = "";
    input.style.height = "auto";
    updateSendBtn();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  input.addEventListener("input", () => {
    autoResizeTextarea();
    updateSendBtn();
  });

  updateSendBtn();
}

function updateSendBtn() {
  const input = document.getElementById("chatInput");
  const btn = document.getElementById("sendBtn");
  if (!input || !btn) return;
  btn.disabled = input.value.trim() === "";
}

function autoResizeTextarea() {
  const input = document.getElementById("chatInput");
  if (!input) return;
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 120) + "px";
}

/* ══════════════════════════════════════
   QUICK PROMPT CHIPS
   ══════════════════════════════════════ */

function initPromptChips() {
  document.querySelectorAll(".prompt-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const text = chip.dataset.prompt;
      if (!text) return;
      sendMessage(text, true);
    });
  });
}

/* ══════════════════════════════════════
   MESSAGING — CORE LOGIC
   ══════════════════════════════════════ */

function getTimestamp() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Main send function.
 * - If logged in → calls backend Claude AI (multi-turn)
 * - If guest     → uses local response pool as fallback
 */
async function sendMessage(text, isPrompt = false) {
  if (isTyping) return;

  appendUserMessage(text);
  showTypingIndicator();

  const token = getToken();

  if (token) {
    // ── Authenticated: Use Claude AI ──────────────────────────────────────
    try {
      const res = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history: conversationHistory, // Send full conversation context
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Append to history for next turn
        conversationHistory.push({ role: "user", content: text });
        conversationHistory.push({
          role: "assistant",
          content: data.data.botResponse,
        });
        // Cap history to last 40 messages (~20 turns)
        if (conversationHistory.length > 40) {
          conversationHistory = conversationHistory.slice(-40);
        }

        hideTypingIndicator();
        appendAIMessage(data.data.botResponse);
        messageCount++;
        return;
      }

      if (res.status === 401) {
        // Session expired mid-conversation
        clearAuth();
        conversationHistory = [];
        showGuestBanner();
      }

      // Server returned an error with a fallback message
      if (data.fallback) {
        hideTypingIndicator();
        appendAIMessage(data.fallback);
        messageCount++;
        return;
      }
    } catch {
      /* Network error — fall through to local response */
    }
  }

  // ── Guest / Fallback: Local response pool ─────────────────────────────
  const delay = 900 + Math.random() * 900;
  setTimeout(() => {
    hideTypingIndicator();
    const aiReply = getLocalResponse(text);
    appendAIMessage(aiReply);
    messageCount++;
  }, delay);
}

/* ══════════════════════════════════════
   MESSAGE RENDERING
   ══════════════════════════════════════ */

function appendUserMessage(text) {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  const wrap = document.createElement("div");
  wrap.className = "message message--user";
  wrap.innerHTML = `
    <div class="msg-content">
      <div class="msg-bubble">${escapeHTML(text)}</div>
      <span class="msg-time">${getTimestamp()}</span>
    </div>
  `;
  container.appendChild(wrap);
  scrollToBottom();
}

function appendAIMessage(text) {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  const wrap = document.createElement("div");
  wrap.className = "message message--ai";
  wrap.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                 C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                 c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
    <div class="msg-content">
      <div class="msg-bubble">${formatMessage(text)}</div>
      <span class="msg-time">${getTimestamp()}</span>
    </div>
  `;
  container.appendChild(wrap);
  scrollToBottom();
}

function showTypingIndicator() {
  isTyping = true;
  const indicator = document.getElementById("typingIndicator");
  if (indicator) {
    indicator.classList.add("visible");
    scrollToBottom();
  }
}

function hideTypingIndicator() {
  isTyping = false;
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.classList.remove("visible");
}

function scrollToBottom() {
  const container = document.getElementById("chatMessages");
  if (container) {
    setTimeout(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, 50);
  }
}

/* ══════════════════════════════════════
   LOCAL RESPONSE LOGIC (guest fallback)
   ══════════════════════════════════════ */

function getLocalResponse(userText) {
  const lower = userText.toLowerCase();

  for (const [key, val] of Object.entries(QUICK_RESPONSES)) {
    if (lower.includes(key.toLowerCase())) return val;
  }

  if (
    lower.includes("calm") ||
    lower.includes("good") ||
    lower.includes("fine") ||
    lower.includes("great") ||
    lower.includes("happy")
  )
    return pick(AI_RESPONSES.calm);
  if (
    lower.includes("sad") ||
    lower.includes("cry") ||
    lower.includes("depress") ||
    lower.includes("unhappy") ||
    lower.includes("hurt")
  )
    return pick(AI_RESPONSES.sad);
  if (
    lower.includes("anxi") ||
    lower.includes("worry") ||
    lower.includes("stress") ||
    lower.includes("panic") ||
    lower.includes("scare")
  )
    return pick(AI_RESPONSES.anxious);
  if (
    lower.includes("angry") ||
    lower.includes("anger") ||
    lower.includes("furious") ||
    lower.includes("mad") ||
    lower.includes("frustrated")
  )
    return pick(AI_RESPONSES.angry);
  if (
    lower.includes("tired") ||
    lower.includes("exhaust") ||
    lower.includes("sleep") ||
    lower.includes("fatigue")
  )
    return pick(AI_RESPONSES.tired);

  return pick(AI_RESPONSES.default);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ══════════════════════════════════════
   SUPPORT BUTTON
   ══════════════════════════════════════ */

function initSupportButton() {
  const btn = document.getElementById("supportBtn");
  const panel = document.getElementById("supportPanel");
  if (!btn || !panel) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove("open");
    }
  });
}

/* ══════════════════════════════════════
   UTILS
   ══════════════════════════════════════ */

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMessage(text) {
  return escapeHTML(text).replace(/\n/g, "<br>");
}

