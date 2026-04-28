-- Enable RLS on all tables
alter table public.devices enable row level security;
alter table public.readings enable row level security;
alter table public.device_commands enable row level security;
alter table public.app_config enable row level security;

-- Public read access for the app (it uses the anon key)
-- Readings: anyone with anon key can read
create policy "readings are readable by anon"
  on public.readings
  for select
  to anon
  using (true);

-- App config: anyone can read, only service role can write
create policy "config is readable by anon"
  on public.app_config
  for select
  to anon
  using (true);

-- Devices: readable by anon for status checks
create policy "devices are readable by anon"
  on public.devices
  for select
  to anon
  using (true);

-- Device commands: anon can insert (to send commands from app)
create policy "anon can insert device commands"
  on public.device_commands
  for insert
  to anon
  with check (true);

create policy "anon can read own device commands"
  on public.device_commands
  for select
  to anon
  using (true);

-- Service role (used by edge functions) has full access by default
-- No explicit policies needed for service_role
