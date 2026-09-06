import "server-only";

import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { resolveSelectedOrganization } from "@/lib/organizations/selection";
import { createClient } from "@/lib/supabase/server";

import type {
  ContactFilterOptions,
  ContactFilters,
  ContactListItem,
  DebtSummary,
} from "./types";

export type ContactsPageData = {
  organizations: Awaited<ReturnType<typeof getCurrentUserOrganizations>>;
  selectedOrganizationId: string | null;
  contacts: ContactListItem[];
  filterOptions: ContactFilterOptions;
};

function matchesFilters(contact: ContactListItem, filters: ContactFilters) {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  if (normalizedSearch) {
    const matchesSearch = [
      contact.externalCode,
      contact.fullName,
      contact.phone,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch));

    if (!matchesSearch) {
      return false;
    }
  }

  if (filters.status && contact.currentStatus !== filters.status) {
    return false;
  }

  if (filters.level && contact.currentLevel !== filters.level) {
    return false;
  }

  if (filters.district && contact.district !== filters.district) {
    return false;
  }

  return true;
}

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}

export async function getContactsPageData(
  requestedOrganizationId: string | undefined,
  filters: ContactFilters,
): Promise<ContactsPageData> {
  const organizations = await getCurrentUserOrganizations();
  const selectedOrganization = resolveSelectedOrganization(
    organizations,
    requestedOrganizationId,
  );

  if (!selectedOrganization) {
    return {
      organizations,
      selectedOrganizationId: null,
      contacts: [],
      filterOptions: { statuses: [], levels: [], districts: [] },
    };
  }

  const supabase = await createClient();

  const [{ data: contactRows, error: contactsError }, { data: activeCycle }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select(
          "id, organization_id, external_code, full_name, phone, current_status, current_level, district, updated_at",
        )
        .eq("organization_id", selectedOrganization.id)
        .order("full_name", { ascending: true, nullsFirst: false })
        .order("external_code", { ascending: true }),
      supabase
        .from("cycles")
        .select("id")
        .eq("organization_id", selectedOrganization.id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  if (contactsError) {
    throw new Error("Unable to load organization contacts", {
      cause: contactsError,
    });
  }

  const debtSummaryByContactId = new Map<string, DebtSummary>();

  if (activeCycle) {
    const { data: debtRows, error: debtsError } = await supabase
      .from("debts")
      .select("contact_id, commercial_status, current_balance")
      .eq("organization_id", selectedOrganization.id)
      .eq("cycle_id", activeCycle.id);

    if (debtsError) {
      throw new Error("Unable to load active cycle debts", {
        cause: debtsError,
      });
    }

    for (const debt of debtRows) {
      const existing = debtSummaryByContactId.get(debt.contact_id);
      const balance = debt.current_balance ?? 0;

      if (existing) {
        existing.currentBalanceTotal += balance;
        existing.debtCount += 1;
        existing.commercialStatus ??= debt.commercial_status;
      } else {
        debtSummaryByContactId.set(debt.contact_id, {
          commercialStatus: debt.commercial_status,
          currentBalanceTotal: balance,
          debtCount: 1,
        });
      }
    }
  }

  const contacts: ContactListItem[] = contactRows.map((contact) => ({
    id: contact.id,
    organizationId: contact.organization_id,
    externalCode: contact.external_code,
    fullName: contact.full_name,
    phone: contact.phone,
    currentStatus: contact.current_status,
    currentLevel: contact.current_level,
    district: contact.district,
    updatedAt: contact.updated_at,
    debtSummary: debtSummaryByContactId.get(contact.id) ?? null,
  }));

  const filterOptions: ContactFilterOptions = {
    statuses: uniqueSorted(contacts.map((contact) => contact.currentStatus)),
    levels: uniqueSorted(contacts.map((contact) => contact.currentLevel)),
    districts: uniqueSorted(contacts.map((contact) => contact.district)),
  };

  return {
    organizations,
    selectedOrganizationId: selectedOrganization.id,
    contacts: contacts.filter((contact) => matchesFilters(contact, filters)),
    filterOptions,
  };
}
