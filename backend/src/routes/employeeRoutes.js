import express from 'express';
import { 
  getEmployees, 
  getEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  exportEmployees 
} from '../controllers/employeeController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.route('/')
  .get(getEmployees)
  .post(checkPermission('employees.create'), createEmployee);

router.get('/export', checkPermission('employees.export'), exportEmployees);

router.route('/:id')
  .get(getEmployee)
  .put(checkPermission('employees.update'), updateEmployee)
  .delete(checkPermission('employees.delete'), deleteEmployee);

export default router;
