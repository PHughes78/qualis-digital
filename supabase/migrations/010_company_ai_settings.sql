-- Migration: Add AI assistant settings to company profile

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS chatgpt_api_key TEXT;

COMMENT ON COLUMN public.company_settings.chatgpt_api_key IS 'Encrypted ChatGPT API key used for in-app guidance.';
