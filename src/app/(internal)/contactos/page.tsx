import { Search } from "lucide-react";

import {
  NoOrganizationState,
  PageHeader,
} from "@/features/app-shell/section-states";
import { ContactsTable } from "@/features/contacts/components/contacts-table";
import { CreateContactForm } from "@/features/contacts/components/create-contact-form";
import { getContactsPageData } from "@/features/contacts/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type ContactsPageProps = {
  searchParams: Promise<{
    organization?: string;
    q?: string;
  }>;
};

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams;
  const { selectedOrganizationId, contacts } = await getContactsPageData(
    params.organization,
    params.q,
  );

  if (!selectedOrganizationId) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Contactos"
          description="Mantén la base de consultoras que se usará para emparejar importaciones por código."
        />
        <NoOrganizationState />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Contactos base"
        description="Directorio operativo de consultoras. El código se conserva estable porque será la llave de correlación de los reportes."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section className="grid gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Directorio
              </h2>
              <p className="text-sm text-muted-foreground">
                {contacts.length} contacto{contacts.length === 1 ? "" : "s"}
              </p>
            </div>

            <form className="flex w-full gap-2 md:w-auto">
              <input
                type="hidden"
                name="organization"
                value={selectedOrganizationId}
              />
              <label className="sr-only" htmlFor="q">
                Buscar contactos
              </label>
              <div className="relative min-w-0 flex-1 md:w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="q"
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Buscar por código, nombre o teléfono"
                  className="h-10 pl-9"
                />
              </div>
              <Button type="submit" variant="outline" className="h-10">
                Buscar
              </Button>
            </form>
          </div>

          <ContactsTable contacts={contacts} />
        </section>

        <CreateContactForm organizationId={selectedOrganizationId} />
      </div>
    </div>
  );
}
