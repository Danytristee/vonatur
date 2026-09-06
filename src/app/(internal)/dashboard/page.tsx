import {
  ArrowRight,
  CircleDollarSign,
  Contact,
  Download,
  RotateCcw,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import {
  EmptyState,
  PageHeader,
  PreparedSection,
} from "@/features/app-shell/section-states";
import { getDashboardSummary } from "@/features/dashboard/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
          description="Panel interno de Vonatur para ciclos, consultoras, deudas e importaciones."
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
        action={
          <div className="flex flex-wrap gap-3">
            {summary.activeCycleId ? (
              <Button variant="outline" asChild>
                <a
                  href={`/api/ciclos/${summary.activeCycleId}/cambios?organization=${summary.selectedOrganizationId}`}
                >
                  <Download aria-hidden="true" />
                  Finalizar ciclo
                </a>
              </Button>
            ) : null}
            <Button asChild>
              <Link href={`/importaciones${organizationQuery}`}>
                <Upload aria-hidden="true" />
                Iniciar ciclo
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={RotateCcw}
          label="Ciclo activo"
          value={summary.activeCycleLabel ?? "Sin ciclo activo"}
          href={`/ciclos${organizationQuery}`}
        />
        <SummaryCard
          icon={RotateCcw}
          label="Ciclos registrados"
          value={String(summary.cycleCount)}
          href={`/ciclos${organizationQuery}`}
        />
        <SummaryCard
          icon={Contact}
          label="Consultoras"
          value={String(summary.contactCount)}
          href={`/consultoras${organizationQuery}`}
        />
        <SummaryCard
          icon={CircleDollarSign}
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

        <Card className="grid gap-3 p-5">
          <h2 className="text-base font-semibold text-foreground">
            Próximas acciones
          </h2>
          <div className="grid gap-2">
            <ActionLink href={`/ciclos${organizationQuery}`}>
              Crear o revisar ciclos borrador
            </ActionLink>
            <ActionLink href={`/importaciones${organizationQuery}`}>
              Preparar importación de archivos
            </ActionLink>
            <ActionLink href={`/consultoras${organizationQuery}`}>
              Mantener consultoras base
            </ActionLink>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-28 gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
        <Icon className="size-5 text-accent-foreground" />
      </div>
      <div>
        <span className="block text-sm text-muted-foreground">{label}</span>
        <span className="block text-2xl font-semibold text-foreground">
          {value}
        </span>
      </div>
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
      className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
