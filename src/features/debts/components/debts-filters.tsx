import { Search } from "lucide-react";

import type { CycleListItem, CycleStatus } from "@/features/cycles/types";
import type { DebtFilterOptions, DebtFilters } from "@/features/debts/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const cycleStatusLabels: Record<CycleStatus, string> = {
  active: "Activo",
  archived: "Archivado",
  draft: "Borrador",
};

type DebtsFiltersProps = {
  organizationId: string;
  cycles: CycleListItem[];
  selectedCycleId: string | null;
  filters: DebtFilters;
  options: DebtFilterOptions;
};

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: string[];
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium text-muted-foreground" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DebtsFilters({
  organizationId,
  cycles,
  selectedCycleId,
  filters,
  options,
}: DebtsFiltersProps) {
  return (
    <form className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[auto_1fr_auto_auto_auto_auto] lg:items-end">
      <input type="hidden" name="organization" value={organizationId} />

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="ciclo">
          Ciclo
        </label>
        <select
          id="ciclo"
          name="ciclo"
          defaultValue={selectedCycleId ?? ""}
          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 lg:w-48"
        >
          {cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              Ciclo {cycle.cycleNumber} · {cycle.year} (
              {cycleStatusLabels[cycle.status]})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="q">
          Buscar
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="q"
            name="q"
            defaultValue={filters.search ?? ""}
            placeholder="Código o nombre"
            className="h-10 pl-9"
          />
        </div>
      </div>

      <FilterSelect
        name="vencimiento"
        label="Vencimiento"
        value={filters.maturityStatus}
        options={options.maturityStatuses}
      />
      <FilterSelect
        name="estado"
        label="Estado"
        value={filters.situation}
        options={options.situations}
      />
      <FilterSelect
        name="nivel"
        label="Nivel"
        value={filters.level}
        options={options.levels}
      />

      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="submit" variant="outline" className="h-10 w-full lg:w-auto">
          Filtrar
        </Button>
      </div>
    </form>
  );
}
