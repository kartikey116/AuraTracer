const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  projectApiKey: {
    type: String,
    required: true,
    index: true
  },
  hash: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  path: {
    type: String,
    default: null
  },
  stack: {
    type: String,
    default: null
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  count: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['unresolved', 'resolved', 'ignored'],
    default: 'unresolved'
  },
  metadata: {
    browsers: { type: Map, of: Number, default: {} },
    os: { type: Map, of: Number, default: {} },
    urls: { type: Map, of: Number, default: {} }
  }
});

// Compound unique index to prevent duplicate issues for the same error hash in a project
IssueSchema.index({ projectApiKey: 1, hash: 1 }, { unique: true });

// Compound index for querying feed sorted by last seen
IssueSchema.index({ projectApiKey: 1, lastSeen: -1 });

module.exports = mongoose.model('Issue', IssueSchema);
