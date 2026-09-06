# Vonatur RLS Security Scenarios

These scenarios define the minimum security checks for the multi-tenant RLS
foundation. They should be run against a local Supabase database before any
production deployment that changes tenant policies.

## Actors

- User A belongs to Organization A through `organization_members`.
- User B belongs to Organization B through `organization_members`.
- User C is authenticated but has no membership.
- Anonymous requests have no authenticated user.

## Required Behavior

- User A can select Organization A and cannot select Organization B.
- User A can select contacts, cycles, contact cycle data, and debts for
  Organization A.
- User A cannot select contacts, cycles, contact cycle data, or debts for
  Organization B.
- User A can insert tenant rows only when `organization_id` is Organization A.
- User A cannot insert a tenant row with Organization B's `organization_id`.
- User A cannot update a tenant row from Organization B.
- User A cannot move a tenant row from Organization A to Organization B by
  changing `organization_id`.
- User A cannot reassign `contact_cycle_data` or `debts` to another
  `cycle_id` or `contact_id` after insert.
- User A cannot delete a debt row from Organization B.
- User A can select only membership rows where `user_id = auth.uid()`.
- User A cannot insert, update, or delete `organization_members` from browser
  credentials.
- User C cannot read or mutate tenant data.
- Anonymous requests cannot read or mutate any tenant table.

## Secret Exposure Check

- Browser code may use only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- No service-role key, database password, access token, or refresh token may be
  present in files committed to Git.
- No service-role Supabase client exists in the browser or shared client modules.
