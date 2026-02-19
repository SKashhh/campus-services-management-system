# Campus Services Management System

A comprehensive DBMS project for managing campus service requests with priority-aware handling, service transparency, feedback loops, and analytics.

## 🎯 Project Overview

This system centralizes student service requests (hostel, library, lab, maintenance, sports) into a single, transparent, and priority-aware platform. It enables students to submit requests, tracks service performance, and provides data-driven insights for administrators.

### Key Features

1. **Priority-Aware Request Handling** - Automatic sorting of requests by urgency
2. **Service Transparency** - Real-time tracking of resolution times and workload
3. **Closed Feedback Loop** - Student feedback drives continuous improvement
4. **Analytics Dashboard** - Database-driven insights without ML
5. **Role-Based Access Control** - Different permissions for students, staff, and admins

## 🏗️ System Architecture

### Technology Stack

- **Database**: PostgreSQL (Primary - Business logic resides here)
- **Backend**: Node.js + Express (Thin API layer)
- **Frontend**: React (Minimal UI for interaction)

### Database-Centric Design

The PostgreSQL database is the **single source of truth** and contains:
- Comprehensive schema with constraints
- Triggers for automatic calculations
- Stored procedures for analytics
- Views and materialized views for performance
- Activity logging and audit trails

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v13 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### Step 1: Database Setup

1. **Create PostgreSQL Database**

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE campus_services_db;

# Exit psql
\q
```

2. **Run Database Schema**

```bash
# Navigate to database directory
cd database

# Execute schema file
psql -U postgres -d campus_services_db -f schema.sql
```

This will create all tables, triggers, stored procedures, views, and seed data.

### Step 2: Backend Setup

1. **Navigate to backend directory**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your database credentials
```

Update the `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_services_db
DB_USER=postgres
DB_PASSWORD=your_password

PORT=5000
JWT_SECRET=your_secret_key_here

CLIENT_URL=http://localhost:3000
```

4. **Start backend server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

### Step 3: Frontend Setup

1. **Navigate to frontend directory**

```bash
cd frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Start frontend application**

```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 👤 Default Admin Credentials

After running the schema, a default admin account is created:

- **Email**: admin@campus.edu
- **Password**: admin123

⚠️ **Important**: Change these credentials after first login!

## 🔑 User Roles & Permissions

### Student
- Submit service requests
- Track own request status
- Provide feedback on completed requests
- View own request history

### Staff
- View all service requests
- Update request status
- Assign requests
- View analytics dashboard

### Admin
- All staff permissions
- User management
- Department management
- Advanced analytics
- System configuration

## 📊 Database Features

### Tables
- `users` - User accounts and authentication
- `departments` - Service departments
- `service_types` - Types of services offered
- `requests` - Service request records
- `feedback` - User feedback on completed requests
- `request_logs` - Activity and audit trail

### Triggers
1. **update_resolution_time** - Auto-calculates resolution time when request completed
2. **log_status_change** - Logs all status changes for audit trail
3. **validate_feedback_timing** - Ensures feedback only on completed requests

### Stored Procedures
1. **get_department_workload()** - Department workload analysis
2. **get_service_performance()** - Service performance metrics
3. **get_priority_distribution()** - Priority distribution analysis
4. **get_feedback_ratings()** - Feedback-based ratings
5. **refresh_monthly_analytics()** - Refresh materialized view

### Views
- **priority_summary** - Quick priority-based statistics
- **monthly_analytics** - Pre-computed monthly analytics (materialized)

## 📈 Analytics Features

The system provides several analytics views:

1. **Department Workload** - Pending requests, average resolution time, workload percentage
2. **Service Performance** - Completion rates, ratings, performance scores
3. **Priority Distribution** - Distribution of high/medium/low priority requests
4. **Feedback Ratings** - Satisfaction rates and rating distribution
5. **SLA Compliance** - Service Level Agreement compliance tracking
6. **User Activity** - Request patterns and user engagement

## 🔄 Typical Workflow

1. **Student submits request**
   - Selects department and service type
   - Provides description
   - Assigns priority (low/medium/high)

2. **Request enters system**
   - Status: Pending
   - Logged in database
   - Visible to staff

3. **Staff processes request**
   - Reviews details
   - Updates status (Approved → In Progress → Completed/Rejected)
   - Can add remarks

4. **Student receives notification**
   - Can track status in real-time
   - Views resolution timeline

5. **Request completed**
   - Student provides feedback (rating + comment)
   - Data feeds into analytics
   - System calculates resolution metrics

## 🧪 Testing the System

### Test Scenario 1: Submit a Request

1. Register as a student
2. Navigate to "New Request"
3. Select "Hostel Management" → "Electricity Issue"
4. Set priority to "High"
5. Submit request
6. View in "My Requests"

### Test Scenario 2: Process Request (Admin)

1. Login as admin
2. Go to "All Requests"
3. Click on a pending request
4. Update status to "In Progress"
5. Update status to "Completed"
6. View activity log

### Test Scenario 3: View Analytics

1. Login as admin/staff
2. Navigate to "Analytics"
3. Explore:
   - Department workload charts
   - Service performance metrics
   - Priority distribution
   - Feedback ratings

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Requests
- `POST /api/requests` - Create new request
- `GET /api/requests` - Get all requests (admin/staff)
- `GET /api/requests/my-requests` - Get user's requests
- `GET /api/requests/:id` - Get request details
- `PATCH /api/requests/:id/status` - Update request status
- `DELETE /api/requests/:id` - Delete request

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback (admin/staff)
- `GET /api/feedback/request/:requestId` - Get feedback for request

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/department-workload` - Department workload
- `GET /api/analytics/service-performance` - Service performance
- `GET /api/analytics/priority-distribution` - Priority distribution
- `GET /api/analytics/feedback-ratings` - Feedback ratings
- `GET /api/analytics/sla-compliance` - SLA compliance

### Services & Departments
- `GET /api/departments` - Get all departments
- `GET /api/services` - Get all services
- `POST /api/services` - Create service (admin)
- `POST /api/departments` - Create department (admin)

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l | grep campus_services
```

### Port Already in Use

```bash
# Backend (5000)
lsof -ti:5000 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

### Cannot Login

- Verify database has seed data
- Check JWT_SECRET in .env
- Clear browser localStorage
- Verify password hash in database

## 🎓 Project Justification (For Academic Defense)

### Why This Project is Unique

1. **Database-Centric Architecture**: Business logic in PostgreSQL, not application code
2. **Priority-Based Fairness**: Automatic handling based on urgency
3. **Transparency Metrics**: Students see average resolution times
4. **Closed Feedback Loop**: System improves based on user feedback
5. **Analytics Without ML**: SQL-based insights, fully explainable

### Key Differentiators

| Feature | Traditional Systems | Our System |
|---------|-------------------|-----------|
| Priority Handling | Manual/None | Automatic |
| Transparency | Low | High |
| Feedback Loop | One-way | Closed-loop |
| Analytics | Basic/None | Comprehensive |
| Business Logic | App Code | Database |

### Defense Points

1. **Not just a ticket system** - Includes analytics, fairness scoring, and feedback loops
2. **DBMS Focus** - Extensive use of triggers, procedures, constraints
3. **Real-world Impact** - Addresses actual campus service problems
4. **Scalable Design** - Database handles business rules, app is thin
5. **Academic Rigor** - Proper normalization, indexing, transaction handling

## 📄 License

This project is created for educational purposes as part of a DBMS course project.

## 👥 Team

[Add your team member names and contributions]

## 🙏 Acknowledgments

- PostgreSQL Documentation
- Express.js Framework
- React Library
- Recharts for data visualization
