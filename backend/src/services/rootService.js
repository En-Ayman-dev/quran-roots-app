const { executeQuery, getSurahName } = require('../config/database');
const surahMetadata = require('../data/surahMetadata');

class RootService {
  // Search for verses containing a specific root
  async searchByRoot(root) {
    try {
      // Validate root
      if (!root || typeof root !== 'string' || root.trim().length === 0) {
        throw new Error('الجذر غير صالح');
      }

      let cleanRoot = root.trim();

      // --- SMART SEARCH PHASE 1: Direct Search ---
      let result = await this.performSearch(cleanRoot);
      if (result.ayahs.length > 0) {
        return result;
      }

      // --- SMART SEARCH PHASE 2: Word -> Root Inference ---
      console.log(`[RootService] No partial root matches for "${cleanRoot}". Attempting Smart Search...`);

      // Normalize user input (strip diacritics/tashkeel from input)
      // Ranges: \u064B-\u065F (Tanwin, Tashkeel), \u0670 (Superscript Aleph)
      const normalizedInput = cleanRoot.replace(/[\u064B-\u065F\u0670]/g, "");

      // SQL to strip diacritics from 'token' column for comparison
      // We strip: Tanwin (Fathatan, Dammatan, Kasratan), Harakat (Fatha, Damma, Kasra, Sukun), Shadda, Aleph Khanjareeya
      const sqlNormalize = `
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
          token, 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', '')
      `;

      // Find ANY token that matches the normalized input (word match)
      const findRootQuery = `
        SELECT root 
        FROM token 
        WHERE ${sqlNormalize} = ? 
           OR ${sqlNormalize} LIKE ? 
        LIMIT 1
      `;

      // Try exact match first, then prefix match
      const rootRows = await executeQuery(findRootQuery, [normalizedInput, `${normalizedInput}%`]);

      if (rootRows.length > 0) {
        const foundRoot = rootRows[0].root;
        console.log(`[RootService] Smart Search inferred root "${foundRoot}" from word "${cleanRoot}"`);

        // Search again with the discovered root
        return await this.performSearch(foundRoot);
      }

      return result; // Return empty result if everything fails

    } catch (error) {
      console.error('Error in searchByRoot:', error);
      throw error;
    }
  }

  // Internal helper for the core search logic
  async performSearch(targetRoot) {
    // OPTIMIZATION: Step 1 - Get Root Counts directly from Token table (Indexed access)
    // Avoids the expensive JOIN on calculated fields: (CAST(a.surah_no AS TEXT) || ':' || ...)
    const tokenCountsQuery = `
      SELECT ayah_id, COUNT(*) as root_count
      FROM token
      WHERE root = ?
      GROUP BY ayah_id
    `;

    // We only need the root matches from the token table first
    const tokenCounts = await executeQuery(tokenCountsQuery, [targetRoot]);

    if (tokenCounts.length === 0) {
      return {
        root: targetRoot,
        ayahs: [],
        totalOccurrences: 0
      };
    }

    // Sort by integer surah/ayah for consistent order if needed, but we'll sort final result
    // map "surah:ayah" -> { surah, ayah, count }
    const validAyahs = tokenCounts.map(tc => {
      const [surah, ayah] = tc.ayah_id.split(':').map(Number);
      return { surah, ayah, count: tc.root_count, id: tc.ayah_id };
    });

    // OPTIMIZATION: Step 2 - Fetch Ayah details for ONLY the matching ayahs
    // Construct a filter clause. 
    // Since we might have many IDs, we can't use simple IN (...) because we need composite key (surah, ayah)
    // Or we can rely on global_ayah if we knew it mapping.
    // Efficient approach: `(surah_no = ? AND ayah_no = ?) OR ...`
    // SQLite can handle many ORs, but if it's too many (e.g. > 500), we might need to chunk it?
    // 500 ayahs is a lot for one root, but possible.
    // Let's use a reconstructed ID match if possible or just loop?

    // Actually, since we know the surah/ayah pairs, we can try to fetch by surah if list is huge?
    // Let's use the OR strategy, it is generally safe for < 1000 parameters.

    // OPTIMIZATION: Step 2 - Fetch Ayah details for ONLY the matching ayahs
    // Use chunking to avoid SQLite limit (SQLITE_LIMIT_VARIABLE_NUMBER which defaults to 999)
    // AND to avoid SQLITE_MAX_EXPR_DEPTH (default 1000, but can be 100 on restrictive envs/Turso)
    const CHUNK_SIZE = 50; // Reduced from 400 to comply with depth limit of 100
    let ayahs = [];

    for (let i = 0; i < validAyahs.length; i += CHUNK_SIZE) {
      const chunk = validAyahs.slice(i, i + CHUNK_SIZE);
      const ayahConditions = chunk.map(() => `(surah_no = ? AND ayah_no = ?)`).join(' OR ');
      const ayahParams = chunk.flatMap(a => [a.surah, a.ayah]);

      const chunkQuery = `
        SELECT 
          global_ayah, surah_no, ayah_no, text_uthmani, page, juz
        FROM ayah
        WHERE ${ayahConditions}
        ORDER BY surah_no, ayah_no
      `;

      const chunkResults = await executeQuery(chunkQuery, ayahParams);
      ayahs = ayahs.concat(chunkResults);
    }

    // Ensure final list is sorted specifically by Quranic order
    ayahs.sort((a, b) => {
      if (a.surah_no !== b.surah_no) return a.surah_no - b.surah_no;
      return a.ayah_no - b.ayah_no;
    });

    // Merge counts
    const ayahsWithCounts = ayahs.map(a => {
      // Find count
      const match = validAyahs.find(v => v.surah === a.surah_no && v.ayah === a.ayah_no);
      return { ...a, root_count: match ? match.count : 0 };
    });

    // ... Original Logic for Enrichment ...

    // Fix: Use the correct ayah_id format (surah:ayah) for querying the token table
    const ayahIds = ayahsWithCounts.map(ayah => `${ayah.surah_no}:${ayah.ayah_no}`);

    // Optimize: Fetch ALL tokens for these ayahs to highlight and find other roots
    // Use IN clause which is efficient for string IDs
    const placeholders = ayahIds.map(() => '?').join(',');
    const tokensQuery = `
      SELECT ayah_id, pos, token_uthmani as token, root, token_plain_norm
      FROM token_uthmani
      WHERE ayah_id IN (${placeholders})
      ORDER BY ayah_id, pos
    `;

    const allTokens = await executeQuery(tokensQuery, ayahIds);

    const tokensByAyah = {};
    allTokens.forEach(token => {
      if (!tokensByAyah[token.ayah_id]) {
        tokensByAyah[token.ayah_id] = [];
      }
      tokensByAyah[token.ayah_id].push(token);
    });

    const enrichedAyahs = ayahsWithCounts.map(ayah => {
      const ayahId = ayah.global_ayah;
      const lookupId = `${ayah.surah_no}:${ayah.ayah_no}`;
      let tokens = tokensByAyah[lookupId] || [];

      // Filter out short roots (less than 3 chars) from display, unless it's the target root
      const targetTokens = tokens.filter(t => t.root === targetRoot);

      // Determine other roots
      const otherRootsSet = new Set();
      tokens.forEach(t => {
        if (t.root && t.root !== targetRoot && t.root.length >= 3) otherRootsSet.add(t.root);
      });

      return {
        id: ayahId,
        surahNo: ayah.surah_no,
        ayahNo: ayah.ayah_no,
        surahName: getSurahName(ayah.surah_no),
        text: ayah.text_uthmani,
        rootCount: ayah.root_count,
        tokens: targetTokens,
        allTokens: tokens,
        otherRoots: Array.from(otherRootsSet),
        page: ayah.page,
        juz: ayah.juz
      };
    });

    const totalOccurrences = enrichedAyahs.reduce((sum, ayah) => sum + ayah.root_count, 0);

    return {
      root: targetRoot,
      ayahs: enrichedAyahs,
      totalOccurrences: totalOccurrences
    };
  }

  // Suggest roots based on partial input (Auto-complete)
  async suggestRoots(query) {
    try {
      if (!query || query.trim().length < 2) return [];

      const cleanQuery = query.trim().replace(/[\u064B-\u065F\u0670]/g, ""); // Normalize input

      const sqlNormalize = `
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
          token, 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', '')
      `;

      // Strategy:
      // 1. Match Roots directly (highest priority)
      // 2. Match Words (Tokens) and get their roots
      const sql = `
        SELECT DISTINCT root, 'root_match' as type 
        FROM token 
        WHERE root LIKE ? 
        
        UNION 
        
        SELECT DISTINCT root, 'word_match' as type
        FROM token 
        WHERE ${sqlNormalize} LIKE ?
        LIMIT 10
      `;

      const rows = await executeQuery(sql, [`${cleanQuery}%`, `${cleanQuery}%`]);

      // Return just the roots, prioritizing exact matches if any
      return rows.map(r => r.root);

    } catch (error) {
      console.error('Error in suggestRoots:', error);
      return [];
    }
  }

  // Get statistics for a root
  async getRootStatistics(root) {
    try {
      const result = await this.searchByRoot(root);

      if (result.ayahs.length === 0) {
        return {
          root: root,
          statistics: null,
          message: 'لا توجد نتائج لهذا الجذر'
        };
      }

      const statistics = this.calculateStatistics(result);

      return {
        root: root,
        statistics: statistics
      };

    } catch (error) {
      console.error('Error in getRootStatistics:', error);
      throw error;
    }
  }

  // Calculate statistics
  calculateStatistics(searchResult) {
    const { ayahs, totalOccurrences } = searchResult;

    // Ensure we have a safe numeric totalOccurrences (fallback compute if missing/invalid)
    const safeTotalOccurrences = (typeof totalOccurrences === 'number' && isFinite(totalOccurrences))
      ? totalOccurrences
      : ayahs.reduce((sum, a) => sum + (a.rootCount || 0), 0);

    const surahDistribution = {};
    const accompanyingRoots = {};
    const juzDistribution = {};
    const pageDistribution = {};

    // New Statistics
    const formDistribution = {}; // token_plain_norm -> count
    const timelineData = {}; // revelationOrder -> count
    const eraDistribution = { meccan: 0, medinan: 0 };
    const coOccurrenceNetwork = { nodes: [], links: [] };

    // Helper to track root links
    const rootLinks = {}; // root1 -> { root2: count }

    const targetRoot = searchResult.root;

    ayahs.forEach(ayah => {
      // Surah distribution
      const surahKey = ayah.surahName;
      surahDistribution[surahKey] = (surahDistribution[surahKey] || 0) + ayah.rootCount;

      // Timeline & Era
      const meta = surahMetadata[ayah.surahNo];
      if (meta) {
        // Timeline
        const revOrder = meta.revelationOrder;
        // Group by 10s or just raw order? Raw order is 1-114, fine for a bar chart
        timelineData[revOrder] = (timelineData[revOrder] || 0) + ayah.rootCount;

        // Era
        if (meta.type === 'Meccan') eraDistribution.meccan += ayah.rootCount;
        else if (meta.type === 'Medinan') eraDistribution.medinan += ayah.rootCount;
      }

      // Word Forms (Derivations)
      // ayah.tokens contains the target root tokens
      ayah.tokens.forEach(t => {
        // Use plain norm for better grouping (removes some tashkeel but keeps orthography)
        const form = t.token_plain_norm || t.token;
        formDistribution[form] = (formDistribution[form] || 0) + 1;
      });

      // Accompanying roots (Co-occurrence)
      ayah.otherRoots.forEach(otherRoot => {
        const cleanRoot = otherRoot ? otherRoot.trim() : '';
        // Strict check: strip diacritics before counting length
        const normalizedLen = cleanRoot.replace(/[\u064B-\u065F\u0670]/g, "").length;

        if (normalizedLen >= 3) {
          accompanyingRoots[cleanRoot] = (accompanyingRoots[cleanRoot] || 0) + 1;

          // Network links (Star topology center=targetRoot)
          if (!rootLinks[targetRoot]) rootLinks[targetRoot] = {};
          rootLinks[targetRoot][otherRoot] = (rootLinks[targetRoot][otherRoot] || 0) + 1;
        }
      });

      // Juz distribution
      const juzKey = `الجزء ${ayah.juz}`;
      juzDistribution[juzKey] = (juzDistribution[juzKey] || 0) + 1;

      // Page distribution
      const pageKey = `صفحة ${ayah.page}`;
      pageDistribution[pageKey] = (pageDistribution[pageKey] || 0) + 1;
    });

    // --- Format Data for Frontend ---

    // 1. Word Forms (Top 20)
    const sortedForms = Object.entries(formDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([form, count]) => ({ form, count }));

    // 2. Timeline (Sort by Order 1-114)
    // We want to send a sorted array of { surah: string, order: number, count: number }
    const sortedTimeline = Object.entries(timelineData)
      .map(([orderStr, count]) => {
        const order = parseInt(orderStr);
        // Find surah entry for this revelation order
        // surahMetadata is keyed by surahNo
        const entry = Object.entries(surahMetadata).find(([_, s]) => s.revelationOrder === order);
        const surahNo = entry ? parseInt(entry[0]) : 0;
        const surahEntry = entry ? entry[1] : null;

        return {
          order, // Revelation Order
          surahNo, // Quranic Order (Standard)
          surah: surahEntry ? surahEntry.name : `Surah ${order}`,
          count
        };
      })
      .sort((a, b) => a.order - b.order);

    // 3. Network Graph
    const sortedAccompanyingRoots = Object.entries(accompanyingRoots)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const nodes = [
      { id: targetRoot, group: 1, radius: 20 + (safeTotalOccurrences / 5) } // Main node
    ];

    sortedAccompanyingRoots.forEach(([root, count]) => {
      nodes.push({ id: root, group: 2, radius: 10 + (count / 2) });
    });

    const links = sortedAccompanyingRoots.map(([root, count]) => ({
      source: targetRoot,
      target: root,
      value: count
    }));


    // 4. Co-occurrence Matrix (Top 7 + Target)
    // We want to see how the top roots interact with EACH OTHER, not just the target.
    // Matrix Roots: Target + Top 6 Accompanying
    const matrixRoots = [targetRoot, ...sortedAccompanyingRoots.slice(0, 6).map(r => r[0])];
    const matrixData = []; // Array of { x: rootA, y: rootB, value: count }

    // Pre-calculate sets of ayah IDs for each matrix root to speed up intersection
    const rootAyahSets = {};
    matrixRoots.forEach(r => rootAyahSets[r] = new Set());

    // Populate sets
    ayahs.forEach(ayah => {
      // Target is in all these ayahs
      rootAyahSets[targetRoot].add(ayah.id);

      // Check presence of other roots
      ayah.otherRoots.forEach(other => {
        const cleanOther = other ? other.trim() : '';
        if (rootAyahSets[cleanOther]) { // Only track if it's in our top list
          rootAyahSets[cleanOther].add(ayah.id);
        }
      });
    });

    // Calculate intersections
    for (let i = 0; i < matrixRoots.length; i++) {
      for (let j = 0; j < matrixRoots.length; j++) {
        const rootA = matrixRoots[i];
        const rootB = matrixRoots[j];

        let count = 0;
        if (rootA === rootB) {
          count = rootAyahSets[rootA].size;
        } else {
          // Intersection size
          const setA = rootAyahSets[rootA];
          const setB = rootAyahSets[rootB];
          // Efficient intersection
          if (setA.size < setB.size) {
            for (const id of setA) if (setB.has(id)) count++;
          } else {
            for (const id of setB) if (setA.has(id)) count++;
          }
        }

        matrixData.push({ x: rootA, y: rootB, value: count });
      }
    }

    // Safe average calculation (avoid division by zero / NaN)
    const avg = (ayahs.length > 0 && isFinite(safeTotalOccurrences)) ? (safeTotalOccurrences / ayahs.length) : 0;

    return {
      totalOccurrences: safeTotalOccurrences,
      totalAyahs: ayahs.length,
      uniqueSurahs: Object.keys(surahDistribution).length,
      surahDistribution,
      topAccompanyingRoots: sortedAccompanyingRoots,
      juzDistribution,
      pageDistribution,
      averageOccurrencesPerAyah: avg.toFixed(2),
      // Enhanced Metrics
      forms: sortedForms,
      timeline: sortedTimeline,
      era: eraDistribution,
      network: { nodes, links },
      matrix: matrixData // New Field
    };
  }
}

module.exports = new RootService();
