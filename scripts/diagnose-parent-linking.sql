-- Diagnostic script to find why parent-student linking fails
-- Run each section separately to identify the issue

-- 1. Check if we can manually insert a test link
-- First, get sample IDs that actually exist
SELECT 'Sample Parents:' as info;
SELECT id, name, auth_id FROM parents LIMIT 5;

SELECT 'Sample Students:' as info;
SELECT id, name, auth_id, username FROM students LIMIT 5;

-- 2. Check the exact structure of parent_students table
SELECT 'Parent_Students Table Structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'parent_students'
ORDER BY ordinal_position;

-- 3. Check constraints on parent_students
SELECT 'Constraints on parent_students:' as info;
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'parent_students';

-- 4. Check if there are any triggers that might be blocking inserts
SELECT 'Triggers on parent_students:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'parent_students';

-- 5. Check current permissions
SELECT 'Permissions on parent_students:' as info;
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'parent_students'
ORDER BY grantee, privilege_type;

-- 6. Try a test insert with actual IDs from your database
-- IMPORTANT: Replace 1 and 1 with actual parent_id and student_id from the queries above
/*
-- Uncomment and modify this with real IDs:
INSERT INTO parent_students (parent_id, student_id) 
VALUES (1, 1)
RETURNING *;
*/

-- 7. Check if RLS is enabled
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'parent_students';

-- 8. Check for any check constraints or rules
SELECT 'Check Constraints:' as info;
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
AND conrelid = 'parent_students'::regclass;

-- 9. Test if we can select from the table
SELECT 'Current parent_students data:' as info;
SELECT * FROM parent_students LIMIT 10;