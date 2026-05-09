import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  
  // Subscription (SaaS)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'expired'],
      default: 'trialing',
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEnd: Date,
    canceledAt: Date,
  },
  
  // Features & Limits
  features: {
    maxEmployees: {
      type: Number,
      default: 10,
    },
    maxUsers: {
      type: Number,
      default: 5,
    },
    maxStorage: {
      type: Number, // in MB
      default: 1024,
    },
    customDomain: {
      type: Boolean,
      default: false,
    },
    apiAccess: {
      type: Boolean,
      default: false,
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    advancedReports: {
      type: Boolean,
      default: false,
    },
    integrations: {
      type: Boolean,
      default: false,
    },
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Company email is required'],
    lowercase: true,
    trim: true,
  },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  
  // Settings
  settings: {
    language: {
      type: String,
      default: 'ar',
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh',
    },
    currency: {
      type: String,
      default: 'SAR',
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
    },
    logo: String,
    favicon: String,
    primaryColor: {
      type: String,
      default: '#4F46E5',
    },
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // Audit Trail
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Indexes
companySchema.index({ slug: 1 });
companySchema.index({ 'subscription.status': 1 });

// Generate slug before saving
companySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Methods
companySchema.methods.hasFeature = function(feature) {
  return this.features[feature] || false;
};

companySchema.methods.isSubscriptionActive = function() {
  const activeStatuses = ['active', 'trialing'];
  return activeStatuses.includes(this.subscription.status);
};

companySchema.methods.canAddEmployee = async function() {
  const Employee = mongoose.model('Employee');
  const count = await Employee.countDocuments({ company: this._id });
  return count < this.features.maxEmployees;
};

// Static method to get plan limits
companySchema.statics.getPlanLimits = function(planId) {
  const limits = {
    free: { maxUsers: 5, maxStorage: '1GB', maxProjects: 3 },
    starter: { maxUsers: 20, maxStorage: '10GB', maxProjects: 10 },
    professional: { maxUsers: 100, maxStorage: '50GB', maxProjects: -1 },
    enterprise: { maxUsers: -1, maxStorage: '500GB', maxProjects: -1 }
  };
  return limits[planId] || limits.free;
};

// Instance method to get plan limits
companySchema.methods.getPlanLimits = function() {
  return Company.getPlanLimits(this.subscription.plan);
};

// Get plan features
companySchema.methods.getPlanFeatures = function() {
  const features = {
    free: ['Basic HR Management', 'Task Management', 'Limited Reports'],
    starter: ['All Free Features', 'Advanced Reports', '24/7 Support', 'Daily Backups'],
    professional: ['All Starter Features', 'Full Customization', 'Unlimited API', 'Multi-level Approvals'],
    enterprise: ['All Professional Features', 'Private Server', 'Dedicated Account Manager', 'Custom Integrations']
  };
  return features[this.subscription.plan] || features.free;
};

const Company = mongoose.model('Company', companySchema);

export default Company;
