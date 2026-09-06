import { Download, Upload } from "lucide-react";
import Link from "next/link";

import {
  NoOrganizationState,
  PageHeader,
} from "@/features/app-shell/section-states";
import { CreateCycleForm } from "@/features/cycles/components/create-cycle-form";
import { CyclesTable } from "@/features/cycles/components/cycles-table";
import { getCyclesPageData } from "@/features/cycles/queries";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type CyclesPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

export default async function CyclesPage({ searchParams }: CyclesPageProps) {
  const params = await searchParams;
  const { organizations, selectedOrganizationId, cycles } =
    await getCyclesPageData(params.organization);
  const activeCycle = cycles.find((cycle) => cycle.status === "active");

  if (!selectedOrganizationId) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Ciclos"
          description="Gestiona los ciclos comerciales de cada organización antes de importar archivos."
        />
        <NoOrganizationState />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Ciclos comerciales"
        description="Crea ciclos en borrador y revisa su estado. La activación queda bloqueada hasta completar importación, preview y confirmación."
        action={
          <div className="flex flex-wrap gap-3">
            {activeCycle ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/api/ciclos/${activeCycle.id}/cambios?organization=${selectedOrganizationId}`}
                >
                  <Download aria-hidden="true" />
                  Finalizar ciclo
                </a>
              </Button>
            ) : null}
            <Button size="sm" asChild>
              <Link href={`/importaciones?organization=${selectedOrganizationId}`}>
                <Upload aria-hidden="true" />
                Iniciar ciclo
              </Link>
            </Button>
          </div>
        }
      />

      {organizations.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="grid gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Historial de ciclos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {cycles.length} ciclo{cycles.length === 1 ? "" : "s"} registrado
                {cycles.length === 1 ? "" : "s"}
              </p>
            </div>
            <CyclesTable cycles={cycles} />
          </section>

          <CreateCycleForm organizationId={selectedOrganizationId} />
        </div>
      ) : null}
    </div>
  );
}
