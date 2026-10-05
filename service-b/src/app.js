const express = require("express");
const cors = require("cors");
const { validateContact } = require("./validator");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ status: "ok", service: "service-b" }));
  app.post("/validate", (req, res) => res.json(validateContact(req.body)));

  return app;
}

module.exports = { createApp };
