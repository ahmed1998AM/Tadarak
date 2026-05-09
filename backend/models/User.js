import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Personal Information
  username: {
    type: String,
    required: [true, 'اسم المستخدم مطلوب'],
    unique: true,
    trim: true,
    minlength: [3, 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل'],
    maxlength: [50, 'يجب ألا يتجاوز اسم المستخدم 50 حرف']
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'يرجى إدخال بريد إلكتروني صحيح']
  },
  fullName: {
    type: String,
    required: [true, 'الاسم الكامل مطلوب'],
    trim: true,
    maxlength: [100, 'يجب ألا يتجاوز الاسم الكامل 100 حرف']
  },
  
  // Security
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'],
    select: false // Don't return password by default
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Role & Permissions (RBAC)
  role: {
    type: String,
    enum: ['super_admin', 'company_admin', 'hr_manager', 'department_manager', 'team_lead', 'employee', 'viewer'],
    default: 'employee'
  },
  permissions: [{
    type: String,
    enum: [
      // Employees
      'employees.create', 'employees.update', 'employees.delete', 'employees.export',
      'employees.view_all', 'employees.view_own',
      
      // Tasks
      'tasks.create', 'tasks.update', 'tasks.delete',
      'tasks.view_all', 'tasks.view_own', 'tasks.assign',
      
      // Transfers
      'transfers.request', 'transfers.review', 'transfers.approve', 'transfers.delete',
      
      // Custodies
      'custodies.assign', 'custodies.return', 'custodies.delete',
      
      // Finances
      'finances.request', 'finances.approve', 'finances.collect', 'finances.delete',
      
      // Reports
      'reports.employees', 'reports.tasks', 'reports.finances', 'reports.attendance',
      
      // Settings
      'settings.manage', 'users.manage', 'roles.manage'
    ]
  }],
  
  // Company/Tenant (for SaaS multi-tenancy)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Security Tracking
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  lastActivity: Date,
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ company: 1, role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  this.loginAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts >= 5 && !this.lockUntil) {
    this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  }
  
  return this.save();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

// Static method to find user with role permissions
userSchema.statics.hasPermission = async function(userId, permission) {
  const user = await this.findById(userId);
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true;
  
  // Check if user has the specific permission
  return user.permissions && user.permissions.includes(permission);
};

const User = mongoose.model('User', userSchema);

export default User;
