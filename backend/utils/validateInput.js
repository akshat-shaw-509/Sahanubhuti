// backend/utils/validateInput.js
// Pure validation helpers — no DB calls here

/**
 * Validates email format using regex
 * @param {string} email
 * @returns {{ valid: boolean, message: string }}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string") {
    return { valid: false, message: "Email is required" };
  }
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: "Please enter a valid email address" };
  }
  return { valid: true, message: "" };
};

/**
 * Validates password strength
 * Rules:
 *  - Minimum 6 characters
 *  - Maximum 128 characters
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters long",
    };
  }
  if (password.length > 128) {
    return { valid: false, message: "Password is too long (max 128 chars)" };
  }
  return { valid: true, message: "" };
};

/**
 * Validates user name
 * @param {string} name
 * @returns {{ valid: boolean, message: string }}
 */
const validateName = (name) => {
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { valid: false, message: "Name must be at least 2 characters" };
  }
  return { valid: true, message: "" };
};

/**
 * Validates all registration fields at once
 * @param {{ name, email, password }} fields
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateRegistration = ({ name, email, password }) => {
  const errors = [];

  const nameCheck = validateName(name);
  if (!nameCheck.valid) errors.push(nameCheck.message);

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) errors.push(emailCheck.message);

  const passCheck = validatePassword(password);
  if (!passCheck.valid) errors.push(passCheck.message);

  return { valid: errors.length === 0, errors };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateRegistration,
};
