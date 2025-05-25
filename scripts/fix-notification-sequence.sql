-- Fix notification sequence issues
-- This script addresses duplicate key errors in notifications table

-- Check current notifications
SELECT id, user_id, type, title, created_at FROM notifications ORDER BY id;

-- Check the maximum ID in the table
SELECT MAX(id) as max_id FROM notifications;

-- Check the current sequence value (use last_value instead of currval)
SELECT last_value, is_called FROM notifications_id_seq;

-- Reset the sequence to be higher than the maximum ID
-- This ensures the next auto-generated ID won't conflict with existing data
SELECT setval('notifications_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM notifications), 0), (SELECT last_value FROM notifications_id_seq)) + 1, false);

-- Verify the sequence has been updated
SELECT last_value, is_called FROM notifications_id_seq;

-- Alternative commands if you want to clear all notifications and restart from 1:
-- DELETE FROM notifications;
-- SELECT setval('notifications_id_seq', 1, false);