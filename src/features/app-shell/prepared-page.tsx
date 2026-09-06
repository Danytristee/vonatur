import {
  NoOrganizationState,
  PageHeader,
  PreparedSection,
} from "@/features/app-shell/section-states";
import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { resolveSelectedOrganization } from "@/lib/organizations/selection";

type PreparedPageProps = {
  requestedOrganizationId?: string;
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription: string;
  steps?: string[];
};

export async function PreparedPage({
  description,
  requestedOrganizationId,
  sectionDescription,
  sectionTitle,
  steps,
  title,
}: PreparedPageProps) {
  const organizations = await getCurrentUserOrganizations();
  const selectedOrganization = resolveSelectedOrganization(
    organizations,
    requestedOrganizationId,
  );

  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} />
      {selectedOrganization ? (
        <PreparedSection
          title={sectionTitle}
          description={sectionDescription}
          steps={steps}
        />
      ) : (
        <NoOrganizationState />
      )}
    </div>
  );
}
