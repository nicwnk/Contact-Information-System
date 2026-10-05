const { parsePhoneNumberFromString } = require("libphonenumber-js");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pure function: returns { valid, errors }. Empty fields are allowed.
function validateContact({ phone, email, personal_email } = {}) {
  const errors = [];
  if (phone && phone.trim()) {
    const parsed = parsePhoneNumberFromString(phone.trim(), "PH");
    if (!parsed || !parsed.isValid()) errors.push("Phone number is not valid.");
  }
  if (email && email.trim() && !EMAIL.test(email.trim())) {
    errors.push("Email address is not valid.");
  }
  if (personal_email && personal_email.trim() && !EMAIL.test(personal_email.trim())) {
    errors.push("Personal email address is not valid.");
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateContact };
