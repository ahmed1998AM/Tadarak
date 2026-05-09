import express from 'express';
import { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../controllers/taskController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.route('/')
  .get(getTasks)
  .post(checkPermission('tasks.create'), createTask);

router.route('/:id')
  .get(getTask)
  .put(checkPermission('tasks.update'), updateTask)
  .delete(checkPermission('tasks.delete'), deleteTask);

export default router;
