"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSchema = initSchema;
const pool_1 = require("./pool");
async function initSchema() {
    await pool_1.pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      description TEXT NOT NULL,
      image TEXT NOT NULL
    );
  `);
}
async function run() {
    await initSchema();
    console.log('Database schema is ready.');
}
if (require.main === module) {
    run()
        .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exitCode = 1;
    })
        .finally(async () => {
        await pool_1.pool.end();
    });
}
