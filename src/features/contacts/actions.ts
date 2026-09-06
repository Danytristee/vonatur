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

    revalidatePath("/contactos");
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

  revalidatePath("/contactos");
}
