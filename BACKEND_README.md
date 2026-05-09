# 🚀 HR Pro SaaS - دليل التشغيل السريع

## المتطلبات الأساسية

- **Node.js** v18+ 
- **MongoDB** v6+ (محلي أو MongoDB Atlas)
- **npm** v9+

## التثبيت السريع

### 1. تثبيت المكتبات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
```bash
# انسخ ملف المثال
cp .env.example .env

# عدل الملف .env بالبيانات المناسبة لك
```

### 3. تشغيل MongoDB (إذا كان محلياً)
```bash
# على Linux/Mac
sudo systemctl start mongod

# على Windows
net start MongoDB
```

### 4. تشغيل الخادم
```bash
# وضع التطوير (مع إعادة التشغيل التلقائي)
npm run dev

# وضع الإنتاج
npm start
```

الخادم سيعمل على: `http://localhost:5000`

---

## اختبار API

### التحقق من صحة الخادم
```bash
curl http://localhost:5000/api/health
```

### تسجيل مستخدم جديد
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@hrpro.com",
    "fullName": "مدير النظام",
    "password": "admin123",
    "role": "company_admin"
  }'
```

### تسجيل الدخول
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## هيكل المشروع

```
/workspace
├── backend/
│   ├── config/
│   │   └── database.js          # اتصال MongoDB
│   ├── models/
│   │   ├── User.js              # نموذج المستخدم
│   │   └── Company.js           # نموذج الشركة
│   ├── routes/
│   │   ├── auth.js              # مسارات المصادقة
│   │   └── companies.js         # مسارات الشركات
│   ├── middleware/
│   │   ├── auth.js              # middleware الأمان
│   │   └── validation.js        # التحقق من البيانات
│   └── server.js                # نقطة الدخول الرئيسية
├── js/                          # كود الواجهة الأمامية
├── css/                         # ملفات التنسيق
├── .env                         # متغيرات البيئة
├── .env.example                 # مثال لمتغيرات البيئة
└── package.json
```

---

## نقاط النهاية المتاحة (API Endpoints)

### المصادقة (Auth)
| الطريقة | المسار | الوصف | الصلاحية |
|---------|--------|-------|----------|
| POST | `/api/auth/register` | تسجيل مستخدم جديد | عام |
| POST | `/api/auth/login` | تسجيل الدخول | عام |
| GET | `/api/auth/me` | الحصول على بيانات المستخدم الحالي | خاص |
| PUT | `/api/auth/updateprofile` | تحديث الملف الشخصي | خاص |
| PUT | `/api/auth/updatepassword` | تغيير كلمة المرور | خاص |
| POST | `/api/auth/logout` | تسجيل الخروج | خاص |
| GET | `/api/auth/users` | قائمة المستخدمين | Admin |
| GET | `/api/auth/users/:id` | عرض مستخدم | Admin |
| PUT | `/api/auth/users/:id` | تعديل مستخدم | Admin |
| DELETE | `/api/auth/users/:id` | حذف مستخدم | Admin |

### الشركات (Companies)
| الطريقة | المسار | الوصف | الصلاحية |
|---------|--------|-------|----------|
| POST | `/api/companies` | إنشاء شركة | Super Admin |
| GET | `/api/companies` | قائمة الشركات | Super Admin |
| GET | `/api/companies/my` | شركتي الحالية | خاص |
| GET | `/api/companies/:id` | عرض شركة | خاص |
| PUT | `/api/companies/:id` | تحديث شركة | Admin |
| DELETE | `/api/companies/:id` | حذف شركة | Super Admin |
| GET | `/api/companies/stats/dashboard` | إحصائيات لوحة التحكم | خاص |

---

## الأدوار والصلاحيات (RBAC)

### الأدوار المتاحة:
1. **Super Admin** - مدير النظام العالمي (جميع الصلاحيات)
2. **Company Admin** - مدير الشركة (إدارة كاملة للشركة)
3. **HR Manager** - مدير الموارد البشرية
4. **Department Manager** - مدير القسم
5. **Team Lead** - قائد الفريق
6. **Employee** - موظف عادي
7. **Viewer** - مشاهد فقط

### الصلاحيات:
- `employees.*` - إدارة الموظفين
- `tasks.*` - إدارة المهام
- `transfers.*` - طلبات النقل
- `custodies.*` - العهد والأمانات
- `finances.*` - الشؤون المالية
- `reports.*` - التقارير
- `settings.*` - الإعدادات

---

## الأمان

### الميزات الأمنية المطبقة:
- ✅ تشفير كلمات المرور (bcrypt)
- ✅ JWT Authentication
- ✅ Session expiration (24 ساعة)
- ✅ Account lockout بعد 5 محاولات فاشلة
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Multi-tenancy isolation

---

## تطوير الواجهة الأمامية

لربط الواجهة الأمامية بالخادم الجديد:

1. **تحديث auth.js**:
```javascript
const API_URL = 'http://localhost:5000/api';

// استبدال localStorage بـ API calls
await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
```

2. **تخزين Token**:
```javascript
localStorage.setItem('token', response.token);
// أو استخدام cookies
```

3. **إرسال Token مع الطلبات**:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## النشر (Deployment)

### خيارات النشر:

#### 1. Heroku
```bash
heroku create hr-pro-saas
heroku addons:create mongolab:sandbox
git push heroku main
```

#### 2. Vercel + MongoDB Atlas
- رفع Backend على Vercel
- قاعدة البيانات على MongoDB Atlas

#### 3. DigitalOcean / AWS
- Docker container
- EC2 instance

---

## الدعم والمساعدة

لأي مشاكل أو استفسارات:
- 📧 البريد: support@hrpro.sa
- 📚 التوثيق الكامل: `/docs`
- 🐛 الإبلاغ عن مشكلة: GitHub Issues

---

**تم التطوير بواسطة فريق HR Pro © 2024**
