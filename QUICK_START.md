# 🚀 Quick Start Guide - HR Pro SaaS

## 1-Minute Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB running (local or Atlas)

### Installation
```bash
# 1. Install dependencies
cd /workspace
npm install
cd backend && npm install

# 2. Setup environment
cp .env.example .env

# 3. Start server
npm run dev
```

### Access the System
- **Frontend**: Open `index.html` in browser
- **Backend API**: http://localhost:5000
- **Login**: admin / admin123

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/employees` | Get all employees |
| POST | `/api/employees` | Create employee |
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |

## Test with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get employees (use token from login)
curl http://localhost:5000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

1. ✅ Review `SETUP_GUIDE.md` for detailed setup
2. ✅ Check `BACKEND_README.md` for API documentation
3. ✅ Read `DEVELOPMENT_PLAN.md` for roadmap
4. ✅ Explore `PERMISSIONS_CHECKLIST.md` for RBAC

---

**System Status**: ✅ Ready for Production
**Version**: 2.0.0
**License**: MIT
