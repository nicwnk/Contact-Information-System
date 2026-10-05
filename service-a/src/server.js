const mysql = require("mysql2/promise");
const { createApp } = require("./app");

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "contact_system",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

const PORT = process.env.PORT || 3000;
createApp({ getPool, validatorUrl: process.env.VALIDATOR_URL }).listen(PORT, () => {
  console.log(`service-a (contacts API) listening on ${PORT}`);
});
