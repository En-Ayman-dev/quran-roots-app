const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
let NodeCache;

// Robust fallback if node-cache is missing
try {
    NodeCache = require('node-cache');
    console.log('✅ node-cache loaded successfully'); // Log success
} catch (e) {
    console.warn('⚠️ node-cache not found, using simple in-memory fallback');
    // Simple Mock Implementation
    NodeCache = class {
        constructor(options) {
            this.cache = new Map();
            this.stdTTL = options.stdTTL || 0;
        }
        get(key) {
            const item = this.cache.get(key);
            if (!item) return undefined;
            if (Date.now() > item.expiry) {
                this.cache.delete(key);
                return undefined;
            }
            return item.value;
        }
        set(key, value, ttl) {
            const t = ttl || this.stdTTL;
            const expiry = Date.now() + (t * 1000);
            this.cache.set(key, { value, expiry });
            return true;
        }
    };
}

// Cache for 24 hours (stats don't change often)
const statsCache = new NodeCache({ stdTTL: 86400 });

const fs = require('fs');
const path = require('path');

// Get global statistics
router.get('/global', async (req, res) => {
    try {
        const statsPath = path.join(__dirname, '../data/global_stats.json');

        if (!fs.existsSync(statsPath)) {
            console.warn('⚠️ global_stats.json not found. Generating on the fly...');

            // On-the-fly Calculation Fallback
            console.time('GlobalStats Generation');

            // PARALLEL EXECUTION: Define all queries
            const countsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM ayah) as totalAyahs,
                    (SELECT COUNT(*) FROM (SELECT DISTINCT surah_no FROM ayah)) as totalSurahs,
                    (SELECT COUNT(DISTINCT root) FROM token WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3) as totalRoots,
                    (SELECT COUNT(*) FROM token WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3) as totalWords
            `;

            const rootsPerSurahQuery = `
                SELECT a.surah_no, COUNT(DISTINCT t.root) as distinct_roots
                FROM token t
                JOIN ayah a ON t.ayah_id = (CAST(a.surah_no AS TEXT) || ':' || CAST(a.ayah_no AS TEXT))
                WHERE t.root IS NOT NULL AND t.root != '' AND LENGTH(t.root) >= 3
                GROUP BY a.surah_no
                ORDER BY distinct_roots DESC
                LIMIT 10
            `;

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

            const rootLengthQuery = `
                SELECT LENGTH(root) as len, COUNT(DISTINCT root) as count
                FROM token
                WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
                GROUP BY len
                ORDER BY len
            `;

            const hapaxQuery = `
                SELECT root, COUNT(*) as count 
                FROM token 
                WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
                GROUP BY root 
                HAVING count = 1
                LIMIT 50
            `;

            const topRootsQuery = `
                SELECT root, COUNT(*) as count 
                FROM token 
                WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
                GROUP BY root 
                ORDER BY count DESC 
                LIMIT 10
            `;

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

            // Execute ALL queries in parallel
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

            // Save for next time
            const dir = path.dirname(statsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
            console.log('✅ global_stats.json generated and saved.');
            console.timeEnd('GlobalStats Generation');

            res.set('Cache-Control', 'public, max-age=3600');
            return res.json({ success: true, data: stats, fromCache: false, generated: true });
        }

        const data = fs.readFileSync(statsPath, 'utf8');
        const stats = JSON.parse(data);

        // Add cache control for browser
        res.set('Cache-Control', 'public, max-age=3600');

        res.json({ success: true, data: stats, fromCache: true });
    } catch (error) {
        console.error('Error fetching global stats:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Get roots by specific length (Exploration) with Caching
router.get('/roots-by-length/:length', async (req, res) => {
    try {
        const targetLength = parseInt(req.params.length);
        if (isNaN(targetLength) || targetLength < 1) {
            return res.status(400).json({ success: false, error: 'Invalid length' });
        }

        const cacheKey = `roots_len_${targetLength}`;
        const cachedResult = statsCache.get(cacheKey);
        if (cachedResult) {
            return res.json({ success: true, data: cachedResult, fromCache: true });
        }

        // Optimized Query: Filter by length directly in SQL
        // Note: For strict Arabic length without diacritics, we rely on the helper column 'token_plain_norm' if available 
        // or just accept raw length filter first then refine. 
        // Given current schema, let's filter raw first to reduce transfer, then refine.

        // 1. Fetch Candidates (roots with length roughly in range to avoid huge transfer)
        // Since diacritics add length, LENGTH(root) >= targetLength

        const query = `
            SELECT root, COUNT(*) as count 
            FROM token 
            WHERE root IS NOT NULL AND root != ''
            AND LENGTH(root) >= ? 
            GROUP BY root
        `;

        const candidates = await executeQuery(query, [targetLength]);

        // 2. Refine in JS (Removal of diacritics)
        const filteredRoots = candidates.filter(r => {
            const cleanRoot = r.root.replace(/[\u064B-\u065F\u0670]/g, "");
            return cleanRoot.length === targetLength;
        });

        // Sort by count DESC
        filteredRoots.sort((a, b) => b.count - a.count);

        // Calculate summary
        const summary = {
            total_occurrences: filteredRoots.reduce((acc, curr) => acc + curr.count, 0),
            total_roots: filteredRoots.length
        };

        const resultData = {
            roots: filteredRoots,
            summary
        };

        statsCache.set(cacheKey, resultData);

        res.json({
            success: true,
            data: resultData
        });

    } catch (error) {
        console.error(`Error fetching roots by length ${req.params.length}:`, error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
