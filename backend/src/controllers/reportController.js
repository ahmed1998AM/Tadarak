const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const Transfer = require('../models/Transfer');
const Custody = require('../models/Custody');
const Finance = require('../models/Finance');
const AuditLog = require('../models/AuditLog');
const Company = require('../models/Company');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const company = req.company._id;
  
  // Employee stats
  const totalEmployees = await Employee.countDocuments({ company, status: 'active' });
  const newThisMonth = await Employee.countDocuments({ 
    company, 
    joinDate: { $gte: new Date(new Date().setDate(1)) } 
  });
  const leavingSoon = await Employee.countDocuments({ 
    company, 
    endDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    status: 'active'
  });
  
  // Task stats
  const totalTasks = await Task.countDocuments({ company });
  const pendingTasks = await Task.countDocuments({ company, status: 'pending' });
  const completedTasks = await Task.countDocuments({ company, status: 'completed' });
  const overdueTasks = await Task.countDocuments({ 
    company, 
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  });
  
  // Transfer stats
  const pendingTransfers = await Transfer.countDocuments({ company, status: 'pending' });
  
  // Custody stats
  const activeCustodies = await Custody.countDocuments({ company, status: 'active' });
  const overdueCustodies = await Custody.countDocuments({
    company,
    status: 'active',
    expectedReturnDate: { $lt: new Date() }
  });
  
  // Finance stats
  const pendingFinances = await Finance.countDocuments({ company, status: 'pending' });
  const financeStats = await Finance.aggregate([
    { $match: { company } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalRemaining: { $sum: '$remainingAmount' }
      }
    }
  ]);
  
  // Department breakdown
  const deptStats = await Employee.aggregate([
    { $match: { company, status: 'active' } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  res.json({
    success: true,
    data: {
      employees: {
        total: totalEmployees,
        newThisMonth,
        leavingSoon
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
        overdue: overdueTasks
      },
      transfers: {
        pending: pendingTransfers
      },
      custodies: {
        active: activeCustodies,
        overdue: overdueCustodies
      },
      finances: {
        pending: pendingFinances,
        totalAmount: financeStats[0]?.totalAmount || 0,
        totalRemaining: financeStats[0]?.totalRemaining || 0
      },
      departments: deptStats,
      generatedAt: new Date()
    }
  });
});

// @desc    Get employee report
// @route   GET /api/reports/employees
// @access  Private (HR, Admin, Manager)
exports.getEmployeeReport = asyncHandler(async (req, res) => {
  const { department, status, joinDateStart, joinDateEnd } = req.query;
  
  let query = { company: req.company._id };
  
  if (department) query.department = department;
  if (status) query.status = status;
  if (joinDateStart || joinDateEnd) {
    query.joinDate = {};
    if (joinDateStart) query.joinDate.$gte = new Date(joinDateStart);
    if (joinDateEnd) query.joinDate.$lte = new Date(joinDateEnd);
  }
  
  const employees = await Employee.find(query)
    .select('name nameEn position department joinDate salary status')
    .sort('-joinDate');
  
  const stats = await Employee.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgSalary: { $avg: '$salary' }
      }
    }
  ]);
  
  res.json({
    success: true,
    count: employees.length,
    data: {
      employees,
      stats
    }
  });
});

// @desc    Get task report
// @route   GET /api/reports/tasks
// @access  Private (Manager, Admin)
exports.getTaskReport = asyncHandler(async (req, res) => {
  const { status, priority, assignee, startDate, endDate } = req.query;
  
  let query = { company: req.company._id };
  
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignee) query.assignee = assignee;
  if (startDate || endDate) {
    query.dueDate = {};
    if (startDate) query.dueDate.$gte = new Date(startDate);
    if (endDate) query.dueDate.$lte = new Date(endDate);
  }
  
  const tasks = await Task.find(query)
    .populate('assignee', 'name nameEn position')
    .populate('createdBy', 'name email')
    .sort('-dueDate');
  
  const completionRate = await Task.aggregate([
    { $match: { company: req.company._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  res.json({
    success: true,
    count: tasks.length,
    data: {
      tasks,
      completionRate
    }
  });
});

// @desc    Get attendance report
// @route   GET /api/reports/attendance
// @access  Private (HR, Admin, Manager)
exports.getAttendanceReport = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide start and end dates'
    });
  }
  
  let query = { 
    company: req.company._id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (employeeId) query.employee = employeeId;
  
  // This would need an Attendance model - using placeholder
  const attendance = []; // Would be: await Attendance.find(query).populate('employee');
  
  res.json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});

// @desc    Get finance report
// @route   GET /api/reports/finances
// @access  Private (Finance, Admin)
exports.getFinanceReport = asyncHandler(async (req, res) => {
  const { type, status, startDate, endDate } = req.query;
  
  let query = { company: req.company._id };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const finances = await Finance.find(query)
    .populate('employee', 'name nameEn position')
    .sort('-createdAt');
  
  const summary = await Finance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalRemaining: { $sum: '$remainingAmount' },
        totalPaid: { 
          $sum: { $subtract: ['$amount', '$remainingAmount'] }
        }
      }
    }
  ]);
  
  res.json({
    success: true,
    count: finances.length,
    data: {
      finances,
      summary
    }
  });
});

// @desc    Export report to CSV
// @route   GET /api/reports/export/:type
// @access  Private
exports.exportReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { startDate, endDate } = req.query;
  
  let data = [];
  let filename = `report_${type}_${Date.now()}.csv`;
  
  // Generate data based on type
  switch(type) {
    case 'employees':
      data = await Employee.find({ company: req.company._id })
        .select('name nameEn position department joinDate salary status');
      break;
    case 'tasks':
      data = await Task.find({ company: req.company._id })
        .populate('assignee', 'name');
      break;
    case 'finances':
      data = await Finance.find({ company: req.company._id })
        .populate('employee', 'name');
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
  }
  
  // Convert to CSV
  const csv = convertToCSV(data);
  
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'object' ? JSON.stringify(val) : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

// @desc    Get audit log report
// @route   GET /api/reports/audit
// @access  Private (Admin, Super Admin)
exports.getAuditReport = asyncHandler(async (req, res) => {
  const { action, user, startDate, endDate } = req.query;
  
  let query = { company: req.company._id };
  
  if (action) query.action = action;
  if (user) query.user = user;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const logs = await AuditLog.find(query)
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(100);
  
  res.json({
    success: true,
    count: logs.length,
    data: logs
  });
});
