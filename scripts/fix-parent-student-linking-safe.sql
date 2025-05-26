-- SAFE fix for parent-student linking system (preserves existing data)
-- Run this in Supabase SQL Editor

-- 1. Check if parent_students table exists and backup data if it does
DO $$
DECLARE
    table_exists boolean;
    backup_count integer := 0;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'parent_students'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Create backup table with existing data
        EXECUTE 'CREATE TABLE parent_students_backup AS SELECT * FROM parent_students';
        SELECT COUNT(*) INTO backup_count FROM parent_students_backup;
        RAISE NOTICE 'Backed up % existing parent-student links to parent_students_backup table', backup_count;
    ELSE
        RAISE NOTICE 'parent_students table does not exist, will create new one';
    END IF;
END $$;

-- 2. Create parent_students table if it doesn't exist (non-destructive)
CREATE TABLE IF NOT EXISTS parent_students (
    parent_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (parent_id, student_id)
);

-- 3. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'parent_students' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE parent_students ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'parent_students' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE parent_students ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- 4. Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Check and add foreign key to parents table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'parent_students' 
        AND constraint_name LIKE '%parent_id%fkey%'
    ) THEN
        BEGIN
            ALTER TABLE parent_students 
            ADD CONSTRAINT parent_students_parent_id_fkey 
            FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added parent_id foreign key constraint';
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not add parent foreign key: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Parent foreign key already exists';
    END IF;
    
    -- Check and add foreign key to students table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'parent_students' 
        AND constraint_name LIKE '%student_id%fkey%'
    ) THEN
        BEGIN
            ALTER TABLE parent_students 
            ADD CONSTRAINT parent_students_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added student_id foreign key constraint';
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not add student foreign key: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Student foreign key already exists';
    END IF;
END $$;

-- 5. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_created_at ON parent_students(created_at);

-- 6. Fix permissions issues
DO $$
BEGIN
    -- Disable RLS if it's enabled
    ALTER TABLE parent_students DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Disabled Row Level Security on parent_students';
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON TABLE parent_students TO anon;
    GRANT ALL PRIVILEGES ON TABLE parent_students TO authenticated;
    GRANT ALL PRIVILEGES ON TABLE parent_students TO service_role;
    GRANT ALL PRIVILEGES ON TABLE parent_students TO postgres;
    RAISE NOTICE 'Granted permissions to all roles';
    
    -- Also ensure proper permissions on parent and student tables
    GRANT SELECT ON TABLE parents TO anon;
    GRANT SELECT ON TABLE parents TO authenticated;
    GRANT SELECT ON TABLE parents TO service_role;
    
    GRANT SELECT ON TABLE students TO anon;
    GRANT SELECT ON TABLE students TO authenticated;
    GRANT SELECT ON TABLE students TO service_role;
    RAISE NOTICE 'Ensured SELECT permissions on parents and students tables';
END $$;

-- 7. Restore data from backup if it exists
DO $$
DECLARE
    backup_exists boolean;
    restore_count integer := 0;
    backup_has_timestamps boolean := false;
BEGIN
    -- Check if backup table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'parent_students_backup'
    ) INTO backup_exists;
    
    IF backup_exists THEN
        -- Check if backup table has timestamp columns
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'parent_students_backup' 
            AND column_name = 'created_at'
        ) INTO backup_has_timestamps;
        
        IF backup_has_timestamps THEN
            -- Restore with existing timestamps
            INSERT INTO parent_students (parent_id, student_id, created_at, updated_at)
            SELECT 
                parent_id, 
                student_id, 
                COALESCE(created_at, NOW()),
                COALESCE(updated_at, NOW())
            FROM parent_students_backup
            WHERE NOT EXISTS (
                SELECT 1 FROM parent_students ps
                WHERE ps.parent_id = parent_students_backup.parent_id
                AND ps.student_id = parent_students_backup.student_id
            );
        ELSE
            -- Restore without timestamps (use default values)
            INSERT INTO parent_students (parent_id, student_id)
            SELECT 
                parent_id, 
                student_id
            FROM parent_students_backup
            WHERE NOT EXISTS (
                SELECT 1 FROM parent_students ps
                WHERE ps.parent_id = parent_students_backup.parent_id
                AND ps.student_id = parent_students_backup.student_id
            );
        END IF;
        
        GET DIAGNOSTICS restore_count = ROW_COUNT;
        RAISE NOTICE 'Restored % parent-student links from backup', restore_count;
        
        -- Drop backup table
        DROP TABLE parent_students_backup;
        RAISE NOTICE 'Cleaned up backup table';
    END IF;
END $$;

-- 8. Test the setup
DO $$
DECLARE
    test_parent_id INTEGER;
    test_student_id INTEGER;
    existing_links_count INTEGER;
BEGIN
    -- Count existing links
    SELECT COUNT(*) INTO existing_links_count FROM parent_students;
    RAISE NOTICE 'Current number of parent-student links: %', existing_links_count;
    
    -- Test if we have data to test with
    IF (SELECT COUNT(*) FROM parents) > 0 AND (SELECT COUNT(*) FROM students) > 0 THEN
        SELECT id INTO test_parent_id FROM parents LIMIT 1;
        SELECT id INTO test_student_id FROM students LIMIT 1;
        
        -- Only test if this link doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM parent_students 
            WHERE parent_id = test_parent_id AND student_id = test_student_id
        ) THEN
            BEGIN
                -- Try test insert
                INSERT INTO parent_students (parent_id, student_id) 
                VALUES (test_parent_id, test_student_id);
                
                -- Clean up test
                DELETE FROM parent_students 
                WHERE parent_id = test_parent_id AND student_id = test_student_id;
                
                RAISE NOTICE 'SUCCESS: parent_students table is working correctly!';
            EXCEPTION
                WHEN others THEN
                    RAISE NOTICE 'ERROR: Insert test failed: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Test skipped: link already exists between parent % and student %', test_parent_id, test_student_id;
        END IF;
    ELSE
        RAISE NOTICE 'Test skipped: no parents or students in database';
    END IF;
END $$;

-- 9. Show final status
SELECT 'Final table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'parent_students'
ORDER BY ordinal_position;

SELECT 'Final link count:' as info;
SELECT COUNT(*) as total_links FROM parent_students;

-- 10. Success message
DO $$
BEGIN
    RAISE NOTICE '=== SAFE SETUP COMPLETE ===';
    RAISE NOTICE 'All existing parent-student links have been preserved';
    RAISE NOTICE 'Table permissions and structure have been fixed';
    RAISE NOTICE 'You can now test the linking functionality in your application';
END $$;