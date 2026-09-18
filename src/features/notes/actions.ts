"use server";

import { assertOrganizationMembership } from "@/lib/organizations/authorization";
import { createClient } from "@/lib/supabase/server";

import { deleteNoteSchema, noteFormSchema } from "./schemas";
import type { NoteActionState, NoteItem } from "./types";

export async function listContactNotes(
  organizationId: string,
  contactId: string,
): Promise<NoteItem[]> {
  await assertOrganizationMembership(organizationId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_notes")
    .select("id, body, created_at")
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load contact notes", { cause: error });
  }

  return data.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function createNote(
  _previousState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = noteFormSchema.safeParse({
    organizationId: formData.get("organizationId"),
    contactId: formData.get("contactId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa la nota.",
    };
  }

  try {
    await assertOrganizationMembership(parsed.data.organizationId);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No tienes acceso.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_notes").insert({
    organization_id: parsed.data.organizationId,
    contact_id: parsed.data.contactId,
    body: parsed.data.body,
  });

  if (error) {
    return { ok: false, message: "No pudimos guardar la nota." };
  }

  return { ok: true, message: null };
}

export async function deleteNote(
  _previousState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = deleteNoteSchema.safeParse({
    organizationId: formData.get("organizationId"),
    noteId: formData.get("noteId"),
  });

  if (!parsed.success) {
    return { ok: false, message: "No pudimos borrar la nota." };
  }

  try {
    await assertOrganizationMembership(parsed.data.organizationId);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No tienes acceso.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_notes")
    .delete()
    .eq("id", parsed.data.noteId)
    .eq("organization_id", parsed.data.organizationId);

  if (error) {
    return { ok: false, message: "No pudimos borrar la nota." };
  }

  return { ok: true, message: null };
}
