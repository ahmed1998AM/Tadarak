import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all subscription plans
 * @access  Public
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'مجاني',
        nameEn: 'Free',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          'حتى 5 موظفين',
          'إدارة المهام الأساسية',
          'تقارير محدودة',
          'دعم عبر البريد الإلكتروني'
        ],
        limits: {
          maxUsers: 5,
          maxStorage: '1GB',
          maxProjects: 3,
          apiCallsPerMonth: 1000
        },
        popular: false
      },
      {
        id: 'starter',
        name: 'مبتدئ',
        nameEn: 'Starter',
        price: 29,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          'حتى 20 موظف',
          'جميع وحدات النظام',
          'تقارير متقدمة',
          'دعم فني 24/7',
          'نسخ احتياطي يومي',
          'تكامل مع Google Calendar'
        ],
        limits: {
          maxUsers: 20,
          maxStorage: '10GB',
          maxProjects: 10,
          apiCallsPerMonth: 10000
        },
        popular: true
      },
      {
        id: 'professional',
        name: 'احترافي',
        nameEn: 'Professional',
        price: 79,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          'حتى 100 موظف',
          'جميع ميزات Starter',
          'تخصيص كامل للنظام',
          'API غير محدود',
          'مدراء أقسام متعددين',
          'موافقات متعددة المستويات',
          'تكامل مع أنظمة المحاسبة'
        ],
        limits: {
          maxUsers: 100,
          maxStorage: '50GB',
          maxProjects: -1,
          apiCallsPerMonth: 100000
        },
        popular: false
      },
      {
        id: 'enterprise',
        name: 'مؤسسات',
        nameEn: 'Enterprise',
        price: 199,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          'عدد غير محدود من الموظفين',
          'جميع ميزات Professional',
          'خادم خاص',
          'مدير حساب مخصص',
          'تدريب مخصص',
          'SLA 99.9%',
          'تكامل مخصص'
        ],
        limits: {
          maxUsers: -1,
          maxStorage: '500GB',
          maxProjects: -1,
          apiCallsPerMonth: -1
        },
        popular: false
      }
    ];
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب خطط الاشتراك',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current company subscription
 * @access  Private
 */
router.get('/current', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const company = await Company.findById(user.companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    const planLimits = company.getPlanLimits();
    const userCount = await User.countDocuments({ companyId: company._id });
    
    res.json({
      success: true,
      data: {
        plan: company.subscriptionPlan,
        status: company.subscriptionStatus,
        startDate: company.subscriptionStartDate,
        endDate: company.subscriptionEndDate,
        usage: {
          users: userCount,
          maxUsers: planLimits.maxUsers,
          storage: company.storageUsed || 0,
          maxStorage: planLimits.maxStorage
        },
        features: company.getPlanFeatures(),
        canUpgrade: true,
        canDowngrade: company.subscriptionPlan !== 'free'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب بيانات الاشتراك',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/subscriptions/upgrade
 * @desc    Upgrade subscription plan
 * @access  Private - Admin+
 */
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    
    const validPlans = ['free', 'starter', 'professional', 'enterprise'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({
        success: false,
        message: 'خطة اشتراك غير صالحة'
      });
    }
    
    const user = await User.findById(req.user.userId);
    const company = await Company.findById(user.companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    // Check if downgrading
    const planOrder = { free: 0, starter: 1, professional: 2, enterprise: 3 };
    const isDowngrade = planOrder[planId] < planOrder[company.subscriptionPlan];
    
    if (isDowngrade) {
      // Check current usage vs new plan limits
      const newLimits = Company.getPlanLimits(planId);
      const userCount = await User.countDocuments({ companyId: company._id });
      
      if (newLimits.maxUsers !== -1 && userCount > newLimits.maxUsers) {
        return res.status(400).json({
          success: false,
          message: `لا يمكن الترقية للخطة المختارة. الحد الأقصى للموظفين في هذه الخطة هو ${newLimits.maxUsers}`
        });
      }
    }
    
    // Update company subscription
    company.subscriptionPlan = planId;
    company.subscriptionStatus = 'active';
    company.subscriptionStartDate = new Date();
    
    // Set end date based on billing period
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    company.subscriptionEndDate = endDate;
    
    await company.save();
    
    res.json({
      success: true,
      message: 'تم تغيير خطة الاشتراك بنجاح',
      data: {
        plan: company.subscriptionPlan,
        status: company.subscriptionStatus,
        endDate: company.subscriptionEndDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في تغيير خطة الاشتراك',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription
 * @access  Private - Admin+
 */
router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const company = await Company.findById(user.companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    company.subscriptionStatus = 'cancelled';
    company.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period
    
    await company.save();
    
    res.json({
      success: true,
      message: 'تم إلغاء الاشتراك بنجاح. ستستمر الخدمة حتى تاريخ الانتهاء.',
      data: {
        status: company.subscriptionStatus,
        endDate: company.subscriptionEndDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في إلغاء الاشتراك',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/subscriptions/invoices
 * @desc    Get subscription invoices
 * @access  Private
 */
router.get('/invoices', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const company = await Company.findById(user.companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    // Mock invoices - in production, fetch from payment provider
    const invoices = company.invoices || [];
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الفواتير',
      error: error.message
    });
  }
});

export default router;
