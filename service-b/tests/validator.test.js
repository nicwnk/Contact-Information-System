const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { validateContact } = require("../src/validator");
const { createApp } = require("../src/app");

test("GET /health returns 200", async () => {
  const server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, r));
  const res = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  assert.strictEqual(res.status, 200);
  server.close();
});

test("accepts a valid PH number and email", () => {
  const r = validateContact({ phone: "+639171234567", email: "ana@example.com" });
  assert.strictEqual(r.valid, true);
});

test("rejects an invalid phone number", () => {
  const r = validateContact({ phone: "+63123" });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors[0].includes("Phone"));
});

test("rejects a malformed email and allows empty fields", () => {
  assert.strictEqual(validateContact({ email: "not-an-email" }).valid, false);
  assert.strictEqual(validateContact({ phone: "", email: "" }).valid, true);
});
