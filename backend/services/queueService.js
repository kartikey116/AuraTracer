const { createClient } = require('redis');
const Log = require('../models/Log');
const Issue = require('../models/Issue');
const { generateFingerprint } = require('../utils/fingerprint');

class QueueService {
  constructor() {
    this.memoryQueue = [];
    this.redisClient = null;
    this.useRedis = false;
    this.flushInterval = 2000; // Flush every 2 seconds
    this.batchSize = 100;      // Flush when batch reaches 100
    this.flushTimer = null;
  }

  /**
   * Initializes the queue service and attempts to connect to Redis.
   */
  async init() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      this.redisClient = createClient({ url: redisUrl });
      
      // Handle connection errors gracefully without crashing the server
      this.redisClient.on('error', (err) => {
        if (!this.useRedis) {
          // Suppress repeated logs if already falling back
          return;
        }
        console.warn(`Redis connection error, falling back to In-Memory Queue: ${err.message}`);
        this.useRedis = false;
      });

      await this.redisClient.connect();
      this.useRedis = true;
      console.log('Redis Ingestion Buffer Connected successfully.');
    } catch (error) {
      console.warn(`Failed to connect to Redis (${redisUrl}). Falling back to In-Memory Queue.`);
      this.useRedis = false;
    }

    // Start the periodic flush worker
    this.startWorker();
  }

  /**
   * Starts the background queue flusher.
   */
  startWorker() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Pushes a new log document into the queue.
   * @param {object} logData - The log entry payload
   */
  async enqueue(logData) {
    // Add default timestamp if not present
    const log = {
      ...logData,
      timestamp: logData.timestamp ? new Date(logData.timestamp) : new Date()
    };

    if (this.useRedis) {
      try {
        await this.redisClient.rPush('logs_queue', JSON.stringify(log));
        
        // Fast flush if Redis queue length exceeds batchSize
        const len = await this.redisClient.lLen('logs_queue');
        if (len >= this.batchSize) {
          this.flush();
        }
      } catch (err) {
        console.error('Failed to write to Redis queue, pushing to memory fallback:', err.message);
        this.memoryQueue.push(log);
        if (this.memoryQueue.length >= this.batchSize) {
          this.flush();
        }
      }
    } else {
      this.memoryQueue.push(log);
      if (this.memoryQueue.length >= this.batchSize) {
        this.flush();
      }
    }
  }

  /**
   * Flushes queued items and writes them in batch to MongoDB.
   */
  async flush() {
    let itemsToProcess = [];

    try {
      if (this.useRedis && this.redisClient) {
        // Fetch up to batchSize items from Redis list
        // Multi/Exec transaction to get and trim is the safest approach
        const len = await this.redisClient.lLen('logs_queue');
        if (len === 0) return;

        const rangeEnd = Math.min(len, this.batchSize) - 1;
        
        // Fetch items
        const rawItems = await this.redisClient.lRange('logs_queue', 0, rangeEnd);
        
        // Remove items
        await this.redisClient.lTrim('logs_queue', rangeEnd + 1, -1);
        
        itemsToProcess = rawItems.map(item => JSON.parse(item));
      } else {
        if (this.memoryQueue.length === 0) return;
        itemsToProcess = [...this.memoryQueue];
        this.memoryQueue = [];
      }

      if (itemsToProcess.length === 0) return;

      await this.saveBatch(itemsToProcess);
    } catch (error) {
      console.error('Error during queue flush processing:', error);
      // If memory write fails, prepend items back to retry (to avoid data loss)
      if (!this.useRedis && itemsToProcess.length > 0) {
        this.memoryQueue = [...itemsToProcess, ...this.memoryQueue];
      }
    }
  }

  async saveBatch(logs) {
    try {
      // 1. Preprocess logs to calculate fingerprint for errors and store it in metadata
      for (const log of logs) {
        if (log.type === 'error') {
          const metadata = log.metadata || {};
          const errorPath = log.path || 'Unknown';
          const stack = metadata.stack || '';
          
          const { hash } = generateFingerprint(log.message, errorPath, stack);
          
          if (!log.metadata) {
            log.metadata = {};
          }
          log.metadata.fingerprint = hash;
        }
      }

      // 2. Write all raw logs using bulk insertMany (extremely fast)
      await Log.insertMany(logs, { ordered: false });

      // 3. Aggregate errors to write to the Issue collection
      const errorLogs = logs.filter(log => log.type === 'error');
      if (errorLogs.length === 0) return;

      const issueOperations = [];

      for (const log of errorLogs) {
        const metadata = log.metadata || {};
        const browser = metadata.browser || 'Unknown';
        const os = metadata.os || 'Unknown';
        const errorPath = log.path || 'Unknown';
        const stack = metadata.stack || '';
        const hash = metadata.fingerprint; // Retrieve pre-calculated hash

        const { sanitizedMessage } = generateFingerprint(log.message, errorPath, stack);

        // Sanitize map keys for MongoDB paths (replace '.' with '_')
        const safeBrowserKey = `metadata.browsers.${browser.replace(/\./g, '_')}`;
        const safeOsKey = `metadata.os.${os.replace(/\./g, '_')}`;
        const safeUrlKey = `metadata.urls.${errorPath.replace(/\./g, '_')}`;

        const incUpdate = {
          count: 1
        };
        incUpdate[safeBrowserKey] = 1;
        incUpdate[safeOsKey] = 1;
        incUpdate[safeUrlKey] = 1;

        issueOperations.push({
          updateOne: {
            filter: { projectApiKey: log.apiKey, hash: hash },
            update: {
              $setOnInsert: {
                message: sanitizedMessage,
                path: errorPath,
                stack: stack,
                firstSeen: log.timestamp
              },
              $set: {
                lastSeen: log.timestamp,
                status: 'unresolved' // Reset status to unresolved on new occurrence
              },
              $inc: incUpdate
            },
            upsert: true
          }
        });
      }

      if (issueOperations.length > 0) {
        // Execute issue updates in bulk to avoid DB overhead
        await Issue.bulkWrite(issueOperations, { ordered: false });
      }
    } catch (error) {
      console.error('MongoDB batch insert error:', error.message);
    }
  }

  /**
   * Gracefully shuts down the queue by flushing remaining items.
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    console.log('Shutting down queue service, flushing remaining logs...');
    await this.flush();
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Singleton Instance
const queueService = new QueueService();
module.exports = queueService;
