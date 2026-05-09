import { asyncHandler } from '../middleware/error.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';

// @desc    Get all employees for the company
// @route   GET /api/employees
// @access  Private
export const getEmployees = asyncHandler(async (req, res) => {
  const { 
    department, 
    status, 
    search, 
    page = 1, 
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = { company: req.company };

  if (department) query.department = department;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

  // Execute query
  const employees = await Employee.find(query)
    .populate('manager', 'firstName lastName position')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Employee.countDocuments(query);

  res.json({
    success: true,
    data: {
      employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ 
    _id: req.params.id,
    company: req.company 
  }).populate('manager', 'firstName lastName position');

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  res.json({
    success: true,
    data: { employee },
  });
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (requires employees.create permission)
export const createEmployee = asyncHandler(async (req, res) => {
  // Check company subscription limits
  const company = await Company.findById(req.company);
  const employeeCount = await Employee.countDocuments({ company: req.company });
  
  if (employeeCount >= company.features.maxEmployees) {
    res.status(403);
    throw new Error(`Company plan limit reached. Maximum ${company.features.maxEmployees} employees allowed. Please upgrade your plan.`);
  }

  const employee = await Employee.create({
    ...req.body,
    company: req.company,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: { employee },
  });
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (requires employees.update permission)
export const updateEmployee = asyncHandler(async (req, res) => {
  let employee = await Employee.findOne({ 
    _id: req.params.id,
    company: req.company 
  });

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { 
      ...req.body,
      updatedBy: req.user._id,
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Employee updated successfully',
    data: { employee },
  });
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (requires employees.delete permission)
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ 
    _id: req.params.id,
    company: req.company 
  });

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  await employee.deleteOne();

  res.json({
    success: true,
    message: 'Employee deleted successfully',
  });
});

// @desc    Export employees to CSV
// @route   GET /api/employees/export
// @access  Private (requires employees.export permission)
export const exportEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ company: req.company })
    .select('-__v')
    .lean();

  // Simple CSV generation
  const headers = ['Employee ID', 'Full Name', 'Email', 'Phone', 'Department', 'Position', 'Status', 'Hire Date'];
  const csvRows = [headers.join(',')];

  employees.forEach(emp => {
    const row = [
      emp.employeeId,
      `"${emp.fullName}"`,
      emp.email || '',
      emp.phone || '',
      emp.department,
      emp.position || '',
      emp.status,
      new Date(emp.hireDate).toISOString().split('T')[0],
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=employees-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});
