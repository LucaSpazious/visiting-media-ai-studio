-- Hotels
create table if not exists vas_hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  location text,
  country text,
  star_rating int,
  status text default 'active',
  created_at timestamptz default now()
);

-- Users (standalone, not referencing auth.users for flexibility with NextAuth)
create table if not exists vas_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  password_hash text,
  role text not null default 'hotel_user',
  hotel_id uuid references vas_hotels(id),
  created_at timestamptz default now()
);

-- Space types
create table if not exists vas_space_types (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references vas_hotels(id),
  name text not null,
  created_at timestamptz default now()
);

-- Specific spaces
create table if not exists vas_spaces (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references vas_hotels(id),
  space_type_id uuid references vas_space_types(id),
  name text not null,
  created_at timestamptz default now()
);

-- Photos
create table if not exists vas_photos (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references vas_hotels(id),
  space_id uuid references vas_spaces(id),
  space_type_id uuid references vas_space_types(id),
  original_url text not null,
  filename text not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- People bank
create table if not exists vas_people (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references vas_hotels(id),
  name text not null,
  image_url text not null,
  created_at timestamptz default now()
);

-- Generations
create table if not exists vas_generations (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid references vas_photos(id),
  hotel_id uuid references vas_hotels(id),
  theme text not null,
  person_id uuid references vas_people(id),
  prompt text,
  result_url text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table vas_hotels enable row level security;
alter table vas_users enable row level security;
alter table vas_space_types enable row level security;
alter table vas_spaces enable row level security;
alter table vas_photos enable row level security;
alter table vas_people enable row level security;
alter table vas_generations enable row level security;

-- Allow service role full access (API routes use service role key)
create policy "Service role full access" on vas_hotels for all using (true);
create policy "Service role full access" on vas_users for all using (true);
create policy "Service role full access" on vas_space_types for all using (true);
create policy "Service role full access" on vas_spaces for all using (true);
create policy "Service role full access" on vas_photos for all using (true);
create policy "Service role full access" on vas_people for all using (true);
create policy "Service role full access" on vas_generations for all using (true);
