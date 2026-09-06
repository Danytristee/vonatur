import Link from "next/link";

import {
  NoOrganizationState,
  PageHeader,
} from "@/features/app-shell/section-states";
import { CreateCycleForm } from "@/features/cycles/components/create-cycle-form";
import { CyclesTable } from "@/features/cycles/components/cycles-table";
import { getCyclesPageData } from "@/features/cycles/queries";

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
          <Link
            href={`/importaciones?organization=${selectedOrganizationId}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Ir a importaciones
          </Link>
        }
      />

      {organizations.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="grid gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                Historial de ciclos
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
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
