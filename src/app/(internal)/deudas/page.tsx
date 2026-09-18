import {
  NoOrganizationState,
  PageHeader,
} from "@/features/app-shell/section-states";
import { DebtsFilters } from "@/features/debts/components/debts-filters";
import { DebtsTable } from "@/features/debts/components/debts-table";
import { getDebtsPageData } from "@/features/debts/queries";

export const dynamic = "force-dynamic";

type DebtsPageProps = {
  searchParams: Promise<{
    organization?: string;
    ciclo?: string;
    q?: string;
    estado?: string;
    nivel?: string;
    vencimiento?: string;
  }>;
};

export default async function DebtsPage({ searchParams }: DebtsPageProps) {
  const params = await searchParams;
  const filters = {
    search: params.q,
    situation: params.estado,
    level: params.nivel,
    maturityStatus: params.vencimiento,
  };
  const {
    selectedOrganizationId,
    cycles,
    selectedCycleId,
    debts,
    filterOptions,
  } = await getDebtsPageData(params.organization, params.ciclo, filters);

  if (!selectedOrganizationId) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Deudas"
          description="Consulta saldos por consultora y ciclo una vez confirmada una importación."
        />
        <NoOrganizationState />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Deudas" />

      {cycles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay ciclos creados para esta organización.
        </p>
      ) : (
        <>
          <DebtsFilters
            organizationId={selectedOrganizationId}
            cycles={cycles}
            selectedCycleId={selectedCycleId}
            filters={filters}
            options={filterOptions}
          />

          <p className="text-sm text-muted-foreground">
            {debts.length} deuda{debts.length === 1 ? "" : "s"}
          </p>

          <DebtsTable organizationId={selectedOrganizationId} debts={debts} />
        </>
      )}
    </div>
  );
}
