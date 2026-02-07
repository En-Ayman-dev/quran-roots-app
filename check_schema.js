
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: './backend/.env' });

async function getSchema() {
    const client = createClient({
        url: process.env.TURSO_DB_URL,
        authToken: process.env.TURSO_DB_AUTH_TOKEN,
    });

    try {
        console.log("Checking tables...");
        const tables = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('ayah', 'token', 'token_uthmani')");
        console.log(JSON.stringify(tables.rows, null, 2));

        console.log("\nChecking indexes...");
        const indexes = await client.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND tbl_name IN ('ayah', 'token', 'token_uthmani')");
        console.log(JSON.stringify(indexes.rows, null, 2));

    } catch (e) {
        console.error(e);
    }
}

getSchema();
