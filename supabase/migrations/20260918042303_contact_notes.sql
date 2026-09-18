-- Vonatur — contact_notes: free-text follow-up notes per consultora.
--
-- The líder tracks collection/follow-up context ("prometió pagar el viernes",
-- "no contesta") that isn't part of the imported Excel data. Notes are a
-- continuous history per contact, independent of cycle — a running timeline,
-- not a per-cycle snapshot.

create table public.contact_notes (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null,
  contact_id      uuid        not null,
  body            text        not null,
  created_at      timestamptz not null default now(),

  constraint contact_notes_contact_fkey
    foreign key (contact_id, organization_id)
    references public.contacts (id, organization_id)
    on update restrict on delete restrict,

  constraint contact_notes_body_not_blank
    check (length(btrim(body)) > 0)
);

comment on table public.contact_notes is
  'Free-text follow-up notes a líder writes about a consultora (e.g. "prometió pagar el viernes"). Continuous history, not scoped to a cycle.';

-- Primary access path: "notes for this contact, most recent first".
create index contact_notes_organization_id_contact_id_created_at_idx
  on public.contact_notes (organization_id, contact_id, created_at desc);

alter table public.contact_notes enable row level security;

-- No update policy: a mistaken note is deleted and re-added rather than
-- edited, keeping the history honest without needing an updated_at/trigger.
revoke all on table public.contact_notes from public, anon, authenticated;

grant select, insert, delete on table public.contact_notes to authenticated;
grant select, insert, update, delete on table public.contact_notes to service_role;

create policy "contact_notes_select_for_members"
  on public.contact_notes
  for select
  to authenticated
  using (public.is_organization_member(organization_id));

create policy "contact_notes_insert_for_members"
  on public.contact_notes
  for insert
  to authenticated
  with check (public.is_organization_member(organization_id));

create policy "contact_notes_delete_for_members"
  on public.contact_notes
  for delete
  to authenticated
  using (public.is_organization_member(organization_id));
