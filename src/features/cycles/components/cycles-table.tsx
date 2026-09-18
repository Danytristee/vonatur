"use client";

import { flexRender, type SortingState } from "@tanstack/react-table";
import {
  type LegacyColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { useState } from "react";

import type { CycleListItem, CycleStatus } from "@/features/cycles/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SortableColumnHeader } from "@/components/ui/data-table";

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

const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });

const columns: LegacyColumnDef<CycleListItem>[] = [
  {
    accessorKey: "year",
    header: "Año",
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: "cycleNumber",
    header: "Ciclo",
    cell: ({ getValue }) => (
      <span className="text-foreground/90">Ciclo {getValue<number>()}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ getValue }) => {
      const status = getValue<CycleStatus>();
      return <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>;
    },
  },
  {
    accessorKey: "activatedAt",
    header: "Activado",
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return (
        <span className="text-muted-foreground">
          {value ? dateFormatter.format(new Date(value)) : "Pendiente"}
        </span>
      );
    },
  },
  {
    id: "nextStep",
    header: "Siguiente paso",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.status === "draft"
          ? "Pendiente de importación confirmada"
          : "Sin acción manual"}
      </span>
    ),
  },
];

type CyclesTableProps = {
  cycles: CycleListItem[];
};

export function CyclesTable({ cycles }: CyclesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useLegacyTable({
    data: cycles,
    columns,
    getRowId: (cycle) => cycle.id,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3">
                    <SortableColumnHeader column={header.column}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </SortableColumnHeader>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-secondary/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
