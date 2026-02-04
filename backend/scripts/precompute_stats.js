const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@libsql/client');

if (!process.env.TURSO_DB_URL || !process.env.TURSO_DB_AUTH_TOKEN) {
    console.error('❌ Missing TURSO_DB_URL or TURSO_DB_AUTH_TOKEN');
    process.exit(1);
}

const client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
});

async function executeQuery(sql, params = []) {
    const result = await client.execute({ sql, args: params });
    return result.rows || [];
}

async function precomputeStats() {
    console.log('🚀 Starting Statistics Pre-calculation...');
    console.time('Precompute');

    try {
        // 1. Counts
        const countsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM ayah) as totalAyahs,
                (SELECT COUNT(*) FROM (SELECT DISTINCT surah_no FROM ayah)) as totalSurahs,
                (SELECT COUNT(DISTINCT root) FROM token WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3) as totalRoots,
                (SELECT COUNT(*) FROM token WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3) as totalWords
        `;

        // 2. Roots per Surah
        const rootsPerSurahQuery = `
            SELECT a.surah_no, COUNT(DISTINCT t.root) as distinct_roots
            FROM token t
            JOIN ayah a ON t.ayah_id = (CAST(a.surah_no AS TEXT) || ':' || CAST(a.ayah_no AS TEXT))
            WHERE t.root IS NOT NULL AND t.root != '' AND LENGTH(t.root) >= 3
            GROUP BY a.surah_no
            ORDER BY distinct_roots DESC
            LIMIT 10
        `;

        // 3. Unique to Surah
        const uniqueToSurahQuery = `
            SELECT a.surah_no, COUNT(DISTINCT t.root) as unique_roots_count
            FROM token t
            JOIN ayah a ON t.ayah_id = (CAST(a.surah_no AS TEXT) || ':' || CAST(a.ayah_no AS TEXT))
            WHERE t.root IN (
                SELECT root FROM token 
                WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
                GROUP BY root 
                HAVING COUNT(DISTINCT SUBSTR(ayah_id, 1, INSTR(ayah_id, ':') - 1)) = 1
            )
            GROUP BY a.surah_no
            ORDER BY unique_roots_count DESC
            LIMIT 5
        `;

        // 4. Root Length
        const rootLengthQuery = `
            SELECT LENGTH(root) as len, COUNT(DISTINCT root) as count
            FROM token
            WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
            GROUP BY len
            ORDER BY len
        `;

        // 5. Hapax Legomena
        const hapaxQuery = `
            SELECT root, COUNT(*) as count 
            FROM token 
            WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
            GROUP BY root 
            HAVING count = 1
            LIMIT 50
        `;

        // 6. Top Roots
        const topRootsQuery = `
             SELECT root, COUNT(*) as count 
             FROM token 
             WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
             GROUP BY root 
             ORDER BY count DESC 
             LIMIT 10
        `;

        // 7. Lexical Density
        const lexicalDensityQuery = `
            SELECT 
                a.surah_no,
                CAST(COUNT(DISTINCT t.root) AS FLOAT) / CAST(COUNT(t.root) AS FLOAT) as density,
                COUNT(DISTINCT t.root) as distinct_roots
            FROM token t
            JOIN ayah a ON t.ayah_id = (CAST(a.surah_no AS TEXT) || ':' || CAST(a.ayah_no AS TEXT))
            WHERE t.root IS NOT NULL AND t.root != '' AND LENGTH(t.root) >= 3
            GROUP BY a.surah_no
            ORDER BY density DESC
            LIMIT 5
        `;

        // Parallel Execution
        console.log('⏳ Running queries...');
        const [
            counts,
            rootsPerSurah,
            uniqueToSurah,
            rootLength,
            hapaxRoots,
            topRoots,
            lexicalDensity
        ] = await Promise.all([
            executeQuery(countsQuery),
            executeQuery(rootsPerSurahQuery),
            executeQuery(uniqueToSurahQuery),
            executeQuery(rootLengthQuery),
            executeQuery(hapaxQuery),
            executeQuery(topRootsQuery),
            executeQuery(lexicalDensityQuery)
        ]);

        const stats = {
            ...counts[0],
            rootsPerSurah,
            uniqueToSurah,
            rootLength,
            hapaxRoots,
            topRoots,
            lexicalDensity,
            lastUpdated: new Date().toISOString()
        };

        const outputPath = path.join(__dirname, '../src/data/global_stats.json');
        fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));

        console.timeEnd('Precompute');
        console.log(`✅ Stats saved to ${outputPath}`);

    } catch (error) {
        console.error('❌ Error precomputing stats:', error);
        process.exit(1);
    }
}

precomputeStats();
