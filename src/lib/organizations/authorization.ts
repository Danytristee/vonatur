import "server-only";

import { getCurrentUserOrganizations } from "./queries";

export async function assertOrganizationMembership(organizationId: string) {
  const organizations = await getCurrentUserOrganizations();
  const isMember = organizations.some(
    (organization) => organization.id === organizationId,
  );

  if (!isMember) {
    throw new Error("No tienes acceso a esta organización.");
  }
}
