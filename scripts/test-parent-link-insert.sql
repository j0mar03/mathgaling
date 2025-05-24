-- Test insert to find the exact error

-- First, let's see what IDs we can use
SELECT 'Available Parents (first 5):' as info;
SELECT id, name FROM parents 
WHERE id NOT IN (SELECT DISTINCT parent_id FROM parent_students)
LIMIT 5;

SELECT 'Available Students (first 5):' as info;
SELECT id, name FROM students 
WHERE id NOT IN (SELECT DISTINCT student_id FROM parent_students)
LIMIT 5;

-- Now try an insert with specific IDs
-- Replace these IDs with actual ones from above queries
BEGIN;

-- Test insert
INSERT INTO parent_students (parent_id, student_id) 
VALUES (1, 1)  -- CHANGE THESE to real IDs from queries above
RETURNING *;

-- If successful, you'll see the inserted row
-- If error, you'll see the exact error message

-- Rollback so we don't actually save test data
ROLLBACK;

-- Alternative: Check what happens with your actual API data
-- Look at your browser console for the exact parent_id and student_id being sent
-- Then test with those exact values:
/*
INSERT INTO parent_students (parent_id, student_id) 
VALUES (parent_id_from_console, student_id_from_console)
RETURNING *;
*/