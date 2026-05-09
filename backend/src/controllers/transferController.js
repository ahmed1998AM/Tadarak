const asyncHandler = require('express-async-handler');
const Transfer = require('../models/Transfer');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const Company = require('../models/Company');

// @desc    Get all transfers for company
// @route   GET /api/transfers
// @access  Private (HR, Admin, Manager, Finance)
exports.getTransfers = asyncHandler(async (req, res) => {
  const { status, type, employeeId, startDate, endDate } = req.query;
  
  let query = { company: req.company._id };
  
  if (status) query.status = status;
  if (type) query.type = type;
  if (employeeId) query.employee = employeeId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const transfers = await Transfer.find(query)
    .populate('employee', 'name nameEn position department')
    .populate('fromDepartment', 'name nameEn')
    .populate('toDepartment', 'name nameEn')
    .populate('createdBy', 'name email')
    .sort('-createdAt');
  
  res.json({
    success: true,
    count: transfers.length,
    data: transfers
  });
});

// @desc    Get single transfer
// @route   GET /api/transfers/:id
// @access  Private
exports.getTransfer = asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id)
    .populate('employee', 'name nameEn position department')
    .populate('fromDepartment', 'name nameEn')
    .populate('toDepartment', 'name nameEn')
    .populate('approvedBy', 'name email')
    .populate('createdBy', 'name email');
  
  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer not found'
    });
  }
  
  // Check company match
  if (transfer.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this transfer'
    });
  }
  
  res.json({
    success: true,
    data: transfer
  });
});

// @desc    Create new transfer
// @route   POST /api/transfers
// @access  Private (HR, Admin)
exports.createTransfer = asyncHandler(async (req, res) => {
  const { employee, type, fromDepartment, toDepartment, fromPosition, toPosition, 
          effectiveDate, reason, notes } = req.body;
  
  // Validate required fields
  if (!employee || !type || !effectiveDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide employee, type, and effective date'
    });
  }
  
  // Check if employee exists and belongs to company
  const emp = await Employee.findOne({ _id: employee, company: req.company._id });
  if (!emp) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found in your company'
    });
  }
  
  const transfer = await Transfer.create({
    employee,
    type,
    fromDepartment,
    toDepartment,
    fromPosition,
    toPosition,
    effectiveDate: new Date(effectiveDate),
    reason,
    notes,
    company: req.company._id,
    createdBy: req.user._id,
    status: 'pending'
  });
  
  // Update employee record if transfer is approved automatically for certain types
  if (type === 'promotion' || type === 'department_change') {
    if (toPosition) emp.position = toPosition;
    if (toDepartment) emp.department = toDepartment;
    await emp.save();
  }
  
  // Log activity
  await AuditLog.create({
    action: 'TRANSFER_CREATED',
    entity: 'Transfer',
    entityId: transfer._id,
    user: req.user._id,
    company: req.company._id,
    details: `Transfer created for employee ${emp.name}`
  });
  
  res.status(201).json({
    success: true,
    data: transfer
  });
});

// @desc    Update transfer
// @route   PUT /api/transfers/:id
// @access  Private (HR, Admin)
exports.updateTransfer = asyncHandler(async (req, res) => {
  let transfer = await Transfer.findById(req.params.id);
  
  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer not found'
    });
  }
  
  // Check company match
  if (transfer.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this transfer'
    });
  }
  
  // Only pending transfers can be updated
  if (transfer.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update approved/rejected transfers'
    });
  }
  
  transfer = await Transfer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  // Log activity
  await AuditLog.create({
    action: 'TRANSFER_UPDATED',
    entity: 'Transfer',
    entityId: transfer._id,
    user: req.user._id,
    company: req.company._id,
    details: `Transfer updated`
  });
  
  res.json({
    success: true,
    data: transfer
  });
});

// @desc    Approve/Reject transfer
// @route   PATCH /api/transfers/:id/status
// @access  Private (Admin, Manager)
exports.updateTransferStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be approved or rejected'
    });
  }
  
  let transfer = await Transfer.findById(req.params.id);
  
  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer not found'
    });
  }
  
  // Check company match
  if (transfer.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  if (transfer.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Transfer already processed'
    });
  }
  
  transfer.status = status;
  if (status === 'rejected') {
    transfer.rejectionReason = rejectionReason;
  }
  transfer.approvedBy = req.user._id;
  transfer.approvedAt = Date.now();
  
  await transfer.save();
  
  // Update employee if approved
  if (status === 'approved') {
    const emp = await Employee.findById(transfer.employee);
    if (emp) {
      if (transfer.toPosition) emp.position = transfer.toPosition;
      if (transfer.toDepartment) emp.department = transfer.toDepartment;
      if (transfer.type === 'promotion' && transfer.newSalary) {
        emp.salary = transfer.newSalary;
      }
      await emp.save();
    }
  }
  
  // Log activity
  await AuditLog.create({
    action: `TRANSFER_${status.toUpperCase()}`,
    entity: 'Transfer',
    entityId: transfer._id,
    user: req.user._id,
    company: req.company._id,
    details: `Transfer ${status} by ${req.user.name}`
  });
  
  res.json({
    success: true,
    data: transfer
  });
});

// @desc    Delete transfer
// @route   DELETE /api/transfers/:id
// @access  Private (Admin)
exports.deleteTransfer = asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id);
  
  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer not found'
    });
  }
  
  // Check company match
  if (transfer.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  // Only pending transfers can be deleted
  if (transfer.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete processed transfers'
    });
  }
  
  await transfer.deleteOne();
  
  // Log activity
  await AuditLog.create({
    action: 'TRANSFER_DELETED',
    entity: 'Transfer',
    entityId: transfer._id,
    user: req.user._id,
    company: req.company._id,
    details: `Transfer deleted`
  });
  
  res.json({
    success: true,
    message: 'Transfer deleted successfully'
  });
});

// @desc    Get transfer statistics
// @route   GET /api/transfers/stats
// @access  Private (Admin, HR, Manager)
exports.getTransferStats = asyncHandler(async (req, res) => {
  const stats = await Transfer.aggregate([
    { $match: { company: req.company._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const byType = await Transfer.aggregate([
    { $match: { company: req.company._id } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      byStatus: stats,
      byType: byType
    }
  });
});
