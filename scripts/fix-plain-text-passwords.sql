-- Fix Plain Text Passwords Issue
-- This script identifies and reports passwords that may be stored as plain text
-- due to the previous admin password update bug

-- Check students table for potential plain text passwords
-- bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
SELECT 
    'students' as table_name,
    id,
    name,
    auth_id,
    CASE 
        WHEN password IS NULL THEN 'NULL PASSWORD'
        WHEN LENGTH(password) != 60 THEN 'LIKELY PLAIN TEXT (wrong length)'
        WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%' THEN 'LIKELY PLAIN TEXT (wrong format)'
        ELSE 'PROPERLY HASHED'
    END as password_status,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_prefix
FROM students 
WHERE password IS NOT NULL
ORDER BY password_status, id;

-- Check teachers table
SELECT 
    'teachers' as table_name,
    id,
    name,
    auth_id,
    CASE 
        WHEN password IS NULL THEN 'NULL PASSWORD'
        WHEN LENGTH(password) != 60 THEN 'LIKELY PLAIN TEXT (wrong length)'
        WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%' THEN 'LIKELY PLAIN TEXT (wrong format)'
        ELSE 'PROPERLY HASHED'
    END as password_status,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_prefix
FROM teachers 
WHERE password IS NOT NULL
ORDER BY password_status, id;

-- Check admin table (note: table name is "Admins" with capital A)
SELECT 
    'Admins' as table_name,
    id,
    name,
    auth_id,
    CASE 
        WHEN password IS NULL THEN 'NULL PASSWORD'
        WHEN LENGTH(password) != 60 THEN 'LIKELY PLAIN TEXT (wrong length)'
        WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%' THEN 'LIKELY PLAIN TEXT (wrong format)'
        ELSE 'PROPERLY HASHED'
    END as password_status,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_prefix
FROM "Admins" 
WHERE password IS NOT NULL
ORDER BY password_status, id;

-- Check parents table
SELECT 
    'parents' as table_name,
    id,
    name,
    auth_id,
    CASE 
        WHEN password IS NULL THEN 'NULL PASSWORD'
        WHEN LENGTH(password) != 60 THEN 'LIKELY PLAIN TEXT (wrong length)'
        WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%' THEN 'LIKELY PLAIN TEXT (wrong format)'
        ELSE 'PROPERLY HASHED'
    END as password_status,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_prefix
FROM parents 
WHERE password IS NOT NULL
ORDER BY password_status, id;

-- Summary counts
SELECT 
    'SUMMARY' as info,
    (SELECT COUNT(*) FROM students WHERE password IS NOT NULL AND (LENGTH(password) != 60 OR (password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%'))) as students_with_plain_text,
    (SELECT COUNT(*) FROM teachers WHERE password IS NOT NULL AND (LENGTH(password) != 60 OR (password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%'))) as teachers_with_plain_text,
    (SELECT COUNT(*) FROM "Admins" WHERE password IS NOT NULL AND (LENGTH(password) != 60 OR (password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%'))) as admins_with_plain_text,
    (SELECT COUNT(*) FROM parents WHERE password IS NOT NULL AND (LENGTH(password) != 60 OR (password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' AND password NOT LIKE '$2y$%'))) as parents_with_plain_text;

-- Instructions for fixing:
-- If any users have plain text passwords, you will need to either:
-- 1. Reset their passwords through the admin interface (which now properly hashes them)
-- 2. Or manually hash them using bcrypt with salt rounds 10
-- 
-- For testing purposes, you might want to create a test user with a known password:
-- INSERT INTO students (name, auth_id, password, grade_level) 
-- VALUES ('Test Student', 'test@student.mathtagumpay.com', '$2b$10$example.hash.here', '3');