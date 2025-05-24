-- Debug why parent 1 and student 21 can't be linked

-- 1. Verify both IDs exist
SELECT 'Parent 1 exists?' as info;
SELECT id, name FROM parents WHERE id = 1;

SELECT 'Student 21 exists?' as info;
SELECT id, name FROM students WHERE id = 21;

-- 2. Check if this link already exists
SELECT 'Link already exists?' as info;
SELECT * FROM parent_students 
WHERE parent_id = 1 AND student_id = 21;

-- 3. Show all existing links for parent 1
SELECT 'All students linked to parent 1:' as info;
SELECT ps.*, s.name as student_name
FROM parent_students ps
JOIN students s ON s.id = ps.student_id
WHERE ps.parent_id = 1;

-- 4. Show all existing links for student 21
SELECT 'All parents linked to student 21:' as info;
SELECT ps.*, p.name as parent_name
FROM parent_students ps
JOIN parents p ON p.id = ps.parent_id
WHERE ps.student_id = 21;

-- 5. Try the exact insert that the API is attempting
BEGIN;
INSERT INTO parent_students (parent_id, student_id) 
VALUES (1, 21);
-- This will show the exact error if it fails
ROLLBACK;