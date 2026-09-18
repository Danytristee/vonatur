"use client";

import type { RowData } from "@tanstack/react-table";
import type { LegacyColumn } from "@tanstack/react-table/legacy";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

type SortableColumnHeaderProps<TData extends RowData, TValue> = {
  column: LegacyColumn<TData, TValue>;
  children: ReactNode;
};

export function SortableColumnHeader<TData extends RowData, TValue>({
  column,
  children,
}: SortableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <>{children}</>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className="inline-flex items-center gap-1.5 hover:text-foreground"
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" aria-hidden="true" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" aria-hidden="true" />
      ) : (
        <ChevronsUpDown
          className="size-3.5 text-muted-foreground/50"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
