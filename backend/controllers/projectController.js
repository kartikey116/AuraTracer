const crypto = require('crypto');
const Project = require('../models/Project');

/**
 * @desc    Create a new project
 * @route   POST /api/v1/projects
 * @access  Private
 */
const createProject = async (req, res) => {
  try {
    const { name, allowedOrigins } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    // Process allowed origins (default to * if empty, otherwise parse array/string)
    let origins = ['*'];
    if (allowedOrigins) {
      if (Array.isArray(allowedOrigins)) {
        origins = allowedOrigins.map(o => o.trim()).filter(Boolean);
      } else if (typeof allowedOrigins === 'string') {
        origins = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
      }
    }
    if (origins.length === 0) {
      origins = ['*'];
    }

    // Generate secure random API key prefixed with dev_
    const apiKey = `dev_${crypto.randomBytes(24).toString('hex')}`;

    const project = await Project.create({
      name,
      userId: req.user._id,
      apiKey,
      allowedOrigins: origins
    });

    return res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error creating project' });
  }
};

/**
 * @desc    Get all user projects
 * @route   GET /api/v1/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving projects' });
  }
};

/**
 * @desc    Get single project details
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving project details' });
  }
};

/**
 * @desc    Update project settings (e.g. allowedOrigins, name)
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
const updateProject = async (req, res) => {
  try {
    const { name, allowedOrigins } = req.body;
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (name) project.name = name;
    if (allowedOrigins) {
      let origins = [];
      if (Array.isArray(allowedOrigins)) {
        origins = allowedOrigins.map(o => o.trim()).filter(Boolean);
      } else if (typeof allowedOrigins === 'string') {
        origins = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
      }
      project.allowedOrigins = origins.length > 0 ? origins : ['*'];
    }

    await project.save();

    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error updating project' });
  }
};

/**
 * @desc    Delete project and its credentials
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Optional: Clean up associated logs and issues in the background?
    // Log.deleteMany({ apiKey: project.apiKey })
    // Issue.deleteMany({ projectApiKey: project.apiKey })

    return res.status(200).json({
      success: true,
      message: 'Project and credentials deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error deleting project' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
};
