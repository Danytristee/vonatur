import Link from "next/link";

import {
  EmptyState,
  PageHeader,
  PreparedSection,
} from "@/features/app-shell/section-states";
import { getDashboardSummary } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

const workflowSteps = [
  "Subir Channel Extract y Debt Report.",
  "Parsear y normalizar columnas esperadas.",
  "Validar datos y correlacionar por external_code.",
  "Revisar preview antes de persistir cambios.",
  "Confirmar importación y activar el ciclo.",
];

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const summary = await getDashboardSummary(params.organization);

  if (!summary.selectedOrganizationId) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Inicio"
          description="Panel interno de Vonatur para ciclos, contactos, deudas e importaciones."
        />
        <EmptyState
          title="Tu usuario aún no tiene organización"
          description="Crea la primera organización y vincula tu usuario en organization_members para empezar a usar el panel interno."
        />
      </div>
    );
  }

  const organizationQuery = `?organization=${summary.selectedOrganizationId}`;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Inicio"
        description={`Resumen operativo de ${summary.selectedOrganizationName}. La prioridad actual es preparar ciclos e importaciones sin activar nada antes de confirmar los archivos.`}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Ciclo activo"
          value={summary.activeCycleLabel ?? "Sin ciclo activo"}
          href={`/ciclos${organizationQuery}`}
        />
        <SummaryCard
          label="Ciclos registrados"
          value={String(summary.cycleCount)}
          href={`/ciclos${organizationQuery}`}
        />
        <SummaryCard
          label="Contactos"
          value={String(summary.contactCount)}
          href={`/contactos${organizationQuery}`}
        />
        <SummaryCard
          label="Deudas"
          value={String(summary.debtCount)}
          href={`/deudas${organizationQuery}`}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PreparedSection
          title="Flujo seguro del próximo ciclo"
          description="La activación manual está deshabilitada. Vonatur debe completar el flujo de importación confirmado antes de mover un ciclo a activo."
          steps={workflowSteps}
        />

        <section className="grid gap-3 rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-950">
            Próximas acciones
          </h2>
          <div className="grid gap-2">
            <ActionLink href={`/ciclos${organizationQuery}`}>
              Crear o revisar ciclos borrador
            </ActionLink>
            <ActionLink href={`/importaciones${organizationQuery}`}>
              Preparar importación de archivos
            </ActionLink>
            <ActionLink href={`/contactos${organizationQuery}`}>
              Mantener contactos base
            </ActionLink>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-28 gap-2 rounded-md border border-zinc-200 bg-white p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
    >
      <span className="text-sm text-zinc-600">{label}</span>
      <span className="text-2xl font-semibold tracking-normal text-zinc-950">
        {value}
      </span>
    </Link>
  );
}

function ActionLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
    >
      {children}
    </Link>
  );
}
