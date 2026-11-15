-- Matty · teacher area: homework, list numbers and a per-child report.
--
-- Still no accounts and no real names. A child is identified to the teacher by the class list
-- number; the teacher may write names next to the numbers, but those stay on the teacher's device.
-- Children's devices can no longer see classmates at all (there are no rankings): the per-child
-- report is only returned with the teacher key that was handed out when the class was created.

alter table pm_classes add column if not exists teacher_key text;
alter table pm_classes add column if not exists homework jsonb;

alter table pm_members add column if not exists num int check (num between 1 and 99);
alter table pm_members add column if not exists look text check (char_length(look) <= 200);
alter table pm_members add column if not exists stats jsonb check (pg_column_size(stats) <= 4000);

create or replace function pm_class_create(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_key text;
begin
  select string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') into v_key from generate_series(1, 8);
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') into v_code from generate_series(1, 6);
    begin
      insert into pm_classes (code, name, teacher_key) values (v_code, btrim(p_name), v_key);
      return json_build_object('code', v_code, 'teacherKey', v_key);
    exception when unique_violation then
      -- extremely unlikely collision: draw another code
    end;
  end loop;
end $$;

create or replace function pm_class_get(p_code text) returns json
language sql security definer stable set search_path = public as $$
  select json_build_object(
    'code', c.code,
    'name', c.name,
    'homework', c.homework,
    'members', (select count(*) from pm_members m where m.class_code = c.code),
    'stars', (select coalesce(sum(m.stars), 0) from pm_members m where m.class_code = c.code))
  from pm_classes c where c.code = upper(p_code);
$$;

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
end $$;

-- Raises unless the key is the one given to whoever created the class.
create or replace function pm_assert_teacher(p_code text, p_key text) returns void
language plpgsql security definer stable set search_path = public as $$
begin
  if not exists (select 1 from pm_classes where code = upper(p_code) and teacher_key is not null and teacher_key = upper(p_key)) then
    raise exception 'bad-key';
  end if;
end $$;

create or replace function pm_class_report(p_code text, p_key text) returns json
language plpgsql security definer stable set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  return coalesce((
    select json_agg(json_build_object(
      'id', m.id, 'name', m.name, 'num', m.num, 'look', m.look, 'stars', m.stars, 'xp', m.xp,
      'stats', m.stats, 'updatedAt', (extract(epoch from m.updated_at) * 1000)::bigint) order by m.num, m.name)
    from pm_members m where m.class_code = upper(p_code)), '[]'::json);
end $$;

create or replace function pm_class_set_homework(p_code text, p_key text, p_homework jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  if p_homework is not null and pg_column_size(p_homework) > 600 then
    raise exception 'homework-too-big';
  end if;
  update pm_classes set homework = p_homework where code = upper(p_code);
end $$;

create or replace function pm_class_remove_member(p_code text, p_key text, p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  delete from pm_members where id = p_member and class_code = upper(p_code);
end $$;

-- A teacher can delete a class with everything in it (members go with it).
create or replace function pm_class_delete(p_code text, p_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  delete from pm_classes where code = upper(p_code);
end $$;

revoke all on function pm_class_create(text) from public;
revoke all on function pm_class_get(text) from public;
revoke all on function pm_member_upsert(text, uuid, uuid, text, int, text, int, int, jsonb) from public;
revoke all on function pm_assert_teacher(text, text) from public, anon, authenticated;
revoke all on function pm_class_report(text, text) from public;
revoke all on function pm_class_set_homework(text, text, jsonb) from public;
revoke all on function pm_class_remove_member(text, text, uuid) from public;
revoke all on function pm_class_delete(text, text) from public;
grant execute on function pm_class_create(text) to anon, authenticated;
grant execute on function pm_class_get(text) to anon, authenticated;
grant execute on function pm_member_upsert(text, uuid, uuid, text, int, text, int, int, jsonb) to anon, authenticated;
grant execute on function pm_class_report(text, text) to anon, authenticated;
grant execute on function pm_class_set_homework(text, text, jsonb) to anon, authenticated;
grant execute on function pm_class_remove_member(text, text, uuid) to anon, authenticated;
grant execute on function pm_class_delete(text, text) to anon, authenticated;
