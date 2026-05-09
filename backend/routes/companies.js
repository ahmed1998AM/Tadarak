import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { protect, authorize } from '../middleware/auth.js';
import { registerValidation, updateUserValidation } from '../middleware/validation.js';

const router = express.Router();

// @route   POST /api/companies
// @desc    Create new company
// @access  Private/Super Admin
router.post('/', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, phone, address, subscription } = req.body;

    // Check if company exists
    const existingCompany = await Company.findOne({ 
      $or: [{ email }, { taxNumber: req.body.taxNumber }] 
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'الشركة موجودة بالفعل',
        error: 'COMPANY_EXISTS'
      });
    }

    const companyData = {
      name,
      email,
      phone,
      address,
      subscription: subscription || {
        plan: 'starter',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        maxUsers: 50,
        maxDepartments: 10
      },
      createdBy: req.user._id
    };

    const company = await Company.create(companyData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الشركة بنجاح',
      company
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   GET /api/companies
// @desc    Get all companies
// @access  Private/Super Admin
router.get('/', protect, authorize('super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.status) {
      query['subscription.status'] = req.query.status;
    }

    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      count: companies.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      companies
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   GET /api/companies/my
// @desc    Get current user's company
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    if (!req.user.company) {
      return res.status(404).json({
        success: false,
        message: 'لا توجد شركة مرتبطة بالحساب'
      });
    }

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Get my company error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   GET /api/companies/:id
// @desc    Get single company
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    // Check permission
    if (req.user.role !== 'super_admin' && 
        company._id.toString() !== req.user.company?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية عرض هذه الشركة'
      });
    }

    res.status(200).json({
      success: true,
      company
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Private/Admin
router.put('/:id', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    // Check permission
    if (req.user.role !== 'super_admin' && 
        company._id.toString() !== req.user.company?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية تعديل هذه الشركة'
      });
    }

    // Only super admin can update subscription
    if (req.body.subscription && req.user.role !== 'super_admin') {
      delete req.body.subscription;
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'تم تحديث الشركة بنجاح',
      company: updatedCompany
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   DELETE /api/companies/:id
// @desc    Delete company
// @access  Private/Super Admin
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    // Delete all users in the company
    await User.deleteMany({ company: company._id });

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'تم حذف الشركة وجميع بياناتها بنجاح'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   GET /api/companies/stats/dashboard
// @desc    Get company dashboard statistics
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const companyId = req.user.company;

    if (!companyId && req.user.role !== 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'لا توجد شركة مرتبطة'
      });
    }

    const query = req.user.role === 'super_admin' ? {} : { company: companyId };

    // Get counts
    const totalUsers = await User.countDocuments(query);
    const activeUsers = await User.countDocuments({ ...query, isActive: true });
    const inactiveUsers = await User.countDocuments({ ...query, isActive: false });

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: query },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get company info
    let company = null;
    if (companyId) {
      company = await Company.findById(companyId);
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        company: company ? {
          name: company.name,
          plan: company.subscription?.plan,
          maxUsers: company.subscription?.maxUsers,
          usersUsed: totalUsers,
          usersRemaining: (company.subscription?.maxUsers || 0) - totalUsers
        } : null
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

export default router;
