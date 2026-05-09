import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// @desc    Get all custodies (عهد)
// @route   GET /api/custodies
// @access  Private (Finance, HR, Manager, Admin)
router.get('/', 
  protect, 
  authorize('finance', 'hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    const { status, type, employeeId } = req.query;
    
    let query = { 
      company: req.company._id,
      isCustody: true 
    };
    
    if (status) query.status = status;
    if (type) query.custodyType = type;
    if (employeeId) query.employee = employeeId;
    
    const custodies = await Employee.find(query)
      .populate('employee', 'name employeeId department')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: custodies.length,
      data: custodies
    });
  })
);

// @desc    Create custody
// @route   POST /api/custodies
// @access  Private (Finance, HR, Manager, Admin)
router.post('/', 
  protect, 
  authorize('finance', 'hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    req.body.company = req.company._id;
    req.body.createdBy = req.user._id;
    req.body.isCustody = true;
    
    const custody = await Employee.create(req.body);
    
    res.status(201).json({
      success: true,
      data: custody
    });
  })
);

// @desc    Get single custody
// @route   GET /api/custodies/:id
// @access  Private
router.get('/:id', 
  protect,
  asyncHandler(async (req, res) => {
    const custody = await Employee.findById(req.params.id)
      .populate('employee', 'name employeeId department')
      .populate('createdBy', 'name username');
    
    if (!custody) {
      return res.status(404).json({
        success: false,
        message: 'Custody not found'
      });
    }
    
    if (custody.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this custody'
      });
    }
    
    res.json({
      success: true,
      data: custody
    });
  })
);

// @desc    Update custody
// @route   PUT /api/custodies/:id
// @access  Private (Finance, HR, Manager, Admin)
router.put('/:id', 
  protect, 
  authorize('finance', 'hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    let custody = await Employee.findById(req.params.id);
    
    if (!custody) {
      return res.status(404).json({
        success: false,
        message: 'Custody not found'
      });
    }
    
    if (custody.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this custody'
      });
    }
    
    custody = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: custody
    });
  })
);

// @desc    Return custody
// @route   POST /api/custodies/:id/return
// @access  Private (Finance, HR, Manager, Admin)
router.post('/:id/return', 
  protect, 
  authorize('finance', 'hr', 'manager', 'admin', 'owner'),
  asyncHandler(async (req, res) => {
    let custody = await Employee.findById(req.params.id);
    
    if (!custody) {
      return res.status(404).json({
        success: false,
        message: 'Custody not found'
      });
    }
    
    if (custody.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this custody'
      });
    }
    
    custody.status = 'returned';
    custody.returnDate = new Date();
    custody.returnNotes = req.body.notes;
    
    await custody.save();
    
    res.json({
      success: true,
      data: custody,
      message: 'Custody returned successfully'
    });
  })
);

// @desc    Delete custody
// @route   DELETE /api/custodies/:id
// @access  Private (Admin, Owner)
router.delete('/:id', 
  protect, 
  authorize('admin', 'owner'),
  asyncHandler(async (req, res) => {
    const custody = await Employee.findById(req.params.id);
    
    if (!custody) {
      return res.status(404).json({
        success: false,
        message: 'Custody not found'
      });
    }
    
    if (custody.company.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this custody'
      });
    }
    
    await custody.deleteOne();
    
    res.json({
      success: true,
      message: 'Custody deleted successfully'
    });
  })
);

export default router;
