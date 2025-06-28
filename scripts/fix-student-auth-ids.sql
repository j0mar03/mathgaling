-- Fix Student Auth IDs to Standard Format
-- This script corrects any students who have auth_id in plain username format
-- and converts them to the standard username@student.mathtagumpay.com format

-- First, let's see what students have broken auth_id format
-- (auth_id that doesn't contain @ symbol)
SELECT id, name, auth_id, username 
FROM students 
WHERE auth_id NOT LIKE '%@%' 
  AND auth_id IS NOT NULL;

-- Now fix all students with broken auth_id format
-- Convert plain username to username@student.mathtagumpay.com
UPDATE students 
SET auth_id = CONCAT(auth_id, '@student.mathtagumpay.com')
WHERE auth_id NOT LIKE '%@%' 
  AND auth_id IS NOT NULL
  AND auth_id != '';

-- Verify the fix - should show no records with broken format
SELECT id, name, auth_id, username 
FROM students 
WHERE auth_id NOT LIKE '%@%' 
  AND auth_id IS NOT NULL;

-- Show all students with corrected auth_id format
SELECT id, name, auth_id, username 
FROM students 
WHERE auth_id LIKE '%@student.mathtagumpay.com'
ORDER BY id;

-- Count of students fixed
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN auth_id LIKE '%@student.mathtagumpay.com' THEN 1 END) as correct_format,
  COUNT(CASE WHEN auth_id NOT LIKE '%@%' AND auth_id IS NOT NULL THEN 1 END) as broken_format
FROM students;