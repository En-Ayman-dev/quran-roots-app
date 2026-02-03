const express = require('express');
const router = express.Router();
const rootService = require('../services/rootService');

// Search by root
router.get('/root/:root', async (req, res, next) => {
  try {
    const { root } = req.params;
    const result = await rootService.searchByRoot(root);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Suggest roots (Autocomplete)
router.get('/suggest', async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await rootService.suggestRoots(q);
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});



// Get statistics for a root
router.get('/statistics/:root', async (req, res, next) => {
  try {
    const { root } = req.params;
    const result = await rootService.getRootStatistics(root);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
