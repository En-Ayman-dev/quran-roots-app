const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Get global statistics
router.get('/global', async (req, res) => {
    try {
        const stats = {};

        // 1. Basic Counts (Filtered by Root Length >= 3)
        const countsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM ayah) as totalAyahs,
                (SELECT COUNT(*) FROM (SELECT DISTINCT surah_no FROM ayah)) as totalSurahs,
                (SELECT COUNT(DISTINCT root) FROM token WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3) as totalRoots,
                (SELECT COUNT(*) FROM token WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3) as totalWords
        `;
        const counts = await executeQuery(countsQuery);
        Object.assign(stats, counts[0]);

        // 2. Distinct Roots per Surah (Filter >= 3)
        const rootsPerSurahQuery = `
            SELECT a.surah_no, COUNT(DISTINCT t.root) as distinct_roots
            FROM token t
            JOIN ayah a ON t.ayah_id = (CAST(a.surah_no AS TEXT) || ':' || CAST(a.ayah_no AS TEXT))
            WHERE t.root IS NOT NULL AND t.root != '' AND LENGTH(t.root) >= 3
            GROUP BY a.surah_no
            ORDER BY distinct_roots DESC
            LIMIT 10
        `;
        stats.rootsPerSurah = await executeQuery(rootsPerSurahQuery);

        // 3. Unique Roots to specific Surah (Filter >= 3)
        // Find roots that appear in ONLY one surah
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
        stats.uniqueToSurah = await executeQuery(uniqueToSurahQuery);

        // 4. Root Length Distribution (Filter >= 3)
        const rootLengthQuery = `
            SELECT LENGTH(root) as len, COUNT(DISTINCT root) as count
            FROM token
            WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
            GROUP BY len
            ORDER BY len
        `;
        stats.rootLength = await executeQuery(rootLengthQuery);

        // 5. Hapax Legomena (Roots appearing exactly once in Quran) (Filter >= 3)
        const hapaxQuery = `
            SELECT root, COUNT(*) as count 
            FROM token 
            WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
            GROUP BY root 
            HAVING count = 1
            LIMIT 50
        `;
        stats.hapaxRoots = await executeQuery(hapaxQuery);

        // 6. Top Roots (Filter >= 3)
        const topRootsQuery = `
             SELECT root, COUNT(*) as count 
             FROM token 
             WHERE root IS NOT NULL AND root != '' AND LENGTH(root) >= 3
             GROUP BY root 
             ORDER BY count DESC 
             LIMIT 10
        `;
        stats.topRoots = await executeQuery(topRootsQuery);

        // 7. Lexical Density (Richness) (Filter >= 3)
        // (Distinct Roots / Total Words in Surah)
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
        stats.lexicalDensity = await executeQuery(lexicalDensityQuery);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching global stats:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Get roots by specific length (Exploration)
router.get('/roots-by-length/:length', async (req, res) => {
    try {
        const targetLength = parseInt(req.params.length);
        if (isNaN(targetLength) || targetLength < 1) {
            return res.status(400).json({ success: false, error: 'Invalid length' });
        }

        // Fetch ALL roots (filtering in JS for accuracy regarding diacritics)
        const query = `
      SELECT root, COUNT(*) as count 
      FROM token 
      WHERE root IS NOT NULL AND root != ''
      GROUP BY root 
    `;

        const allRoots = await executeQuery(query);

        // Filter strictly in JavaScript
        // Remove diacritics (Harakat) before checking length
        const filteredRoots = allRoots.filter(r => {
            const cleanRoot = r.root.replace(/[\u064B-\u065F\u0670]/g, "");
            return cleanRoot.length === targetLength;
        });

        // Sort by count DESC
        filteredRoots.sort((a, b) => b.count - a.count);

        // Calculate summary from the filtered list
        const summary = {
            total_occurrences: filteredRoots.reduce((acc, curr) => acc + curr.count, 0),
            total_roots: filteredRoots.length
        };

        res.json({
            success: true,
            data: {
                roots: filteredRoots,
                summary
            }
        });

    } catch (error) {
        console.error(`Error fetching roots by length ${req.params.length}:`, error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


module.exports = router;
