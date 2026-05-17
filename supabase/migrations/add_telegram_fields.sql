-- Add telegram_group_title and telegram_linked_at to community_profiles
-- These fields were added to the backend implementation but may not exist in the database yet

ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS telegram_group_title TEXT,
ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN community_profiles.telegram_group_title IS 'Title/name of the linked Telegram group';
COMMENT ON COLUMN community_profiles.telegram_linked_at IS 'Timestamp when the Telegram group was linked';
