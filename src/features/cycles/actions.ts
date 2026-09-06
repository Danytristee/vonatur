"use server";

import { revalidatePath } from "next/cache";

import { assertOrganizationMembership } from "@/lib/organizations/authorization";
import { createClient } from "@/lib/supabase/server";

import { cycleFormSchema } from "./schemas";
import type { CycleActionState } from "./types";

const successState: CycleActionState = {
  ok: true,
  message: null,
};

function failureState(message: string): CycleActionState {
  return {
    ok: false,
    message,
  };
}

export async function createDraftCycle(
  _previousState: CycleActionState,
  formData: FormData,
): Promise<CycleActionState> {
  const parsed = cycleFormSchema.safeParse({
    organizationId: formData.get("organizationId"),
    year: formData.get("year"),
    cycleNumber: formData.get("cycleNumber"),
  });

  if (!parsed.success) {
    return failureState(parsed.error.issues[0]?.message ?? "Revisa los datos del ciclo.");
  }

  try {
    await assertOrganizationMembership(parsed.data.organizationId);

    const supabase = await createClient();
    const { error } = await supabase.from("cycles").insert({
      organization_id: parsed.data.organizationId,
      year: parsed.data.year,
      cycle_number: parsed.data.cycleNumber,
      status: "draft",
    });

    if (error) {
      if (error.code === "23505") {
        return failureState("Ese ciclo ya existe para esta organización.");
      }

      return failureState("No pudimos crear el ciclo.");
    }

    revalidatePath("/ciclos");
    revalidatePath("/importaciones");
    return successState;
  } catch (error) {
    return failureState(
      error instanceof Error ? error.message : "No pudimos crear el ciclo.",
    );
  }
}
