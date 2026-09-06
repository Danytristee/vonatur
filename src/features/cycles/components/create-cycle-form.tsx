"use client";

import { useActionState } from "react";

import { createDraftCycle } from "@/features/cycles/actions";
import type { CycleActionState } from "@/features/cycles/types";

const initialState: CycleActionState = {
  ok: false,
  message: null,
};

type CreateCycleFormProps = {
  organizationId: string;
};

export function CreateCycleForm({ organizationId }: CreateCycleFormProps) {
  const [state, formAction, isPending] = useActionState(
    createDraftCycle,
    initialState,
  );
  const currentYear = new Date().getFullYear();

  return (
    <form action={formAction} className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-zinc-950">Crear ciclo</h2>
        <p className="text-sm text-zinc-600">
          El ciclo nuevo se crea como borrador hasta que lo actives.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="year">
            Año
          </label>
          <input
            id="year"
            name="year"
            type="number"
            min="2000"
            max="2200"
            defaultValue={currentYear}
            required
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="cycleNumber">
            Ciclo
          </label>
          <input
            id="cycleNumber"
            name="cycleNumber"
            type="number"
            min="1"
            max="19"
            required
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      {state.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Ciclo creado.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isPending ? "Creando..." : "Crear borrador"}
      </button>
    </form>
  );
}
