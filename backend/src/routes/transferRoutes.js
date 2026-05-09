import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// @desc    Get all transfers
// @route   GET /api/transfers
// @access  Private (HR, Manager, Admin)
router.get('/', 
  protect, 
  authorize('hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { status, type, employeeId } = req.query;
    
    let query = { company: req.company._id };
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (employeeId) query.employee = employeeId;
    
    const transfers = await Employee.find(query)
      .populate('employee', 'name employeeId department')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  })
);

// @desc    Create transfer
// @route   POST /api/transfers
// @access  Private (HR, Manager, Admin)
router.post('/', 
  protect, 
  authorize('hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    req.body.company = req.company._id;
    req.body.createdBy = req.user._id;
    
    const transfer = await Employee.create(req.body);
    
    res.status(201).json({
      success: true,
      data: transfer
    });
  })
);

// @desc    Get single transfer
// @route   GET /api/transfers/:id
// @access  Private
router.get('/:id', 
  protect,
  asyncHandler(async (req, res) => {
    const transfer = await Employee.findById(req.params.id)
      .populate('employee', 'name employeeId department')
      .populate('createdBy', 'name username');
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    // Check ownership
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
  })
);

// @desc    Update transfer
// @route   PUT /api/transfers/:id
// @access  Private (HR, Manager, Admin)
router.put('/:id', 
  protect, 
  authorize('hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    let transfer = await Employee.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    if (transfer.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this transfer'
      });
    }
    
    transfer = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: transfer
    });
  })
);

// @desc    Delete transfer
// @route   DELETE /api/transfers/:id
// @access  Private (Admin, Owner)
router.delete('/:id', 
  protect, 
  authorize('admin', 'owner'),
  asyncHandler(async (req, res) => {
    const transfer = await Employee.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    if (transfer.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this transfer'
      });
    }
    
    await transfer.deleteOne();
    
    res.json({
      success: true,
      message: 'Transfer deleted successfully'
    });
  })
);

export default router;
