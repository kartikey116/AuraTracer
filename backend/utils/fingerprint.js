const crypto = require('crypto');

/**
 * Normalizes an error message by stripping dynamic identifiers.
 * @param {string} message - The raw error message
 * @returns {string} - The sanitized/normalized message
 */
function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') return '';

  return message
    // 1. Replace emails
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]')
    // 2. Replace UUIDs (hex-based, typical GUIDs)
    .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '[UUID]')
    // 3. Replace MongoDB ObjectIds (24-char hex strings)
    .replace(/\b[0-9a-fA-F]{24}\b/g, '[OBJECTID]')
    // 4. Replace IP Addresses (IPv4)
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
    // 5. Replace stand-alone numbers/integers
    .replace(/\b\d+\b/g, '[NUM]');
}

/**
 * Normalizes stack trace by stripping line and column numbers.
 * @param {string} stack - The error stack trace
 * @returns {string} - The sanitized stack trace
 */
function sanitizeStack(stack) {
  if (!stack || typeof stack !== 'string') return '';

  // 1. Strip dynamic IDs, UUIDs, ObjectIds, etc. from the stack trace message line
  const cleanedMessage = sanitizeMessage(stack);

  // 2. Strip line and column numbers (e.g. :123:45 or :123)
  return cleanedMessage
    .replace(/:\d+:\d+/g, ':[LOC]')
    .replace(/:\d+/g, ':[LOC]');
}

/**
 * Generates a stable MD5 fingerprint hash for an error.
 * @param {string} message - Error message
 * @param {string} path - Code path or URL where error occurred
 * @param {string} stack - Stack trace
 * @returns {object} - { hash, sanitizedMessage }
 */
function generateFingerprint(message, path, stack) {
  const normMessage = sanitizeMessage(message);
  const normPath = path || '';
  const normStack = sanitizeStack(stack);

  // Build the key from normalized components
  // If stack is available, it is the most reliable fingerprint component.
  // Otherwise, use the normalized message and path.
  const fingerprintKey = normStack 
    ? `${normStack}`
    : `${normMessage}:${normPath}`;

  const hash = crypto
    .createHash('md5')
    .update(fingerprintKey)
    .digest('hex');

  return {
    hash,
    sanitizedMessage: normMessage
  };
}

module.exports = {
  sanitizeMessage,
  sanitizeStack,
  generateFingerprint
};
