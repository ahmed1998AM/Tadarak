# 🚀 HR Pro System - Backend

Professional SaaS HR Management System Backend built with Node.js, Express, and MongoDB.

## 📋 Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC) with 7 roles
- Permission-based authorization (34+ permissions)
- Account lockout after failed login attempts
- Session management and expiration
- Password reset functionality
- Multi-tenancy support (company isolation)

### 👥 User Management
- User registration with company creation
- Login/logout with token management
- Profile management
- Password recovery

### 🏢 Company Management (SaaS)
- Multi-tenant architecture
- Subscription plans (Free, Starter, Professional, Enterprise)
- Feature limits per plan
- Trial period support
- Company settings customization

### 👨‍💼 Employee Management
- Full CRUD operations
- Department and position tracking
- Employment status management
- Document attachments
- Emergency contact information
- CSV export functionality
- Search and filtering
- Pagination

### ✅ Task Management
- Task creation and assignment
- Priority and status tracking
- Progress monitoring
- Comments and attachments
- Due date management
- Time tracking

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: express-validator
- **Logging**: Morgan
- **Compression**: compression
- **CORS**: cors

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- MongoDB (local or Atlas)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hr-pro-saas

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000
```

4. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user + company | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/logout` | Logout user | Private |

### Employees
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/employees` | Get all employees | - |
| GET | `/api/employees/:id` | Get single employee | - |
| POST | `/api/employees` | Create employee | `employees.create` |
| PUT | `/api/employees/:id` | Update employee | `employees.update` |
| DELETE | `/api/employees/:id` | Delete employee | `employees.delete` |
| GET | `/api/employees/export` | Export to CSV | `employees.export` |

### Tasks
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/tasks` | Get all tasks | - |
| GET | `/api/tasks/:id` | Get single task | - |
| POST | `/api/tasks` | Create task | `tasks.create` |
| PUT | `/api/tasks/:id` | Update task | `tasks.update` |
| DELETE | `/api/tasks/:id` | Delete task | `tasks.delete` |

## 🔒 RBAC System

### Roles
1. **Super Admin** - All permissions across all companies
2. **Company Admin** - Full access within company
3. **HR Manager** - HR operations
4. **Department Manager** - Department-level access
5. **Team Lead** - Team management
6. **Employee** - Basic access
7. **Viewer** - Read-only access

### Permissions (34+)
- `employees.create`, `employees.update`, `employees.delete`, `employees.export`
- `tasks.create`, `tasks.update`, `tasks.delete`
- `transfers.request`, `transfers.review`
- `custodies.assign`, `custodies.return`
- `finances.request`, `finances.approve`, `finances.collect`
- And more...

## 📝 Usage Examples

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@company.com",
    "password": "admin123",
    "fullName": "Admin User",
    "companyName": "My Company",
    "companyEmail": "info@company.com"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Create Employee (with token)
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@company.com",
    "department": "Engineering",
    "position": "Developer"
  }'
```

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js # Auth logic
│   │   ├── employeeController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── auth.js           # Auth middleware
│   │   └── error.js          # Error handlers
│   ├── models/
│   │   ├── User.js           # User schema
│   │   ├── Company.js        # Company schema
│   │   ├── Employee.js       # Employee schema
│   │   └── Task.js           # Task schema
│   ├── routes/
│   │   ├── index.js          # Main router
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   └── taskRoutes.js
│   └── server.js             # Entry point
├── .env.example
├── package.json
└── README.md
```

## 🧪 Testing

```bash
npm test
```

## 📊 Database Models

### User
- Authentication (username, password)
- Profile (name, email, phone, avatar)
- RBAC (role, permissions)
- Security (login attempts, lock status)
- Multi-tenancy (company reference)

### Company
- Basic info (name, slug, contact)
- Subscription (plan, status, limits)
- Features (max employees, storage, etc.)
- Settings (language, currency, theme)

### Employee
- Personal info (name, email, phone)
- Job details (department, position, salary)
- Status (active, on_leave, terminated)
- Documents and attachments

### Task
- Assignment (assignedTo, assignedBy)
- Details (title, description, priority)
- Tracking (status, progress, dates)
- Comments and attachments

## 🔐 Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT tokens with expiration
- ✅ Rate limiting on auth endpoints
- ✅ Account lockout protection
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection prevention (NoSQL)
- ✅ XSS protection
- ✅ Multi-tenancy isolation

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hr-pro
JWT_SECRET=<strong-random-secret>
ALLOWED_ORIGINS=https://yourdomain.com
```

### Recommended Platforms
- **Hosting**: Heroku, Railway, Render, AWS, DigitalOcean
- **Database**: MongoDB Atlas
- **Environment**: Use platform secrets management

## 📈 Future Enhancements

- [ ] Email notifications (nodemailer)
- [ ] File uploads (multer + cloud storage)
- [ ] Payment integration (Stripe)
- [ ] Advanced reporting
- [ ] Real-time updates (Socket.io)
- [ ] Mobile API optimization
- [ ] GraphQL API
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit and integration tests
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@hrpro.com

---

**Built with ❤️ for HR Pro System**
