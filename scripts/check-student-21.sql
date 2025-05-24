-- Check if student ID 21 exists and is in classroom 30

-- 1. Does student 21 exist?
SELECT 'Student ID 21:' as info;
SELECT id, name, username, grade_level 
FROM students 
WHERE id = 21;

-- 2. Is student 21 in classroom 30?
SELECT 'Student 21 in classroom 30?' as info;
SELECT cs.*, s.name as student_name
FROM classroom_students cs
LEFT JOIN students s ON s.id = cs.student_id
WHERE cs.classroom_id = 30 
AND cs.student_id = 21;

-- 3. Show all students in classroom 30
SELECT 'All students in classroom 30:' as info;
SELECT cs.student_id, s.name as student_name
FROM classroom_students cs
JOIN students s ON s.id = cs.student_id
WHERE cs.classroom_id = 30
ORDER BY cs.student_id;

-- 4. Check if the exact insert would work
-- This will show the exact error
INSERT INTO parent_students (parent_id, student_id) 
VALUES (1, 21) 
ON CONFLICT DO NOTHING
RETURNING *;