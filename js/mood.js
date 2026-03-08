/* ===================================
   SAHANUBHUTI – Mood Tracker JS
   =================================== */

/* ── Mood Config ── */
const MOODS = {
  calm:    { emoji: '😌', label: 'Calm',    color: '#7abfb0', insight: 'calm' },
  sad:     { emoji: '😢', label: 'Sad',     color: '#a0b4d4', insight: 'sad' },
  anxious: { emoji: '😰', label: 'Anxious', color: '#c8a850', insight: 'anxious' },
  angry:   { emoji: '😠', label: 'Angry',   color: '#d48080', insight: 'angry' },
  tired:   { emoji: '😴', label: 'Tired',   color: '#a090c8', insight: 'tired' },
};

const EMPTY_EMOJI = '🔘';
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ── Insights ── */
const WEEKLY_INSIGHTS = {
  calm:    { main: "You've had mostly calm days!",    quote: "Stillness is strength. Keep nurturing it. 🌿" },
  sad:     { main: "It's been a tender week.",         quote: "It's okay to feel — every tear is valid. 💙" },
  anxious: { main: "Quite an anxious week for you.",   quote: "Breathe. You've made it through every hard day so far. 💛" },
  angry:   { main: "Some strong feelings this week.",  quote: "Your emotions are messengers — not enemies. 🧡" },
  tired:   { main: "You've been carrying a heavy load.", quote: "Rest is not laziness. You deserve to recharge. 💜" },
  mixed:   { main: "A beautifully mixed emotional week.", quote: "All emotions are valid — they're just visitors passing through. 🌱" },
};

/* ── State ── */
let selectedMood = null;   // currently picked in check-in
let currentWeekOffset = 0; // 0 = this week, -1 = last week, etc.
let moodLog = {};          // { 'YYYY-MM-DD': 'calm' }

/* ════════════════════════════════════
   INIT
   ════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  fadeInPage();
  initNavbarScroll();
  loadMoodLog();
  initMoodPicker();
  initLogButton();
  initWeekNav();
  renderWeek();
  updateStats();
  seedDemoData(); // populate sample data so UI looks alive on first visit
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
function loadMoodLog() {
  try {
    const raw = localStorage.getItem('sahanubhuti_moodlog');
    moodLog = raw ? JSON.parse(raw) : {};
  } catch { moodLog = {}; }
}

function saveMoodLog() {
  try { localStorage.setItem('sahanubhuti_moodlog', JSON.stringify(moodLog)); } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

/* Seed demo data for Mon–yesterday so the chart looks alive */
function seedDemoData() {
  const sampleMoods = ['calm', 'anxious', 'calm', 'calm', 'tired', 'calm'];
  const today = new Date();
  const dow = today.getDay(); // 0=Sun … 6=Sat
  // Days from Mon (1) up to yesterday
  for (let i = 1; i < dow; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (dow - i));
    const key = dateKey(d);
    if (!moodLog[key]) {
      moodLog[key] = sampleMoods[i - 1] || 'calm';
    }
  }
  saveMoodLog();
  renderWeek();
  updateStats();
}

/* ════════════════════════════════════
   MOOD PICKER
   ════════════════════════════════════ */
function initMoodPicker() {
  const btns = document.querySelectorAll('.mood-pick-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      btns.forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      selectedMood = mood;
      updateLogButton();
    });
  });

  // Pre-select today's mood if already logged
  const todayMood = moodLog[todayKey()];
  if (todayMood) {
    const btn = document.querySelector(`.mood-pick-btn[data-mood="${todayMood}"]`);
    if (btn) { btn.classList.add('selected'); btn.setAttribute('aria-pressed', 'true'); }
    selectedMood = todayMood;
    updateLogButton();
  }
}

function updateLogButton() {
  const btn = document.getElementById('logMoodBtn');
  if (btn) btn.disabled = !selectedMood;
}

/* ════════════════════════════════════
   LOG BUTTON
   ════════════════════════════════════ */
function initLogButton() {
  const btn   = document.getElementById('logMoodBtn');
  const toast = document.getElementById('logToast');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!selectedMood) return;

    moodLog[todayKey()] = selectedMood;
    saveMoodLog();
    renderWeek();
    updateStats();

    // Show toast
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // Button feedback
    btn.textContent = '';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Logged!`;
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Log Today's Mood`;
      btn.style.pointerEvents = '';
    }, 2200);
  });
}

/* ════════════════════════════════════
   WEEK RENDERING
   ════════════════════════════════════ */
function getWeekDates(offset = 0) {
  // Returns array of 7 Date objects: Mon → Sun of the target week
  const today = new Date();
  const dow = today.getDay(); // 0=Sun…6=Sat
  // Start of current week = Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function renderWeek() {
  const weekDates = getWeekDates(currentWeekOffset);
  const container = document.getElementById('weekRow');
  const weekLabelEl = document.getElementById('weekLabel');
  if (!container) return;

  // Update label
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (weekLabelEl) {
    weekLabelEl.textContent = currentWeekOffset === 0
      ? 'This Week'
      : `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  }

  container.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const moodsThisWeek = [];

  weekDates.forEach((date, idx) => {
    const key   = dateKey(date);
    const mood  = moodLog[key];
    const isFuture = date > today;
    const dayDiv = document.createElement('div');
    dayDiv.className = 'mood-day' + ((!mood) ? ' mood-day--empty' : '');

    const emojiEl = document.createElement('span');
    emojiEl.className = 'mood-day__emoji';
    emojiEl.setAttribute('role', 'img');

    if (mood && !isFuture) {
      emojiEl.textContent = MOODS[mood]?.emoji || '🔘';
      emojiEl.setAttribute('aria-label', MOODS[mood]?.label || mood);
      moodsThisWeek.push(mood);
    } else if (isFuture) {
      emojiEl.textContent = '·';
      emojiEl.setAttribute('aria-label', 'No entry yet');
      emojiEl.style.fontSize = '1.4rem';
      emojiEl.style.color = 'rgba(156,136,128,0.3)';
    } else {
      emojiEl.textContent = '🔘';
      emojiEl.setAttribute('aria-label', 'No mood logged');
    }

    const labelEl = document.createElement('span');
    labelEl.className = 'mood-day__label';
    labelEl.textContent = DAYS[(date.getDay())];

    dayDiv.appendChild(emojiEl);
    dayDiv.appendChild(labelEl);
    container.appendChild(dayDiv);
  });

  renderInsight(moodsThisWeek);
}

function renderInsight(moodsArray) {
  const mainEl  = document.getElementById('insightMain');
  const quoteEl = document.getElementById('insightQuote');
  if (!mainEl || !quoteEl) return;

  if (!moodsArray.length) {
    mainEl.innerHTML  = 'No moods logged yet this week.';
    quoteEl.innerHTML = 'Start by logging how you feel today. 🌸';
    return;
  }

  // Find dominant mood
  const counts = {};
  moodsArray.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
  const dominant = Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0];
  const uniqueMoods = Object.keys(counts).length;

  const insight = uniqueMoods >= 3 ? WEEKLY_INSIGHTS.mixed : WEEKLY_INSIGHTS[dominant];

  mainEl.innerHTML  = `This week: <span>${insight.main}</span>`;
  quoteEl.innerHTML = insight.quote;
}

/* ════════════════════════════════════
   WEEK NAVIGATION
   ════════════════════════════════════ */
function initWeekNav() {
  document.getElementById('prevWeek')?.addEventListener('click', () => {
    currentWeekOffset--;
    renderWeek();
  });
  document.getElementById('nextWeek')?.addEventListener('click', () => {
    if (currentWeekOffset < 0) { currentWeekOffset++; renderWeek(); }
  });
}

/* ════════════════════════════════════
   STATS
   ════════════════════════════════════ */
function updateStats() {
  // Total entries
  const total = Object.keys(moodLog).length;

  // Streak: consecutive days ending today
  let streak = 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (moodLog[dateKey(d)]) streak++;
    else break;
  }

  // Most frequent mood
  const counts = {};
  Object.values(moodLog).forEach(m => { counts[m] = (counts[m] || 0) + 1; });
  const topMood = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  const topEmoji = topMood ? (MOODS[topMood[0]]?.emoji || '–') : '–';

  setStatVal('statTotal',  total);
  setStatVal('statStreak', streak + (streak === 1 ? ' day' : ' days'));
  setStatVal('statTop',    topEmoji);
}

function setStatVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}