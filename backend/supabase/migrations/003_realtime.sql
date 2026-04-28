-- Add tables to the realtime publication so the app can subscribe to changes
alter publication supabase_realtime add table public.readings;
alter publication supabase_realtime add table public.app_config;
alter publication supabase_realtime add table public.device_commands;
