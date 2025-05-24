-- Check what student and parent IDs actually exist

-- 1. Show all student IDs that exist (since there are only ~24)
SELECT 'All Student IDs in database:' as info;
SELECT id, name, username, grade_level 
FROM students 
ORDER BY id;

-- 2. Show all parent IDs (probably similar range)
SELECT 'All Parent IDs in database:' as info;
SELECT id, name, auth_id 
FROM parents 
ORDER BY id;

-- 3. Check if ID=1 exists for both tables
SELECT 'Does student ID=1 exist?' as info;
SELECT EXISTS(SELECT 1 FROM students WHERE id = 1) as student_1_exists;

SELECT 'Does parent ID=1 exist?' as info;
SELECT EXISTS(SELECT 1 FROM parents WHERE id = 1) as parent_1_exists;

-- 4. Show existing parent-student links
SELECT 'Existing parent-student links:' as info;
SELECT 
    ps.parent_id,
    p.name as parent_name,
    ps.student_id,
    s.name as student_name
FROM parent_students ps
JOIN parents p ON p.id = ps.parent_id
JOIN students s ON s.id = ps.student_id
ORDER BY ps.parent_id, ps.student_id;

-- 5. Find the first valid parent and student IDs we can use for testing
SELECT 'First valid parent ID:' as info;
SELECT id, name FROM parents ORDER BY id LIMIT 1;

SELECT 'First valid student ID:' as info;
SELECT id, name FROM students ORDER BY id LIMIT 1;