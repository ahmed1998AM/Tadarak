const mongoose = require('mongoose');

const custodySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Please provide employee']
  },
  item: {
    type: String,
    required: [true, 'Please provide item name'],
    trim: true
  },
  category: {
    type: String,
    enum: ['laptop', 'phone', 'tablet', 'accessories', 'tools', 'vehicle', 'keys', 'documents', 'other'],
    required: [true, 'Please provide category']
  },
  serialNumber: {
    type: String,
    trim: true
  },
  value: {
    type: Number,
    min: 0,
    default: 0
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  notes: {
    type: String
  },
  expectedReturnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'lost', 'damaged'],
    default: 'active'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  returnedAt: {
    type: Date
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
  },
  returnNotes: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
custodySchema.index({ company: 1, employee: 1 });
custodySchema.index({ company: 1, status: 1 });
custodySchema.index({ company: 1, category: 1 });

module.exports = mongoose.model('Custody', custodySchema);
