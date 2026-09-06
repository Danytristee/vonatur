import { Search } from "lucide-react";

import type { ContactFilterOptions, ContactFilters } from "@/features/contacts/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContactsFiltersProps = {
  organizationId: string;
  filters: ContactFilters;
  options: ContactFilterOptions;
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
        className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
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

export function ContactsFilters({
  organizationId,
  filters,
  options,
}: ContactsFiltersProps) {
  return (
    <form className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto_auto]">
      <input type="hidden" name="organization" value={organizationId} />

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
            placeholder="Código, nombre o teléfono"
            className="h-10 pl-9"
          />
        </div>
      </div>

      <FilterSelect
        name="estado"
        label="Estado"
        value={filters.status}
        options={options.statuses}
      />
      <FilterSelect
        name="nivel"
        label="Nivel"
        value={filters.level}
        options={options.levels}
      />
      <FilterSelect
        name="distrito"
        label="Distrito"
        value={filters.district}
        options={options.districts}
      />

      <div className="flex items-end">
        <Button type="submit" variant="outline" className="h-10 w-full sm:w-auto">
          Filtrar
        </Button>
      </div>
    </form>
  );
}
