-- =============================================================
-- RLS Policies for Visiting Media AI Studio V2
-- =============================================================
-- NOTE: All API routes use the service_role key which bypasses RLS.
-- These policies provide defense-in-depth for anon key access
-- and serve as documentation of the access model.
--
-- Access model:
-- - vm_admin: full access to all hotels
-- - hotel_user: access only to their assigned hotel's data
-- =============================================================

-- Drop existing permissive policies
drop policy if exists "Service role full access" on vas_hotels;
drop policy if exists "Service role full access" on vas_users;
drop policy if exists "Service role full access" on vas_space_types;
drop policy if exists "Service role full access" on vas_spaces;
drop policy if exists "Service role full access" on vas_photos;
drop policy if exists "Service role full access" on vas_people;
drop policy if exists "Service role full access" on vas_generations;
drop policy if exists "Service role full access" on vas_projects;

-- =============================================================
-- vas_hotels: users can only see their assigned hotel
-- =============================================================
create policy "Users can view their hotel"
  on vas_hotels for select
  using (
    id in (
      select hotel_id from vas_users
      where email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    or exists (
      select 1 from vas_users
      where email = current_setting('request.jwt.claims', true)::json->>'email'
        and role = 'vm_admin'
    )
  );

-- =============================================================
-- vas_users: users can only see themselves
-- =============================================================
create policy "Users can view themselves"
  on vas_users for select
  using (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    or exists (
      select 1 from vas_users
      where email = current_setting('request.jwt.claims', true)::json->>'email'
        and role = 'vm_admin'
    )
  );

-- =============================================================
-- Hotel-scoped tables: access by hotel_id
-- Pattern: user's hotel_id must match the row's hotel_id
-- =============================================================

-- Helper function to check hotel access
create or replace function vas_user_has_hotel_access(check_hotel_id uuid)
returns boolean as $$
  select exists (
    select 1 from vas_users
    where email = current_setting('request.jwt.claims', true)::json->>'email'
      and (role = 'vm_admin' or hotel_id = check_hotel_id)
  );
$$ language sql security definer stable;

-- vas_space_types
create policy "Hotel-scoped access" on vas_space_types
  for all using (vas_user_has_hotel_access(hotel_id));

-- vas_spaces
create policy "Hotel-scoped access" on vas_spaces
  for all using (vas_user_has_hotel_access(hotel_id));

-- vas_photos
create policy "Hotel-scoped access" on vas_photos
  for all using (vas_user_has_hotel_access(hotel_id));

-- vas_people
create policy "Hotel-scoped access" on vas_people
  for all using (vas_user_has_hotel_access(hotel_id));

-- vas_projects
create policy "Hotel-scoped access" on vas_projects
  for all using (vas_user_has_hotel_access(hotel_id));

-- vas_generations
create policy "Hotel-scoped access" on vas_generations
  for all using (vas_user_has_hotel_access(hotel_id));
