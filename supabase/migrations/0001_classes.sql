-- PartyMates · classes, teams and leaderboards.
--
-- Privacy by design for a children's app:
--   · no accounts, no e-mail, no real names: a member is a nickname, an emoji avatar and scores;
--   · tables are closed by RLS (no policies), the app can only call the pm_* functions below;
--   · a class is reachable only by its 6-character code, a member row only with its device secret.

create table if not exists pm_classes (
  code text primary key check (code ~ '^[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists pm_teams (
  id uuid primary key default gen_random_uuid(),
  class_code text not null references pm_classes (code) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now()
);
create index if not exists pm_teams_class on pm_teams (class_code);

create table if not exists pm_members (
  id uuid primary key,
  secret uuid not null,
  class_code text not null references pm_classes (code) on delete cascade,
  name text not null check (char_length(name) between 1 and 14),
  skin text not null check (char_length(skin) <= 16),
  color text not null check (char_length(color) <= 24),
  pet text check (char_length(pet) <= 16),
  stars int not null default 0 check (stars between 0 and 100000),
  xp int not null default 0 check (xp between 0 and 100000000),
  week_xp int not null default 0 check (week_xp >= 0),
  week text not null default '',
  team_id uuid references pm_teams (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists pm_members_class on pm_members (class_code);

alter table pm_classes enable row level security;
alter table pm_teams enable row level security;
alter table pm_members enable row level security;

create or replace function pm_create_class(p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') into v_code from generate_series(1, 6);
    begin
      insert into pm_classes (code, name) values (v_code, btrim(p_name));
      return v_code;
    exception when unique_violation then
      -- extremely unlikely collision: draw another code
    end;
  end loop;
end $$;

create or replace function pm_get_class(p_code text) returns json
language sql security definer stable set search_path = public as $$
  select json_build_object(
    'code', c.code,
    'name', c.name,
    'teams', coalesce((
      select json_agg(json_build_object('id', t.id, 'name', t.name, 'emoji', t.emoji) order by t.created_at)
      from pm_teams t where t.class_code = c.code), '[]'::json),
    'members', coalesce((
      select json_agg(json_build_object(
        'id', m.id, 'name', m.name, 'skin', m.skin, 'color', m.color, 'pet', m.pet,
        'stars', m.stars, 'xp', m.xp, 'weekXp', m.week_xp, 'week', m.week,
        'teamId', m.team_id, 'updatedAt', (extract(epoch from m.updated_at) * 1000)::bigint))
      from pm_members m where m.class_code = c.code), '[]'::json))
  from pm_classes c where c.code = upper(p_code);
$$;

create or replace function pm_upsert_member(
  p_code text, p_id uuid, p_secret uuid, p_name text, p_skin text, p_color text, p_pet text,
  p_stars int, p_xp int, p_week_xp int, p_week text, p_team_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from pm_classes where code = p_code) then
    raise exception 'class-not-found';
  end if;
  if p_team_id is not null and not exists (select 1 from pm_teams where id = p_team_id and class_code = p_code) then
    raise exception 'team-not-found';
  end if;
  if (select count(*) from pm_members where class_code = p_code) >= 60
     and not exists (select 1 from pm_members where id = p_id) then
    raise exception 'class-full';
  end if;
  insert into pm_members (id, secret, class_code, name, skin, color, pet, stars, xp, week_xp, week, team_id)
  values (p_id, p_secret, p_code, btrim(p_name), p_skin, p_color, p_pet, p_stars, p_xp, p_week_xp, p_week, p_team_id)
  on conflict (id) do update set
    class_code = excluded.class_code, name = excluded.name, skin = excluded.skin, color = excluded.color,
    pet = excluded.pet, stars = excluded.stars, xp = excluded.xp, week_xp = excluded.week_xp,
    week = excluded.week, team_id = excluded.team_id, updated_at = now()
  where pm_members.secret = p_secret;
  if not found then
    raise exception 'not-your-member';
  end if;
end $$;

create or replace function pm_leave_class(p_id uuid, p_secret uuid) returns void
language sql security definer set search_path = public as $$
  delete from pm_members where id = p_id and secret = p_secret;
$$;

create or replace function pm_create_team(p_code text, p_name text, p_emoji text) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_team pm_teams;
begin
  if (select count(*) from pm_teams where class_code = p_code) >= 12 then
    raise exception 'too-many-teams';
  end if;
  insert into pm_teams (class_code, name, emoji) values (p_code, btrim(p_name), p_emoji) returning * into v_team;
  return json_build_object('id', v_team.id, 'name', v_team.name, 'emoji', v_team.emoji);
end $$;

revoke all on function pm_create_class(text) from public;
revoke all on function pm_get_class(text) from public;
revoke all on function pm_upsert_member(text, uuid, uuid, text, text, text, text, int, int, int, text, uuid) from public;
revoke all on function pm_leave_class(uuid, uuid) from public;
revoke all on function pm_create_team(text, text, text) from public;
grant execute on function pm_create_class(text) to anon, authenticated;
grant execute on function pm_get_class(text) to anon, authenticated;
grant execute on function pm_upsert_member(text, uuid, uuid, text, text, text, text, int, int, int, text, uuid) to anon, authenticated;
grant execute on function pm_leave_class(uuid, uuid) to anon, authenticated;
grant execute on function pm_create_team(text, text, text) to anon, authenticated;
