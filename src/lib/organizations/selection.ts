import type { CurrentUserOrganization } from "./queries";

export function resolveSelectedOrganization(
  organizations: CurrentUserOrganization[],
  requestedOrganizationId?: string,
) {
  return (
    organizations.find(
      (organization) => organization.id === requestedOrganizationId,
    ) ??
    organizations[0] ??
    null
  );
}
