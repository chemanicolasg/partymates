-- Belt and braces: Supabase grants table privileges to the API roles by default.
-- RLS without policies already hides every row; removing the grants closes the tables outright.
revoke all on table pm_classes, pm_teams, pm_members from anon, authenticated;
