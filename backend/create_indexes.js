const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
});

async function createIndexes() {
    console.log('🚀 Starting Index Creation on Turso...');
    try {
        console.log('1. Creating index on token(root)...');
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_token_root ON token(root)`);
        console.log('✅ idx_token_root created.');

        console.log('2. Creating index on token(ayah_id)...');
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_token_ayah_id ON token(ayah_id)`);
        console.log('✅ idx_token_ayah_id created.');

        console.log('3. Creating index on ayah(surah_no, ayah_no)...');
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_ayah_composite ON ayah(surah_no, ayah_no)`);
        console.log('✅ idx_ayah_composite created.');

        console.log('🎉 All indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
}

createIndexes();
