const express = require('express');
const router = express.Router();
const {
  getStats,
  getLogs,
  getIssues,
  getIssue,
  updateIssueStatus
} = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

// Protect all routes
router.use(requireAuth);

router.get('/stats', getStats);
router.get('/logs', getLogs);
router.get('/issues', getIssues);
router.get('/issues/:id', getIssue);
router.put('/issues/:id', updateIssueStatus);

module.exports = router;
