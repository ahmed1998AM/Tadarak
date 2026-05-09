const asyncHandler = require('express-async-handler');
const Custody = require('../models/Custody');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// @desc    Get all custodies for company
// @route   GET /api/custodies
// @access  Private (Finance, Admin, HR, Manager)
exports.getCustodies = asyncHandler(async (req, res) => {
  const { status, employeeId, category } = req.query;
  
  let query = { company: req.company._id };
  
  if (status) query.status = status;
  if (employeeId) query.employee = employeeId;
  if (category) query.category = category;
  
  const custodies = await Custody.find(query)
    .populate('employee', 'name nameEn position department')
    .populate('receivedBy', 'name email')
    .populate('returnedBy', 'name email')
    .sort('-createdAt');
  
  res.json({
    success: true,
    count: custodies.length,
    data: custodies
  });
});

// @desc    Get single custody
// @route   GET /api/custodies/:id
// @access  Private
exports.getCustody = asyncHandler(async (req, res) => {
  const custody = await Custody.findById(req.params.id)
    .populate('employee', 'name nameEn position department')
    .populate('receivedBy', 'name email')
    .populate('returnedBy', 'name email');
  
  if (!custody) {
    return res.status(404).json({
      success: false,
      message: 'Custody not found'
    });
  }
  
  if (custody.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  res.json({
    success: true,
    data: custody
  });
});

// @desc    Create new custody
// @route   POST /api/custodies
// @access  Private (Finance, Admin, HR)
exports.createCustody = asyncHandler(async (req, res) => {
  const { employee, item, category, serialNumber, value, 
          condition, notes, expectedReturnDate } = req.body;
  
  if (!employee || !item || !category) {
    return res.status(400).json({
      success: false,
      message: 'Please provide employee, item, and category'
    });
  }
  
  const emp = await Employee.findOne({ _id: employee, company: req.company._id });
  if (!emp) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  const custody = await Custody.create({
    employee,
    item,
    category,
    serialNumber,
    value: value || 0,
    condition: condition || 'good',
    notes,
    expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
    company: req.company._id,
    receivedBy: req.user._id,
    status: 'active'
  });
  
  await AuditLog.create({
    action: 'CUSTODY_CREATED',
    entity: 'Custody',
    entityId: custody._id,
    user: req.user._id,
    company: req.company._id,
    details: `Custody created for ${emp.name}: ${item}`
  });
  
  res.status(201).json({
    success: true,
    data: custody
  });
});

// @desc    Update custody
// @route   PUT /api/custodies/:id
// @access  Private (Finance, Admin)
exports.updateCustody = asyncHandler(async (req, res) => {
  let custody = await Custody.findById(req.params.id);
  
  if (!custody) {
    return res.status(404).json({
      success: false,
      message: 'Custody not found'
    });
  }
  
  if (custody.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  // Cannot update returned custodies
  if (custody.status === 'returned') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update returned custody'
    });
  }
  
  custody = await Custody.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  await AuditLog.create({
    action: 'CUSTODY_UPDATED',
    entity: 'Custody',
    entityId: custody._id,
    user: req.user._id,
    company: req.company._id,
    details: `Custody updated`
  });
  
  res.json({
    success: true,
    data: custody
  });
});

// @desc    Return custody
// @route   PATCH /api/custodies/:id/return
// @access  Private (Finance, Admin, HR)
exports.returnCustody = asyncHandler(async (req, res) => {
  const { condition, notes } = req.body;
  
  let custody = await Custody.findById(req.params.id);
  
  if (!custody) {
    return res.status(404).json({
      success: false,
      message: 'Custody not found'
    });
  }
  
  if (custody.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  if (custody.status === 'returned') {
    return res.status(400).json({
      success: false,
      message: 'Custody already returned'
    });
  }
  
  custody.status = 'returned';
  custody.returnedAt = Date.now();
  custody.returnedBy = req.user._id;
  custody.returnCondition = condition || 'good';
  if (notes) custody.returnNotes = notes;
  
  await custody.save();
  
  await AuditLog.create({
    action: 'CUSTODY_RETURNED',
    entity: 'Custody',
    entityId: custody._id,
    user: req.user._id,
    company: req.company._id,
    details: `Custody returned: ${custody.item}`
  });
  
  res.json({
    success: true,
    data: custody
  });
});

// @desc    Delete custody
// @route   DELETE /api/custodies/:id
// @access  Private (Admin)
exports.deleteCustody = asyncHandler(async (req, res) => {
  const custody = await Custody.findById(req.params.id);
  
  if (!custody) {
    return res.status(404).json({
      success: false,
      message: 'Custody not found'
    });
  }
  
  if (custody.company.toString() !== req.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  // Only can delete if not returned or recently created
  if (custody.status === 'returned' && custody.returnedAt) {
    const daysSinceReturn = (Date.now() - new Date(custody.returnedAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceReturn > 7) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete old returned custodies'
      });
    }
  }
  
  await custody.deleteOne();
  
  await AuditLog.create({
    action: 'CUSTODY_DELETED',
    entity: 'Custody',
    entityId: custody._id,
    user: req.user._id,
    company: req.company._id,
    details: `Custody deleted`
  });
  
  res.json({
    success: true,
    message: 'Custody deleted successfully'
  });
});

// @desc    Get custody statistics
// @route   GET /api/custodies/stats
// @access  Private (Finance, Admin, Manager)
exports.getCustodyStats = asyncHandler(async (req, res) => {
  const stats = await Custody.aggregate([
    { $match: { company: req.company._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    }
  ]);
  
  const byCategory = await Custody.aggregate([
    { $match: { company: req.company._id, status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const overdue = await Custody.countDocuments({
    company: req.company._id,
    status: 'active',
    expectedReturnDate: { $lt: new Date() }
  });
  
  res.json({
    success: true,
    data: {
      byStatus: stats,
      byCategory: byCategory,
      overdueCount: overdue
    }
  });
});
