const express = require("express");
const cors = require("cors");
const { clean } = require("./clean");

// getPool: function returning a mysql2 pool (created lazily so /health never touches the DB)
// validatorUrl: base URL of service-b (optional)
function createApp({ getPool, validatorUrl } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // Asks service-b to validate phone/email. Returns an error message or null.
  // If service-b is unreachable, the request is allowed through (fail-open).
  async function validate(c) {
    if (!validatorUrl) return null;
    try {
      const r = await fetch(`${validatorUrl}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: c.phone, email: c.email, personal_email: c.personal_email }),
        signal: AbortSignal.timeout(3000),
      });
      const data = await r.json();
      return data.valid ? null : data.errors[0];
    } catch (e) {
      console.warn("validator unavailable, skipping validation:", e.message);
      return null;
    }
  }

  const fail = (res, e) => {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  };

  // Does not touch the database.
  app.get("/health", (req, res) => res.json({ status: "broken", service: "service-a" }));

  app.get("/", async (req, res) => {
    try {
      const [rows] = await getPool().query("SELECT * FROM contacts ORDER BY id DESC");
      res.json(rows);
    } catch (e) { fail(res, e); }
  });

  app.get("/:id", async (req, res) => {
    try {
      const [rows] = await getPool().query("SELECT * FROM contacts WHERE id = ?", [req.params.id]);
      if (!rows.length) return res.status(404).json({ message: "Contact not found" });
      res.json(rows[0]);
    } catch (e) { fail(res, e); }
  });

  app.post("/", async (req, res) => {
    try {
      const c = clean(req.body);
      const problem = await validate(c);
      if (problem) return res.status(400).json({ message: problem });

      const pool = getPool();
      if (c.phone !== "") {
        const [dup] = await pool.query("SELECT id FROM contacts WHERE TRIM(phone) = ?", [c.phone]);
        if (dup.length) {
          return res.status(400).json({ message: "This phone number is already registered!" });
        }
      }
      const [result] = await pool.execute(
        `INSERT INTO contacts (first_name, middle_initial, last_name, phone, email, personal_email, address, profile_picture)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.first_name, c.middle_initial, c.last_name, c.phone, c.email, c.personal_email, c.address, c.profile_picture]
      );
      res.json({ id: result.insertId, message: "Contact added successfully" });
    } catch (e) { fail(res, e); }
  });

  app.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const c = clean(req.body);
      const problem = await validate(c);
      if (problem) return res.status(400).json({ message: problem });

      const pool = getPool();
      if (c.phone !== "") {
        const [dup] = await pool.query(
          "SELECT id FROM contacts WHERE TRIM(phone) = ? AND id != ?", [c.phone, id]);
        if (dup.length) {
          return res.status(400).json({ message: "This phone number is already registered to another contact!" });
        }
      }
      await pool.execute(
        `UPDATE contacts SET first_name = ?, middle_initial = ?, last_name = ?, phone = ?, email = ?,
         personal_email = ?, address = ?, profile_picture = ? WHERE id = ?`,
        [c.first_name, c.middle_initial, c.last_name, c.phone, c.email, c.personal_email, c.address, c.profile_picture, id]
      );
      res.json({ message: "Contact updated successfully" });
    } catch (e) { fail(res, e); }
  });

  app.delete("/:id", async (req, res) => {
    try {
      await getPool().execute("DELETE FROM contacts WHERE id = ?", [req.params.id]);
      res.json({ message: "Contact deleted successfully" });
    } catch (e) { fail(res, e); }
  });

  return app;
}

module.exports = { createApp };
