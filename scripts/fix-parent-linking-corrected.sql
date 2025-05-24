-- Complete fix for parent-student linking (CORRECTED VERSION)
-- Run this in Supabase SQL Editor

-- 1. First, check if the parent_students table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'parent_students'
) as parent_students_exists;

-- 2. Create parent_students table if it doesn't exist
CREATE TABLE IF NOT EXISTS parent_students (
    parent_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    PRIMARY KEY (parent_id, student_id)
);

-- 3. Check and add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Check if foreign key to parents exists
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
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Foreign key for parent_id already exists or parents table missing';
        END;
    END IF;
    
    -- Check if foreign key to students exists
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
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Foreign key for student_id already exists or students table missing';
        END;
    END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON parent_students(student_id);

-- 5. Ensure RLS is disabled (to avoid permission issues)
ALTER TABLE parent_students DISABLE ROW LEVEL SECURITY;

-- 6. Grant permissions
GRANT ALL ON parent_students TO anon;
GRANT ALL ON parent_students TO authenticated;
GRANT ALL ON parent_students TO service_role;

-- 7. Check the structure of all related tables
SELECT 
    'parents' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'parents'
UNION ALL
SELECT 
    'students' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'students'
UNION ALL
SELECT 
    'parent_students' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'parent_students'
ORDER BY table_name, column_name;

-- 8. Check for any existing data
SELECT COUNT(*) as existing_links FROM parent_students;

-- 9. Verify all tables exist and have correct structure
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