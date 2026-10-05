const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { createApp } = require("../src/app");
const { clean, fullName } = require("../src/clean");

// None of these tests need a database.
function listen(server) {
  return new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
}

test("GET /health returns 200 without touching the database", async () => {
  const getPool = () => { throw new Error("DB must not be used"); };
  const server = http.createServer(createApp({ getPool }));
  const port = await listen(server);
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, "ok");
  server.close();
});

test("POST / returns 400 when the validator rejects the contact", async () => {
  const validator = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ valid: false, errors: ["Phone number is not valid."] }));
  });
  const vPort = await listen(validator);
  const getPool = () => { throw new Error("DB must not be used"); };
  const server = http.createServer(createApp({ getPool, validatorUrl: `http://127.0.0.1:${vPort}` }));
  const port = await listen(server);

  const res = await fetch(`http://127.0.0.1:${port}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ first_name: "A", last_name: "B", phone: "123" }),
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).message, "Phone number is not valid.");
  server.close();
  validator.close();
});

test("clean() trims fields and fills defaults", () => {
  const c = clean({ first_name: "  Ana ", phone: " +639171234567 " });
  assert.strictEqual(c.first_name, "Ana");
  assert.strictEqual(c.phone, "+639171234567");
  assert.strictEqual(c.address, "");
});

test("fullName() joins first, middle initial and last name", () => {
  assert.strictEqual(fullName({ first_name: "Juan", middle_initial: "D", last_name: "Cruz" }), "Juan D. Cruz");
  assert.strictEqual(fullName({ first_name: "Ana", last_name: "Reyes" }), "Ana Reyes");
});
