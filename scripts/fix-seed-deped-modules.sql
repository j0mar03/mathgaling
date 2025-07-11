-- Fix Seed DepEd Modules Script
-- This script safely updates the database without view conflicts
-- Run this in Supabase SQL editor

-- First, safely drop the view if it exists
DROP VIEW IF EXISTS deped_module_overview;

-- Insert Module 2 data only (Module 1 should already exist)
INSERT INTO deped_modules (quarter_id, module_number, title, description, estimated_weeks, order_index, is_active) VALUES
(
    (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025'),
    2,
    'Module 2: Paghahambing at Pagkakaayos ng mga Numero',
    'Learn to compare, order, and round numbers from 1001 to 10,000',
    4,
    2,
    true
)
ON CONFLICT (quarter_id, module_number) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    estimated_weeks = EXCLUDED.estimated_weeks,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active;

-- Insert Learning Competencies for Module 2
INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
(
    (SELECT id FROM deped_modules WHERE module_number = 2 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ib-5.1-2',
    'KC4: Comparing Numbers up to 10,000 using symbols (>, <, =)',
    ARRAY[
        'Compare numbers up to 10,000 using the symbols >, <, and =',
        'Compare the number of digits first - more digits means larger number',
        'If digits are equal, compare from left to right starting with thousands',
        'Use real-world contexts like tree planting and school data',
        'Identify place value to determine which digit has largest value',
        'Apply comparison skills in practical problem-solving scenarios'
    ],
    2
),
(
    (SELECT id FROM deped_modules WHERE module_number = 2 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ic-6.1-2',
    'KC5: Ordering Numbers with 4 to 5 Digits in ascending or descending order',
    ARRAY[
        'Order numbers with 4-5 digits from smallest to largest (ascending) or largest to smallest (descending)',
        'Compare numbers from left to right to determine their order',
        'Arrange numbers in pataas (ascending) order from smallest to largest',
        'Arrange numbers in pababa (descending) order from largest to smallest',
        'Apply ordering skills to real-world data like market weights',
        'Solve problems involving sequencing and ranking of numerical data'
    ],
    2
),
(
    (SELECT id FROM deped_modules WHERE module_number = 2 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ib-4.1-3',
    'KC6: Rounding Numbers to the Nearest Tens, Hundreds, and Thousands',
    ARRAY[
        'Round numbers to the nearest tens, hundreds, and thousands',
        'Apply rounding rules: 0-4 rounds down (pababa), 5-9 rounds up (pataas)',
        'Round to nearest tens by looking at ones place digit',
        'Round to nearest hundreds by looking at tens place digit', 
        'Round to nearest thousands by looking at hundreds place digit',
        'Use rounding for estimation in practical situations like shopping and measurements'
    ],
    1
)
ON CONFLICT (module_id, melc_code) DO UPDATE SET
    competency_text = EXCLUDED.competency_text,
    learning_objectives = EXCLUDED.learning_objectives,
    difficulty_level = EXCLUDED.difficulty_level;

-- Recreate the view with proper structure
CREATE VIEW deped_module_overview AS
SELECT 
    q.quarter_number,
    q.title as quarter_title,
    q.grade_level,
    m.id as module_id,
    m.module_number,
    m.title as module_title,
    m.description as module_description,
    m.estimated_weeks,
    m.order_index,
    COUNT(lc.id) as competency_count,
    COUNT(mcm.content_item_id) as content_item_count
FROM deped_quarters q
JOIN deped_modules m ON q.id = m.quarter_id
LEFT JOIN learning_competencies lc ON m.id = lc.module_id
LEFT JOIN module_content_mapping mcm ON m.id = mcm.module_id
GROUP BY q.id, q.quarter_number, q.title, q.grade_level, m.id, m.module_number, m.title, m.description, m.estimated_weeks, m.order_index
ORDER BY q.quarter_number, m.order_index;

-- Verify the results
SELECT 'Module 2 setup completed successfully!' as message;
SELECT 
    module_number,
    module_title,
    competency_count,
    estimated_weeks
FROM deped_module_overview 
WHERE grade_level = 3 
ORDER BY module_number;

-- Show the new competencies
SELECT 
    m.module_number,
    m.title as module_title,
    lc.melc_code,
    lc.competency_text
FROM deped_modules m
JOIN learning_competencies lc ON m.id = lc.module_id
WHERE m.module_number IN (1, 2)
ORDER BY m.module_number, lc.melc_code;