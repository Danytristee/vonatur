import {
  NoOrganizationState,
  PageHeader,
} from "@/features/app-shell/section-states";
import { CreateCycleForm } from "@/features/cycles/components/create-cycle-form";
import { ImportWizard } from "@/features/imports/components/import-wizard";
import { getDraftCycle } from "@/features/imports/queries";
import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { resolveSelectedOrganization } from "@/lib/organizations/selection";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type ImportsPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const params = await searchParams;
  const organizations = await getCurrentUserOrganizations();
  const selectedOrganization = resolveSelectedOrganization(
    organizations,
    params.organization,
  );

  if (!selectedOrganization) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Importaciones"
          description="Centro del flujo seguro para reemplazar un ciclo comercial desde los archivos oficiales."
        />
        <NoOrganizationState />
      </div>
    );
  }

  const draftCycle = await getDraftCycle(selectedOrganization.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Importaciones"
        description="Sube el Extracto de Canal y el Reporte de Deudas para iniciar un nuevo ciclo. El ciclo activo actual permanece intacto hasta que confirmes la vista previa."
      />

      {draftCycle ? (
        <ImportWizard
          organizationId={selectedOrganization.id}
          draftCycle={draftCycle}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-foreground">
              Primero crea el ciclo nuevo
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Un ciclo debe existir en borrador antes de poder subir sus
              archivos. Créalo con el año y número de ciclo correctos y
              vuelve a esta página para subir los dos reportes.
            </p>
          </Card>

          <CreateCycleForm organizationId={selectedOrganization.id} />
        </div>
      )}
    </div>
  );
}
