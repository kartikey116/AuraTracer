const Project = require('../models/Project');
const queueService = require('../services/queueService');

/**
 * Helper to validate log type and level.
 */
function isValidLog(log) {
  const validTypes = ['page_view', 'click', 'error', 'server_log', 'db_log'];
  const validLevels = ['info', 'warn', 'error', 'fatal'];

  if (!log.type || !validTypes.includes(log.type)) return false;
  if (log.level && !validLevels.includes(log.level)) return false;
  if (!log.message) return false;
  if (!log.sessionId) return false;

  return true;
}

/**
 * @desc    Ingest developer telemetry events (Client beacon or Server logs)
 * @route   POST /api/v1/ingest
 * @access  Public (Authorized via apiKey)
 */
const ingest = async (req, res) => {
  try {
    let apiKey = req.headers['x-api-key'] || req.query.apiKey;
    let rawBody = req.body;

    // Handle navigator.sendBeacon text/plain content type payloads
    if (req.is('text/*') && typeof req.body === 'string') {
      try {
        rawBody = JSON.parse(req.body);
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Invalid plain text JSON payload' });
      }
    }

    // Extract apiKey from body if not in header/query
    if (!apiKey && rawBody) {
      apiKey = rawBody.apiKey || (Array.isArray(rawBody) ? rawBody[0]?.apiKey : null);
    }

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key is missing' });
    }

    // Validate Project API key
    const project = await Project.findOne({ apiKey });
    if (!project) {
      return res.status(403).json({ success: false, error: 'Invalid API Key' });
    }

    // Validate Origin for browser clients (CORS restriction verification)
    const origin = req.headers.origin || req.get('origin');
    if (origin && !project.allowedOrigins.includes('*')) {
      const isAllowed = project.allowedOrigins.some(allowedOrigin => {
        // Strip trailing slash and protocol if needed for exact comparison, or use wildcard match
        return allowedOrigin === origin || origin.startsWith(allowedOrigin);
      });

      if (!isAllowed) {
        return res.status(403).json({ success: false, error: 'CORS Origin not allowed' });
      }
    }

    // Set CORS headers manually if needed
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Process logs (single log or array of logs)
    const logs = Array.isArray(rawBody) ? rawBody : [rawBody];
    const validLogsCount = 0;

    for (const rawLog of logs) {
      const log = {
        apiKey,
        type: rawLog.type,
        level: rawLog.level || 'info',
        message: rawLog.message,
        path: rawLog.path || null,
        sessionId: rawLog.sessionId || 'server-session',
        metadata: rawLog.metadata || {},
        timestamp: rawLog.timestamp || new Date()
      };

      if (isValidLog(log)) {
        // Enqueue asynchronously to ensure immediate response
        queueService.enqueue(log);
      }
    }

    // Return 202 Accepted immediately to prevent browser load latency
    return res.status(202).json({ success: true, message: 'Events queued for ingestion' });
  } catch (error) {
    console.error('Ingestion endpoint error:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error processing ingestion' });
  }
};

/**
 * @desc    Ingest server or DB logs from backend applications
 * @route   POST /api/v1/ingest/backend
 * @access  Public (Authorized via apiKey)
 */
const ingestBackend = async (req, res) => {
  try {
    let apiKey = req.headers['x-api-key'] || req.query.apiKey;
    let rawBody = req.body;

    // Handle text/plain payloads if sent via custom clients or sendBeacon
    if (req.is('text/*') && typeof req.body === 'string') {
      try {
        rawBody = JSON.parse(req.body);
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Invalid plain text JSON payload' });
      }
    }

    if (!apiKey && rawBody) {
      apiKey = rawBody.apiKey || (Array.isArray(rawBody) ? rawBody[0]?.apiKey : null);
    }

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key is missing' });
    }

    const project = await Project.findOne({ apiKey });
    if (!project) {
      return res.status(403).json({ success: false, error: 'Invalid API Key' });
    }

    const logs = Array.isArray(rawBody) ? rawBody : [rawBody];

    for (const rawLog of logs) {
      const type = rawLog.type || 'server_log';
      if (type !== 'server_log' && type !== 'db_log') {
        continue;
      }

      const log = {
        apiKey,
        type,
        level: rawLog.level || 'info',
        message: rawLog.message,
        path: rawLog.path || 'Backend',
        sessionId: rawLog.sessionId || 'server-session',
        metadata: {
          service: rawLog.service || 'backend-service',
          ...rawLog.metadata,
          environment: {
            browser: 'Backend',
            os: 'Server',
            userAgent: 'Server-Agent',
            ...(rawLog.metadata?.environment || {})
          }
        },
        timestamp: rawLog.timestamp || new Date()
      };

      if (isValidLog(log)) {
        queueService.enqueue(log);
      }
    }

    return res.status(202).json({ success: true, message: 'Backend events queued for ingestion' });
  } catch (error) {
    console.error('Backend Ingestion endpoint error:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error processing backend ingestion' });
  }
};

module.exports = {
  ingest,
  ingestBackend
};
