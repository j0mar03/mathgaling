-- DepEd Grade 3 Mathematics Module Data Seeding Script
-- Based on official DepEd curriculum: "Unang Markahan - Modyul 1: Numero at Ang Kahulugan Nito"
-- Run this after creating the DepEd module system schema

-- Insert Grade 3 Quarters
INSERT INTO deped_quarters (quarter_number, title, description, grade_level, school_year) VALUES
(1, 'Unang Markahan', 'First Quarter - Numbers and Basic Operations', 3, '2024-2025'),
(2, 'Ikalawang Markahan', 'Second Quarter - Addition and Subtraction', 3, '2024-2025'),
(3, 'Ikatlong Markahan', 'Third Quarter - Multiplication and Division', 3, '2024-2025'),
(4, 'Ikaapat na Markahan', 'Fourth Quarter - Fractions and Geometry', 3, '2024-2025')
ON CONFLICT (quarter_number, grade_level, school_year) DO NOTHING;

-- Insert Module 1: Numero at Ang Kahulugan Nito
INSERT INTO deped_modules (quarter_id, module_number, title, description, estimated_weeks, order_index, is_active) VALUES
(
    (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025'),
    1,
    'Numero at Ang Kahulugan Nito',
    'Students will learn to represent, identify, read, and write numbers from 1001 to 10,000 using various methods and tools including blocks, flats, longs, squares, number discs, and straw bundles.',
    3,
    1,
    true
),
(
    (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025'),
    2,
    'Module 2: Paghahambing at Pagkakaayos ng mga Numero',
    'Comparison and ordering of numbers from 1001 to 10,000',
    2,
    2,
    true
),
(
    (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025'),
    3,
    'Module 3: Pagdadagdag ng mga Numero',
    'Addition of numbers with and without regrouping',
    3,
    3,
    true
),
(
    (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025'),
    2,
    'Module 2: Paghahambing at Pagkakaayos ng mga Numero',
    'Learn to compare, order, and round numbers from 1001 to 10,000',
    4,
    2,
    true
),
(
    (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025'),
    4,
    'Module 4: Pagbabawas ng mga Numero',
    'Subtraction of numbers with and without regrouping',
    3,
    4,
    true
)
ON CONFLICT (quarter_id, module_number) DO NOTHING;

-- Insert Learning Competencies for Module 1
INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
(
    (SELECT id FROM deped_modules WHERE module_number = 1 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ia-9.1',
    'Representing Numbers from 1001 to 10,000',
    ARRAY[
        'Students will learn to represent numbers from 1001 to 10,000 using visual aids such as blocks, flats, longs, squares, number discs, and straw bundles',
        'Use blocks to represent 1000 units (1 block = 1000)',
        'Use flats to represent 100 units (1 flat = 10 longs = 100 units)',
        'Use longs to represent 10 units (1 long = 10 squares)',
        'Use squares to represent 1 unit',
        'Represent numbers using number discs for thousands, hundreds, tens, and ones',
        'Use straw bundles to represent large numbers'
    ],
    2
),
(
    (SELECT id FROM deped_modules WHERE module_number = 1 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ia-9.2',
    'Identifying Place Value and Value of Digits in 4- to 5-Digit Numbers',
    ARRAY[
        'Students will identify the place value (libuhan/thousands, sandaanan/hundreds, sampuan/tens, isahan/ones) and the value of each digit in 4- to 5-digit numbers',
        'Identify libuhan (thousands place) and its value',
        'Identify sandaanan (hundreds place) and its value',
        'Identify sampuan (tens place) and its value',
        'Identify isahan (ones place) and its value',
        'Fill in place value charts for 4-5 digit numbers',
        'Construct smallest and largest 4-digit numbers using given digits'
    ],
    3
),
(
    (SELECT id FROM deped_modules WHERE module_number = 1 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ia-9.3',
    'Reading and Writing Numbers from 1001 to 10,000 in Symbols and Words',
    ARRAY[
        'Students will read and write numbers from 1001 to 10,000 in both numerical symbols and words',
        'Read numbers from left to right, starting with the highest place value (thousands) to the lowest (ones)',
        'Write numbers in symbols according to their place value',
        'Write numbers in Filipino words using proper naming conventions',
        'Convert numbers between symbols and words',
        'Match numbers in symbols to their word form in Filipino',
        'Use contextual examples like birth years and real-world scenarios'
    ],
    3
);

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
);

-- Map existing Knowledge Components to Module 1
-- This assumes your existing KC1, KC2, KC3 correspond to the module competencies
INSERT INTO module_content_mapping (module_id, content_item_id)
SELECT 
    (SELECT id FROM deped_modules WHERE module_number = 1 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    ci.id
FROM content_items ci
WHERE ci.knowledge_component_id IN (
    SELECT id FROM knowledge_components 
    WHERE name LIKE '%Representing Numbers from 1001 to 10,000%'
    OR name LIKE '%Place Value%'
    OR name LIKE '%Reading and Writing Numbers%'
    OR id IN (1, 2, 3) -- Assuming KC1, KC2, KC3 are the first three KCs
)
ON CONFLICT (module_id, content_item_id) DO NOTHING;

-- Insert sample Module 2 competencies (placeholder - to be updated with actual DepEd data)
INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
(
    (SELECT id FROM deped_modules WHERE module_number = 2 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ib-10.1',
    'Comparing Numbers from 1001 to 10,000',
    ARRAY[
        'Compare numbers using greater than, less than, and equal to',
        'Use symbols >, <, = to compare numbers',
        'Arrange numbers in ascending and descending order',
        'Identify the largest and smallest numbers in a set'
    ],
    2
),
(
    (SELECT id FROM deped_modules WHERE module_number = 2 AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3)),
    'M3NS-Ib-10.2',
    'Ordering Numbers from 1001 to 10,000',
    ARRAY[
        'Arrange numbers in ascending order (smallest to largest)',
        'Arrange numbers in descending order (largest to smallest)',
        'Use number lines to order numbers',
        'Find missing numbers in sequences'
    ],
    2
);

-- Create a view for easy module access
CREATE OR REPLACE VIEW deped_module_overview AS
SELECT 
    q.quarter_number,
    q.title as quarter_title,
    q.grade_level,
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

-- Create function to get student module progress
CREATE OR REPLACE FUNCTION get_student_module_progress(student_id_param INTEGER)
RETURNS TABLE (
    quarter_number INTEGER,
    quarter_title TEXT,
    module_number INTEGER,
    module_title TEXT,
    module_description TEXT,
    completion_percentage DECIMAL(5,2),
    questions_answered INTEGER,
    questions_correct INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_activity_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.quarter_number,
        q.title::TEXT as quarter_title,
        m.module_number,
        m.title::TEXT as module_title,
        m.description::TEXT as module_description,
        COALESCE(smp.completion_percentage, 0.00) as completion_percentage,
        COALESCE(smp.questions_answered, 0) as questions_answered,
        COALESCE(smp.questions_correct, 0) as questions_correct,
        smp.started_at,
        smp.completed_at,
        smp.last_activity_at
    FROM deped_quarters q
    JOIN deped_modules m ON q.id = m.quarter_id
    LEFT JOIN student_module_progress smp ON m.id = smp.module_id AND smp.student_id = student_id_param
    WHERE q.grade_level = (SELECT grade_level FROM students WHERE id = student_id_param)
    ORDER BY q.quarter_number, m.order_index;
END;
$$ LANGUAGE plpgsql;

-- Insert initial progress for existing students (optional)
INSERT INTO student_module_progress (student_id, module_id, completion_percentage, questions_answered, questions_correct)
SELECT 
    s.id as student_id,
    m.id as module_id,
    0.00 as completion_percentage,
    0 as questions_answered,
    0 as questions_correct
FROM students s
CROSS JOIN deped_modules m
JOIN deped_quarters q ON m.quarter_id = q.id
WHERE s.grade_level = q.grade_level
AND NOT EXISTS (
    SELECT 1 FROM student_module_progress smp 
    WHERE smp.student_id = s.id AND smp.module_id = m.id
)
ON CONFLICT (student_id, module_id) DO NOTHING;

-- Success message
SELECT 
    'DepEd Grade 3 Module 1 data seeded successfully!' as message,
    COUNT(DISTINCT q.id) as quarters_created,
    COUNT(DISTINCT m.id) as modules_created,
    COUNT(lc.id) as competencies_created,
    COUNT(DISTINCT smp.student_id) as students_initialized
FROM deped_quarters q
LEFT JOIN deped_modules m ON q.id = m.quarter_id
LEFT JOIN learning_competencies lc ON m.id = lc.module_id
LEFT JOIN student_module_progress smp ON m.id = smp.module_id
WHERE q.grade_level = 3;