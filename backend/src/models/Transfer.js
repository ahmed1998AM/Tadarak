const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Please provide employee']
  },
  type: {
    type: String,
    enum: ['promotion', 'demotion', 'department_change', 'location_change', 'role_change', 'other'],
    required: [true, 'Please provide transfer type']
  },
  fromDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  toDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  fromPosition: {
    type: String
  },
  toPosition: {
    type: String
  },
  fromLocation: {
    type: String
  },
  toLocation: {
    type: String
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Please provide effective date']
  },
  reason: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  newSalary: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
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

// Index for faster queries
transferSchema.index({ company: 1, employee: 1 });
transferSchema.index({ company: 1, status: 1 });
transferSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Transfer', transferSchema);
