-- Supabase Setup Script
-- Run this in Supabase SQL Editor to ensure proper setup

-- 1. Reset auto-increment sequences to avoid duplicate key errors
SELECT setval('students_id_seq', COALESCE((SELECT MAX(id) FROM students), 0) + 1, false);
SELECT setval('teachers_id_seq', COALESCE((SELECT MAX(id) FROM teachers), 0) + 1, false);
SELECT setval('parents_id_seq', COALESCE((SELECT MAX(id) FROM parents), 0) + 1, false);
SELECT setval('"Admins_id_seq"', COALESCE((SELECT MAX(id) FROM "Admins"), 0) + 1, false);

-- 2. Ensure auth_id is unique in all user tables
ALTER TABLE students ADD CONSTRAINT students_auth_id_unique UNIQUE (auth_id) ON CONFLICT DO NOTHING;
ALTER TABLE teachers ADD CONSTRAINT teachers_auth_id_unique UNIQUE (auth_id) ON CONFLICT DO NOTHING;
ALTER TABLE parents ADD CONSTRAINT parents_auth_id_unique UNIQUE (auth_id) ON CONFLICT DO NOTHING;
ALTER TABLE "Admins" ADD CONSTRAINT admins_auth_id_unique UNIQUE (auth_id) ON CONFLICT DO NOTHING;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_auth_id ON students(auth_id);
CREATE INDEX IF NOT EXISTS idx_teachers_auth_id ON teachers(auth_id);
CREATE INDEX IF NOT EXISTS idx_parents_auth_id ON parents(auth_id);
CREATE INDEX IF NOT EXISTS idx_admins_auth_id ON "Admins"(auth_id);

-- 4. Create a function to safely create users with auto-increment handling
CREATE OR REPLACE FUNCTION create_user_safe(
  p_table_name text,
  p_user_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_next_id integer;
BEGIN
  -- Try to insert without ID
  BEGIN
    EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1) RETURNING to_jsonb(%I.*)', 
                   p_table_name, p_table_name, p_table_name)
    USING p_user_data
    INTO v_result;
    
    RETURN v_result;
  EXCEPTION WHEN unique_violation THEN
    -- If auth_id already exists, return existing record
    IF SQLERRM LIKE '%auth_id%' THEN
      EXECUTE format('SELECT to_jsonb(%I.*) FROM %I WHERE auth_id = $1', 
                     p_table_name, p_table_name)
      USING p_user_data->>'auth_id'
      INTO v_result;
      
      RETURN v_result;
    END IF;
    
    -- If ID conflict, get next ID and retry
    IF SQLERRM LIKE '%pkey%' THEN
      EXECUTE format('SELECT COALESCE(MAX(id), 0) + 1 FROM %I', p_table_name)
      INTO v_next_id;
      
      p_user_data = jsonb_set(p_user_data, '{id}', to_jsonb(v_next_id));
      
      EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1) RETURNING to_jsonb(%I.*)', 
                     p_table_name, p_table_name, p_table_name)
      USING p_user_data
      INTO v_result;
      
      RETURN v_result;
    END IF;
    
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- 5. Grant necessary permissions (adjust based on your RLS policies)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Check current sequence values
SELECT 
  'students' as table_name,
  currval('students_id_seq') as current_sequence_value,
  (SELECT MAX(id) FROM students) as max_id
UNION ALL
SELECT 
  'teachers' as table_name,
  currval('teachers_id_seq') as current_sequence_value,
  (SELECT MAX(id) FROM teachers) as max_id
UNION ALL
SELECT 
  'parents' as table_name,
  currval('parents_id_seq') as current_sequence_value,
  (SELECT MAX(id) FROM parents) as max_id
UNION ALL
SELECT 
  'Admins' as table_name,
  currval('"Admins_id_seq"') as current_sequence_value,
  (SELECT MAX(id) FROM "Admins") as max_id;