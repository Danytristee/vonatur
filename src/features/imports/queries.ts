import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DraftCycle = {
  id: string;
  year: number;
  cycleNumber: number;
};

export async function getDraftCycle(
  organizationId: string,
): Promise<DraftCycle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cycles")
    .select("id, year, cycle_number")
    .eq("organization_id", organizationId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos revisar los ciclos en borrador.", {
      cause: error,
    });
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    year: data.year,
    cycleNumber: data.cycle_number,
  };
}

export async function getExistingExternalCodes(
  organizationId: string,
): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("external_code")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error("No pudimos revisar las consultoras existentes.", {
      cause: error,
    });
  }

  return new Set(data.map((row) => row.external_code));
}
