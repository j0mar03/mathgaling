-- Check what IDs actually exist in your database

-- 1. Show the range of parent IDs
SELECT 'Parent ID Range:' as info;
SELECT 
    MIN(id) as min_parent_id,
    MAX(id) as max_parent_id,
    COUNT(*) as total_parents
FROM parents;

-- 2. Show the range of student IDs  
SELECT 'Student ID Range:' as info;
SELECT 
    MIN(id) as min_student_id,
    MAX(id) as max_student_id,
    COUNT(*) as total_students
FROM students;

-- 3. Show first 10 actual parent IDs with names
SELECT 'First 10 Parents:' as info;
SELECT id, name, auth_id 
FROM parents 
ORDER BY id 
LIMIT 10;

-- 4. Show first 10 actual student IDs with names
SELECT 'First 10 Students:' as info;
SELECT id, name, auth_id, username, grade_level
FROM students 
ORDER BY id 
LIMIT 10;

-- 5. Find a valid parent-student combination that doesn't exist yet
SELECT 'Available Parent-Student Combinations:' as info;
SELECT 
    p.id as parent_id,
    p.name as parent_name,
    s.id as student_id,
    s.name as student_name
FROM parents p
CROSS JOIN students s
WHERE NOT EXISTS (
    SELECT 1 FROM parent_students ps 
    WHERE ps.parent_id = p.id 
    AND ps.student_id = s.id
)
LIMIT 5;

-- 6. Check if there's an ID sequence issue
SELECT 'Parent ID Sequence:' as info;
SELECT 
    schemaname,
    sequencename,
    last_value
FROM pg_sequences
WHERE sequencename LIKE '%parent%';

SELECT 'Student ID Sequence:' as info;
SELECT 
    schemaname,
    sequencename,
    last_value
FROM pg_sequences
WHERE sequencename LIKE '%student%';