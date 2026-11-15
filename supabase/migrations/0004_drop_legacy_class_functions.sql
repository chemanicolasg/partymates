-- The first version let any device list its classmates and their scores. Rankings are gone,
-- so those functions go too (pm_leave_class stays). Apply together with the release of the
-- version that uses the pm_class_* functions: older copies of the app stop syncing classes.
drop function if exists pm_get_class(text);
drop function if exists pm_upsert_member(text, uuid, uuid, text, text, text, text, int, int, int, text, uuid);
drop function if exists pm_create_class(text);
drop function if exists pm_create_team(text, text, text);
