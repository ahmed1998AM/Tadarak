import { asyncHandler } from '../middleware/error.js';
import Task from '../models/Task.js';

// @desc    Get all tasks for the company
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req, res) => {
  const { 
    status, 
    priority, 
    assignedTo,
    department,
    search, 
    page = 1, 
    limit = 20,
    sortBy = 'dueDate',
    order = 'asc'
  } = req.query;

  // Build query
  const query = { company: req.company };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

  // Execute query
  const tasks = await Task.find(query)
    .populate('assignedTo', 'firstName lastName position')
    .populate('assignedBy', 'fullName role')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(query);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ 
    _id: req.params.id,
    company: req.company 
  })
    .populate('assignedTo', 'firstName lastName email position')
    .populate('assignedBy', 'fullName role');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({
    success: true,
    data: { task },
  });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (requires tasks.create permission)
export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ...req.body,
    company: req.company,
    assignedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (requires tasks.update permission)
export const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findOne({ 
    _id: req.params.id,
    company: req.company 
  });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task = await Task.findByIdAndUpdate(
    req.params.id,
    { 
      ...req.body,
      updatedBy: req.user._id,
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (requires tasks.delete permission)
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ 
    _id: req.params.id,
    company: req.company 
  });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await task.deleteOne();

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
});
