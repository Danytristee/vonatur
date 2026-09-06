import type { CycleListItem, CycleStatus } from "@/features/cycles/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const statusLabels: Record<CycleStatus, string> = {
  active: "Activo",
  archived: "Archivado",
  draft: "Borrador",
};

const statusVariants: Record<
  CycleStatus,
  "success" | "outline" | "warning"
> = {
  active: "success",
  archived: "outline",
  draft: "warning",
};

type CyclesTableProps = {
  cycles: CycleListItem[];
};

export function CyclesTable({ cycles }: CyclesTableProps) {
  if (cycles.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center shadow-none">
        <h2 className="text-base font-semibold text-foreground">
          Aún no hay ciclos
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Crea el primer borrador para preparar la importación del siguiente
          paso.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Ciclo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Activado</th>
              <th className="px-4 py-3">Siguiente paso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cycles.map((cycle) => (
              <tr key={cycle.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-foreground">{cycle.year}</td>
                <td className="px-4 py-3 text-foreground/90">Ciclo {cycle.cycleNumber}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariants[cycle.status]}>
                    {statusLabels[cycle.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {cycle.activatedAt
                    ? new Intl.DateTimeFormat("es-PE", {
                        dateStyle: "medium",
                      }).format(new Date(cycle.activatedAt))
                    : "Pendiente"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {cycle.status === "draft"
                    ? "Pendiente de importación confirmada"
                    : "Sin acción manual"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
