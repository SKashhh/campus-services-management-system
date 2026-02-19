-- ============================================
-- CAMPUS SERVICES MANAGEMENT SYSTEM
-- Database Schema (PostgreSQL)
-- ============================================

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS set_completion_time ON requests;
DROP TRIGGER IF EXISTS log_status_change ON requests;
DROP TRIGGER IF EXISTS validate_feedback_timing ON feedback;
DROP FUNCTION IF EXISTS update_resolution_time() CASCADE;
DROP FUNCTION IF EXISTS log_request_status_change() CASCADE;
DROP FUNCTION IF EXISTS validate_feedback_submission() CASCADE;
DROP FUNCTION IF EXISTS get_department_workload() CASCADE;
DROP FUNCTION IF EXISTS get_service_performance() CASCADE;
DROP FUNCTION IF EXISTS get_priority_distribution() CASCADE;
DROP FUNCTION IF EXISTS get_feedback_ratings() CASCADE;
DROP MATERIALIZED VIEW IF EXISTS monthly_analytics CASCADE;
DROP VIEW IF EXISTS priority_summary CASCADE;
DROP TABLE IF EXISTS request_logs CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin', 'staff')),
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL UNIQUE,
    max_capacity INT DEFAULT 50,
    response_sla_hours INT DEFAULT 48,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Types Table
CREATE TABLE service_types (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    dept_id INT NOT NULL REFERENCES departments(dept_id) ON DELETE CASCADE,
    description TEXT,
    default_priority VARCHAR(10) DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_name, dept_id)
);

-- Requests Table (Core Table)
CREATE TABLE requests (
    request_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES service_types(service_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    assigned_to INT REFERENCES users(user_id),
    rejection_reason TEXT,
    resolution_hours NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,
    request_id INT UNIQUE NOT NULL REFERENCES requests(request_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Request Activity Logs Table
CREATE TABLE request_logs (
    log_id SERIAL PRIMARY KEY,
    request_id INT NOT NULL REFERENCES requests(request_id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INT REFERENCES users(user_id),
    remarks TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Composite index for admin dashboard queries
CREATE INDEX idx_requests_status_priority_date ON requests(status, priority, submitted_at DESC);

-- Index for user's requests
CREATE INDEX idx_requests_user_id ON requests(user_id);

-- Index for service lookups
CREATE INDEX idx_requests_service_id ON requests(service_id);

-- Index for department queries
CREATE INDEX idx_service_types_dept_id ON service_types(dept_id);

-- Index for feedback queries
CREATE INDEX idx_feedback_request_id ON feedback(request_id);

-- Index for logs
CREATE INDEX idx_request_logs_request_id ON request_logs(request_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger 1: Auto-calculate resolution time when request is completed
CREATE OR REPLACE FUNCTION update_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at timestamp
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
        
        -- Calculate resolution hours
        NEW.resolution_hours = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.submitted_at)) / 3600;
    END IF;
    
    -- Set approved_at timestamp
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        NEW.approved_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Update updated_at
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_completion_time
BEFORE UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION update_resolution_time();

-- Trigger 2: Log all status changes
CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO request_logs (request_id, previous_status, new_status, changed_by, remarks)
        VALUES (NEW.request_id, OLD.status, NEW.status, NEW.assigned_to, 
                CASE 
                    WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                    ELSE NULL
                END);
    END IF;
    
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO request_logs (request_id, previous_status, new_status, changed_by)
        VALUES (NEW.request_id, NULL, NEW.status, NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_status_change
AFTER INSERT OR UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION log_request_status_change();

-- Trigger 3: Validate feedback can only be submitted after completion
CREATE OR REPLACE FUNCTION validate_feedback_submission()
RETURNS TRIGGER AS $$
DECLARE
    request_status VARCHAR(20);
BEGIN
    SELECT status INTO request_status
    FROM requests
    WHERE request_id = NEW.request_id;
    
    IF request_status != 'completed' THEN
        RAISE EXCEPTION 'Feedback can only be submitted for completed requests';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_feedback_timing
BEFORE INSERT ON feedback
FOR EACH ROW
EXECUTE FUNCTION validate_feedback_submission();

-- ============================================
-- STORED PROCEDURES FOR ANALYTICS
-- ============================================

-- Procedure 1: Get Department Workload Analysis
CREATE OR REPLACE FUNCTION get_department_workload()
RETURNS TABLE(
    dept_name VARCHAR,
    total_requests BIGINT,
    pending_count BIGINT,
    completed_count BIGINT,
    avg_resolution_hours NUMERIC,
    workload_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.dept_name,
        COUNT(r.request_id) AS total_requests,
        COUNT(r.request_id) FILTER (WHERE r.status = 'pending') AS pending_count,
        COUNT(r.request_id) FILTER (WHERE r.status = 'completed') AS completed_count,
        ROUND(AVG(r.resolution_hours) FILTER (WHERE r.status = 'completed'), 2) AS avg_resolution_hours,
        ROUND(
            (COUNT(r.request_id) FILTER (WHERE r.status = 'pending')::NUMERIC / 
            NULLIF(d.max_capacity, 0)) * 100, 
            2
        ) AS workload_percentage
    FROM departments d
    LEFT JOIN service_types st ON d.dept_id = st.dept_id
    LEFT JOIN requests r ON st.service_id = r.service_id
    GROUP BY d.dept_id, d.dept_name, d.max_capacity
    ORDER BY pending_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Procedure 2: Get Service Performance Metrics
CREATE OR REPLACE FUNCTION get_service_performance()
RETURNS TABLE(
    service_name VARCHAR,
    dept_name VARCHAR,
    total_requests BIGINT,
    avg_resolution_hours NUMERIC,
    completion_rate NUMERIC,
    avg_rating NUMERIC,
    performance_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.service_name,
        d.dept_name,
        COUNT(r.request_id) AS total_requests,
        ROUND(AVG(r.resolution_hours) FILTER (WHERE r.status = 'completed'), 2) AS avg_resolution_hours,
        ROUND(
            (COUNT(r.request_id) FILTER (WHERE r.status = 'completed')::NUMERIC / 
            NULLIF(COUNT(r.request_id), 0)) * 100,
            2
        ) AS completion_rate,
        ROUND(AVG(f.rating), 2) AS avg_rating,
        ROUND(
            (COALESCE(AVG(f.rating), 3) / 5.0) * 
            (COUNT(r.request_id) FILTER (WHERE r.status = 'completed')::NUMERIC / 
            NULLIF(COUNT(r.request_id), 0)) * 100,
            2
        ) AS performance_score
    FROM service_types st
    JOIN departments d ON st.dept_id = d.dept_id
    LEFT JOIN requests r ON st.service_id = r.service_id
    LEFT JOIN feedback f ON r.request_id = f.request_id
    GROUP BY st.service_id, st.service_name, d.dept_name
    ORDER BY performance_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Procedure 3: Get Priority Distribution
CREATE OR REPLACE FUNCTION get_priority_distribution()
RETURNS TABLE(
    priority VARCHAR,
    total_count BIGINT,
    pending_count BIGINT,
    completed_count BIGINT,
    avg_resolution_hours NUMERIC,
    percentage_of_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.priority,
        COUNT(r.request_id) AS total_count,
        COUNT(r.request_id) FILTER (WHERE r.status = 'pending') AS pending_count,
        COUNT(r.request_id) FILTER (WHERE r.status = 'completed') AS completed_count,
        ROUND(AVG(r.resolution_hours) FILTER (WHERE r.status = 'completed'), 2) AS avg_resolution_hours,
        ROUND(
            (COUNT(r.request_id)::NUMERIC / 
            (SELECT COUNT(*) FROM requests) * 100),
            2
        ) AS percentage_of_total
    FROM requests r
    GROUP BY r.priority
    ORDER BY 
        CASE r.priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
        END;
END;
$$ LANGUAGE plpgsql;

-- Procedure 4: Get Feedback-Based Ratings
CREATE OR REPLACE FUNCTION get_feedback_ratings()
RETURNS TABLE(
    dept_name VARCHAR,
    total_feedback BIGINT,
    avg_rating NUMERIC,
    five_star_count BIGINT,
    one_star_count BIGINT,
    satisfaction_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.dept_name,
        COUNT(f.feedback_id) AS total_feedback,
        ROUND(AVG(f.rating), 2) AS avg_rating,
        COUNT(f.feedback_id) FILTER (WHERE f.rating = 5) AS five_star_count,
        COUNT(f.feedback_id) FILTER (WHERE f.rating = 1) AS one_star_count,
        ROUND(
            (COUNT(f.feedback_id) FILTER (WHERE f.rating >= 4)::NUMERIC / 
            NULLIF(COUNT(f.feedback_id), 0)) * 100,
            2
        ) AS satisfaction_rate
    FROM departments d
    JOIN service_types st ON d.dept_id = st.dept_id
    JOIN requests r ON st.service_id = r.service_id
    LEFT JOIN feedback f ON r.request_id = f.request_id
    WHERE f.feedback_id IS NOT NULL
    GROUP BY d.dept_id, d.dept_name
    ORDER BY avg_rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- View: Priority Summary Dashboard
CREATE VIEW priority_summary AS
SELECT 
    priority,
    COUNT(*) AS total_requests,
    ROUND(AVG(resolution_hours), 2) AS avg_resolution_hours,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)) * 100,
        2
    ) AS completion_rate
FROM requests
GROUP BY priority
ORDER BY 
    CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
    END;

-- Materialized View: Monthly Analytics (Pre-computed for performance)
CREATE MATERIALIZED VIEW monthly_analytics AS
SELECT 
    DATE_TRUNC('month', submitted_at) AS month,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_requests,
    ROUND(AVG(resolution_hours) FILTER (WHERE status = 'completed'), 2) AS avg_resolution_hours,
    COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count,
    ROUND(AVG(f.rating), 2) AS avg_rating
FROM requests r
LEFT JOIN feedback f ON r.request_id = f.request_id
GROUP BY DATE_TRUNC('month', submitted_at)
ORDER BY month DESC;

-- Create index on materialized view
CREATE INDEX idx_monthly_analytics_month ON monthly_analytics(month);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Departments
INSERT INTO departments (dept_name, max_capacity, response_sla_hours) VALUES
('Library Services', 30, 24),
('Hostel Management', 50, 48),
('Maintenance', 40, 72),
('Laboratory Services', 35, 48),
('Sports Facilities', 25, 48),
('IT Services', 45, 24);

-- Insert Admin User (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin', 'admin@campus.edu', '$2b$10$rKGZxHqJ0pY8jV4yZ6YKuOQGZxHqJ0pY8jV4yZ6YKuOQGZxHqJ0pY8', 'admin');

-- Insert Service Types
INSERT INTO service_types (service_name, dept_id, description, default_priority) VALUES
-- Library Services
('Book Request', 1, 'Request for new books or journals', 'low'),
('Computer Access Issue', 1, 'Problems with library computers', 'medium'),
('Reading Room Complaint', 1, 'Issues with reading room facilities', 'medium'),

-- Hostel Management
('Room Maintenance', 2, 'Room repair requests', 'medium'),
('Electricity Issue', 2, 'Power outage or electrical problems', 'high'),
('Water Supply Problem', 2, 'Water shortage or plumbing issues', 'high'),
('Furniture Replacement', 2, 'Damaged furniture replacement', 'low'),

-- Maintenance
('Building Repair', 3, 'Structural or building maintenance', 'high'),
('Cleaning Request', 3, 'Cleanliness issues', 'low'),
('Garden Maintenance', 3, 'Landscaping and garden work', 'low'),

-- Laboratory Services
('Equipment Malfunction', 4, 'Lab equipment not working', 'high'),
('Chemical Request', 4, 'Request for chemicals or supplies', 'medium'),
('Safety Concern', 4, 'Lab safety issues', 'high'),

-- Sports Facilities
('Equipment Request', 5, 'Sports equipment availability', 'low'),
('Ground Maintenance', 5, 'Sports ground issues', 'medium'),
('Booking Issue', 5, 'Problems with facility booking', 'medium'),

-- IT Services
('Network Issue', 6, 'Internet or WiFi problems', 'high'),
('Software Installation', 6, 'Software installation requests', 'medium'),
('Account Access', 6, 'Login or access issues', 'medium');

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to refresh materialized view (call monthly)
CREATE OR REPLACE FUNCTION refresh_monthly_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW monthly_analytics;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

