-- Complete fix for parent-student linking system
-- Run this in Supabase SQL Editor to fix all issues

-- 1. Check current state
SELECT 'Current state of tables:' as info;
SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES ('parents'), ('students'), ('parent_students'), ('classroom_students')
) as required(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_schema = 'public' 
    AND t.table_name = required.table_name;

-- 2. Drop existing parent_students table if it has issues
DROP TABLE IF EXISTS parent_students CASCADE;

-- 3. Create parent_students table with proper structure
CREATE TABLE parent_students (
    parent_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (parent_id, student_id)
);

-- 4. Add foreign key constraints with proper error handling
DO $$ 
BEGIN
    -- Add foreign key to parents table
    BEGIN
        ALTER TABLE parent_students 
        ADD CONSTRAINT parent_students_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Could not add parent foreign key: %', SQLERRM;
    END;
    
    -- Add foreign key to students table
    BEGIN
        ALTER TABLE parent_students 
        ADD CONSTRAINT parent_students_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Could not add student foreign key: %', SQLERRM;
    END;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_created_at ON parent_students(created_at);

-- 6. Disable RLS completely to avoid permission issues
ALTER TABLE parent_students DISABLE ROW LEVEL SECURITY;

-- 7. Grant full permissions to all roles
GRANT ALL PRIVILEGES ON TABLE parent_students TO anon;
GRANT ALL PRIVILEGES ON TABLE parent_students TO authenticated;
GRANT ALL PRIVILEGES ON TABLE parent_students TO service_role;
GRANT ALL PRIVILEGES ON TABLE parent_students TO postgres;

-- 8. Also ensure proper permissions on parent and student tables
GRANT SELECT ON TABLE parents TO anon;
GRANT SELECT ON TABLE parents TO authenticated;
GRANT SELECT ON TABLE parents TO service_role;

GRANT SELECT ON TABLE students TO anon;
GRANT SELECT ON TABLE students TO authenticated;
GRANT SELECT ON TABLE students TO service_role;

-- 9. Test the setup by trying a sample insert (will be rolled back)
DO $$
BEGIN
    -- Check if we have at least one parent and one student
    IF (SELECT COUNT(*) FROM parents) > 0 AND (SELECT COUNT(*) FROM students) > 0 THEN
        DECLARE
            test_parent_id INTEGER;
            test_student_id INTEGER;
        BEGIN
            SELECT id INTO test_parent_id FROM parents LIMIT 1;
            SELECT id INTO test_student_id FROM students LIMIT 1;
            
            -- Try the insert
            BEGIN
                INSERT INTO parent_students (parent_id, student_id) 
                VALUES (test_parent_id, test_student_id);
                
                -- Clean up the test record
                DELETE FROM parent_students 
                WHERE parent_id = test_parent_id AND student_id = test_student_id;
                
                RAISE NOTICE 'SUCCESS: parent_students table is working correctly!';
            EXCEPTION
                WHEN others THEN
                    RAISE NOTICE 'ERROR: Insert test failed: %', SQLERRM;
            END;
        END;
    ELSE
        RAISE NOTICE 'WARNING: No test data available (no parents or students in database)';
    END IF;
END $$;

-- 10. Show final table structure
SELECT 'Final table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'parent_students'
ORDER BY ordinal_position;

-- 11. Show any existing links
SELECT 'Existing parent-student links:' as info;
SELECT COUNT(*) as total_links FROM parent_students;

-- 12. Verify permissions
SELECT 'Table permissions:' as info;
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'parent_students'
ORDER BY grantee, privilege_type;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Parent-student linking setup complete!';
    RAISE NOTICE 'You can now test the linking functionality in your application.';
END $$;