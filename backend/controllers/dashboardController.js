const Log = require('../models/Log');
const Issue = require('../models/Issue');
const Project = require('../models/Project');

/**
 * Helper to get timeframe start date.
 */
function getTimeframeStartDate(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24h
  }
}

/**
 * @desc    Get dashboard metrics & chart data
 * @route   GET /api/v1/dashboard/stats
 * @access  Private
 */
const getStats = async (req, res) => {
  try {
    const { apiKey, timeframe = '24h' } = req.query;

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'apiKey is required' });
    }

    // Verify user owns the project
    const project = await Project.findOne({ apiKey, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }

    const startDate = getTimeframeStartDate(timeframe);

    // Run stats queries in parallel
    const [totalLogs, totalErrors, distinctSessions] = await Promise.all([
      Log.countDocuments({ apiKey, timestamp: { $gte: startDate } }),
      Log.countDocuments({ apiKey, type: 'error', timestamp: { $gte: startDate } }),
      Log.distinct('sessionId', { apiKey, timestamp: { $gte: startDate } })
    ]);

    const errorRate = totalLogs > 0 ? ((totalErrors / totalLogs) * 100).toFixed(2) : 0;

    // Aggregate chart data (hourly for 24h, daily for others)
    const isHourly = timeframe === '24h';
    const dateFormat = isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

    const chartData = await Log.aggregate([
      {
        $match: {
          apiKey,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$timestamp', timezone: '+05:30' } // Indian Standard Time timezone offset
          },
          count: { $sum: 1 },
          errors: {
            $sum: { $cond: [{ $eq: ['$type', 'error'] }, 1, 0] }
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$type', 'page_view'] }, 1, 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalLogs,
          totalErrors,
          errorRate: parseFloat(errorRate),
          activeSessions: distinctSessions.length
        },
        chart: chartData
      }
    });
  } catch (error) {
    console.error('Get stats dashboard error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving stats' });
  }
};

/**
 * @desc    Get raw logs with filtering and pagination
 * @route   GET /api/v1/dashboard/logs
 * @access  Private
 */
const getLogs = async (req, res) => {
  try {
    const { apiKey, type, level, search, page = 1, limit = 50, timeframe = '24h' } = req.query;

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'apiKey is required' });
    }

    const project = await Project.findOne({ apiKey, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    let start = getTimeframeStartDate(timeframe);
    if (req.query.startDate) {
      start = new Date(req.query.startDate);
    }
    let end = new Date();
    if (req.query.endDate) {
      end = new Date(req.query.endDate);
    }

    const query = {
      apiKey,
      timestamp: { $gte: start, $lte: end }
    };

    if (type) query.type = type;
    if (level) query.level = level;
    if (search) {
      query.message = { $regex: search, $options: 'i' };
    }

    // Custom browser and OS filtering
    let browsers = req.query.browsers;
    if (browsers && typeof browsers === 'string') {
      browsers = browsers.split(',');
    }
    let osList = req.query.osList;
    if (osList && typeof osList === 'string') {
      osList = osList.split(',');
    }

    if (browsers && browsers.length > 0) {
      query['metadata.environment.browser'] = { $in: browsers };
    }
    if (osList && osList.length > 0) {
      query['metadata.environment.os'] = { $in: osList };
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skipIndex)
        .limit(parseInt(limit)),
      Log.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get logs dashboard error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving logs' });
  }
};

/**
 * @desc    Get grouped issues feed
 * @route   GET /api/v1/dashboard/issues
 * @access  Private
 */
const getIssues = async (req, res) => {
  try {
    const { apiKey, status = 'unresolved', sortBy = 'lastSeen' } = req.query;

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'apiKey is required' });
    }

    const project = await Project.findOne({ apiKey, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const query = { projectApiKey: apiKey, status };

    // Date/Timeframe filter
    let start = null;
    if (req.query.startDate) {
      start = new Date(req.query.startDate);
    } else if (req.query.timeframe) {
      start = getTimeframeStartDate(req.query.timeframe);
    }
    let end = null;
    if (req.query.endDate) {
      end = new Date(req.query.endDate);
    }

    if (start || end) {
      query.lastSeen = {};
      if (start) query.lastSeen.$gte = start;
      if (end) query.lastSeen.$lte = end;
    }

    // Browser filter
    let browsers = req.query.browsers;
    if (browsers && typeof browsers === 'string') {
      browsers = browsers.split(',');
    }
    if (browsers && browsers.length > 0) {
      const browserQueries = browsers.map(b => ({ [`metadata.browsers.${b.replace(/\./g, '_')}`]: { $gt: 0 } }));
      query.$or = browserQueries;
    }

    // OS filter
    let osList = req.query.osList;
    if (osList && typeof osList === 'string') {
      osList = osList.split(',');
    }
    if (osList && osList.length > 0) {
      const osQueries = osList.map(o => ({ [`metadata.os.${o.replace(/\./g, '_')}`]: { $gt: 0 } }));
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: osQueries }
        ];
        delete query.$or;
      } else {
        query.$or = osQueries;
      }
    }

    const sortOption = {};
    if (sortBy === 'count') {
      sortOption.count = -1;
    } else {
      sortOption.lastSeen = -1;
    }

    const issues = await Issue.find(query)
      .sort(sortOption);

    return res.status(200).json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    console.error('Get issues dashboard error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving issues' });
  }
};

/**
 * @desc    Get single issue details + occurrences + timeline
 * @route   GET /api/v1/dashboard/issues/:id
 * @access  Private
 */
const getIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    const project = await Project.findOne({ apiKey: issue.projectApiKey, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch the 10 most recent raw log occurrences for this issue hash
    const occurrences = await Log.find({
      apiKey: issue.projectApiKey,
      'metadata.fingerprint': issue.hash
    })
      .sort({ timestamp: -1 })
      .limit(10);

    // Extract the Click-to-Error timeline (breadcrumbs) from the most recent occurrence if available
    let breadcrumbs = [];
    const latestOccurrence = occurrences[0];
    if (latestOccurrence && latestOccurrence.metadata && latestOccurrence.metadata.breadcrumbs) {
      breadcrumbs = latestOccurrence.metadata.breadcrumbs;
    }

    return res.status(200).json({
      success: true,
      data: {
        issue,
        occurrences,
        breadcrumbs // timeline trail of user interactions
      }
    });
  } catch (error) {
    console.error('Get issue details error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving issue details' });
  }
};

/**
 * @desc    Update issue status (e.g. resolve, ignore)
 * @route   PUT /api/v1/dashboard/issues/:id
 * @access  Private
 */
const updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['unresolved', 'resolved', 'ignored'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    const project = await Project.findOne({ apiKey: issue.projectApiKey, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    issue.status = status;
    await issue.save();

    return res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Update issue status error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error updating issue' });
  }
};

module.exports = {
  getStats,
  getLogs,
  getIssues,
  getIssue,
  updateIssueStatus
};
