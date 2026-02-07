
const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config();

console.log("Script starting...");

async function getSchema() {
    console.log("Creating client...");
    if (!process.env.TURSO_DB_URL) {
        console.error("MISSING TURSO_DB_URL");
        process.exit(1);
    }

    const client = createClient({
        url: process.env.TURSO_DB_URL,
        authToken: process.env.TURSO_DB_AUTH_TOKEN,
    });

    try {
        let output = "";
        console.log("Checking tables...");
        const tables = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('ayah', 'token', 'token_uthmani')");
        output += JSON.stringify(tables.rows, null, 2) + "\n";

        console.log("\nChecking indexes...");
        const indexes = await client.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND tbl_name IN ('ayah', 'token', 'token_uthmani')");
        output += JSON.stringify(indexes.rows, null, 2);

        fs.writeFileSync('schema_output.txt', output);
        console.log("Written to schema_output.txt");

    } catch (e) {
        console.error("ERROR:", e);
        fs.writeFileSync('schema_error.txt', String(e));
    }
}

getSchema();
