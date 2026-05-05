"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
function quoteIdentifier(name) {
    return `"${name.replace(/"/g, '""')}"`;
}
async function createDatabaseIfMissing() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is required. Add it to backend/.env');
    }
    const targetUrl = new URL(connectionString);
    const databaseName = targetUrl.pathname.replace(/^\//, '');
    if (!databaseName) {
        throw new Error('DATABASE_URL must include a database name (for example /fitness_store).');
    }
    const adminUrl = new URL(connectionString);
    adminUrl.pathname = '/postgres';
    const client = new pg_1.Client({ connectionString: adminUrl.toString() });
    await client.connect();
    try {
        const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
        if (exists.rowCount && exists.rowCount > 0) {
            console.log(`Database "${databaseName}" already exists.`);
            return;
        }
        await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
        console.log(`Database "${databaseName}" created.`);
    }
    finally {
        await client.end();
    }
}
createDatabaseIfMissing().catch((error) => {
    console.error('Failed to create database:', error);
    process.exitCode = 1;
});
