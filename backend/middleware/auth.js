import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك - يرجى تسجيل الدخول',
      error: 'NO_TOKEN'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير نشط',
        error: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(401).json({
        success: false,
        message: 'الحساب مقفل مؤقتاً بسبب محاولات دخول فاشلة متعددة',
        error: 'ACCOUNT_LOCKED'
      });
    }

    // Update last activity
    user.lastActivity = Date.now();
    await user.save();

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'التوكن غير صالح',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية التوكن',
        error: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `ليس لديك الصلاحية للوصول (${req.user.role})`,
        error: 'FORBIDDEN'
      });
    }
    next();
  };
};

// Check specific permission
export const hasPermission = (permission) => {
  return async (req, res, next) => {
    const hasPerm = await User.hasPermission(req.user._id, permission);
    
    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: `ليس لديك صلاحية: ${permission}`,
        error: 'PERMISSION_DENIED'
      });
    }
    next();
  };
};

// Multi-tenancy - ensure user accesses only their company data
export const restrictToCompany = () => {
  return (req, res, next) => {
    // Super admin can access all companies
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Add company filter to query
    req.query.company = req.user.company;
    next();
  };
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Send token response
export const sendTokenResponse = (user, statusCode, res, message = 'تم تسجيل الدخول بنجاح') => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  // Remove password from output
  user.password = undefined;

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        company: user.company,
        department: user.department,
        position: user.position,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
    });
};
