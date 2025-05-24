-- UNDO Row Level Security changes that are breaking existing features
-- This script removes RLS without deleting any data

-- 1. Remove all RLS policies on classroom_students
DROP POLICY IF EXISTS "Allow authenticated read classroom_students" ON classroom_students;
DROP POLICY IF EXISTS "Allow authenticated insert classroom_students" ON classroom_students;
DROP POLICY IF EXISTS "Allow authenticated delete classroom_students" ON classroom_students;

-- 2. Disable RLS on classroom_students
ALTER TABLE classroom_students DISABLE ROW LEVEL SECURITY;

-- 3. Remove all RLS policies on parent_students (if causing issues)
DROP POLICY IF EXISTS "Allow authenticated read parent_students" ON parent_students;
DROP POLICY IF EXISTS "Allow authenticated insert parent_students" ON parent_students;
DROP POLICY IF EXISTS "Allow authenticated delete parent_students" ON parent_students;

-- 4. Disable RLS on parent_students
ALTER TABLE parent_students DISABLE ROW LEVEL SECURITY;

-- 5. Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename IN ('classroom_students', 'parent_students');

-- This should show rowsecurity = false for both tables
-- Your data is NOT affected - only the security policies are removed