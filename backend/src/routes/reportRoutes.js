import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import Employee from '../models/Employee.js';
import Task from '../models/Task.js';

const router = express.Router();

// @desc    Get dashboard reports
// @route   GET /api/reports/dashboard
// @access  Private (All authenticated users)
router.get('/dashboard', 
  protect,
  asyncHandler(async (req, res) => {
    const companyId = req.company._id.toString();
    
    // Employee count by department
    const employeesByDept = await Employee.aggregate([
      { $match: { company: companyId, isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    
    // Task statistics
    const taskStats = await Task.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Recent activities (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEmployees = await Employee.countDocuments({
      company: companyId,
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const recentTasks = await Task.countDocuments({
      company: companyId,
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Finance summary
    const financeStats = await Employee.aggregate([
      { $match: { company: companyId, financeType: { $exists: true } } },
      {
        $group: {
          _id: '$financeType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        employees: {
          total: await Employee.countDocuments({ company: companyId, isActive: true }),
          byDepartment: employeesByDept,
          newThisWeek: recentEmployees
        },
        tasks: {
          byStatus: taskStats,
          newThisWeek: recentTasks
        },
        finances: {
          byType: financeStats
        },
        transfers: {
          pending: await Employee.countDocuments({ 
            company: companyId, 
            transferType: { $exists: true },
            status: 'pending' 
          })
        },
        custodies: {
          active: await Employee.countDocuments({ 
            company: companyId, 
            isCustody: true,
            status: 'active' 
          })
        }
      }
    });
  })
);

// @desc    Generate employee report
// @route   POST /api/reports/employees
// @access  Private (HR, Manager, Admin)
router.post('/employees', 
  protect, 
  authorize('hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, department, status } = req.body;
    
    let query = { company: req.company._id };
    
    if (startDate && endDate) {
      query.hireDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (department) query.department = department;
    if (status) query.isActive = status === 'active';
    
    const employees = await Employee.find(query)
      .select('name employeeId department position hireDate salary isActive')
      .sort({ hireDate: -1 });
    
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  })
);

// @desc    Generate finance report
// @route   POST /api/reports/finances
// @access  Private (Finance, Manager, Admin)
router.post('/finances', 
  protect, 
  authorize('finance', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, type } = req.body;
    
    let query = { 
      company: req.company._id,
      financeType: { $exists: true }
    };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (type) query.financeType = type;
    
    const finances = await Employee.find(query)
      .populate('employee', 'name employeeId')
      .populate('approvedBy', 'name username')
      .sort({ date: -1 });
    
    // Calculate totals
    const totals = finances.reduce((acc, curr) => {
      acc.total += curr.amount || 0;
      if (curr.financeType === 'loan') acc.loans += curr.amount || 0;
      if (curr.financeType === 'bonus') acc.bonuses += curr.amount || 0;
      if (curr.financeType === 'deduction') acc.deductions += curr.amount || 0;
      return acc;
    }, { total: 0, loans: 0, bonuses: 0, deductions: 0 });
    
    res.json({
      success: true,
      count: finances.length,
      data: finances,
      totals
    });
  })
);

// @desc    Generate task report
// @route   POST /api/reports/tasks
// @access  Private (Manager, Admin)
router.post('/tasks', 
  protect, 
  authorize('manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, status, assignedTo } = req.body;
    
    let query = { company: req.company._id };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name employeeId')
      .populate('assignedBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  })
);

// @desc    Export report data
// @route   POST /api/reports/export
// @access  Private (Admin, Owner)
router.post('/export', 
  protect, 
  authorize('admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { type, format, data } = req.body;
    
    // In a real implementation, this would generate CSV/PDF files
    // For now, we'll return the data in the requested format
    
    if (format === 'json') {
      res.json({
        success: true,
        format: 'json',
        dataType: type,
        exportedAt: new Date().toISOString(),
        data
      });
    } else if (format === 'csv') {
      // Simple CSV conversion
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No data to export'
        });
      }
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' ? `"${val}"` : val
        ).join(',')
      );
      
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format'
      });
    }
  })
);

// @desc    Get audit logs
// @route   GET /api/reports/audit
// @access  Private (Admin, Owner)
router.get('/audit', 
  protect, 
  authorize('admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, action, user } = req.query;
    
    // This would typically query an AuditLog model
    // For now, returning mock structure
    res.json({
      success: true,
      data: {
        logs: [],
        message: 'Audit logs feature - implement AuditLog model for full functionality'
      }
    });
  })
);

export default router;
