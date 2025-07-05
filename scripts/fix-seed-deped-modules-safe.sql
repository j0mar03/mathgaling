-- Safe Seed DepEd Modules Script
-- This script safely updates the database without constraint conflicts
-- Run this in Supabase SQL editor

-- First, safely drop the view if it exists
DROP VIEW IF EXISTS deped_module_overview;

-- Check if Module 2 already exists, if not insert it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM deped_modules 
        WHERE module_number = 2 
        AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025')
    ) THEN
        INSERT INTO deped_modules (quarter_id, module_number, title, description, estimated_weeks, order_index, is_active) VALUES
        (
            (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3 AND school_year = '2024-2025'),
            2,
            'Module 2: Paghahambing at Pagkakaayos ng mga Numero',
            'Learn to compare, order, and round numbers from 1001 to 10,000',
            4,
            2,
            true
        );
    END IF;
END $$;

-- Check if Module 3 already exists, if not insert it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM deped_modules 
        WHERE module_number = 3 
        AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 2 AND grade_level = 3 AND school_year = '2024-2025')
    ) THEN
        -- First ensure Quarter 2 exists
        IF NOT EXISTS (SELECT 1 FROM deped_quarters WHERE quarter_number = 2 AND grade_level = 3 AND school_year = '2024-2025') THEN
            INSERT INTO deped_quarters (quarter_number, title, grade_level, school_year, start_date, end_date, is_active) VALUES
            (2, 'Ikalawang Markahan', 3, '2024-2025', '2024-11-01', '2025-01-31', true);
        END IF;
        
        -- Then insert Module 3
        INSERT INTO deped_modules (quarter_id, module_number, title, description, estimated_weeks, order_index, is_active) VALUES
        (
            (SELECT id FROM deped_quarters WHERE quarter_number = 2 AND grade_level = 3 AND school_year = '2024-2025'),
            3,
            'Module 3: Ordinal Numbers at Pera',
            'Learn ordinal numbers from 1st to 100th and identify, read, and write Philippine money',
            3,
            1,
            true
        );
    END IF;
END $$;

-- Get the Module 2 ID for competencies
DO $$
DECLARE
    module2_id INTEGER;
BEGIN
    SELECT id INTO module2_id 
    FROM deped_modules 
    WHERE module_number = 2 
    AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 1 AND grade_level = 3);

    -- Delete existing competencies for Module 2 to avoid duplicates
    DELETE FROM learning_competencies WHERE module_id = module2_id;

    -- Insert KC4 competency
    INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
    (
        module2_id,
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
    );

    -- Insert KC5 competency
    INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
    (
        module2_id,
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
    );

    -- Insert KC6 competency
    INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
    (
        module2_id,
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

END $$;

-- Get the Module 3 ID for competencies
DO $$
DECLARE
    module3_id INTEGER;
BEGIN
    SELECT id INTO module3_id 
    FROM deped_modules 
    WHERE module_number = 3 
    AND quarter_id = (SELECT id FROM deped_quarters WHERE quarter_number = 2 AND grade_level = 3);

    -- Only proceed if Module 3 exists
    IF module3_id IS NOT NULL THEN
        -- Delete existing competencies for Module 3 to avoid duplicates
        DELETE FROM learning_competencies WHERE module_id = module3_id;

        -- Insert KC7 competency
        INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
        (
            module3_id,
            'M3NS-Ic-7',
            'KC7: Understanding Ordinal Numbers from 1st to 100th',
            ARRAY[
                'Identify ordinal numbers from 1st to 100th, emphasizing positions from 21st to 100th',
                'Use point of reference as starting point for counting positions',
                'Write ordinal numbers in symbols using proper superscript rules (st, nd, rd, th)',
                'Write ordinal numbers in Filipino words using "ika-" prefix',
                'Apply ordinal number knowledge to real-world contexts like birthdays and sequences',
                'Practice with Filipino alphabet and repeated sequences for position counting'
            ],
            2
        );

        -- Insert KC8 competency
        INSERT INTO learning_competencies (module_id, melc_code, competency_text, learning_objectives, difficulty_level) VALUES
        (
            module3_id,
            'M3NS-Id-8-9',
            'KC8: Identifying, Reading, and Writing Money',
            ARRAY[
                'Identify Philippine coins and bills by their features, colors, and heroes',
                'Read money amounts in symbols using PhP notation with proper decimal placement',
                'Write money amounts in Filipino words following pesos-first, centavos-second pattern',
                'Convert between symbolic and word forms of money amounts',
                'Recognize coin and bill denominations from 1 sentimo to Php 1000',
                'Apply money knowledge to real-world scenarios like piggy banks and shopping'
            ],
            2
        );
    END IF;

END $$;

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
    COALESCE(COUNT(mcm.content_item_id), 0) as content_item_count
FROM deped_quarters q
JOIN deped_modules m ON q.id = m.quarter_id
LEFT JOIN learning_competencies lc ON m.id = lc.module_id
LEFT JOIN module_content_mapping mcm ON m.id = mcm.module_id
GROUP BY q.id, q.quarter_number, q.title, q.grade_level, m.id, m.module_number, m.title, m.description, m.estimated_weeks, m.order_index
ORDER BY q.quarter_number, m.order_index;

-- Verify the results
SELECT 'Modules 2 and 3 setup completed successfully!' as message;

-- Show all modules
SELECT 
    quarter_number,
    module_number,
    module_title,
    competency_count,
    estimated_weeks
FROM deped_module_overview 
WHERE grade_level = 3 
ORDER BY quarter_number, module_number;

-- Show the new Module 2 and 3 competencies
SELECT 
    q.quarter_number,
    m.module_number,
    CONCAT('Module ', m.module_number, ' Competencies:') as info,
    lc.melc_code,
    lc.competency_text
FROM deped_modules m
JOIN deped_quarters q ON m.quarter_id = q.id
JOIN learning_competencies lc ON m.id = lc.module_id
WHERE m.module_number IN (2, 3)
AND q.quarter_number IN (1, 2) 
AND q.grade_level = 3
ORDER BY q.quarter_number, m.module_number, lc.melc_code;