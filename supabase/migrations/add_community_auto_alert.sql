-- Migration: Add auto_alert_enabled to community_profiles for automatic EWS notifications
-- This enables communities to receive automatic Telegram alerts when warning levels change
-- for sensors they have subscribed to.

-- Add auto_alert_enabled column
ALTER TABLE public.community_profiles 
ADD COLUMN IF NOT EXISTS auto_alert_enabled boolean DEFAULT false;

-- Add index for efficient querying of enabled communities
CREATE INDEX IF NOT EXISTS idx_community_profiles_auto_alert 
ON public.community_profiles (auto_alert_enabled) 
WHERE auto_alert_enabled = true AND telegram_group_id IS NOT NULL;

-- Create view for eligible community subscribers with auto-alert enabled
CREATE OR REPLACE VIEW public.v_ews_eligible_communities AS
SELECT
  cs.community_id AS user_id,
  cs.sensor_id,
  cp.telegram_group_id,
  cp.telegram_group_title,
  cp.auto_alert_enabled,
  cs.created_at AS subscribed_at
FROM public.community_subscriptions cs
JOIN public.community_profiles cp ON cp.user_id = cs.community_id
WHERE cp.telegram_group_id IS NOT NULL
  AND cp.auto_alert_enabled = true;

COMMENT ON VIEW public.v_ews_eligible_communities IS 
'Communities with auto-alert enabled that should receive EWS notifications for their subscribed sensors';
