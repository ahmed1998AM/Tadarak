import express from 'express';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { protect, sendTokenResponse, authorize } from '../middleware/auth.js';
import { loginValidation, registerValidation, updateUserValidation } from '../middleware/validation.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(401).json({
        success: false,
        message: `الحساب مقفل مؤقتاً. حاول مرة أخرى بعد ${lockTime} دقيقة`,
        error: 'ACCOUNT_LOCKED'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res, 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public (or Company Admin)
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { username, email, fullName, password, role, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم موجود بالفعل',
        error: 'USER_EXISTS'
      });
    }

    // Create user
    const userData = {
      username,
      email,
      fullName,
      password,
      role: role || 'employee'
    };

    if (company) {
      userData.company = company;
    }

    const user = await User.create(userData);

    // Send token response
    sendTokenResponse(user, 201, res, 'تم إنشاء الحساب بنجاح');
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('company', 'name logo')
      .populate('manager', 'fullName email');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/updateprofile
// @desc    Update user profile
// @access  Private
router.put('/updateprofile', protect, async (req, res) => {
  try {
    const fieldsToUpdate = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      department: req.body.department,
      position: req.body.position
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/updatepassword
// @desc    Update password
// @access  Private
router.put('/updatepassword', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال كلمة المرور الحالية والجديدة'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
  res.clearCookie('token');
  
  res.status(200).json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/users', protect, authorize('super_admin', 'company_admin', 'hr_manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    // Filter by company (unless super admin)
    if (req.user.role !== 'super_admin') {
      query.company = req.user.company;
    }

    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { fullName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(query)
      .populate('company', 'name')
      .populate('manager', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   GET /api/auth/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/users/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('company', 'name')
      .populate('manager', 'fullName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Check permission (unless super admin or own profile)
    if (req.user.role !== 'super_admin' && 
        user._id.toString() !== req.user._id.toString() &&
        user.company.toString() !== req.user.company?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية عرض هذا المستخدم'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', protect, authorize('super_admin', 'company_admin', 'hr_manager'), updateUserValidation, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Prevent updating super admin unless you're super admin
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية تعديل مدير النظام'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('company', 'name');

    res.status(200).json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('super_admin', 'company_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Prevent deleting super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حذف مدير النظام'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك الخاص'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
});

export default router;
