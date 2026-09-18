"use client";

import { flexRender, type SortingState } from "@tanstack/react-table";
import {
  type LegacyColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { useState } from "react";

import { ContactRow } from "@/features/contacts/components/contact-row";
import type { ContactListItem } from "@/features/contacts/types";
import { Card } from "@/components/ui/card";
import { SortableColumnHeader } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

// Column defs exist only to drive the sortable header row and the sort order
// of `getRowModel().rows` below — each row's cells still render through
// ContactRow, which owns its own inline-edit state per contact.
const columns: LegacyColumnDef<ContactListItem>[] = [
  { accessorKey: "externalCode", header: "Código" },
  { accessorKey: "fullName", header: "Nombre" },
  { accessorKey: "phone", header: "Teléfono" },
  { accessorKey: "currentStatus", header: "Estado" },
  { accessorKey: "currentLevel", header: "Nivel" },
  { accessorKey: "district", header: "Distrito" },
  {
    id: "debt",
    accessorFn: (contact) => contact.debtSummary?.currentBalanceTotal ?? -1,
    header: "Deuda (ciclo activo)",
  },
  {
    id: "action",
    header: "Acción",
    enableSorting: false,
  },
];

const headerClassNames: Record<string, string> = {
  externalCode: "sticky left-0 z-[3] bg-secondary",
  action: "text-right",
};

type ContactsTableProps = {
  contacts: ContactListItem[];
};

export function ContactsTable({ contacts }: ContactsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useLegacyTable({
    data: contacts,
    columns,
    getRowId: (contact) => contact.id,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (contacts.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center shadow-none">
        <h2 className="text-base font-semibold text-foreground">
          No se encontraron consultoras
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajusta la búsqueda o los filtros, o agrega una consultora nueva.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="max-h-[68vh] min-h-96 overflow-auto">
        <table className="w-full min-w-[880px] divide-y divide-border text-sm">
          <thead className="sticky top-0 z-[2] bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-3",
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
              <ContactRow key={row.id} contact={row.original} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
