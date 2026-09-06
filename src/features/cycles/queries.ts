import "server-only";

import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { resolveSelectedOrganization } from "@/lib/organizations/selection";
import { createClient } from "@/lib/supabase/server";

import type { CycleListItem, CycleStatus } from "./types";

export type CyclesPageData = {
  organizations: Awaited<ReturnType<typeof getCurrentUserOrganizations>>;
  selectedOrganizationId: string | null;
  cycles: CycleListItem[];
};

function toCycleStatus(status: string): CycleStatus {
  if (status === "draft" || status === "active" || status === "archived") {
    return status;
  }

  throw new Error(`Unexpected cycle status: ${status}`);
}

export async function getCyclesPageData(
  requestedOrganizationId?: string,
): Promise<CyclesPageData> {
  const organizations = await getCurrentUserOrganizations();
  const selectedOrganization = resolveSelectedOrganization(
    organizations,
    requestedOrganizationId,
  );

  if (!selectedOrganization) {
    return {
      organizations,
      selectedOrganizationId: null,
      cycles: [],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cycles")
    .select("id, organization_id, year, cycle_number, status, activated_at, updated_at")
    .eq("organization_id", selectedOrganization.id)
    .order("year", { ascending: false })
    .order("cycle_number", { ascending: false });

  if (error) {
    throw new Error("Unable to load organization cycles", {
      cause: error,
    });
  }

  return {
    organizations,
    selectedOrganizationId: selectedOrganization.id,
    cycles: data.map((cycle) => ({
      id: cycle.id,
      organizationId: cycle.organization_id,
      year: cycle.year,
      cycleNumber: cycle.cycle_number,
      status: toCycleStatus(cycle.status),
      activatedAt: cycle.activated_at,
      updatedAt: cycle.updated_at,
    })),
  };
}
