import "server-only";

import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { resolveSelectedOrganization } from "@/lib/organizations/selection";
import { createClient } from "@/lib/supabase/server";

import type { CycleStatus } from "../cycles/types";

export type DashboardSummary = {
  organizations: Awaited<ReturnType<typeof getCurrentUserOrganizations>>;
  selectedOrganizationId: string | null;
  selectedOrganizationName: string | null;
  activeCycleLabel: string | null;
  cycleCount: number;
  contactCount: number;
  debtCount: number;
};

function toCycleStatus(status: string): CycleStatus {
  if (status === "draft" || status === "active" || status === "archived") {
    return status;
  }

  throw new Error(`Unexpected cycle status: ${status}`);
}

export async function getDashboardSummary(
  requestedOrganizationId?: string,
): Promise<DashboardSummary> {
  const organizations = await getCurrentUserOrganizations();
  const selectedOrganization = resolveSelectedOrganization(
    organizations,
    requestedOrganizationId,
  );

  if (!selectedOrganization) {
    return {
      organizations,
      selectedOrganizationId: null,
      selectedOrganizationName: null,
      activeCycleLabel: null,
      cycleCount: 0,
      contactCount: 0,
      debtCount: 0,
    };
  }

  const supabase = await createClient();
  const [
    { count: cycleCount, error: cycleCountError },
    { count: contactCount, error: contactCountError },
    { count: debtCount, error: debtCountError },
    { data: activeCycle, error: activeCycleError },
  ] = await Promise.all([
    supabase
      .from("cycles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", selectedOrganization.id),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", selectedOrganization.id),
    supabase
      .from("debts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", selectedOrganization.id),
    supabase
      .from("cycles")
      .select("year, cycle_number, status")
      .eq("organization_id", selectedOrganization.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const error =
    cycleCountError ?? contactCountError ?? debtCountError ?? activeCycleError;

  if (error) {
    throw new Error("Unable to load dashboard summary", {
      cause: error,
    });
  }

  if (activeCycle) {
    toCycleStatus(activeCycle.status);
  }

  return {
    organizations,
    selectedOrganizationId: selectedOrganization.id,
    selectedOrganizationName: selectedOrganization.name,
    activeCycleLabel: activeCycle
      ? `${activeCycle.year} - Ciclo ${activeCycle.cycle_number}`
      : null,
    cycleCount: cycleCount ?? 0,
    contactCount: contactCount ?? 0,
    debtCount: debtCount ?? 0,
  };
}
