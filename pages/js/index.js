/* ===================================
   SAHANUBHUTI – Index Page JS
   Wired to real backend API
   =================================== */

const API_URL = "http://127.0.0.1:5000/api";

/* ══════════════════════════════════════
   AUTH HELPERS
   ══════════════════════════════════════ */

function saveAuth(token, user) {
  localStorage.setItem("sahanubhuti_token", token);
  localStorage.setItem("sahanubhuti_user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("sahanubhuti_token");
  localStorage.removeItem("sahanubhuti_user");
}

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

/* ══════════════════════════════════════
   INIT
   ══════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  fadeInPage();
  initNavbarScroll();
  initRevealOnScroll();
  initHeroParallax();
  initModals();
  initForms();
  initPasswordStrength();
  initPasswordToggles();
  checkAuthOnLoad(); // ← restore session state on page load
});

/* ══════════════════════════════════════
   PAGE UTILS
   ══════════════════════════════════════ */

function fadeInPage() {
  const done = () => document.body.classList.add("loaded");
  if (document.readyState === "complete") {
    done();
  } else {
    window.addEventListener("load", done);
  }
}

function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  const h = () => navbar.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", h, { passive: true });
  h();
}

function initRevealOnScroll() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => obs.observe(el));
}

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  const content = document.querySelector(".hero__content");
  if (!hero || !content) return;
  hero.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    content.style.transform = `translate(${x * 7}px, ${y * 4}px)`;
    content.style.transition = "transform 0.6s cubic-bezier(0.23,1,0.32,1)";
  });
  hero.addEventListener("mouseleave", () => {
    content.style.transform = "translate(0,0)";
  });
}

/* ══════════════════════════════════════
   AUTH STATE — NAVBAR
   ══════════════════════════════════════ */

function checkAuthOnLoad() {
  const token = getToken();
  const user = getStoredUser();
  if (token && user) {
    updateNavbarForAuth(user);
  }
}

/**
 * Swap Login/Signup buttons for a greeting + Logout button
 */
function updateNavbarForAuth(user) {
  const authEl = document.querySelector(".navbar__auth");
  if (!authEl) return;

  authEl.innerHTML = `
    <span class="navbar__greeting" style="
      font-size: 0.85rem;
      color: var(--text-muted, #a08880);
      font-family: var(--font-accent, serif);
      font-style: italic;
    ">Hi, ${user.name.split(" ")[0]} 🌸</span>
    <button class="btn-login" id="logoutBtn" aria-label="Log out">Log Out</button>
  `;

  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
}

function revertNavbarToGuest() {
  const authEl = document.querySelector(".navbar__auth");
  if (!authEl) return;
  authEl.innerHTML = `
    <button class="btn-login" id="openLogin" aria-label="Log in to your account">Log In</button>
    <button class="btn-signup" id="openSignup" aria-label="Create a new account">Sign Up</button>
  `;
  // Re-attach open triggers
  document.getElementById("openLogin")?.addEventListener("click", () => openModal("loginModal"));
  document.getElementById("openSignup")?.addEventListener("click", () => openModal("signupModal"));
}

async function handleLogout() {
  const token = getToken();
  if (token) {
    // Inform server (best-effort — stateless JWT, but good practice)
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore network errors */
    }
  }
  clearAuth();
  revertNavbarToGuest();
}

/* ══════════════════════════════════════
   MODAL SYSTEM
   ══════════════════════════════════════ */

function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  const first = overlay.querySelector("input");
  if (first) setTimeout(() => first.focus(), 200);
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function switchModal(closeId, openId) {
  closeModal(closeId);
  setTimeout(() => openModal(openId), 180);
}

function initModals() {
  document
    .getElementById("openLogin")
    ?.addEventListener("click", () => openModal("loginModal"));
  document
    .getElementById("openSignup")
    ?.addEventListener("click", () => openModal("signupModal"));
  document
    .getElementById("closeLogin")
    ?.addEventListener("click", () => closeModal("loginModal"));
  document
    .getElementById("closeSignup")
    ?.addEventListener("click", () => closeModal("signupModal"));
  document
    .getElementById("switchToSignup")
    ?.addEventListener("click", () =>
      switchModal("loginModal", "signupModal")
    );
  document
    .getElementById("switchToLogin")
    ?.addEventListener("click", () =>
      switchModal("signupModal", "loginModal")
    );

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal("loginModal");
      closeModal("signupModal");
    }
  });
}

/* ══════════════════════════════════════
   FORM VALIDATION
   ══════════════════════════════════════ */

function setError(inputId, errId, msg) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) inp.classList.toggle("error", !!msg);
  if (err) err.textContent = msg || "";
}

function clearFormErrors(modalId) {
  document
    .querySelectorAll(`#${modalId} .form-error`)
    .forEach((el) => (el.textContent = ""));
  document
    .querySelectorAll(`#${modalId} input`)
    .forEach((el) => el.classList.remove("error"));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateLoginForm() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const pw = document.getElementById("loginPassword")?.value;
  let valid = true;

  if (!email) {
    setError("loginEmail", "loginEmailErr", "Please enter your email.");
    valid = false;
  } else if (!validateEmail(email)) {
    setError(
      "loginEmail",
      "loginEmailErr",
      "Enter a valid email address."
    );
    valid = false;
  } else {
    setError("loginEmail", "loginEmailErr", "");
  }

  if (!pw) {
    setError(
      "loginPassword",
      "loginPasswordErr",
      "Please enter your password."
    );
    valid = false;
  } else {
    setError("loginPassword", "loginPasswordErr", "");
  }

  return valid;
}

function validateSignupForm() {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const pw = document.getElementById("signupPassword")?.value;
  const confirm = document.getElementById("signupConfirm")?.value;
  const agree = document.getElementById("signupAgree")?.checked;
  let valid = true;

  if (!name || name.length < 2) {
    setError("signupName", "signupNameErr", "Please enter your full name.");
    valid = false;
  } else {
    setError("signupName", "signupNameErr", "");
  }

  if (!email) {
    setError("signupEmail", "signupEmailErr", "Please enter your email.");
    valid = false;
  } else if (!validateEmail(email)) {
    setError(
      "signupEmail",
      "signupEmailErr",
      "Enter a valid email address."
    );
    valid = false;
  } else {
    setError("signupEmail", "signupEmailErr", "");
  }

  if (!pw || pw.length < 6) {
    setError(
      "signupPassword",
      "signupPasswordErr",
      "Password must be at least 6 characters."
    );
    valid = false;
  } else {
    setError("signupPassword", "signupPasswordErr", "");
  }

  if (!confirm) {
    setError(
      "signupConfirm",
      "signupConfirmErr",
      "Please confirm your password."
    );
    valid = false;
  } else if (pw !== confirm) {
    setError(
      "signupConfirm",
      "signupConfirmErr",
      "Passwords do not match."
    );
    valid = false;
  } else {
    setError("signupConfirm", "signupConfirmErr", "");
  }

  const agreeErr = document.getElementById("signupAgreeErr");
  if (!agree) {
    if (agreeErr)
      agreeErr.textContent = "Please accept the terms to continue.";
    valid = false;
  } else {
    if (agreeErr) agreeErr.textContent = "";
  }

  return valid;
}

/* ══════════════════════════════════════
   FORM SUBMIT — REAL API CALLS
   ══════════════════════════════════════ */

function setButtonLoading(btn, isLoading) {
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
}

function showSuccess(modalId, message) {
  const modal = document.querySelector(`#${modalId} .modal`);
  if (!modal) return;

  const success = document.createElement("div");
  success.className = "modal__success show";
  success.innerHTML = `
    <div class="success-circle">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h3 style="font-family:var(--font-display);font-size:1.4rem;color:var(--text-dark)">${message}</h3>
    <p style="font-size:0.85rem;color:var(--text-light);font-family:var(--font-accent);font-style:italic">
      You're part of the Sahanubhuti family now. 🌸
    </p>
  `;

  modal
    .querySelectorAll(
      ".modal__title, .modal__sub, .modal__form, .modal__switch, .modal__icon"
    )
    .forEach((el) => (el.style.display = "none"));

  modal.appendChild(success);
  setTimeout(() => closeModal(modalId), 2600);
}

function showApiError(inputId, errId, message) {
  setError(inputId, errId, message);
  document.getElementById(inputId)?.focus();
}

function initForms() {
  // ── Login ────────────────────────────────────────────────────────────────
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    const btn = e.target.querySelector(".btn-form-submit");
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    setButtonLoading(btn, true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        saveAuth(data.token, data.user);
        setButtonLoading(btn, false);
        showSuccess("loginModal", `Welcome back, ${data.user.name}! 💛`);
        updateNavbarForAuth(data.user);
      } else {
        setButtonLoading(btn, false);
        // Show server error message under password field
        showApiError(
          "loginPassword",
          "loginPasswordErr",
          data.message || "Login failed. Please try again."
        );
      }
    } catch {
      setButtonLoading(btn, false);
      showApiError(
        "loginPassword",
        "loginPasswordErr",
        "Cannot connect to server. Is it running?"
      );
    }
  });

  // ── Signup ───────────────────────────────────────────────────────────────
  document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    const btn = e.target.querySelector(".btn-form-submit");
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    setButtonLoading(btn, true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        saveAuth(data.token, data.user);
        setButtonLoading(btn, false);
        showSuccess("signupModal", `Welcome, ${data.user.name}! 🎉`);
        updateNavbarForAuth(data.user);
      } else {
        setButtonLoading(btn, false);
        // Surface server error (e.g. "Email already exists") under email field
        showApiError(
          "signupEmail",
          "signupEmailErr",
          data.message || "Registration failed. Please try again."
        );
      }
    } catch {
      setButtonLoading(btn, false);
      showApiError(
        "signupEmail",
        "signupEmailErr",
        "Cannot connect to server. Is it running?"
      );
    }
  });

  // ── Live error clearing ──────────────────────────────────────────────────
  document.querySelectorAll(".modal__form input").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("error");
      const errSpan = input.closest(".form-group")?.querySelector(".form-error");
      if (errSpan) errSpan.textContent = "";
    });
  });
}

/* ══════════════════════════════════════
   PASSWORD UTILITIES
   ══════════════════════════════════════ */

function initPasswordStrength() {
  const pwInput = document.getElementById("signupPassword");
  const strengthWrap = document.getElementById("pwStrength");
  const strengthFill = document.getElementById("strengthFill");
  const strengthLabel = document.getElementById("strengthLabel");
  if (!pwInput || !strengthWrap) return;

  pwInput.addEventListener("input", () => {
    const val = pwInput.value;
    if (!val) {
      strengthWrap.classList.remove("visible");
      return;
    }
    strengthWrap.classList.add("visible");

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
      { label: "Weak", color: "#e07070", width: "25%" },
      { label: "Fair", color: "#e0a050", width: "50%" },
      { label: "Good", color: "#70b88a", width: "75%" },
      { label: "Strong", color: "#4a9e6e", width: "100%" },
    ];

    const level = levels[Math.max(0, score - 1)];
    strengthFill.style.width = level.width;
    strengthFill.style.background = level.color;
    strengthLabel.textContent = level.label;
    strengthLabel.style.color = level.color;
  });
}

function initPasswordToggles() {
  document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isText = input.type === "text";
      input.type = isText ? "password" : "text";
      btn.innerHTML = isText
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });
  });
}

