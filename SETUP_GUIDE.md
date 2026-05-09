# 🚀 دليل الإعداد والتشغيل - HR Pro SaaS System

## المتطلبات الأساسية

### 1. Node.js
- الإصدار المطلوب: **Node.js 18+**
- التحميل من: https://nodejs.org

### 2. MongoDB
- **الخيار أ**: تثبيت محلي (MongoDB Community Server)
  - التحميل من: https://www.mongodb.com/try/download/community
  
- **الخيار ب**: MongoDB Atlas (سحابي - مجاني)
  - التسجيل في: https://www.mongodb.com/cloud/atlas

### 3. Git (اختياري)
- للتحميل من GitHub

---

## خطوات التثبيت

### الخطوة 1: تحميل المشروع
```bash
cd /workspace
```

### الخطوة 2: تثبيت المكتبات
```bash
# تثبيت مكتبات الجذر
npm install

# تثبيت مكتبات الـ Backend
cd backend
npm install
```

### الخطوة 3: إعداد متغيرات البيئة
```bash
cd backend
cp .env.example .env
```

ثم عدّل ملف `.env` بالبيانات التالية:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB URI
# للمحلي:
MONGODB_URI=mongodb://localhost:27017/hr-pro-saas

# أو لـ MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hr-pro-saas

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400000
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000
```

---

## التشغيل

### وضع التطوير (Development)
```bash
cd /workspace/backend
npm run dev
```

### وضع الإنتاج (Production)
```bash
cd /workspace/backend
npm start
```

### تشغيل Frontend
افتح ملف `index.html` في المتصفح، أو استخدم Live Server في VS Code.

---

## اختبار النظام

### 1. التحقق من صحة الخادم
بعد التشغيل، افتح المتصفح واذهب إلى:
```
http://localhost:5000
```

يجب أن ترى رسالة ترحيبية مع معلومات API.

### 2. تسجيل الدخول
استخدم بيانات الاختبار:
```
Username: admin
Password: admin123
```

### 3. اختبار API endpoints

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "companyName": "Test Company",
    "companyEmail": "company@example.com"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## استكشاف الأخطاء

### مشكلة: MongoDB لا يتصل
```bash
# تأكد من تشغيل MongoDB
# على Linux/Mac:
sudo systemctl status mongod

# على Windows:
net start MongoDB

# أو تحقق من Connection String في .env
```

### مشكلة: Port 5000 مشغول
```bash
# غيّر المنفذ في .env
PORT=5001
```

### مشكلة: npm install يفشل
```bash
# امسح cache وأعد التثبيت
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## البنية التقنية

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- No framework (Vanilla JS)
- Responsive Design
- Dark Mode Support
- RTL (Arabic) Support

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- RBAC Authorization
- Multi-Tenancy Architecture

### الأمان
- Password Hashing (bcrypt)
- JWT Tokens
- Rate Limiting
- CORS Protection
- Helmet Security Headers
- Input Validation

---

## هيكل المشروع

```
/workspace
├── index.html              # الصفحة الرئيسية
├── css/                    # ملفات التنسيق
│   ├── main.css
│   ├── enhanced-ui.css
│   ├── themes.css
│   ├── animations.css
│   └── responsive.css
├── js/                     # ملفات JavaScript
│   ├── app.js
│   ├── auth.js
│   ├── security.js
│   ├── employees.js
│   ├── tasks.js
│   ├── transfers.js
│   ├── custodies.js
│   ├── finances.js
│   ├── reports.js
│   ├── profile.js
│   ├── settings.js
│   ├── dashboard.js
│   ├── lang.js
│   ├── notifications.js
│   └── utils.js
├── backend/                # Backend Server
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── package.json
│   └── .env
└── docs/                   # التوثيق
    ├── README.md
    ├── DEVELOPMENT_PLAN.md
    ├── BACKEND_README.md
    └── ...
```

---

## الدعم والمساعدة

للمزيد من المعلومات، راجع الملفات التالية:
- `README.md` - دليل الاستخدام العام
- `BACKEND_README.md` - دليل الـ Backend
- `DEVELOPMENT_PLAN.md` - خطة التطوير
- `PERMISSIONS_CHECKLIST.md` - قائمة الصلاحيات

---

## الترخيص

MIT License - حر للاستخدام التجاري والشخصي.
