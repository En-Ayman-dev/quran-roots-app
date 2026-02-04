const express = require('express');
const router = express.Router();
const rootService = require('../services/rootService');
let NodeCache;

// Robust fallback (Same as statistics)
try {
  NodeCache = require('node-cache');
} catch (e) {
  NodeCache = class {
    constructor(options) { this.cache = new Map(); this.stdTTL = options.stdTTL || 0; }
    get(key) {
      const item = this.cache.get(key);
      if (!item) return undefined;
      if (item.expiry < Date.now()) { this.cache.delete(key); return undefined; }
      return item.value;
    }
    set(key, value, ttl) {
      this.cache.set(key, { value, expiry: Date.now() + (ttl || this.stdTTL) * 1000 });
      return true;
    }
  };
}

// 1 Hour Cache for Search Results
const searchCache = new NodeCache({ stdTTL: 3600 });

// Search by root
router.get('/root/:root', async (req, res, next) => {
  try {
    const { root } = req.params;

    // 1. Check Cache
    const cached = searchCache.get(`search_${root}`);
    if (cached) {
      // Add Browser Cache Header
      res.set('Cache-Control', 'public, max-age=3600');
      return res.json({ ...cached, fromCache: true });
    }

    const result = await rootService.searchByRoot(root);

    // 2. Set Cache
    searchCache.set(`search_${root}`, result);

    // Add Browser Cache Header
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Suggest roots (Autocomplete)
router.get('/suggest', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    // 1. Check Cache
    const cached = searchCache.get(`suggest_${q}`);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=3600');
      return res.json(cached);
    }

    const suggestions = await rootService.suggestRoots(q);

    // 2. Set Cache
    searchCache.set(`suggest_${q}`, suggestions);

    res.set('Cache-Control', 'public, max-age=3600');
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

// Get statistics for a root
router.get('/statistics/:root', async (req, res, next) => {
  try {
    const { root } = req.params;

    // 1. Check Cache
    const cached = searchCache.get(`stats_${root}`);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
      return res.json(cached);
    }

    const result = await rootService.getRootStatistics(root);

    // 2. Set Cache
    searchCache.set(`stats_${root}`, result, 86400); // 24 hours

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
