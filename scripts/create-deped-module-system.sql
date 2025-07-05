-- DepEd Module System Migration Script
-- This script creates the database schema for DepEd-aligned module system
-- Run this in your Supabase SQL editor

-- Create DepEd Quarters table (Q1-Q4)
CREATE TABLE IF NOT EXISTS deped_quarters (
    id SERIAL PRIMARY KEY,
    quarter_number INTEGER NOT NULL CHECK (quarter_number >= 1 AND quarter_number <= 4),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
    school_year VARCHAR(20) DEFAULT '2024-2025',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(quarter_number, grade_level, school_year)
);

-- Create DepEd Modules table
CREATE TABLE IF NOT EXISTS deped_modules (
    id SERIAL PRIMARY KEY,
    quarter_id INTEGER NOT NULL REFERENCES deped_quarters(id) ON DELETE CASCADE,
    module_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    estimated_weeks INTEGER DEFAULT 2,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(quarter_id, module_number),
    UNIQUE(quarter_id, order_index)
);

-- Create Learning Competencies table (MELC codes)
CREATE TABLE IF NOT EXISTS learning_competencies (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES deped_modules(id) ON DELETE CASCADE,
    melc_code VARCHAR(50) NOT NULL,
    competency_text TEXT NOT NULL,
    learning_objectives TEXT[],
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create mapping table to link existing content_items to new modules
CREATE TABLE IF NOT EXISTS module_content_mapping (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES deped_modules(id) ON DELETE CASCADE,
    content_item_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, content_item_id)
);

-- Create student module progress tracking
CREATE TABLE IF NOT EXISTS student_module_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES deped_modules(id) ON DELETE CASCADE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP NULL,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, module_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deped_quarters_grade_level ON deped_quarters(grade_level);
CREATE INDEX IF NOT EXISTS idx_deped_modules_quarter_id ON deped_modules(quarter_id);
CREATE INDEX IF NOT EXISTS idx_deped_modules_order_index ON deped_modules(quarter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_competencies_module_id ON learning_competencies(module_id);
CREATE INDEX IF NOT EXISTS idx_module_content_mapping_module_id ON module_content_mapping(module_id);
CREATE INDEX IF NOT EXISTS idx_module_content_mapping_content_item_id ON module_content_mapping(content_item_id);
CREATE INDEX IF NOT EXISTS idx_student_module_progress_student_id ON student_module_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_module_progress_module_id ON student_module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_student_module_progress_completion ON student_module_progress(completion_percentage);

-- Add RLS (Row Level Security) policies
ALTER TABLE deped_quarters ENABLE ROW LEVEL SECURITY;
ALTER TABLE deped_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_content_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_module_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deped_quarters (readable by all authenticated users)
CREATE POLICY "deped_quarters_read_policy" ON deped_quarters FOR SELECT TO authenticated USING (true);
CREATE POLICY "deped_quarters_admin_policy" ON deped_quarters FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Admins" WHERE auth_id = auth.email()));

-- Create RLS policies for deped_modules (readable by all authenticated users)
CREATE POLICY "deped_modules_read_policy" ON deped_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "deped_modules_admin_policy" ON deped_modules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Admins" WHERE auth_id = auth.email()));

-- Create RLS policies for learning_competencies (readable by all authenticated users)
CREATE POLICY "learning_competencies_read_policy" ON learning_competencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "learning_competencies_admin_policy" ON learning_competencies FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Admins" WHERE auth_id = auth.email()));

-- Create RLS policies for module_content_mapping (readable by all authenticated users)
CREATE POLICY "module_content_mapping_read_policy" ON module_content_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY "module_content_mapping_admin_policy" ON module_content_mapping FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Admins" WHERE auth_id = auth.email()));

-- Create RLS policies for student_module_progress (students can only see their own progress)
CREATE POLICY "student_module_progress_student_policy" ON student_module_progress 
    FOR ALL TO authenticated 
    USING (student_id = (SELECT id FROM students WHERE auth_id = auth.email()));

-- Teachers can see progress of students in their classrooms
CREATE POLICY "student_module_progress_teacher_policy" ON student_module_progress 
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM classroom_students cs 
        JOIN classrooms c ON cs.classroom_id = c.id 
        JOIN teachers t ON c.teacher_id = t.id 
        WHERE cs.student_id = student_module_progress.student_id 
        AND t.auth_id = auth.email()
    ));

-- Admins can see all progress
CREATE POLICY "student_module_progress_admin_policy" ON student_module_progress 
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM "Admins" WHERE auth_id = auth.email()));

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deped_quarters_updated_at BEFORE UPDATE ON deped_quarters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_deped_modules_updated_at BEFORE UPDATE ON deped_modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_learning_competencies_updated_at BEFORE UPDATE ON learning_competencies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_student_module_progress_updated_at BEFORE UPDATE ON student_module_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a function to automatically update last_activity_at when completion_percentage changes
CREATE OR REPLACE FUNCTION update_last_activity_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completion_percentage != OLD.completion_percentage THEN
        NEW.last_activity_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_module_progress_activity BEFORE UPDATE ON student_module_progress FOR EACH ROW EXECUTE PROCEDURE update_last_activity_at();

-- Success message
SELECT 'DepEd Module System schema created successfully!' as message;