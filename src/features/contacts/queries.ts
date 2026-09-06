import "server-only";

import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { resolveSelectedOrganization } from "@/lib/organizations/selection";
import { createClient } from "@/lib/supabase/server";

import type { ContactListItem } from "./types";

export type ContactsPageData = {
  organizations: Awaited<ReturnType<typeof getCurrentUserOrganizations>>;
  selectedOrganizationId: string | null;
  contacts: ContactListItem[];
};

function matchesSearch(contact: ContactListItem, searchQuery?: string) {
  const normalizedSearch = searchQuery?.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    contact.externalCode,
    contact.fullName,
    contact.phone,
    contact.currentStatus,
    contact.currentLevel,
    contact.district,
  ].some((value) => value?.toLowerCase().includes(normalizedSearch));
}

export async function getContactsPageData(
  requestedOrganizationId?: string,
  searchQuery?: string,
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
    };
  }

  const supabase = await createClient();
  const query = supabase
    .from("contacts")
    .select(
      "id, organization_id, external_code, full_name, phone, current_status, current_level, district, updated_at",
    )
    .eq("organization_id", selectedOrganization.id)
    .order("full_name", { ascending: true, nullsFirst: false })
    .order("external_code", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load organization contacts", {
      cause: error,
    });
  }

  return {
    organizations,
    selectedOrganizationId: selectedOrganization.id,
    contacts: data
      .map((contact) => ({
        id: contact.id,
        organizationId: contact.organization_id,
        externalCode: contact.external_code,
        fullName: contact.full_name,
        phone: contact.phone,
        currentStatus: contact.current_status,
        currentLevel: contact.current_level,
        district: contact.district,
        updatedAt: contact.updated_at,
      }))
      .filter((contact) => matchesSearch(contact, searchQuery)),
  };
}
