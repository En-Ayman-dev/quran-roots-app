const express = require('express');
const router = express.Router();
const { getSurahName, executeQuery } = require('../config/database');

// Get all surahs
router.get('/', (req, res) => {
  const surahs = [];
  for (let i = 1; i <= 114; i++) {
    surahs.push({
      number: i,
      name: getSurahName(i)
    });
  }
  res.json(surahs);
});

// Get specific surah with FULL DETAILS (Ayahs + Roots)
router.get('/:surahNo', async (req, res) => {
  const { surahNo } = req.params;
  const number = parseInt(surahNo);

  if (isNaN(number) || number < 1 || number > 114) {
    return res.status(404).json({ error: 'Invalid Surah Number' });
  }

  try {
    // 1. Fetch all Ayahs for this Surah
    const ayahsQuery = `
      SELECT surah_no, ayah_no, text_uthmani
      FROM ayah
      WHERE surah_no = ?
      ORDER BY ayah_no
    `;
    const ayahs = await executeQuery(ayahsQuery, [number]);

    // 2. Fetch all Roots for this Surah using JOIN (Safer than LIKE)
    // FILTER: LENGTH(root) >= 3
    const rootsQuery = `
      SELECT t.root, t.ayah_id, COUNT(*) as count
      FROM token t
      JOIN ayah a ON t.ayah_id = (CAST(a.surah_no AS TEXT) || ':' || CAST(a.ayah_no AS TEXT))
      WHERE a.surah_no = ?
      AND t.root IS NOT NULL AND t.root != ''
      AND LENGTH(t.root) >= 3 
      GROUP BY t.root, t.ayah_id
    `;
    const roots = await executeQuery(rootsQuery, [number]);

    // 3. Calculate Surah-wide statistics (Top roots in this surah)
    // FILTER: LENGTH(root) >= 3
    const surahStatsQuery = `
        SELECT t.root, COUNT(*) as frequency 
        FROM token t
        JOIN ayah a ON t.ayah_id = (CAST(a.surah_no AS TEXT) || ':' || CAST(a.ayah_no AS TEXT))
        WHERE a.surah_no = ?
        AND t.root IS NOT NULL AND t.root != ''
        AND LENGTH(t.root) >= 3
        GROUP BY t.root
        ORDER BY frequency DESC
        LIMIT 10
    `;
    const topRoots = await executeQuery(surahStatsQuery, [number]);

    // 4. Calculate Unique Roots (Roots found ONLY in this surah)
    // FILTER: LENGTH(root) >= 3
    const uniqueRootsQuery = `
        SELECT DISTINCT t1.root
        FROM token t1
        JOIN ayah a1 ON t1.ayah_id = (CAST(a1.surah_no AS TEXT) || ':' || CAST(a1.ayah_no AS TEXT))
        WHERE a1.surah_no = ?
        AND t1.root IS NOT NULL AND t1.root != ''
        AND LENGTH(t1.root) >= 3
        AND t1.root NOT IN (
            SELECT t2.root 
            FROM token t2 
            JOIN ayah a2 ON t2.ayah_id = (CAST(a2.surah_no AS TEXT) || ':' || CAST(a2.ayah_no AS TEXT))
            WHERE a2.surah_no != ?
            AND t2.root IS NOT NULL
        )
    `;
    const uniqueRoots = await executeQuery(uniqueRootsQuery, [number, number]);

    res.json({
      success: true,
      data: {
        number: number,
        name: getSurahName(number),
        ayahs: ayahs,
        roots: roots,
        stats: {
          topRoots: topRoots,
          uniqueRoots: uniqueRoots.map(r => r.root)
        }
      }
    });

  } catch (error) {
    console.error(`Error fetching surah ${number}:`, error);
    res.status(500).json({ success: false, error: 'Server Error fetching Surah details' });
  }
});

module.exports = router;
