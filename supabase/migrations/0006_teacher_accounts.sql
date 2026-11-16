-- Matty · teacher accounts and tracking over time.
--
-- A teacher may now sign in (Supabase Auth, e-mail and password) and keep her classes in the
-- account instead of on one device. The account is a keyring: it remembers which classes are
-- hers and hands back their teacher keys, and everything else keeps going through the same
-- key-protected functions as before. Children still have no accounts.
--
-- Also new: one row per pupil and week, so the report can show progress over time, and an
-- optional roster (names and notes next to list numbers) for teachers who choose to keep it online.

alter table pm_classes add column if not exists owner uuid references auth.users (id) on delete set null;
create index if not exists pm_classes_owner on pm_classes (owner);

create table if not exists pm_member_weeks (
  member_id uuid not null references pm_members (id) on delete cascade,
  week date not null,
  minutes int not null default 0 check (minutes between 0 and 20000),
  days int not null default 0 check (days between 0 and 7),
  stars int not null default 0,
  primary key (member_id, week)
);

create table if not exists pm_roster (
  class_code text not null references pm_classes (code) on delete cascade,
  num int not null check (num between 1 and 99),
  name text not null default '' check (char_length(name) <= 40),
  note text not null default '' check (char_length(note) <= 600),
  updated_at timestamptz not null default now(),
  primary key (class_code, num)
);

alter table pm_member_weeks enable row level security;
alter table pm_roster enable row level security;
revoke all on pm_member_weeks from anon, authenticated;
revoke all on pm_roster from anon, authenticated;

-- ───────────── The account as a keyring ─────────────

create or replace function pm_teacher_classes() returns json
language sql security definer stable set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'code', c.code, 'name', c.name, 'key', c.teacher_key,
    'members', (select count(*) from pm_members m where m.class_code = c.code)) order by c.created_at), '[]'::json)
  from pm_classes c
  where auth.uid() is not null and c.owner = auth.uid();
$$;

create or replace function pm_teacher_class_create(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare
  v json;
begin
  if auth.uid() is null then
    raise exception 'not-signed-in';
  end if;
  if (select count(*) from pm_classes where owner = auth.uid()) >= 40 then
    raise exception 'too-many-classes';
  end if;
  v := pm_class_create(p_name);
  update pm_classes set owner = auth.uid() where code = v->>'code';
  return v;
end $$;

-- Puts a class that was created with code + key into the account. A class has one owner.
create or replace function pm_teacher_claim(p_code text, p_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not-signed-in';
  end if;
  perform pm_assert_teacher(p_code, p_key);
  update pm_classes set owner = auth.uid() where code = upper(p_code) and (owner is null or owner = auth.uid());
  if not found then
    raise exception 'class-owned';
  end if;
end $$;

-- Takes a class out of the account without deleting it: it stays usable with its code and key.
create or replace function pm_teacher_release(p_code text) returns void
language sql security definer set search_path = public as $$
  update pm_classes set owner = null where code = upper(p_code) and auth.uid() is not null and owner = auth.uid();
$$;

-- ───────────── Roster: names and notes, only if the teacher keeps them online ─────────────

create or replace function pm_class_roster(p_code text, p_key text) returns json
language plpgsql security definer stable set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  return coalesce((
    select json_object_agg(r.num, json_build_object('name', r.name, 'note', r.note))
    from pm_roster r where r.class_code = upper(p_code)), '{}'::json);
end $$;

create or replace function pm_class_set_roster(p_code text, p_key text, p_num int, p_name text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  if btrim(coalesce(p_name, '')) = '' and btrim(coalesce(p_note, '')) = '' then
    delete from pm_roster where class_code = upper(p_code) and num = p_num;
  else
    insert into pm_roster (class_code, num, name, note)
    values (upper(p_code), p_num, btrim(coalesce(p_name, '')), btrim(coalesce(p_note, '')))
    on conflict (class_code, num) do update set name = excluded.name, note = excluded.note, updated_at = now();
  end if;
end $$;

-- Removes every name and note of a class from the server (the teacher switched online keeping off).
create or replace function pm_class_clear_roster(p_code text, p_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  delete from pm_roster where class_code = upper(p_code);
end $$;

-- ───────────── Progress over time ─────────────

create or replace function pm_member_upsert(
  p_code text, p_id uuid, p_secret uuid, p_name text, p_num int, p_look text, p_stars int, p_xp int, p_stats jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from pm_classes where code = p_code) then
    raise exception 'class-not-found';
  end if;
  if (select count(*) from pm_members where class_code = p_code) >= 60
     and not exists (select 1 from pm_members where id = p_id) then
    raise exception 'class-full';
  end if;
  insert into pm_members (id, secret, class_code, name, skin, color, num, look, stars, xp, stats)
  values (p_id, p_secret, p_code, btrim(p_name), '', '', p_num, p_look, p_stars, p_xp, p_stats)
  on conflict (id) do update set
    class_code = excluded.class_code, name = excluded.name, num = excluded.num, look = excluded.look,
    stars = excluded.stars, xp = excluded.xp, stats = excluded.stats, updated_at = now()
  where pm_members.secret = p_secret;
  if not found then
    raise exception 'not-your-member';
  end if;
  -- This week's line of the pupil's history. Anything malformed is simply not recorded.
  if (p_stats->>'week') ~ '^\d{4}-\d{2}-\d{2}$' and (p_stats->>'weekMin') ~ '^\d{1,5}$' then
    insert into pm_member_weeks (member_id, week, minutes, days, stars)
    values (p_id, (p_stats->>'week')::date, least((p_stats->>'weekMin')::int, 20000),
            case when (p_stats->>'days') ~ '^[0-7]$' then (p_stats->>'days')::int else 0 end, p_stars)
    on conflict (member_id, week) do update set minutes = excluded.minutes, days = excluded.days, stars = excluded.stars;
    delete from pm_member_weeks where member_id = p_id and week < current_date - 200;
  end if;
end $$;

create or replace function pm_class_report(p_code text, p_key text) returns json
language plpgsql security definer stable set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  return coalesce((
    select json_agg(json_build_object(
      'id', m.id, 'name', m.name, 'num', m.num, 'look', m.look, 'stars', m.stars, 'xp', m.xp,
      'stats', m.stats, 'updatedAt', (extract(epoch from m.updated_at) * 1000)::bigint,
      'weeks', (select coalesce(json_agg(json_build_object('week', w.week, 'min', w.minutes, 'days', w.days, 'stars', w.stars) order by w.week), '[]'::json)
                from (select * from pm_member_weeks x where x.member_id = m.id order by x.week desc limit 10) w)
    ) order by m.num, m.name)
    from pm_members m where m.class_code = upper(p_code)), '[]'::json);
end $$;

revoke all on function pm_teacher_classes() from public, anon;
revoke all on function pm_teacher_class_create(text) from public, anon;
revoke all on function pm_teacher_claim(text, text) from public, anon;
revoke all on function pm_teacher_release(text) from public, anon;
revoke all on function pm_class_roster(text, text) from public;
revoke all on function pm_class_set_roster(text, text, int, text, text) from public;
revoke all on function pm_class_clear_roster(text, text) from public;
grant execute on function pm_teacher_classes() to authenticated;
grant execute on function pm_teacher_class_create(text) to authenticated;
grant execute on function pm_teacher_claim(text, text) to authenticated;
grant execute on function pm_teacher_release(text) to authenticated;
grant execute on function pm_class_roster(text, text) to anon, authenticated;
grant execute on function pm_class_set_roster(text, text, int, text, text) to anon, authenticated;
grant execute on function pm_class_clear_roster(text, text) to anon, authenticated;
