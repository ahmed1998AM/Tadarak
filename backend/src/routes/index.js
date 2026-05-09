import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import taskRoutes from './taskRoutes.js';
import companiesRoutes from './companiesRoutes.js';
import subscriptionsRoutes from './subscriptionsRoutes.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/tasks', taskRoutes);
router.use('/companies', companiesRoutes);
router.use('/subscriptions', subscriptionsRoutes);

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HR Pro System API v1.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      employees: '/api/employees',
      tasks: '/api/tasks',
      companies: '/api/companies',
      transfers: '/api/transfers',
      custodies: '/api/custodies',
      finances: '/api/finances',
      reports: '/api/reports',
    },
  });
});

// Health check
router.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

export default router;
