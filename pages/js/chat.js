/* ===================================
   SAHANUBHUTI – Chat Page JS
   Wired to real Claude AI backend.
   Falls back to local responses for
   guest users (not logged in).
   =================================== */

const API_URL = "http://127.0.0.1:5000/api";

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
let messageNodes = [];
let currentThreadId = null;
let threadsCache = [];
let lastInputSource = "text";

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
  initVoiceToText();
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
        await loadThreadsAndSelect();
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
    threadsCache = [];
    currentThreadId = null;
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

async function loadChatHistory(threadId) {
  const token = getToken();
  if (!token) return;

  try {
    const url = threadId
      ? `${API_URL}/chat/history?threadId=${encodeURIComponent(threadId)}`
      : `${API_URL}/chat/history`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) return;

    resetChatContainer();

    conversationHistory = [];
    messageNodes = [];
    for (const msg of data.data || []) {
      const timeLabel = formatHistoryTime(msg.createdAt);
      if (msg.role === "user") appendUserMessage(msg.content, timeLabel);
      else appendAIMessage(msg.content, timeLabel);
      conversationHistory.push({ role: msg.role, content: msg.content });
    }

    if (!data.data || data.data.length === 0) {
      appendAIMessage(
        "Hello, dear friend. I'm Sahanubhuti, and I'm here to listen with care and understanding. How are you feeling today? 🌸"
      );
    }
  } catch {
    /* ignore history load failures */
  }
}

async function loadThreadsAndSelect(preferredThreadId = null) {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/chat/threads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) return;

    threadsCache = data.data || [];
    renderThreadsList();

    if (threadsCache.length > 0) {
      const targetId =
        preferredThreadId && threadsCache.find((t) => t._id === preferredThreadId)
          ? preferredThreadId
          : currentThreadId && threadsCache.find((t) => t._id === currentThreadId)
          ? currentThreadId
          : threadsCache[0]._id;
      await selectThread(targetId);
    } else {
      await createNewThread();
    }
  } catch {
    /* ignore thread load failures */
  }
}

async function createNewThread() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/chat/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: "New chat" }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) return;

    threadsCache.unshift(data.data);
    renderThreadsList();
    await selectThread(data.data._id);
  } catch {
    /* ignore create failures */
  }
}

async function selectThread(threadId) {
  currentThreadId = threadId;
  renderThreadsList();
  await loadChatHistory(threadId);
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
    const source = lastInputSource;
    sendMessage(text, false, source);
    input.value = "";
    input.style.height = "auto";
    updateSendBtn();
    lastInputSource = "text";
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
    lastInputSource = "text";
  });

  updateSendBtn();
}

// Threads sidebar actions
document.addEventListener("DOMContentLoaded", () => {
  const newChatBtn = document.getElementById("newChatBtn");
  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      createNewThread();
    });
  }
});

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
   VOICE → TEXT (Web Speech API)
   ══════════════════════════════════════ */

function initVoiceToText() {
  const input = document.getElementById("chatInput");
  const voiceBtn = document.getElementById("voiceBtn");
  const statusEl = document.getElementById("voiceStatus");
  if (!input || !voiceBtn || !statusEl) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.setAttribute("aria-label", "Voice input not supported");
    statusEl.textContent = "Voice input isn’t supported in this browser.";
    return;
  }

  // Mic + speech APIs are often blocked on file:// or non-secure origins.
  if (location.protocol === "file:") {
    statusEl.textContent =
      "Voice input needs a secure site. Run via Live Server (http://127.0.0.1:5500) or HTTPS.";
  }

  let recognition = null;
  let isRecording = false;
  let baseText = "";
  let finalTranscript = "";

  const setStatus = (text, listening = false) => {
    statusEl.textContent = text || "";
    statusEl.classList.toggle("listening", Boolean(listening));
  };

  const updateInputValue = (interim = "") => {
    const glue = baseText && !baseText.endsWith(" ") ? " " : "";
    const combined = `${baseText}${glue}${finalTranscript}${interim}`.trimStart();
    input.value = combined;
    autoResizeTextarea();
    updateSendBtn();
  };

  const stopRecognition = () => {
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };

  const startRecognition = () => {
    if (isRecording) return;

    // Clear any previous text before a new voice capture
    input.value = "";
    baseText = "";
    finalTranscript = "";

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isRecording = true;
      voiceBtn.classList.add("recording");
      voiceBtn.setAttribute("aria-label", "Stop voice input");
      setStatus("Listening… speak now.", true);
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript || "";
        if (res.isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      if ((finalTranscript + interim).trim()) {
        lastInputSource = "voice";
      }
      updateInputValue(interim);
    };

    recognition.onerror = (event) => {
      // Common: 'not-allowed' when mic permission denied
      const err = event?.error || "speech_error";
      if (err === "not-allowed" || err === "service-not-allowed") {
        setStatus("Microphone permission denied. Please allow mic access.", false);
      } else if (err === "no-speech") {
        setStatus("No speech detected. Try again.", false);
      } else if (err === "audio-capture") {
        setStatus("No microphone found. Check your audio device.", false);
      } else {
        setStatus("Voice input error. Please try again.", false);
      }
    };

    recognition.onend = () => {
      isRecording = false;
      voiceBtn.classList.remove("recording");
      voiceBtn.setAttribute("aria-label", "Start voice input");

      // Commit final transcript (without interim)
      updateInputValue("");

      // If user stopped it intentionally, keep status minimal
      if (finalTranscript.trim()) setStatus("Voice captured. You can edit and send.", false);
      else setStatus("", false);
    };

    try {
      recognition.start();
    } catch {
      setStatus("Couldn’t start voice input. Please try again.", false);
    }
  };

  voiceBtn.addEventListener("click", () => {
    if (isRecording) stopRecognition();
    else startRecognition();
  });

  // If the user sends, stop listening to avoid unwanted capture.
  document.getElementById("sendBtn")?.addEventListener("click", () => {
    if (isRecording) stopRecognition();
  });
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
async function sendMessage(text, isPrompt = false, source = "text") {
  if (isTyping) return;

  appendUserMessage(text);
  showTypingIndicator();

  const token = getToken();
  const shouldSpeak = source === "voice";

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
          threadId: currentThreadId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.data?.threadId) currentThreadId = data.data.threadId;
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
        await loadThreadsAndSelect(currentThreadId);
        if (shouldSpeak) speakText(data.data.botResponse);
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
    if (shouldSpeak) speakText(aiReply);
  }, delay);
}

/* ══════════════════════════════════════
   MESSAGE RENDERING
   ══════════════════════════════════════ */

function appendUserMessage(text, timeLabel = "") {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  const wrap = document.createElement("div");
  wrap.className = "message message--user";
  wrap.innerHTML = `
    <div class="msg-content">
      <div class="msg-bubble">${escapeHTML(text)}</div>
      <span class="msg-time">${timeLabel || getTimestamp()}</span>
    </div>
  `;
  container.appendChild(wrap);
  messageNodes.push({ role: "user", content: text, el: wrap, time: timeLabel || getTimestamp() });
  scrollToBottom();
}

function appendAIMessage(text, timeLabel = "") {
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
      <span class="msg-time">${timeLabel || getTimestamp()}</span>
    </div>
  `;
  container.appendChild(wrap);
  messageNodes.push({ role: "assistant", content: text, el: wrap, time: timeLabel || getTimestamp() });
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

function resetChatContainer() {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  container.innerHTML = "";

  const divider = document.createElement("div");
  divider.className = "chat-divider";
  divider.setAttribute("aria-label", "Today");
  divider.innerHTML = "<span>Today</span>";
  container.appendChild(divider);

  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.id = "typingIndicator";
  typing.setAttribute("aria-label", "Sahanubhuti is typing");
  typing.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                 C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                 c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
    <div class="typing-bubble" aria-hidden="true">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(typing);
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

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  const cleaned = String(text || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return;

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore speech errors
  }
}

function formatHistoryTime(dateValue) {
  if (!dateValue) return getTimestamp();
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return getTimestamp();
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function renderThreadsList() {
  const list = document.getElementById("threadsList");
  const empty = document.getElementById("threadsEmpty");
  if (!list) return;

  list.innerHTML = "";

  if (!threadsCache || threadsCache.length === 0) {
    if (empty) list.appendChild(empty);
    return;
  }

  threadsCache.forEach((thread) => {
    const el = document.createElement("div");
    el.className = "history-item" + (thread._id === currentThreadId ? " active" : "");
    const title = thread.title || "New chat";
    const updated = formatHistoryTime(thread.updatedAt);
    el.innerHTML = `
      <div class="history-item__text">${escapeHTML(title)}</div>
      <div class="history-item__meta">Updated · ${updated}</div>
    `;
    el.addEventListener("click", () => selectThread(thread._id));
    list.appendChild(el);
  });
}

