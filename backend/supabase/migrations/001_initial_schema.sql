-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;

-- Devices table: registered hardware devices
create table if not exists public.devices (
  id text primary key,
  name text,
  firmware_version text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

comment on table public.devices is 'Physical hardware devices that send vibration data';

-- Readings table: frequency readings from the AI classifier
create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.devices(id) on delete cascade,
  frequency_hz numeric not null check (frequency_hz >= 0 and frequency_hz <= 999999),
  confidence numeric check (confidence >= 0 and confidence <= 1),
  raw_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists readings_device_created_idx
  on public.readings(device_id, created_at desc);

comment on table public.readings is 'Classified frequency readings from tendon vibration data';

-- Device commands: record/stop instructions sent to devices
create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.devices(id) on delete cascade,
  command text not null check (command in ('start', 'stop', 'reset', 'calibrate')),
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists device_commands_pending_idx
  on public.device_commands(device_id, acknowledged, created_at desc)
  where acknowledged = false;

comment on table public.device_commands is 'Commands sent from app to device, polled by device';

-- App config: editable settings the web app reads at runtime
create table if not exists public.app_config (
  key text primary key,
  value text,
  description text,
  updated_at timestamptz not null default now()
);

comment on table public.app_config is 'Runtime config for the web app, editable from admin panel';

-- Seed default config values
insert into public.app_config (key, value, description) values
  ('title', 'Tendon Monitor', 'App title shown at top of screen'),
  ('max_hz', '2000', 'Maximum frequency shown in the ring'),
  ('min_hz', '0', 'Minimum frequency'),
  ('color_low', '#E24B4A', 'Color for low frequency readings'),
  ('color_mid', '#EF9F27', 'Color for mid frequency readings'),
  ('color_high', '#639922', 'Color for high frequency readings'),
  ('ring_size', '240', 'Ring diameter in pixels'),
  ('bar_count', '5', 'Number of bars to show in chart'),
  ('reading_interval_ms', '1200', 'How often the device should send readings'),
  ('demo_reading_max_hz', '2000', 'Max Hz for demo mode readings'),
  ('builder_content_id', '', 'Builder.io content ID for dynamic layout, leave empty to use default')
on conflict (key) do nothing;

-- Seed a default device so dev/demo works out of the box
insert into public.devices (id, name) values
  ('default', 'Default Device')
on conflict (id) do nothing;
