-- Matty · plans.
--
-- Everything is free today, and this changes nothing for anyone. It lays the ground for charging
-- adults later without touching the children's game: every account (a teacher's or a family's)
-- has a plan, kept on the server where only the server can change it, and what each plan allows
-- is decided in one function. Children have no accounts and never meet a price.
--
-- Until a payment provider is connected, a plan is set by hand (a school that pays by invoice):
--   select pm_admin_set_plan('teacher@school.org', 'school', '2027-09-01');

create table if not exists pm_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'family', 'teacher', 'school')),
  -- Paid until this moment. Null is a plan with no end (a gift, an early supporter).
  plan_until timestamptz,
  -- Where the plan came from: 'manual' (an invoice), a payment provider, a licence code.
  source text not null default 'manual' check (char_length(source) <= 40),
  -- The payment provider's customer id, once there is one.
  customer text check (char_length(customer) <= 80),
  note text not null default '' check (char_length(note) <= 200),
  updated_at timestamptz not null default now()
);

alter table pm_accounts enable row level security;
revoke all on pm_accounts from anon, authenticated;

-- The plan an account has right now. A plan that has run out is simply free again: nothing is
-- deleted, and whatever the account made stays where it was.
create or replace function pm_plan_of(p_user uuid) returns text
language sql security definer stable set search_path = public as $$
  select coalesce(
    (select a.plan from pm_accounts a where a.user_id = p_user and (a.plan_until is null or a.plan_until > now())),
    'free');
$$;

-- What each plan allows. The one place to change when plans start to differ; today they do not.
--   groups: classes and families one account can keep.
create or replace function pm_plan_limits(p_plan text) returns jsonb
language sql immutable as $$
  select case p_plan
    when 'school' then '{"groups": 40}'::jsonb
    when 'teacher' then '{"groups": 40}'::jsonb
    when 'family' then '{"groups": 40}'::jsonb
    else '{"groups": 40}'::jsonb
  end;
$$;

-- The signed-in account as its own screen needs it: the plan, until when, and since when the
-- account exists (so that whoever was here before prices existed can be treated accordingly).
create or replace function pm_account() returns json
language sql security definer stable set search_path = public as $$
  select case when auth.uid() is null then null else json_build_object(
    'plan', pm_plan_of(auth.uid()),
    'until', (select (extract(epoch from a.plan_until) * 1000)::bigint from pm_accounts a
              where a.user_id = auth.uid() and a.plan_until > now()),
    'since', (select (extract(epoch from u.created_at) * 1000)::bigint from auth.users u where u.id = auth.uid()),
    'limits', pm_plan_limits(pm_plan_of(auth.uid()))) end;
$$;

-- Gives an account a plan. Not callable from the app: only the server (a payment webhook, or
-- the owner of the project by hand) may run it. 'free' with no date takes the plan away.
create or replace function pm_admin_set_plan(
  p_email text, p_plan text, p_until timestamptz default null, p_source text default 'manual', p_note text default ''
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
begin
  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'no-such-account';
  end if;
  insert into pm_accounts (user_id, plan, plan_until, source, note)
  values (v_user, p_plan, p_until, p_source, coalesce(p_note, ''))
  on conflict (user_id) do update set
    plan = excluded.plan, plan_until = excluded.plan_until, source = excluded.source, note = excluded.note, updated_at = now();
end $$;

-- The two places an account makes a group now ask the plan how many it may keep.
create or replace function pm_teacher_class_create(p_name text) returns json
language plpgsql security definer set search_path = public as $$
declare
  v json;
begin
  if auth.uid() is null then
    raise exception 'not-signed-in';
  end if;
  if (select count(*) from pm_classes where owner = auth.uid())
     >= (pm_plan_limits(pm_plan_of(auth.uid()))->>'groups')::int then
    raise exception 'too-many-classes';
  end if;
  v := pm_class_create(p_name);
  update pm_classes set owner = auth.uid() where code = v->>'code';
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
  if (select count(*) from pm_classes where owner = auth.uid())
     >= (pm_plan_limits(pm_plan_of(auth.uid()))->>'groups')::int then
    raise exception 'too-many-classes';
  end if;
  v := pm_group_create(p_name, p_kind);
  update pm_classes set owner = auth.uid() where code = v->>'code';
  return v;
end $$;

revoke all on function pm_plan_of(uuid) from public, anon, authenticated;
revoke all on function pm_plan_limits(text) from public, anon, authenticated;
revoke all on function pm_account() from public, anon;
revoke all on function pm_admin_set_plan(text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function pm_account() to authenticated;
