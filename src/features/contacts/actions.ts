"use server";

import { revalidatePath } from "next/cache";

import { assertOrganizationMembership } from "@/lib/organizations/authorization";
import { createClient } from "@/lib/supabase/server";

import { contactFormSchema, contactUpdateFormSchema } from "./schemas";
import type { ContactActionState } from "./types";

const successState: ContactActionState = {
  ok: true,
  message: null,
};

function failureState(message: string): ContactActionState {
  return {
    ok: false,
    message,
  };
}

function contactPayload(formData: FormData) {
  return {
    organizationId: formData.get("organizationId"),
    externalCode: formData.get("externalCode"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    currentStatus: formData.get("currentStatus"),
    currentLevel: formData.get("currentLevel"),
    district: formData.get("district"),
  };
}

export async function createContact(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactFormSchema.safeParse(contactPayload(formData));

  if (!parsed.success) {
    return failureState(
      parsed.error.issues[0]?.message ?? "Revisa los datos del contacto.",
    );
  }

  try {
    await assertOrganizationMembership(parsed.data.organizationId);

    const supabase = await createClient();
    const { error } = await supabase.from("contacts").insert({
      organization_id: parsed.data.organizationId,
      external_code: parsed.data.externalCode,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      current_status: parsed.data.currentStatus,
      current_level: parsed.data.currentLevel,
      district: parsed.data.district,
    });

    if (error) {
      if (error.code === "23505") {
        return failureState("Ya existe un contacto con ese código.");
      }

      return failureState("No pudimos crear el contacto.");
    }

    revalidatePath("/consultoras");
    return successState;
  } catch (error) {
    return failureState(
      error instanceof Error ? error.message : "No pudimos crear el contacto.",
    );
  }
}

export async function updateContact(formData: FormData) {
  const parsed = contactUpdateFormSchema.safeParse({
    organizationId: formData.get("organizationId"),
    contactId: formData.get("contactId"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    currentStatus: formData.get("currentStatus"),
    currentLevel: formData.get("currentLevel"),
    district: formData.get("district"),
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Revisa los datos del contacto.",
    );
  }

  await assertOrganizationMembership(parsed.data.organizationId);

  const supabase = await createClient();

  const { data: existingContact, error: existingContactError } = await supabase
    .from("contacts")
    .select("full_name, phone, current_status, current_level, district")
    .eq("id", parsed.data.contactId)
    .eq("organization_id", parsed.data.organizationId)
    .maybeSingle();

  if (existingContactError || !existingContact) {
    throw new Error("No pudimos actualizar el contacto.", {
      cause: existingContactError,
    });
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      current_status: parsed.data.currentStatus,
      current_level: parsed.data.currentLevel,
      district: parsed.data.district,
    })
    .eq("id", parsed.data.contactId)
    .eq("organization_id", parsed.data.organizationId);

  if (error) {
    throw new Error("No pudimos actualizar el contacto.", {
      cause: error,
    });
  }

  await logManualContactChanges({
    supabase,
    organizationId: parsed.data.organizationId,
    contactId: parsed.data.contactId,
    changes: [
      ["full_name", existingContact.full_name, parsed.data.fullName],
      ["phone", existingContact.phone, parsed.data.phone],
      ["current_status", existingContact.current_status, parsed.data.currentStatus],
      ["current_level", existingContact.current_level, parsed.data.currentLevel],
      ["district", existingContact.district, parsed.data.district],
    ],
  });

  revalidatePath("/consultoras");
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function logManualContactChanges({
  supabase,
  organizationId,
  contactId,
  changes,
}: {
  supabase: SupabaseServerClient;
  organizationId: string;
  contactId: string;
  changes: [string, string | null, string | null][];
}) {
  const changedFields = changes.filter(([, oldValue, newValue]) => oldValue !== newValue);

  if (changedFields.length === 0) {
    return;
  }

  const { data: activeCycle } = await supabase
    .from("cycles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .maybeSingle();

  if (!activeCycle) {
    return;
  }

  await supabase.from("audit_logs").insert(
    changedFields.map(([fieldName, oldValue, newValue]) => ({
      organization_id: organizationId,
      cycle_id: activeCycle.id,
      contact_id: contactId,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      source: "manual",
    })),
  );
}
