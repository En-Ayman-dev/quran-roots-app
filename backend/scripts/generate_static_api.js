
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const OUTPUT_FILE = path.join(__dirname, '../../client/public/word_index.json');

async function generateStaticIndex() {
    console.log("🚀 Starting Static Index Generation...");

    if (!process.env.TURSO_DB_URL) {
        console.error("❌ MISSING TURSO_DB_URL within .env");
        process.exit(1);
    }

    const client = createClient({
        url: process.env.TURSO_DB_URL,
        authToken: process.env.TURSO_DB_AUTH_TOKEN,
    });

    try {
        console.log("📦 Fetching data from Turso...");

        // Fetch unique token -> root mappings
        // We only want tokens that have a root
        const query = `
      SELECT DISTINCT token, root 
      FROM token 
      WHERE root IS NOT NULL AND length(root) > 0
    `;

        const result = await client.execute(query);
        const rows = result.rows;

        console.log(`✅ Fetched ${rows.length} unique token-root pairs.`);

        console.log("🔄 Normalizing and indexing...");
        const wordIndex = {};
        const rootSet = new Set();

        // Normalization function (strip diacritics)
        const normalize = (text) => {
            if (!text) return "";
            return text.replace(/[\u064B-\u065F\u0670\u0640]/g, ""); // Remove Tashkeel & Tatweel
        };

        rows.forEach(row => {
            const word = normalize(row.token);
            const root = normalize(row.root);

            if (word && root) {
                // Map word -> root
                // If a word has multiple roots (rare but possible due to homographs), 
                // we'll overwrite or keep first. For simplicity, we keep last/overwrite.
                wordIndex[word] = root;
                rootSet.add(root);
            }
        });

        console.log(`📊 Index Stats:`);
        console.log(`   - Unique Words: ${Object.keys(wordIndex).length}`);
        console.log(`   - Unique Roots: ${rootSet.size}`);

        // Create the final data structure
        // We might want to just dump the map, or a robust structure.
        // A simple map is best for O(1) lookup.
        // Also including a list of roots for direct root autocomplete
        const finalData = {
            roots: Array.from(rootSet).sort(),
            words: wordIndex
        };

        console.log(`💾 Saving to ${OUTPUT_FILE}...`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 0)); // Minified

        console.log("✨ Done! Static API generated successfully.");
        process.exit(0);

    } catch (e) {
        console.error("❌ ERROR:", e);
        process.exit(1);
    }
}

generateStaticIndex();
