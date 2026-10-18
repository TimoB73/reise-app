-- Reise-App: Tabellen, Zugriffsregeln (RLS) und Funktionen für Kopplung, Favoriten und Positionen.
-- Einmalig im Supabase SQL Editor ausführen.

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  start_date date not null,
  end_date date not null,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- „Gemerkt“ und „Besucht“ gelten pro Person.
create table public.favorites (
  trip_id uuid not null,
  user_id uuid not null,
  poi_id text not null check (char_length(poi_id) <= 40),
  name text not null check (char_length(name) <= 200),
  kind text not null check (char_length(kind) <= 30),
  lat double precision not null,
  lng double precision not null,
  saved boolean not null default false,
  visited boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id, poi_id),
  foreign key (trip_id, user_id) references public.members (trip_id, user_id) on delete cascade
);

-- Eine Zeile pro Person; lat/lng sind leer, wenn die Standortfreigabe aus ist.
create table public.positions (
  trip_id uuid not null,
  user_id uuid not null,
  lat double precision,
  lng double precision,
  accuracy real,
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id),
  foreign key (trip_id, user_id) references public.members (trip_id, user_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen (security definer, damit RLS-Prüfungen nicht rekursiv werden)
-- ---------------------------------------------------------------------------

create function public.is_trip_member(p_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m where m.trip_id = p_trip and m.user_id = auth.uid()
  );
$$;

-- Schreiben ist bis einschließlich Enddatum erlaubt (ein Tag Puffer für Zeitzonen).
create function public.is_trip_active(p_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t where t.id = p_trip and t.end_date + 1 >= current_date
  );
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger favorites_touch before insert or update on public.favorites
  for each row execute function public.touch_updated_at();
create trigger positions_touch before insert or update on public.positions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Zugriffsregeln (RLS): nur Mitglieder sehen die Daten ihrer Reise
-- ---------------------------------------------------------------------------

alter table public.trips enable row level security;
alter table public.members enable row level security;
alter table public.favorites enable row level security;
alter table public.positions enable row level security;

-- Reisen werden nur über create_trip/join_trip angelegt bzw. betreten.
create policy "Mitglieder sehen ihre Reise" on public.trips
  for select to authenticated using (public.is_trip_member(id));

create policy "Mitglieder sehen Mitreisende" on public.members
  for select to authenticated using (public.is_trip_member(trip_id));
create policy "Eigenen Namen ändern" on public.members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Reise verlassen" on public.members
  for delete to authenticated using (user_id = auth.uid());

create policy "Mitglieder sehen Favoriten" on public.favorites
  for select to authenticated using (public.is_trip_member(trip_id));
create policy "Eigene Favoriten anlegen" on public.favorites
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_trip_member(trip_id) and public.is_trip_active(trip_id));
create policy "Eigene Favoriten ändern" on public.favorites
  for update to authenticated
  using (user_id = auth.uid() and public.is_trip_active(trip_id))
  with check (user_id = auth.uid() and public.is_trip_member(trip_id) and public.is_trip_active(trip_id));

create policy "Mitglieder sehen Positionen" on public.positions
  for select to authenticated using (public.is_trip_member(trip_id));
create policy "Eigene Position anlegen" on public.positions
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_trip_member(trip_id) and public.is_trip_active(trip_id));
create policy "Eigene Position ändern" on public.positions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_trip_member(trip_id) and public.is_trip_active(trip_id));

-- ---------------------------------------------------------------------------
-- Funktionen für die App
-- ---------------------------------------------------------------------------

-- 6-stelliger Code ohne leicht verwechselbare Zeichen (0/O, 1/I/L)
create function public.generate_trip_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text;
  bytes bytea;
begin
  loop
    bytes := extensions.gen_random_bytes(6);
    result := '';
    for i in 0..5 loop
      result := result || substr(alphabet, 1 + get_byte(bytes, i) % length(alphabet), 1);
    end loop;
    exit when not exists (select 1 from public.trips where code = result);
  end loop;
  return result;
end;
$$;

create function public.create_trip(p_name text, p_start date, p_end date, p_display_name text)
returns public.trips
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.trips;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(trim(coalesce(p_display_name, ''))) = 0 then
    raise exception 'invalid_name';
  end if;
  if p_end < p_start then
    raise exception 'invalid_dates';
  end if;

  insert into public.trips (name, start_date, end_date, code, created_by)
  values (trim(p_name), p_start, p_end, public.generate_trip_code(), auth.uid())
  returning * into t;

  insert into public.members (trip_id, user_id, display_name)
  values (t.id, auth.uid(), trim(p_display_name));

  return t;
end;
$$;

-- Tritt einer Reise bei. Höchstens 2 Personen, nicht nach dem Enddatum.
create function public.join_trip(p_code text, p_display_name text)
returns public.trips
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.trips;
  member_count int;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(trim(coalesce(p_display_name, ''))) = 0 then
    raise exception 'invalid_name';
  end if;

  select * into t from public.trips
  where code = upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'))
  for update;

  if not found then
    raise exception 'trip_not_found';
  end if;

  -- schon Mitglied: nur Namen aktualisieren
  if exists (select 1 from public.members where trip_id = t.id and user_id = auth.uid()) then
    update public.members set display_name = trim(p_display_name)
    where trip_id = t.id and user_id = auth.uid();
    return t;
  end if;

  if t.end_date + 1 < current_date then
    raise exception 'trip_archived';
  end if;

  select count(*) into member_count from public.members where trip_id = t.id;
  if member_count >= 2 then
    raise exception 'trip_full';
  end if;

  insert into public.members (trip_id, user_id, display_name)
  values (t.id, auth.uid(), trim(p_display_name));

  return t;
end;
$$;

-- Wer die Reise angelegt hat, kann den Platz des Partners freigeben
-- (z. B. wenn dessen App gelöscht wurde und er neu beitreten muss).
create function public.remove_partner(p_trip uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.trips where id = p_trip and created_by = auth.uid()) then
    raise exception 'not_allowed';
  end if;
  delete from public.members where trip_id = p_trip and user_id <> auth.uid();
end;
$$;

revoke execute on function public.generate_trip_code() from public, anon, authenticated;
revoke execute on function public.create_trip(text, date, date, text) from public, anon;
revoke execute on function public.join_trip(text, text) from public, anon;
revoke execute on function public.remove_partner(uuid) from public, anon;
grant execute on function public.create_trip(text, date, date, text) to authenticated;
grant execute on function public.join_trip(text, text) to authenticated;
grant execute on function public.remove_partner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Echtzeit-Updates für Favoriten, Positionen und Mitglieder
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.favorites, public.positions, public.members;
