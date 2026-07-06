-- Per-user AI model preference (cross-device). Written by the backend with the
-- service role; validated against the model whitelist in application code.
alter table public.users add column if not exists preferred_model text;
