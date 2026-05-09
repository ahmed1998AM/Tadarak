import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// @desc    Get all finances (سلف ومكافآت وخصومات)
// @route   GET /api/finances
// @access  Private (Finance, Manager, Admin, Owner)
router.get('/', 
  protect, 
  authorize('finance', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { type, status, employeeId, startDate, endDate } = req.query;
    
    let query = { company: req.company._id };
    
    if (type) query.financeType = type; // loan, bonus, deduction, salary
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const finances = await Employee.find(query)
      .populate('employee', 'name employeeId department')
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: finances.length,
      data: finances
    });
  })
);

// @desc    Get finance statistics
// @route   GET /api/finances/stats
// @access  Private (Finance, Manager, Admin, Owner)
router.get('/stats', 
  protect, 
  authorize('finance', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    const stats = await Employee.aggregate([
      { $match: { company: req.company._id.toString() } },
      {
        $group: {
          _id: '$financeType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const totalLoans = stats.find(s => s._id === 'loan')?.totalAmount || 0;
    const totalBonuses = stats.find(s => s._id === 'bonus')?.totalAmount || 0;
    const totalDeductions = stats.find(s => s._id === 'deduction')?.totalAmount || 0;
    
    res.json({
      success: true,
      data: {
        byType: stats,
        totals: {
          loans: totalLoans,
          bonuses: totalBonuses,
          deductions: totalDeductions,
          net: totalBonuses - totalLoans - totalDeductions
        }
      }
    });
  })
);

// @desc    Create finance record
// @route   POST /api/finances
// @access  Private (Finance, HR, Manager, Admin)
router.post('/', 
  protect, 
  authorize('finance', 'hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    req.body.company = req.company._id;
    req.body.createdBy = req.user._id;
    
    // Auto-approve if created by finance/admin
    if (req.user.role === 'finance' || req.user.role === 'admin' || req.user.role === 'owner') {
      req.body.status = 'approved';
      req.body.approvedBy = req.user._id;
      req.body.approvedAt = new Date();
    }
    
    const finance = await Employee.create(req.body);
    
    res.status(201).json({
      success: true,
      data: finance
    });
  })
);

// @desc    Get single finance
// @route   GET /api/finances/:id
// @access  Private
router.get('/:id', 
  protect,
  asyncHandler(async (req, res) => {
    const finance = await Employee.findById(req.params.id)
      .populate('employee', 'name employeeId department')
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username');
    
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Finance record not found'
      });
    }
    
    if (finance.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this record'
      });
    }
    
    res.json({
      success: true,
      data: finance
    });
  })
);

// @desc    Approve/Reject finance
// @route   PUT /api/finances/:id/status
// @access  Private (Finance, Manager, Admin)
router.put('/:id/status', 
  protect, 
  authorize('finance', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    let finance = await Employee.findById(req.params.id);
    
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Finance record not found'
      });
    }
    
    if (finance.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this record'
      });
    }
    
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    finance.status = status;
    finance.approvedBy = req.user._id;
    finance.approvedAt = new Date();
    
    if (status === 'rejected' && rejectionReason) {
      finance.rejectionReason = rejectionReason;
    }
    
    await finance.save();
    
    res.json({
      success: true,
      data: finance,
      message: `Finance record ${status} successfully`
    });
  })
);

// @desc    Update finance
// @route   PUT /api/finances/:id
// @access  Private (Finance, Admin)
router.put('/:id', 
  protect, 
  authorize('finance', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    let finance = await Employee.findById(req.params.id);
    
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Finance record not found'
      });
    }
    
    if (finance.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record'
      });
    }
    
    // Don't allow changing status through this endpoint
    delete req.body.status;
    
    finance = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: finance
    });
  })
);

// @desc    Delete finance
// @route   DELETE /api/finances/:id
// @access  Private (Admin, Owner)
router.delete('/:id', 
  protect, 
  authorize('admin', 'owner'),
  asyncHandler(async (req, res) => {
    const finance = await Employee.findById(req.params.id);
    
    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Finance record not found'
      });
    }
    
    if (finance.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this record'
      });
    }
    
    await finance.deleteOne();
    
    res.json({
      success: true,
      message: 'Finance record deleted successfully'
    });
  })
);

export default router;
