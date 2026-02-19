# Quick Start Guide - Campus Services Management System

This guide will help you get the system up and running in under 10 minutes.

## Prerequisites Checklist

- [ ] PostgreSQL installed and running
- [ ] Node.js (v16+) installed
- [ ] npm installed
- [ ] Code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Database Setup (3 minutes)

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE campus_services_db;"

# Run the schema
psql -U postgres -d campus_services_db -f database/schema.sql

# Verify tables were created
psql -U postgres -d campus_services_db -c "\dt"
```

**Expected Output**: You should see 6 tables listed (users, departments, service_types, requests, feedback, request_logs)

### 2. Backend Setup (3 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies (this might take a minute)
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database password
# Use nano, vim, or any text editor
nano .env

# Start the backend
npm run dev
```

**Expected Output**: 
```
✓ Database connected successfully
✓ Server running on port 5000
```

**Important**: Update these in .env:
```
DB_PASSWORD=your_actual_postgres_password
JWT_SECRET=any_random_string_for_development
```

### 3. Frontend Setup (2 minutes)

```bash
# Open a new terminal
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the frontend
npm start
```

**Expected Output**: Browser opens automatically at `http://localhost:3000`

### 4. First Login (1 minute)

1. Browser should open to login page
2. Use default admin credentials:
   - Email: `admin@campus.edu`
   - Password: `admin123`
3. You should see the dashboard

## Quick Test

### Test as Student

1. **Register a new student account**:
   - Click "Register"
   - Fill in details, select role: "Student"
   - Submit

2. **Submit a request**:
   - Click "New Request"
   - Select "Hostel Management" → "Electricity Issue"
   - Priority: "High"
   - Add description
   - Submit

3. **View your requests**:
   - Click "My Requests"
   - See your submitted request

### Test as Admin

1. **Login as admin** (admin@campus.edu / admin123)

2. **View all requests**:
   - Click "All Requests"
   - See the student's request

3. **Update request status**:
   - Click on the request
   - Update status to "Completed"

4. **View analytics**:
   - Click "Analytics"
   - Explore different charts and metrics

### Test Feedback Loop

1. **Login back as student**
2. Go to "My Requests"
3. Find completed request
4. Click "Give Feedback"
5. Rate and submit

6. **Login as admin**
7. Go to "Analytics"
8. See feedback reflected in metrics

## Common Issues & Fixes

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l | grep campus_services
```

### Issue: Port already in use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Issue: npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Issue: Cannot login
- Check .env file has correct DB_PASSWORD
- Verify JWT_SECRET is set
- Clear browser localStorage: 
  - Open DevTools (F12)
  - Application → Local Storage → Clear

## Directory Structure

```
campus-services-system/
├── database/
│   └── schema.sql          # Database schema with seed data
├── backend/
│   ├── config/
│   │   └── database.js     # DB connection
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & error handling
│   ├── routes/             # API routes
│   ├── .env                # Environment variables (create this)
│   ├── package.json        # Dependencies
│   └── server.js           # Entry point
├── frontend/
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API & auth logic
│   │   ├── styles/         # CSS files
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json        # Dependencies
├── docs/
│   └── PROJECT_DOCUMENTATION.md
└── README.md
```

## Next Steps

1. **Explore the System**:
   - Create multiple users with different roles
   - Submit various types of requests
   - Test the complete workflow

2. **Customize**:
   - Add your college name in Navbar
   - Modify department names in schema.sql
   - Add your team members' info

3. **Learn the Database**:
   - Connect to PostgreSQL: `psql -U postgres -d campus_services_db`
   - Query tables: `SELECT * FROM requests;`
   - Test stored procedures: `SELECT * FROM get_department_workload();`
   - View triggers: `\dft`

4. **Prepare for Demo**:
   - Practice the complete workflow
   - Prepare to explain database design
   - Understand triggers and procedures
   - Review analytics features

## Support

If you encounter issues:

1. Check the main README.md for detailed documentation
2. Review docs/PROJECT_DOCUMENTATION.md for technical details
3. Verify all prerequisites are met
4. Ensure .env file is configured correctly

## Success Criteria

You're ready when:
- [ ] All three components (DB, Backend, Frontend) are running
- [ ] You can login as admin
- [ ] You can create and view requests
- [ ] Analytics dashboard displays data
- [ ] You understand the database schema

---

**Estimated Total Time**: 10-15 minutes

**Pro Tip**: Keep PostgreSQL and both terminal windows (backend + frontend) open in tabs for easy monitoring during development and demos.
