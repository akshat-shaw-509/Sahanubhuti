/* ===================================
   SAHANUBHUTI – Journal Page JS
   =================================== */

/* ══════════════════════════════════════
   AUTH NAVBAR
   ══════════════════════════════════════ */

const API_URL = "https://sahanubhuti.onrender.com/api";

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

function initAuthNavbar() {
  const token = getToken();
  const user  = getStoredUser();

  const authEl = document.querySelector(".navbar__auth");
  if (!authEl) return;

  if (token && user) {
    authEl.innerHTML = `
      <span style="
        font-size: 0.85rem;
        color: var(--text-muted, #a08880);
        font-family: var(--font-accent, serif);
        font-style: italic;
        white-space: nowrap;
      ">Hi, ${user.name.split(" ")[0]} 🌸</span>
      <button class="btn-login" id="logoutBtn" aria-label="Log out">Log Out</button>
    `;

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* ignore */ }
      clearAuth();
      location.reload();
    });
  }
}

/* ── Prompt Pool ── */
const PROMPTS = [
  '"Would you like to write about what made you feel this way today?"',
  '"What is one thing you are grateful for right now, however small?"',
  '"Describe a moment today where you felt truly yourself."',
  '"What would you say to a dear friend going through what you\'re feeling?"',
  '"If your feelings right now had a color, what would it be — and why?"',
  '"What is one thing that brought you even a tiny spark of comfort today?"',
  '"Write about something that has been weighing on your heart lately."',
  '"What does your ideal, peaceful day look like? Describe it freely."',
  '"What is something about yourself you wish more people understood?"',
  '"Finish this sentence: Today I realized that I…"',
  '"What emotion have you been avoiding lately? Can you write about it gently?"',
  '"Describe a memory that makes you feel warm and safe."',
  '"What are three small things that are going right in your life right now?"',
  '"What boundary do you wish you could set — and what stops you?"',
  '"If today had a title, what would it be?"',
];

const MOOD_MAP = {
  calm: '😌', sad: '😢', anxious: '😰', angry: '😠', tired: '😴',
};

/* ── State ── */
let entries = [];
let currentPromptIdx = 0;
let activeEntryId = null;

/* ════════════════════════════════════
   INIT
   ════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fadeInPage();
  initNavbarScroll();
  initAuthNavbar();       // ← auth state
  loadEntries();
  setRandomPrompt(false);
  initTextarea();
  initNewPromptBtn();
  initSaveBtn();
  initEntryOverlay();
  renderEntries();
  updateWordCount();
});

function fadeInPage() {
  const done = () => document.body.classList.add('loaded');
  if (document.readyState === 'complete') done();
  else window.addEventListener('load', done);
}

function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const h = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', h, { passive: true });
  h();
}

/* ════════════════════════════════════
   STORAGE
   ════════════════════════════════════ */
function loadEntries() {
  try {
    const raw = localStorage.getItem('sahanubhuti_journal');
    entries = raw ? JSON.parse(raw) : [];
  } catch { entries = []; }
}

function saveEntries() {
  try { localStorage.setItem('sahanubhuti_journal', JSON.stringify(entries)); } catch {}
}

function getMoodForToday() {
  try {
    const log = JSON.parse(localStorage.getItem('sahanubhuti_moodlog') || '{}');
    const key  = new Date().toISOString().slice(0, 10);
    return log[key] || null;
  } catch { return null; }
}

/* ════════════════════════════════════
   PROMPTS
   ════════════════════════════════════ */
function setRandomPrompt(animate = true) {
  const box = document.getElementById('promptBox');
  const txt = document.getElementById('promptText');
  if (!txt) return;

  const newIdx = Math.floor(Math.random() * PROMPTS.length);
  currentPromptIdx = newIdx;

  if (animate && box) {
    box.classList.add('refreshing');
    setTimeout(() => {
      txt.textContent = PROMPTS[newIdx];
      box.classList.remove('refreshing');
    }, 280);
  } else {
    txt.textContent = PROMPTS[newIdx];
  }
}

function initNewPromptBtn() {
  document.getElementById('newPromptBtn')?.addEventListener('click', () => {
    setRandomPrompt(true);
    const ta = document.getElementById('journalTextarea');
    if (ta && ta.value.trim() === '') ta.focus();
  });
}

/* ════════════════════════════════════
   TEXTAREA
   ════════════════════════════════════ */
function initTextarea() {
  const ta = document.getElementById('journalTextarea');
  if (!ta) return;
  ta.addEventListener('input', () => {
    updateWordCount();
    updateSaveBtnState();
  });
}

function updateWordCount() {
  const ta = document.getElementById('journalTextarea');
  const el = document.getElementById('wordCount');
  if (!ta || !el) return;
  const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
  el.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

function updateSaveBtnState() {
  const ta  = document.getElementById('journalTextarea');
  const btn = document.getElementById('saveEntryBtn');
  if (!ta || !btn) return;
  const hasContent = ta.value.trim().length > 0;
  btn.disabled = !hasContent;
  btn.classList.toggle('active', hasContent);
}

/* ════════════════════════════════════
   SAVE
   ════════════════════════════════════ */
function initSaveBtn() {
  const btn   = document.getElementById('saveEntryBtn');
  const toast = document.getElementById('saveToast');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const ta = document.getElementById('journalTextarea');
    if (!ta || !ta.value.trim()) return;

    const promptText = document.getElementById('promptText')?.textContent || '';
    const now = new Date();

    const entry = {
      id:        Date.now(),
      date:      now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
      shortDate: now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
      time:      now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
      prompt:    promptText,
      text:      ta.value.trim(),
      mood:      getMoodForToday(),
      wordCount: ta.value.trim().split(/\s+/).length,
    };

    entries.unshift(entry);
    saveEntries();
    renderEntries();

    ta.value = '';
    updateWordCount();
    updateSaveBtnState();
    setRandomPrompt(true);

    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2600);
    }

    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Saved!`;
    setTimeout(() => {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Save entry`;
    }, 2000);
  });

  updateSaveBtnState();
}

/* ════════════════════════════════════
   ENTRIES LIST
   ════════════════════════════════════ */
function renderEntries() {
  const list  = document.getElementById('entriesList');
  const count = document.getElementById('entriesCount');
  if (!list) return;

  if (count) count.textContent = `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`;

  if (!entries.length) {
    list.innerHTML = `
      <div class="entries-empty">
        <span aria-hidden="true">📖</span>
        Your journal awaits. Write your first entry above.
      </div>`;
    return;
  }

  list.innerHTML = entries.map(e => `
    <div class="entry-item" data-id="${e.id}" role="button" tabindex="0" aria-label="Open entry from ${e.shortDate}">
      <div class="entry-item__meta">
        <span class="entry-item__date">${e.shortDate} · ${e.time}</span>
        <span class="entry-item__mood" aria-label="Mood: ${e.mood || 'not set'}">${e.mood ? (MOOD_MAP[e.mood] || '') : ''}</span>
      </div>
      <p class="entry-item__preview">${escapeHTML(e.text)}</p>
      <button class="entry-item__delete" data-id="${e.id}" aria-label="Delete entry">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.entry-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.entry-item__delete')) return;
      openEntry(Number(el.dataset.id));
    });
    el.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.entry-item__delete')) {
        openEntry(Number(el.dataset.id));
      }
    });
  });

  list.querySelectorAll('.entry-item__delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteEntry(Number(btn.dataset.id));
    });
  });
}

function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id);
  saveEntries();
  renderEntries();
}

/* ════════════════════════════════════
   ENTRY OVERLAY
   ════════════════════════════════════ */
function initEntryOverlay() {
  const overlay  = document.getElementById('entryOverlay');
  const closeBtn = document.getElementById('closeEntryModal');
  if (!overlay) return;

  closeBtn?.addEventListener('click', () => closeEntry());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeEntry();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEntry();
  });
}

function openEntry(id) {
  const entry   = entries.find(e => e.id === id);
  const overlay = document.getElementById('entryOverlay');
  if (!entry || !overlay) return;

  document.getElementById('modalDate').textContent   = entry.date + (entry.mood ? `  ${MOOD_MAP[entry.mood]}` : '');
  document.getElementById('modalPrompt').textContent = entry.prompt;
  document.getElementById('modalBody').textContent   = entry.text;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEntry() {
  document.getElementById('entryOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ════════════════════════════════════
   UTILS
   ════════════════════════════════════ */
function escapeHTML(str) {
  return str
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

