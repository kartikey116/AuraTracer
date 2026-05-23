const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { requireAuth } = require('../middleware/auth');

// Protect all routes
router.use(requireAuth);

router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
