import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/companies
 * @desc    Get all companies (Super Admin only)
 * @access  Private - Super Admin
 */
router.get('/', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الشركات',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/companies
 * @desc    Create new company
 * @access  Private - Super Admin
 */
router.post('/', auth, requireRole(['super_admin']), async (req, res) => {
  try {
    const { name, slug, subscriptionPlan, settings } = req.body;
    
    // Check if slug already exists
    const existing = await Company.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'معرف الشركة موجود مسبقاً'
      });
    }
    
    const company = new Company({
      name,
      slug,
      subscriptionPlan: subscriptionPlan || 'free',
      settings: settings || {}
    });
    
    await company.save();
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الشركة بنجاح',
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء الشركة',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/companies/:id
 * @desc    Get single company
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    // Check permission
    const user = await User.findById(req.user.userId);
    if (user.role !== 'super_admin' && user.companyId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'لا تملك الصلاحية للوصول إلى هذه الشركة'
      });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب بيانات الشركة',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company
 * @access  Private - Admin+
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, settings, subscriptionPlan } = req.body;
    
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    // Check permission
    const user = await User.findById(req.user.userId);
    if (user.role !== 'super_admin' && user.companyId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'لا تملك الصلاحية لتعديل هذه الشركة'
      });
    }
    
    if (name) company.name = name;
    if (settings) company.settings = { ...company.settings, ...settings };
    if (subscriptionPlan && user.role === 'super_admin') {
      company.subscriptionPlan = subscriptionPlan;
    }
    
    await company.save();
    
    res.json({
      success: true,
      message: 'تم تحديث الشركة بنجاح',
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث الشركة',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/companies/my
 * @desc    Get current user's company
 * @access  Private
 */
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('companyId');
    
    if (!user || !user.companyId) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم تعيين شركة للمستخدم'
      });
    }
    
    res.json({
      success: true,
      data: user.companyId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب بيانات الشركة',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/companies/:id/users
 * @desc    Get all users in a company
 * @access  Private - Admin+
 */
router.get('/:id/users', auth, async (req, res) => {
  try {
    const users = await User.find({ companyId: req.params.id })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب مستخدمي الشركة',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/companies/:id/stats
 * @desc    Get company statistics
 * @access  Private
 */
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    const userCount = await User.countDocuments({ companyId: req.params.id });
    
    res.json({
      success: true,
      data: {
        users: userCount,
        plan: company.subscriptionPlan,
        limits: company.getPlanLimits(),
        usage: {
          users: userCount,
          maxUsers: company.getPlanLimits().maxUsers
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب إحصائيات الشركة',
      error: error.message
    });
  }
});

export default router;
