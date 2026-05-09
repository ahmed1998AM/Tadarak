import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  // Company Information
  name: {
    type: String,
    required: [true, 'اسم الشركة مطلوب'],
    trim: true,
    maxlength: [100, 'يجب ألا يتجاوز اسم الشركة 100 حرف']
  },
  legalName: {
    type: String,
    trim: true,
    maxlength: [150, 'يجب ألا يتجاوز الاسم القانوني 150 حرف']
  },
  taxNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  commercialRegistration: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'بريد الشركة مطلوب'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'السعودية'
    },
    postalCode: String
  },
  website: {
    type: String,
    trim: true
  },
  
  // Subscription (SaaS)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    maxUsers: {
      type: Number,
      default: 10
    },
    maxDepartments: {
      type: Number,
      default: 5
    },
    features: [{
      type: String,
      enum: ['advanced_reports', 'api_access', 'custom_roles', 'priority_support', 'white_label', 'sso']
    }],
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Settings
  settings: {
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh'
    },
    currency: {
      type: String,
      default: 'SAR'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    workingDays: {
      type: [String],
      default: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    }
  },
  
  // Branding
  branding: {
    logo: String,
    primaryColor: {
      type: String,
      default: '#4F46E5'
    },
    secondaryColor: String,
    favicon: String
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
companySchema.index({ email: 1 });
companySchema.index({ taxNumber: 1 });
companySchema.index({ 'subscription.status': 1 });
companySchema.index({ createdAt: -1 });

// Virtual for user count
companySchema.virtual('userCount').get(function() {
  return this.users ? this.users.length : 0;
});

// Pre-save middleware
companySchema.pre('save', function(next) {
  // Auto-set legal name if not provided
  if (!this.legalName && this.name) {
    this.legalName = this.name;
  }
  next();
});

const Company = mongoose.model('Company', companySchema);

export default Company;
