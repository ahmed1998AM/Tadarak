const asyncHandler = require('express-async-handler');
const Finance = require('../models/Finance');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get all finance records for company
// @route   GET /api/finances
// @access  Private (Finance, Admin)
exports.getFinances = asyncHandler(async (req, res) => {
  const { type, status, employeeId, startDate, endDate, category } = req.query;
  
  let query = { company: req.company._id };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (employeeId) query.employee = employeeId;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const finances = await Finance.find(query)
    .populate('employee', 'name nameEn position department')
    .populate('approvedBy', 'name email')
    .populate('createdBy', 'name email')
    .sort('-createdAt');
  
  res.json({
    success: true,
    count: finances.length,
    data: finances
  });
});

// @desc    Get single finance record
// @route   GET /api/finances/:id
// @access  Private
exports.getFinance = asyncHandler(async (req, res) => {
  const finance = await Finance.findById(req.params.id)
    .populate('employee', 'name nameEn position department')
    .populate('approvedBy', 'name email')
    .populate('createdBy', 'name email');
  
  if (!finance) {
    return res.status(404).json({
      success: false,
      message: 'Finance record not found'
    });
  }
  
  if (finance.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  res.json({
    success: true,
    data: finance
  });
});

// @desc    Create new finance record (loan/salary advance)
// @route   POST /api/finances
// @access  Private (Finance, Admin, HR)
exports.createFinance = asyncHandler(async (req, res) => {
  const { employee, type, amount, reason, notes, 
          installments, startDate } = req.body;
  
  if (!employee || !type || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Please provide employee, type, and amount'
    });
  }
  
  const emp = await Employee.findOne({ _id: employee, company: req.company._id });
  if (!emp) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  // Validate amount
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }
  
  const finance = await Finance.create({
    employee,
    type,
    amount,
    reason,
    notes,
    installments: installments || 1,
    startDate: startDate ? new Date(startDate) : new Date(),
    remainingAmount: amount,
    company: req.company._id,
    createdBy: req.user._id,
    status: 'pending'
  });
  
  await AuditLog.create({
    action: 'FINANCE_CREATED',
    entity: 'Finance',
    entityId: finance._id,
    user: req.user._id,
    company: req.company._id,
    details: `${type} created for ${emp.name}: ${amount}`
  });
  
  res.status(201).json({
    success: true,
    data: finance
  });
});

// @desc    Update finance record
// @route   PUT /api/finances/:id
// @access  Private (Finance, Admin)
exports.updateFinance = asyncHandler(async (req, res) => {
  let finance = await Finance.findById(req.params.id);
  
  if (!finance) {
    return res.status(404).json({
      success: false,
      message: 'Finance record not found'
    });
  }
  
  if (finance.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  // Cannot update completed/cancelled records
  if (['completed', 'cancelled'].includes(finance.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed/cancelled records'
    });
  }
  
  finance = await Finance.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  await AuditLog.create({
    action: 'FINANCE_UPDATED',
    entity: 'Finance',
    entityId: finance._id,
    user: req.user._id,
    company: req.company._id,
    details: `Finance record updated`
  });
  
  res.json({
    success: true,
    data: finance
  });
});

// @desc    Approve/Reject finance request
// @route   PATCH /api/finances/:id/status
// @access  Private (Admin, Finance Manager)
exports.updateFinanceStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  
  if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  let finance = await Finance.findById(req.params.id);
  
  if (!finance) {
    return res.status(404).json({
      success: false,
      message: 'Finance record not found'
    });
  }
  
  if (finance.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  if (!['pending', 'active'].includes(finance.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot change status of this record'
    });
  }
  
  finance.status = status;
  if (status === 'rejected') {
    finance.rejectionReason = rejectionReason;
  }
  if (status === 'approved') {
    finance.approvedBy = req.user._id;
    finance.approvedAt = Date.now();
  }
  if (status === 'completed' || status === 'cancelled') {
    finance.closedAt = Date.now();
    finance.closedBy = req.user._id;
  }
  
  await finance.save();
  
  await AuditLog.create({
    action: `FINANCE_${status.toUpperCase()}`,
    entity: 'Finance',
    entityId: finance._id,
    user: req.user._id,
    company: req.company._id,
    details: `Finance ${status}`
  });
  
  res.json({
    success: true,
    data: finance
  });
});

// @desc    Record payment for finance
// @route   POST /api/finances/:id/payment
// @access  Private (Finance, Admin)
exports.recordPayment = asyncHandler(async (req, res) => {
  const { amount, date, notes } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid payment amount'
    });
  }
  
  let finance = await Finance.findById(req.params.id);
  
  if (!finance) {
    return res.status(404).json({
      success: false,
      message: 'Finance record not found'
    });
  }
  
  if (finance.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  if (finance.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Can only record payments for active finances'
    });
  }
  
  if (amount > finance.remainingAmount) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount exceeds remaining balance'
    });
  }
  
  // Add payment to history
  finance.paymentHistory.push({
    amount,
    date: date ? new Date(date) : new Date(),
    notes,
    recordedBy: req.user._id
  });
  
  finance.remainingAmount -= amount;
  
  // Mark as completed if fully paid
  if (finance.remainingAmount <= 0) {
    finance.status = 'completed';
    finance.completedAt = Date.now();
  }
  
  await finance.save();
  
  await AuditLog.create({
    action: 'FINANCE_PAYMENT_RECORDED',
    entity: 'Finance',
    entityId: finance._id,
    user: req.user._id,
    company: req.company._id,
    details: `Payment of ${amount} recorded. Remaining: ${finance.remainingAmount}`
  });
  
  res.json({
    success: true,
    data: finance
  });
});

// @desc    Delete finance record
// @route   DELETE /api/finances/:id
// @access  Private (Admin)
exports.deleteFinance = asyncHandler(async (req, res) => {
  const finance = await Finance.findById(req.params.id);
  
  if (!finance) {
    return res.status(404).json({
      success: false,
      message: 'Finance record not found'
    });
  }
  
  if (finance.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  // Only pending can be deleted
  if (finance.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete processed finance records'
    });
  }
  
  await finance.deleteOne();
  
  await AuditLog.create({
    action: 'FINANCE_DELETED',
    entity: 'Finance',
    entityId: finance._id,
    user: req.user._id,
    company: req.company._id,
    details: `Finance record deleted`
  });
  
  res.json({
    success: true,
    message: 'Finance record deleted successfully'
  });
});

// @desc    Get finance statistics
// @route   GET /api/finances/stats
// @access  Private (Finance, Admin, Manager)
exports.getFinanceStats = asyncHandler(async (req, res) => {
  const stats = await Finance.aggregate([
    { $match: { company: req.company._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalRemaining: { $sum: '$remainingAmount' }
      }
    }
  ]);
  
  const byType = await Finance.aggregate([
    { $match: { company: req.company._id } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const monthlyPayments = await Finance.aggregate([
    { 
      $match: { 
        company: req.company._id,
        status: 'active',
        'paymentHistory.date': { $gte: new Date(new Date().setDate(1)) }
      }
    },
    { $unwind: '$paymentHistory' },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$paymentHistory.amount' }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      byStatus: stats,
      byType: byType,
      monthlyPayments: monthlyPayments[0] || { totalPaid: 0 }
    }
  });
});
