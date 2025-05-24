-- Fix parent-student linking tables for Supabase

-- Ensure parents table exists with correct columns
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    auth_id TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure students table has required columns
-- Add username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'username') THEN
        ALTER TABLE students ADD COLUMN username TEXT;
    END IF;
END $$;

-- Create parent_students junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS parent_students (
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON parent_students(student_id);

-- Ensure classroom_students table exists (for teacher verification)
CREATE TABLE IF NOT EXISTS classroom_students (
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (classroom_id, student_id)
);

-- Create indexes for classroom_students
CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom_id ON classroom_students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_students_student_id ON classroom_students(student_id);

-- Grant necessary permissions (adjust based on your Supabase roles)
GRANT ALL ON parents TO authenticated;
GRANT ALL ON parent_students TO authenticated;
GRANT ALL ON classroom_students TO authenticated;
GRANT USAGE ON SEQUENCE parents_id_seq TO authenticated;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your needs)
-- Allow authenticated users to read parent_students
CREATE POLICY "Allow authenticated read parent_students" ON parent_students
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert parent_students
CREATE POLICY "Allow authenticated insert parent_students" ON parent_students
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete parent_students
CREATE POLICY "Allow authenticated delete parent_students" ON parent_students
    FOR DELETE USING (auth.role() = 'authenticated');

-- Similar policies for classroom_students
CREATE POLICY "Allow authenticated read classroom_students" ON classroom_students
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert classroom_students" ON classroom_students
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete classroom_students" ON classroom_students
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the tables were created correctly
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('parents', 'parent_students', 'classroom_students', 'students')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;