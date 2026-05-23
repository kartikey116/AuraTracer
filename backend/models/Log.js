const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['page_view', 'click', 'error', 'server_log', 'db_log'],
    required: true
  },
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'fatal'],
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  path: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// CRITICAL COMPOUND INDEX
LogSchema.index({ apiKey: 1, timestamp: -1 });

module.exports = mongoose.model('Log', LogSchema);
