-- Test with real IDs that exist in your database

-- Show available parents and students for testing
SELECT 'Available Parents:' as info;
SELECT id, name FROM parents WHERE id NOT IN (SELECT DISTINCT parent_id FROM parent_students) ORDER BY id LIMIT 5;

SELECT 'Available Students:' as info;  
SELECT id, name FROM students WHERE id NOT IN (SELECT DISTINCT student_id FROM parent_students) ORDER BY id LIMIT 5;

-- Test insert with a real student ID (like 6)
-- Replace X with a real parent ID from the query above
BEGIN;

INSERT INTO parent_students (parent_id, student_id) 
VALUES (1, 6);  -- Change 1 to a real parent ID if needed

-- Check if it worked
SELECT * FROM parent_students WHERE student_id = 6;

ROLLBACK; -- Remove this line if you want to keep the test data