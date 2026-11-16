-- Matty · a world the teacher puts together for the class: a short trail of stops, each one a
-- ready-made theme or exercises she wrote herself. Children's devices read it with the class;
-- only the teacher key can set it.

alter table pm_classes add column if not exists world jsonb;

create or replace function pm_class_get(p_code text) returns json
language sql security definer stable set search_path = public as $$
  select json_build_object(
    'code', c.code,
    'name', c.name,
    'homework', c.homework,
    'screening', c.screening,
    'world', c.world,
    'members', (select count(*) from pm_members m where m.class_code = c.code),
    'stars', (select coalesce(sum(m.stars), 0) from pm_members m where m.class_code = c.code))
  from pm_classes c where c.code = upper(p_code);
$$;

create or replace function pm_class_set_world(p_code text, p_key text, p_world jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pm_assert_teacher(p_code, p_key);
  if p_world is not null and pg_column_size(p_world) > 20000 then
    raise exception 'world-too-big';
  end if;
  update pm_classes set world = p_world where code = upper(p_code);
end $$;

revoke all on function pm_class_set_world(text, text, jsonb) from public;
grant execute on function pm_class_set_world(text, text, jsonb) to anon, authenticated;
