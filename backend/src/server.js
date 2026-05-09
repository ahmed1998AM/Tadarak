import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import compression from 'compression';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { 
  apiLimiter, 
  securityHeaders, 
  corsOptions, 
  errorHandler, 
  notFound 
} from './middleware/error.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(securityHeaders); // Security headers
app.use(corsOptions); // CORS
app.use(compression()); // Compression
app.use(morgan('dev')); // Logging
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL-encoded data

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 HR Pro System - Professional SaaS HR Management',
    version: '1.0.0',
    api: '/api',
    documentation: '/api/docs',
  });
});

// Error handling
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀  HR Pro System - Backend Server                      ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║   Port: ${PORT}                                              ║
║   Database: Connected                                      ║
║                                                           ║
║   API Endpoints:                                          ║
║   - Auth: /api/auth                                       ║
║   - Employees: /api/employees                             ║
║   - Tasks: /api/tasks                                     ║
║   - Health: /api/health                                   ║
║                                                           ║
║   Ready to accept requests!                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

export default app;
