import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  
  // Multi-tenancy
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  
  // Assignment
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  }],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Task Details
  department: String,
  project: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'pending',
  },
  category: String,
  tags: [String],
  
  // Time Tracking
  startDate: Date,
  dueDate: Date,
  completedDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  
  // Progress
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  
  // Comments & Attachments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  attachments: [{
    name: String,
    url: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
taskSchema.index({ company: 1, status: 1 });
taskSchema.index({ company: 1, assignedTo: 1 });
taskSchema.index({ company: 1, dueDate: 1 });

// Update progress when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
    this.progress = 100;
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
