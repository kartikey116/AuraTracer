require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const queueService = require('./services/queueService');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const ingestRoutes = require('./routes/ingest');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Initialize Ingestion Queue Buffer
queueService.init();

// CORS configuration (CORS with credentials requires a specific origin, not wildcard *)
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically match any localhost connection or allow requests without origin (SDK beacons / server logs)
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request body parsing middlewares
app.use(express.json());
app.use(cookieParser());
// Crucial: parse text/plain payloads (used by navigator.sendBeacon)
app.use(express.text({ type: 'text/plain', limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/ingest', ingestRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Fallback Route
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: 'Something went wrong on the server' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful Shutdown Handler
const handleGracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Close HTTP Server
  server.close(() => {
    console.log('HTTP Server closed.');
  });

  // Drain and shutdown Queue Service (saves pending logs)
  try {
    await queueService.shutdown();
    console.log('Queue service drained and shutdown.');
  } catch (err) {
    console.error('Error shutting down queue service:', err.message);
  }

  console.log('Graceful shutdown complete. Exiting.');
  process.exit(0);
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
