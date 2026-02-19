# Database Queries Reference

This document contains useful SQL queries for testing, debugging, and demonstrating the system.

## Basic Queries

### View All Tables
```sql
\dt
```

### View Table Structure
```sql
\d requests
\d users
\d departments
```

### Count Records
```sql
SELECT COUNT(*) FROM requests;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM feedback;
```

## User Management

### View All Users
```sql
SELECT user_id, name, email, role, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Create New Admin
```sql
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin User', 'admin2@campus.edu', '$2b$10$...', 'admin');
```

### Change User Role
```sql
UPDATE users 
SET role = 'staff' 
WHERE email = 'student@example.com';
```

## Request Queries

### View All Requests with Details
```sql
SELECT 
    r.request_id,
    r.title,
    r.priority,
    r.status,
    u.name AS student_name,
    s.service_name,
    d.dept_name,
    r.submitted_at,
    r.resolution_hours
FROM requests r
JOIN users u ON r.user_id = u.user_id
JOIN service_types s ON r.service_id = s.service_id
JOIN departments d ON s.dept_id = d.dept_id
ORDER BY r.submitted_at DESC;
```

### High Priority Pending Requests
```sql
SELECT 
    request_id, 
    title, 
    submitted_at,
    EXTRACT(HOUR FROM (CURRENT_TIMESTAMP - submitted_at)) AS hours_pending
FROM requests
WHERE priority = 'high' AND status = 'pending'
ORDER BY submitted_at ASC;
```

### Requests by Department
```sql
SELECT 
    d.dept_name,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE r.status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE r.status = 'completed') AS completed
FROM departments d
LEFT JOIN service_types s ON d.dept_id = s.dept_id
LEFT JOIN requests r ON s.service_id = r.service_id
GROUP BY d.dept_name
ORDER BY total_requests DESC;
```

### Average Resolution Time by Priority
```sql
SELECT 
    priority,
    COUNT(*) AS total_requests,
    ROUND(AVG(resolution_hours), 2) AS avg_hours,
    MIN(resolution_hours) AS min_hours,
    MAX(resolution_hours) AS max_hours
FROM requests
WHERE status = 'completed'
GROUP BY priority
ORDER BY CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
END;
```

## Feedback Queries

### View All Feedback with Details
```sql
SELECT 
    f.feedback_id,
    r.title AS request_title,
    f.rating,
    f.comment,
    u.name AS student_name,
    d.dept_name,
    f.submitted_at
FROM feedback f
JOIN requests r ON f.request_id = r.request_id
JOIN users u ON r.user_id = u.user_id
JOIN service_types s ON r.service_id = s.service_id
JOIN departments d ON s.dept_id = d.dept_id
ORDER BY f.submitted_at DESC;
```

### Department Satisfaction Scores
```sql
SELECT 
    d.dept_name,
    COUNT(f.feedback_id) AS total_feedback,
    ROUND(AVG(f.rating), 2) AS avg_rating,
    COUNT(*) FILTER (WHERE f.rating >= 4) AS positive,
    COUNT(*) FILTER (WHERE f.rating <= 2) AS negative
FROM departments d
JOIN service_types s ON d.dept_id = s.dept_id
JOIN requests r ON s.service_id = r.service_id
LEFT JOIN feedback f ON r.request_id = f.request_id
WHERE f.feedback_id IS NOT NULL
GROUP BY d.dept_name
ORDER BY avg_rating DESC;
```

### Low-Rated Services (Need Attention)
```sql
SELECT 
    s.service_name,
    d.dept_name,
    COUNT(f.feedback_id) AS feedback_count,
    ROUND(AVG(f.rating), 2) AS avg_rating
FROM service_types s
JOIN departments d ON s.dept_id = d.dept_id
JOIN requests r ON s.service_id = r.service_id
JOIN feedback f ON r.request_id = f.request_id
GROUP BY s.service_id, s.service_name, d.dept_name
HAVING AVG(f.rating) < 3.0
ORDER BY avg_rating ASC;
```

## Analytics Queries

### Overall System Statistics
```sql
SELECT 
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
    COUNT(*) FILTER (WHERE priority = 'high') AS high_priority,
    ROUND(AVG(resolution_hours) FILTER (WHERE status = 'completed'), 2) AS avg_resolution_hours
FROM requests;
```

### Daily Request Trend (Last 7 Days)
```sql
SELECT 
    DATE(submitted_at) AS date,
    COUNT(*) AS requests_count,
    COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count
FROM requests
WHERE submitted_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(submitted_at)
ORDER BY date DESC;
```

### Most Active Students
```sql
SELECT 
    u.name,
    u.email,
    COUNT(r.request_id) AS total_requests,
    COUNT(*) FILTER (WHERE r.status = 'completed') AS completed,
    COUNT(f.feedback_id) AS feedback_given,
    ROUND(AVG(f.rating), 2) AS avg_rating_given
FROM users u
LEFT JOIN requests r ON u.user_id = r.user_id
LEFT JOIN feedback f ON r.request_id = f.request_id
WHERE u.role = 'student'
GROUP BY u.user_id, u.name, u.email
HAVING COUNT(r.request_id) > 0
ORDER BY total_requests DESC
LIMIT 10;
```

### SLA Compliance by Department
```sql
SELECT 
    d.dept_name,
    d.response_sla_hours AS sla_target_hours,
    COUNT(r.request_id) AS total_completed,
    COUNT(*) FILTER (WHERE r.resolution_hours <= d.response_sla_hours) AS within_sla,
    COUNT(*) FILTER (WHERE r.resolution_hours > d.response_sla_hours) AS beyond_sla,
    ROUND(
        (COUNT(*) FILTER (WHERE r.resolution_hours <= d.response_sla_hours)::NUMERIC / 
        NULLIF(COUNT(r.request_id), 0)) * 100, 
        2
    ) AS sla_compliance_rate
FROM departments d
LEFT JOIN service_types s ON d.dept_id = s.dept_id
LEFT JOIN requests r ON s.service_id = r.service_id
WHERE r.status = 'completed'
GROUP BY d.dept_id, d.dept_name, d.response_sla_hours
ORDER BY sla_compliance_rate DESC;
```

## Stored Procedure Usage

### Get Department Workload
```sql
SELECT * FROM get_department_workload();
```

### Get Service Performance
```sql
SELECT * FROM get_service_performance();
```

### Get Priority Distribution
```sql
SELECT * FROM get_priority_distribution();
```

### Get Feedback Ratings
```sql
SELECT * FROM get_feedback_ratings();
```

### Refresh Monthly Analytics
```sql
SELECT refresh_monthly_analytics();
SELECT * FROM monthly_analytics ORDER BY month DESC;
```

## View Queries

### Priority Summary View
```sql
SELECT * FROM priority_summary;
```

### Monthly Analytics Materialized View
```sql
SELECT * FROM monthly_analytics ORDER BY month DESC LIMIT 12;
```

## Activity Log Queries

### View Request History
```sql
SELECT 
    rl.log_id,
    rl.request_id,
    r.title,
    rl.previous_status,
    rl.new_status,
    u.name AS changed_by,
    rl.changed_at,
    rl.remarks
FROM request_logs rl
JOIN requests r ON rl.request_id = r.request_id
LEFT JOIN users u ON rl.changed_by = u.user_id
WHERE rl.request_id = <REQUEST_ID>
ORDER BY rl.changed_at ASC;
```

### Recent Status Changes
```sql
SELECT 
    r.request_id,
    r.title,
    rl.previous_status,
    rl.new_status,
    u.name AS changed_by,
    rl.changed_at
FROM request_logs rl
JOIN requests r ON rl.request_id = r.request_id
LEFT JOIN users u ON rl.changed_by = u.user_id
WHERE rl.changed_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY rl.changed_at DESC;
```

## Diagnostic Queries

### Check Trigger Functionality
```sql
-- View triggers
\dft

-- Check if triggers are enabled
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Check Constraints
```sql
-- View all constraints
\d+ requests

-- Check constraint violations (should return empty)
SELECT * FROM requests 
WHERE status NOT IN ('pending', 'approved', 'in_progress', 'completed', 'rejected');
```

### View Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS number_of_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Database Size
```sql
SELECT 
    pg_size_pretty(pg_database_size('campus_services_db')) AS database_size;
```

### Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Testing

### Query Execution Plan
```sql
EXPLAIN ANALYZE
SELECT * FROM requests 
WHERE status = 'pending' AND priority = 'high'
ORDER BY submitted_at ASC;
```

### Slow Queries Detection
```sql
-- Enable query logging
ALTER DATABASE campus_services_db 
SET log_min_duration_statement = 100;

-- View slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Data Cleanup (Use with Caution)

### Delete Test Data
```sql
-- Delete all requests and related data (cascades to feedback and logs)
DELETE FROM requests;

-- Reset auto-increment
ALTER SEQUENCE requests_request_id_seq RESTART WITH 1;
```

### Reset Feedback
```sql
DELETE FROM feedback;
ALTER SEQUENCE feedback_feedback_id_seq RESTART WITH 1;
```

## Backup & Restore

### Backup Database
```bash
# Full backup
pg_dump -U postgres campus_services_db > backup.sql

# Schema only
pg_dump -U postgres --schema-only campus_services_db > schema_backup.sql

# Data only
pg_dump -U postgres --data-only campus_services_db > data_backup.sql
```

### Restore Database
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS campus_services_db;"
psql -U postgres -c "CREATE DATABASE campus_services_db;"

# Restore
psql -U postgres campus_services_db < backup.sql
```

## Tips for Demo

1. **Before Demo**: Insert sample data with various statuses and priorities
2. **Show Real-time**: Update a request status and show trigger effects
3. **Analytics**: Run stored procedures to demonstrate database-driven analytics
4. **Explain**: Use EXPLAIN ANALYZE to show query optimization with indexes
5. **Constraints**: Try to insert invalid data to demonstrate database validation

---

**Note**: Replace `<REQUEST_ID>` with actual request ID when using specific queries.
