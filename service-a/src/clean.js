// Pure helper: trims and defaults the fields of a contact payload.
function clean(b = {}) {
  return {
    first_name: (b.first_name || "").trim(),
    middle_initial: (b.middle_initial || "").trim(),
    last_name: (b.last_name || "").trim(),
    phone: (b.phone || "").trim(),
    email: (b.email || "").trim(),
    personal_email: (b.personal_email || "").trim(),
    address: (b.address || "").trim(),
    profile_picture: b.profile_picture || "",
  };
}

// Pure helper: "Juan D. Cruz"
function fullName(c) {
  return [c.first_name, c.middle_initial && `${c.middle_initial}.`, c.last_name]
    .filter(Boolean)
    .join(" ");
}

module.exports = { clean, fullName };
