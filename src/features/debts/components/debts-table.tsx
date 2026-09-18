"use client";

import { flexRender, type SortingState } from "@tanstack/react-table";
import {
  type LegacyColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { useMemo, useState } from "react";

import type { DebtListItem } from "@/features/debts/types";
import { NotesPopover } from "@/features/notes/components/notes-popover";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SortableColumnHeader } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });

function formatCurrency(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  return value === null ? "—" : dateFormatter.format(new Date(value));
}

function overdueBadgeVariant(daysOverdue: number | null) {
  if (daysOverdue === null || daysOverdue <= 0) return "outline" as const;
  if (daysOverdue <= 30) return "warning" as const;
  return "destructive" as const;
}

const rightAlignedColumns = new Set([
  "principalBalance",
  "currentBalance",
  "daysOverdue",
  "notes",
]);

const headerClassNames: Record<string, string> = {
  externalCode: "sticky left-0 z-[3] bg-secondary",
};

const cellClassNames: Record<string, string> = {
  externalCode: "sticky left-0 z-[1] bg-card",
};

type DebtsTableProps = {
  organizationId: string;
  debts: DebtListItem[];
};

export function DebtsTable({ organizationId, debts }: DebtsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<LegacyColumnDef<DebtListItem>[]>(
    () => [
      {
        accessorKey: "externalCode",
        header: "Código",
        cell: ({ getValue }) => (
          <span className="font-semibold text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "fullName",
        header: "Nombre",
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "level",
        header: "Nivel",
        cell: ({ getValue }) => (
          <span className="text-foreground/90">{getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "situation",
        header: "Estado",
        cell: ({ getValue }) => (
          <span className="text-foreground/90">{getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "maturityStatus",
        header: "Vencimiento",
        cell: ({ getValue }) => (
          <span className="text-foreground/90">{getValue<string | null>() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Fecha vencimiento",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {formatDate(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorKey: "principalBalance",
        header: "Saldo principal",
        cell: ({ getValue }) => (
          <span className="text-foreground/90">
            {formatCurrency(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: "currentBalance",
        header: "Saldo actual",
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {formatCurrency(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: "daysOverdue",
        header: "Días de retraso",
        cell: ({ getValue }) => {
          const daysOverdue = getValue<number | null>();
          return (
            <Badge variant={overdueBadgeVariant(daysOverdue)}>
              {daysOverdue ?? 0} días
            </Badge>
          );
        },
      },
      {
        id: "notes",
        header: "Notas",
        enableSorting: false,
        cell: ({ row }) => (
          <NotesPopover
            organizationId={organizationId}
            contactId={row.original.contactId}
            contactLabel={row.original.fullName ?? row.original.externalCode}
          />
        ),
      },
    ],
    [organizationId],
  );

  const table = useLegacyTable({
    data: debts,
    columns,
    getRowId: (debt) => debt.id,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (debts.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center shadow-none">
        <h2 className="text-base font-semibold text-foreground">
          No se encontraron deudas
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajusta la búsqueda, los filtros, o elige otro ciclo.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="max-h-[68vh] min-h-96 overflow-auto">
        <table className="w-full min-w-[960px] divide-y divide-border text-sm">
          <thead className="sticky top-0 z-[2] bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-3",
                      rightAlignedColumns.has(header.column.id) && "text-right",
                      headerClassNames[header.column.id],
                    )}
                  >
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
              <tr key={row.id} className="align-top">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-4 py-3",
                      rightAlignedColumns.has(cell.column.id) && "text-right",
                      cellClassNames[cell.column.id],
                    )}
                  >
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
