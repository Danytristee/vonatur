import {
  NoOrganizationState,
  PageHeader,
} from "@/features/app-shell/section-states";
import { ContactsFilters } from "@/features/contacts/components/contacts-filters";
import { ContactsTable } from "@/features/contacts/components/contacts-table";
import { CreateContactForm } from "@/features/contacts/components/create-contact-form";
import { getContactsPageData } from "@/features/contacts/queries";

export const dynamic = "force-dynamic";

type ConsultorasPageProps = {
  searchParams: Promise<{
    organization?: string;
    q?: string;
    estado?: string;
    nivel?: string;
    distrito?: string;
  }>;
};

export default async function ConsultorasPage({
  searchParams,
}: ConsultorasPageProps) {
  const params = await searchParams;
  const filters = {
    search: params.q,
    status: params.estado,
    level: params.nivel,
    district: params.distrito,
  };
  const { selectedOrganizationId, contacts, filterOptions } =
    await getContactsPageData(params.organization, filters);

  if (!selectedOrganizationId) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Consultoras"
          description="Mantén la base de consultoras que se usará para emparejar importaciones por código."
        />
        <NoOrganizationState />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Consultoras"
        description="Directorio operativo de consultoras con su situación de deuda del ciclo activo. El código se conserva estable porque es la llave de correlación de los reportes."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section className="grid gap-3">
          <ContactsFilters
            organizationId={selectedOrganizationId}
            filters={filters}
            options={filterOptions}
          />

          <p className="text-sm text-muted-foreground">
            {contacts.length} consultora{contacts.length === 1 ? "" : "s"}
          </p>

          <ContactsTable contacts={contacts} />
        </section>

        <CreateContactForm organizationId={selectedOrganizationId} />
      </div>
    </div>
  );
}
