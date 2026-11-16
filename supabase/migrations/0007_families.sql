-- Matty · families.
--
-- A family is a small group run by a parent instead of a teacher: the same code-and-key group as
-- a class, marked as a family. A child can belong to a class and to a family at once (their device
-- keeps a separate member id for each). Parents set a mission with a few words of their own, a
-- weekly goal and a world, and read the same per-child figures a teacher does.

alter table pm_classes add column if not exists kind text not null default 'class' check (kind in ('class', 'family'));
alter table pm_classes add column if not exists goal jsonb;

-- Creates a class or a family. The one-argument pm_class_create stays for older copies of the app.
create or replace function pm_group_create(p_name text, p_kind text) returns json
language plpgsql security definer set search_path = public as $$
declare
  v json;
begin
  if p_kind not in ('class', 'family') then
    raise exception 'bad-kind';
  end if;
  v := pm_class_create(p_name);
  update pm_classes set kind = p_kind where code = v->>'code';
  return v;
end $$;

create or replace function pm_teacher_group_create(p_name text, p_kind text) returns json
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
  v := pm_group_create(p_name, p_kind);
  update pm_classes set owner = auth.uid() where code = v->>'code';
  return v;
end $$;

create or replace function pm_teacher_classes() returns json
language sql security definer stable set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'code', c.code, 'name', c.name, 'key', c.teacher_key, 'kind', c.kind,
    'members', (select count(*) from pm_members m where m.class_code = c.code)) order by c.created_at), '[]'::json)
  from pm_classes c
  where auth.uid() is not null and c.owner = auth.uid();
$$;

create or replace function pm_class_get(p_code text) returns json
language sql security definer stable set search_path = public as $$
  select json_build_object(
    'code', c.code,
    'name', c.name,
    'kind', c.kind,
    'homework', c.homework,
    'screening', c.screening,
    'world', c.world,
    'goal', c.goal,
    'members', (select count(*) from pm_members m where m.class_code = c.code),
    'stars', (select coalesce(sum(m.stars), 0) from pm_members m where m.class_code = c.code))
  from pm_classes c where c.code = upper(p_code);
$$;

-- A mission may now carry a note and a promised treat from the family: a little more room.
create or replace function pm_class_set_homework(p_code text, p_key text, p_homework jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  if p_homework is not null and pg_column_size(p_homework) > 1600 then
    raise exception 'homework-too-big';
  end if;
  update pm_classes set homework = p_homework where code = upper(p_code);
end $$;

-- The weekly routine the group aims for: days a week and minutes a day.
create or replace function pm_class_set_goal(p_code text, p_key text, p_goal jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  if p_goal is not null and pg_column_size(p_goal) > 200 then
    raise exception 'goal-too-big';
  end if;
  update pm_classes set goal = p_goal where code = upper(p_code);
end $$;

revoke all on function pm_group_create(text, text) from public;
revoke all on function pm_teacher_group_create(text, text) from public, anon;
revoke all on function pm_class_set_goal(text, text, jsonb) from public;
grant execute on function pm_group_create(text, text) to anon, authenticated;
grant execute on function pm_teacher_group_create(text, text) to authenticated;
grant execute on function pm_class_set_goal(text, text, jsonb) to anon, authenticated;
