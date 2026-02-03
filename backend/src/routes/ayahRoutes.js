const express = require('express');
const router = express.Router();
const { executeQuery, getSurahName } = require('../config/database');

// Get ayah details
router.get('/:ayahId', async (req, res, next) => {
  try {
    const { ayahId } = req.params;

    const query = `
      SELECT 
        a.global_ayah,
        a.surah_no,
        a.ayah_no,
        a.text_uthmani,
        a.page,
        a.juz
      FROM ayah a
      WHERE a.global_ayah = ?
    `;

    const ayah = await executeQuery(query, [ayahId]);

    if (ayah.length === 0) {
      return res.status(404).json({ error: 'Ayah not found' });
    }

    const ayahData = ayah[0];

    // Get tokens for this ayah
    const tokensQuery = `
      SELECT 
        pos,
        token,
        token_uthmani,
        root
      FROM token
      WHERE ayah_id = ?
      ORDER BY pos
    `;

    const tokens = await executeQuery(tokensQuery, [ayahId]);

    res.json({
      id: ayahData.global_ayah,
      surahNo: ayahData.surah_no,
      ayahNo: ayahData.ayah_no,
      surahName: getSurahName(ayahData.surah_no),
      text: ayahData.text_uthmani,
      tokens: tokens,
      page: ayahData.page,
      juz: ayahData.juz
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
