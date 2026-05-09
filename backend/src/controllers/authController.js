import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/error.js';
import User from '../models/User.js';
import Company from '../models/Company.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

// @desc    Register new user and create company
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, companyName, companyEmail } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create company
  const company = await Company.create({
    name: companyName || `${fullName}'s Company`,
    email: companyEmail || email,
    owner: null, // Will be set after user creation
    admins: [],
    subscription: {
      plan: 'free',
      status: 'trialing',
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    },
  });

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    fullName,
    company: company._id,
    role: 'company_admin',
    isVerified: true,
  });

  // Update company owner
  company.owner = user._id;
  company.admins.push(user._id);
  await company.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        company: company.name,
      },
      token,
      refreshToken,
      expiresAt: Date.now() + (parseInt(process.env.JWT_EXPIRE) || 24) * 60 * 60 * 1000,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    res.status(400);
    throw new Error('Please provide username and password');
  }

  // Find user with password field
  const user = await User.findOne({ username }).select('+password').populate('company');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(401);
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Check if account is locked
  if (user.isLocked()) {
    res.status(423);
    throw new Error('Account is temporarily locked due to multiple failed login attempts. Please try again later.');
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    // Increment login attempts
    await user.incLoginAttempts();
    
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions || [],
        company: user.company?.name,
        companyId: user.company?._id,
      },
      token,
      refreshToken,
      expiresAt: Date.now() + (parseInt(process.env.JWT_EXPIRE) || 24) * 60 * 60 * 1000,
    },
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Please provide refresh token');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).populate('company');

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: Date.now() + (parseInt(process.env.JWT_EXPIRE) || 24) * 60 * 60 * 1000,
      },
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('company');

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        department: user.department,
        position: user.position,
        employeeId: user.employeeId,
        role: user.role,
        permissions: user.permissions || [],
        avatar: user.avatar,
        company: user.company,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    },
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // In a real app, you would invalidate the token here
  // For JWT, you might add it to a blacklist or wait for expiration
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('No user found with this email');
  }

  // Generate reset token (implement email sending logic here)
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // TODO: Send email with reset token
  // await sendPasswordResetEmail(user.email, resetToken);

  res.json({
    success: true,
    message: 'Password reset link sent to your email',
    data: { resetToken }, // Remove in production, only for testing
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }
});
