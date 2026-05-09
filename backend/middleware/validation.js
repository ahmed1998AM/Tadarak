import { body, param, query, validationResult } from 'express-validator';

// Validation error handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'خطأ في التحقق من البيانات',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Login validation
export const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('اسم المستخدم مطلوب')
    .isLength({ min: 3 }).withMessage('يجب أن يكون اسم المستخدم 3 أحرف على الأقل'),
  
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
  
  validate
];

// Register validation
export const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('اسم المستخدم مطلوب')
    .isLength({ min: 3, max: 50 }).withMessage('يجب أن يكون اسم المستخدم بين 3 و 50 حرف')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('يجب أن يحتوي اسم المستخدم على أحرف وأرقام فقط'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('يرجى إدخال بريد إلكتروني صحيح')
    .normalizeEmail(),
  
  body('fullName')
    .trim()
    .notEmpty().withMessage('الاسم الكامل مطلوب')
    .isLength({ max: 100 }).withMessage('يجب ألا يتجاوز الاسم الكامل 100 حرف'),
  
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل'),
  
  body('role')
    .optional()
    .isIn(['company_admin', 'hr_manager', 'department_manager', 'team_lead', 'employee', 'viewer'])
    .withMessage('الدور غير صالح'),
  
  validate
];

// User update validation
export const updateUserValidation = [
  param('id')
    .isMongoId().withMessage('معرف المستخدم غير صالح'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('يرجى إدخال بريد إلكتروني صحيح')
    .normalizeEmail(),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('يجب ألا يتجاوز الاسم الكامل 100 حرف'),
  
  body('department')
    .optional()
    .trim(),
  
  body('position')
    .optional()
    .trim(),
  
  body('role')
    .optional()
    .isIn(['super_admin', 'company_admin', 'hr_manager', 'department_manager', 'team_lead', 'employee', 'viewer'])
    .withMessage('الدور غير صالح'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('يجب أن تكون حالة النشاط قيمة منطقية'),
  
  validate
];

// Employee validation
export const createEmployeeValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('الاسم الكامل مطلوب')
    .isLength({ max: 100 }).withMessage('يجب ألا يتجاوز الاسم الكامل 100 حرف'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('يرجى إدخال بريد إلكتروني صحيح')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('رقم الهاتف غير صالح'),
  
  body('department')
    .trim()
    .notEmpty().withMessage('القسم مطلوب'),
  
  body('position')
    .trim()
    .notEmpty().withMessage('المسمى الوظيفي مطلوب'),
  
  body('hireDate')
    .optional()
    .isISO8601().withMessage('تاريخ التعيين غير صالح'),
  
  body('salary')
    .optional()
    .isFloat({ min: 0 }).withMessage('الراتب يجب أن يكون رقماً موجباً'),
  
  validate
];

// Task validation
export const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('عنوان المهمة مطلوب')
    .isLength({ max: 200 }).withMessage('يجب ألا يتجاوز عنوان المهمة 200 حرف'),
  
  body('description')
    .optional()
    .trim(),
  
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('معرف الموظف غير صالح'),
  
  body('dueDate')
    .optional()
    .isISO8601().withMessage('تاريخ الاستحقاق غير صالح'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('الأولوية غير صالحة'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('الحالة غير صالحة'),
  
  validate
];

// Generic ID validation
export const idValidation = [
  param('id')
    .isMongoId().withMessage('المعرف غير صالح'),
  
  validate
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('يجب أن يكون رقم الصفحة رقماً صحيحاً موجباً'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('يجب أن يكون الحد بين 1 و 100'),
  
  validate
];
