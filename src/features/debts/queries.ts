import "server-only";

import type { CycleListItem, CycleStatus } from "@/features/cycles/types";
import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { resolveSelectedOrganization } from "@/lib/organizations/selection";
import { createClient } from "@/lib/supabase/server";

import type { DebtFilterOptions, DebtFilters, DebtListItem } from "./types";

export type DebtsPageData = {
  organizations: Awaited<ReturnType<typeof getCurrentUserOrganizations>>;
  selectedOrganizationId: string | null;
  cycles: CycleListItem[];
  selectedCycleId: string | null;
  debts: DebtListItem[];
  filterOptions: DebtFilterOptions;
};

const emptyFilterOptions: DebtFilterOptions = {
  levels: [],
  situations: [],
  maturityStatuses: [],
};

function matchesFilters(debt: DebtListItem, filters: DebtFilters) {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  if (normalizedSearch) {
    const matchesSearch = [debt.externalCode, debt.fullName].some((value) =>
      value?.toLowerCase().includes(normalizedSearch),
    );

    if (!matchesSearch) {
      return false;
    }
  }

  if (filters.level && debt.level !== filters.level) {
    return false;
  }

  if (filters.situation && debt.situation !== filters.situation) {
    return false;
  }

  if (filters.maturityStatus && debt.maturityStatus !== filters.maturityStatus) {
    return false;
  }

  return true;
}

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}

function toCycleStatus(status: string): CycleStatus {
  if (status === "draft" || status === "active" || status === "archived") {
    return status;
  }

  throw new Error(`Unexpected cycle status: ${status}`);
}

export async function getDebtsPageData(
  requestedOrganizationId: string | undefined,
  requestedCycleId: string | undefined,
  filters: DebtFilters,
): Promise<DebtsPageData> {
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
      selectedCycleId: null,
      debts: [],
      filterOptions: emptyFilterOptions,
    };
  }

  const supabase = await createClient();

  const { data: cycleRows, error: cyclesError } = await supabase
    .from("cycles")
    .select("id, organization_id, year, cycle_number, status, activated_at, updated_at")
    .eq("organization_id", selectedOrganization.id)
    .order("year", { ascending: false })
    .order("cycle_number", { ascending: false });

  if (cyclesError) {
    throw new Error("Unable to load organization cycles", { cause: cyclesError });
  }

  const cycles: CycleListItem[] = cycleRows.map((cycle) => ({
    id: cycle.id,
    organizationId: cycle.organization_id,
    year: cycle.year,
    cycleNumber: cycle.cycle_number,
    status: toCycleStatus(cycle.status),
    activatedAt: cycle.activated_at,
    updatedAt: cycle.updated_at,
  }));

  const requestedCycle = cycles.find((cycle) => cycle.id === requestedCycleId);
  const selectedCycle =
    requestedCycle ??
    cycles.find((cycle) => cycle.status === "active") ??
    cycles[0] ??
    null;

  if (!selectedCycle) {
    return {
      organizations,
      selectedOrganizationId: selectedOrganization.id,
      cycles,
      selectedCycleId: null,
      debts: [],
      filterOptions: emptyFilterOptions,
    };
  }

  const { data: debtRows, error: debtsError } = await supabase
    .from("debts")
    .select(
      "id, contact_id, level, situation, maturity_status, title_value, principal_balance, current_balance, due_date, days_overdue",
    )
    .eq("organization_id", selectedOrganization.id)
    .eq("cycle_id", selectedCycle.id)
    .order("days_overdue", { ascending: false, nullsFirst: false });

  if (debtsError) {
    throw new Error("Unable to load cycle debts", { cause: debtsError });
  }

  const contactIds = Array.from(new Set(debtRows.map((debt) => debt.contact_id)));

  const { data: contactRows, error: contactsError } = contactIds.length
    ? await supabase
        .from("contacts")
        .select("id, external_code, full_name")
        .in("id", contactIds)
    : { data: [] as { id: string; external_code: string; full_name: string | null }[], error: null };

  if (contactsError) {
    throw new Error("Unable to load debt contacts", { cause: contactsError });
  }

  const contactById = new Map(contactRows.map((contact) => [contact.id, contact]));

  const debts: DebtListItem[] = debtRows.map((debt) => {
    const contact = contactById.get(debt.contact_id);

    return {
      id: debt.id,
      contactId: debt.contact_id,
      externalCode: contact?.external_code ?? "—",
      fullName: contact?.full_name ?? null,
      level: debt.level,
      situation: debt.situation,
      maturityStatus: debt.maturity_status,
      titleValue: debt.title_value,
      principalBalance: debt.principal_balance,
      currentBalance: debt.current_balance,
      dueDate: debt.due_date,
      daysOverdue: debt.days_overdue,
    };
  });

  const filterOptions: DebtFilterOptions = {
    levels: uniqueSorted(debts.map((debt) => debt.level)),
    situations: uniqueSorted(debts.map((debt) => debt.situation)),
    maturityStatuses: uniqueSorted(debts.map((debt) => debt.maturityStatus)),
  };

  return {
    organizations,
    selectedOrganizationId: selectedOrganization.id,
    cycles,
    selectedCycleId: selectedCycle.id,
    debts: debts.filter((debt) => matchesFilters(debt, filters)),
    filterOptions,
  };
}
