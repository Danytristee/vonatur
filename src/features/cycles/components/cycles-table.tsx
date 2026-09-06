import type { CycleListItem, CycleStatus } from "@/features/cycles/types";

const statusLabels: Record<CycleStatus, string> = {
  active: "Activo",
  archived: "Archivado",
  draft: "Borrador",
};

const statusClasses: Record<CycleStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  archived: "border-zinc-200 bg-zinc-50 text-zinc-700",
  draft: "border-amber-200 bg-amber-50 text-amber-800",
};

type CyclesTableProps = {
  cycles: CycleListItem[];
};

export function CyclesTable({ cycles }: CyclesTableProps) {
  if (cycles.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-zinc-950">Aún no hay ciclos</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Crea el primer borrador para preparar la importación del siguiente paso.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-normal text-zinc-600">
            <tr>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Ciclo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Activado</th>
              <th className="px-4 py-3">Siguiente paso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {cycles.map((cycle) => (
              <tr key={cycle.id}>
                <td className="px-4 py-3 font-medium text-zinc-950">{cycle.year}</td>
                <td className="px-4 py-3 text-zinc-700">Ciclo {cycle.cycleNumber}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusClasses[cycle.status]}`}
                  >
                    {statusLabels[cycle.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {cycle.activatedAt
                    ? new Intl.DateTimeFormat("es-PE", {
                        dateStyle: "medium",
                      }).format(new Date(cycle.activatedAt))
                    : "Pendiente"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {cycle.status === "draft"
                    ? "Pendiente de importación confirmada"
                    : "Sin acción manual"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
