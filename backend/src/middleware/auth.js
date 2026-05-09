import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'Account is deactivated' 
        });
      }

      // Check if user is locked
      if (req.user.isLocked()) {
        return res.status(423).json({ 
          success: false, 
          message: 'Account is temporarily locked due to multiple failed login attempts' 
        });
      }

      // Check session expiration
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ 
          success: false, 
          message: 'Session expired. Please login again' 
        });
      }

      // Multi-tenancy: Attach company to request
      if (req.user.company) {
        req.company = req.user.company;
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired' 
        });
      }

      return res.status(500).json({ 
        success: false, 
        message: 'Server error during authentication' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token provided' 
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check specific permissions
export const checkPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const superAdmin = req.user.role === 'super_admin';
    
    // Super admin has all permissions
    if (superAdmin) {
      return next();
    }

    // Company admin has most permissions
    if (req.user.role === 'company_admin') {
      return next();
    }

    // Check if user has the required permission
    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User does not have permission: ${permission}`,
    });
  };
};

// Multi-tenancy: Ensure user can only access their company's data
export const restrictToCompany = (model) => {
  return async (req, res, next) => {
    if (req.user.role === 'super_admin') {
      return next();
    }

    const Model = mongoose.model(model);
    
    // If creating new document, add company ID
    if (req.method === 'POST' && !req.body.company) {
      req.body.company = req.company;
    }

    // For GET, PUT, DELETE - filter by company
    if (['GET', 'PUT', 'DELETE'].includes(req.method)) {
      if (req.params.id) {
        const doc = await Model.findById(req.params.id);
        if (doc && doc.company.toString() !== req.company.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access this resource',
          });
        }
      } else if (req.method === 'GET') {
        req.query.company = req.company;
      }
    }

    next();
  };
};
