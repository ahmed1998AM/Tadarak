import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete', 'view',
      'login', 'logout', 'approve', 'reject',
      'export', 'import', 'assign', 'transfer'
    ]
  },
  module: {
    type: String,
    required: true,
    enum: [
      'auth', 'employees', 'tasks', 'transfers',
      'custodies', 'finances', 'reports', 'settings',
      'companies', 'subscriptions'
    ]
  },
  description: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  changes: {
    before: Object,
    after: Object
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ entityId: 1 });

// Static method to create log
auditLogSchema.statics.createLog = async function(data) {
  return await this.create(data);
};

// Static method to get logs with pagination
auditLogSchema.statics.getLogs = async function(filters, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = options;
  
  const query = {};
  
  if (filters.company) query.company = filters.company;
  if (filters.user) query.user = filters.user;
  if (filters.module) query.module = filters.module;
  if (filters.action) query.action = filters.action;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const logs = await this.find(query)
    .populate('user', 'name username email role')
    .populate('company', 'name code')
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  const total = await this.countDocuments(query);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get activity summary
auditLogSchema.statics.getActivitySummary = async function(companyId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const summary = await this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return summary;
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
