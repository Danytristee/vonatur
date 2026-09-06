-- Fixes a latent bug in prevent_tenant_key_update(), discovered while running
-- confirm_cycle_import's bulk UPDATE on contacts for the first time against a
-- real database:
--
--   record "old" has no field "user_id"   (SQLSTATE 42703)
--
-- The original body accessed `old.user_id` / `old.cycle_id` / `old.contact_id`
-- inside a boolean AND alongside a `tg_table_name = '...'` guard, e.g.:
--
--   if tg_table_name = 'organization_members' and old.user_id is distinct from new.user_id then
--
-- OLD/NEW are untyped RECORD variables in a trigger function shared across
-- several tables. PL/pgSQL resolves a RECORD field reference against the
-- table's actual tuple descriptor when the expression is evaluated — and that
-- resolution is not reliably skipped by AND's runtime short-circuiting when
-- the field access lives in the same compound expression as the guard. Any
-- UPDATE on a table lacking that column (e.g. `contacts`, which has no
-- user_id) raised 42703 the moment the trigger fired, even though the intent
-- was for the guard to prevent that column ever being touched.
--
-- Fix: read the field through `to_jsonb(old)->>'name'` instead of `old.name`.
-- jsonb key lookup by text never fails for a missing key (returns NULL), so
-- the same expression is safe to evaluate on every table this trigger is
-- attached to, regardless of which columns that table actually has.
create or replace function public.prevent_tenant_key_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.organization_id is distinct from new.organization_id then
    raise exception 'organization_id cannot be changed after insert'
      using errcode = '23514';
  end if;

  if tg_table_name = 'organization_members' then
    if (to_jsonb(old) ->> 'user_id') is distinct from (to_jsonb(new) ->> 'user_id') then
      raise exception 'organization_members.user_id cannot be changed after insert'
        using errcode = '23514';
    end if;
  end if;

  if tg_table_name in ('contact_cycle_data', 'debts', 'audit_logs') then
    if (to_jsonb(old) ->> 'cycle_id') is distinct from (to_jsonb(new) ->> 'cycle_id') then
      raise exception 'cycle_id cannot be changed after insert'
        using errcode = '23514';
    end if;

    if (to_jsonb(old) ->> 'contact_id') is distinct from (to_jsonb(new) ->> 'contact_id') then
      raise exception 'contact_id cannot be changed after insert'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.prevent_tenant_key_update() is
  'BEFORE UPDATE trigger function. Prevents browser-accessible rows from being reassigned across tenant identity boundaries. Reads OLD/NEW fields via a jsonb key lookup rather than dot-notation because the same function is shared across tables with different columns.';
