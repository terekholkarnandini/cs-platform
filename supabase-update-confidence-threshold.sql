-- Run this in Supabase SQL editor to update existing records
-- that still have the old default confidence_threshold of 0.75

UPDATE public.ai_configuration
SET confidence_threshold = 0.50,
    updated_at = now()
WHERE confidence_threshold = 0.75;
