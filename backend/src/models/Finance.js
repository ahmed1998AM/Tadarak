const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Please provide employee']
  },
  type: {
    type: String,
    enum: ['loan', 'salary_advance', 'bonus', 'deduction', 'reimbursement', 'other'],
    required: [true, 'Please provide finance type']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide amount'],
    min: [0, 'Amount cannot be negative']
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    trim: true,
    required: [true, 'Please provide reason']
  },
  notes: {
    type: String
  },
  category: {
    type: String,
    trim: true
  },
  installments: {
    type: Number,
    min: 1,
    default: 1
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedAt: {
    type: Date
  },
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook to set remaining amount on creation
financeSchema.pre('save', function(next) {
  if (this.isNew && this.remainingAmount === 0) {
    this.remainingAmount = this.amount;
  }
  next();
});

// Indexes for faster queries
financeSchema.index({ company: 1, employee: 1 });
financeSchema.index({ company: 1, status: 1 });
financeSchema.index({ company: 1, type: 1 });
financeSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Finance', financeSchema);
