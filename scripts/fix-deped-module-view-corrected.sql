-- Fix DepEd Module Overview View to include module ID
-- Drop and recreate the view to add module_id column
-- Run this in Supabase to update the view

-- Drop the existing view first
DROP VIEW IF EXISTS deped_module_overview;

-- Recreate the view with module_id included
CREATE VIEW deped_module_overview AS
SELECT 
    q.quarter_number,
    q.title as quarter_title,
    q.grade_level,
    m.id as module_id,  -- Add the actual module ID
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

-- Test the view
SELECT 'DepEd Module Overview view updated successfully!' as message;
SELECT * FROM deped_module_overview WHERE grade_level = 3 LIMIT 5;