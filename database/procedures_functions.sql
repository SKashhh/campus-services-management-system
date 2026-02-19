-- ============================================
-- Campus Services Management System
-- Stored Procedures, Functions, and Cursors
-- ============================================

-- ============================================
-- 1. STORED PROCEDURE: Approve Request
-- ============================================
CREATE OR REPLACE PROCEDURE approve_request(p_request_id INT)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE requests 
    SET status = 'approved', 
        assigned_to = (SELECT user_id FROM users WHERE role='staff' LIMIT 1)
    WHERE request_id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request ID % not found', p_request_id;
    END IF;
    
    RAISE NOTICE 'Request % approved successfully', p_request_id;
END;
$$;

-- ============================================
-- 2. FUNCTION: Get Average Rating
-- ============================================
CREATE OR REPLACE FUNCTION get_avg_rating(p_service_id INT)
RETURNS DECIMAL AS $$
DECLARE 
    avg_rating DECIMAL;
BEGIN
    SELECT AVG(f.rating) INTO avg_rating
    FROM feedback f
    JOIN requests r ON f.request_id = r.request_id
    WHERE r.service_id = p_service_id;
    
    RETURN COALESCE(avg_rating, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error calculating rating for service %', p_service_id;
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CURSOR FUNCTION: Send Pending Reminders
-- ============================================
CREATE OR REPLACE FUNCTION send_pending_reminders()
RETURNS TABLE(request_id INT, user_name TEXT, title TEXT) AS $$
DECLARE
    req_cursor CURSOR FOR 
        SELECT r.request_id, u.name, r.title 
        FROM requests r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.status = 'pending' 
        AND r.submitted_at < NOW() - INTERVAL '24 hours';
    req_record RECORD;
BEGIN
    OPEN req_cursor;
    LOOP
        FETCH req_cursor INTO req_record;
        EXIT WHEN NOT FOUND;
        
        -- In production, this would send email
        RAISE NOTICE 'Reminder: Request % by % - %', 
            req_record.request_id, 
            req_record.name, 
            req_record.title;
        
        -- Return the record
        request_id := req_record.request_id;
        user_name := req_record.name;
        title := req_record.title;
        RETURN NEXT;
    END LOOP;
    CLOSE req_cursor;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FUNCTION: Get Request Count by Status
-- ============================================
CREATE OR REPLACE FUNCTION get_request_count(p_status VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM requests
    WHERE status = p_status;
    
    RETURN count_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. PROCEDURE: Complete Request with Notes
-- ============================================
CREATE OR REPLACE PROCEDURE complete_request(
    p_request_id INT, 
    p_resolution_notes TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE requests 
    SET status = 'completed'
    WHERE request_id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request % not found', p_request_id;
    END IF;
    
    RAISE NOTICE 'Request % completed with notes', p_request_id;
END;
$$;

-- ============================================
-- TEST QUERIES
-- ============================================

-- Test stored procedure
-- CALL approve_request(1);

-- Test function
-- SELECT service_name, get_avg_rating(service_id) AS avg_rating
-- FROM service_types;

-- Test cursor function
-- SELECT * FROM send_pending_reminders();

-- Test count function
-- SELECT 
--     get_request_count('pending') AS pending_count,
--     get_request_count('completed') AS completed_count;
```

---

