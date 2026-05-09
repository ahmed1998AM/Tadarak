import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  fullName: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phone: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  nationality: String,
  idNumber: String,
  passportNumber: String,
  
  // Multi-tenancy
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  
  // Job Information
  department: {
    type: String,
    required: [true, 'Department is required'],
  },
  position: String,
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  hireDate: {
    type: Date,
    default: Date.now,
  },
  terminationDate: Date,
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern', 'temporary'],
    default: 'full-time',
  },
  status: {
    type: String,
    enum: ['active', 'on_leave', 'suspended', 'terminated', 'resigned'],
    default: 'active',
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  team: String,
  workLocation: String,
  
  // Salary & Benefits
  baseSalary: Number,
  currency: {
    type: String,
    default: 'SAR',
  },
  payFrequency: {
    type: String,
    enum: ['monthly', 'bi-weekly', 'weekly'],
    default: 'monthly',
  },
  bankName: String,
  bankAccountNumber: String,
  iban: String,
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String,
  },
  
  // Documents
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Avatar
  avatar: String,
  
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
employeeSchema.index({ company: 1, department: 1 });
employeeSchema.index({ company: 1, status: 1 });
employeeSchema.index({ employeeId: 1 }, { unique: true, sparse: true });

// Generate full name before saving
employeeSchema.pre('save', function(next) {
  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
  next();
});

// Generate employee ID if not provided
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId && this.isNew) {
    const Employee = mongoose.model('Employee');
    const count = await Employee.countDocuments({ company: this.company });
    this.employeeId = `EMP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
