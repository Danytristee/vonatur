"use client";

import { useActionState } from "react";

import { createContact } from "@/features/contacts/actions";
import type { ContactActionState } from "@/features/contacts/types";

const initialState: ContactActionState = {
  ok: false,
  message: null,
};

type CreateContactFormProps = {
  organizationId: string;
};

export function CreateContactForm({ organizationId }: CreateContactFormProps) {
  const [state, formAction, isPending] = useActionState(
    createContact,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4"
    >
      <input type="hidden" name="organizationId" value={organizationId} />

      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-zinc-950">Crear contacto</h2>
        <p className="text-sm text-zinc-600">
          Usa el código de consultora que vendrá en los archivos de deuda.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <label
            className="text-sm font-medium text-zinc-900"
            htmlFor="externalCode"
          >
            Código de consultora
          </label>
          <input
            id="externalCode"
            name="externalCode"
            required
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor="fullName">
            Nombre completo
          </label>
          <input
            id="fullName"
            name="fullName"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-900" htmlFor="phone">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="grid gap-2">
            <label
              className="text-sm font-medium text-zinc-900"
              htmlFor="district"
            >
              Distrito
            </label>
            <input
              id="district"
              name="district"
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <div className="grid gap-2">
            <label
              className="text-sm font-medium text-zinc-900"
              htmlFor="currentStatus"
            >
              Estado
            </label>
            <input
              id="currentStatus"
              name="currentStatus"
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="grid gap-2">
            <label
              className="text-sm font-medium text-zinc-900"
              htmlFor="currentLevel"
            >
              Nivel
            </label>
            <input
              id="currentLevel"
              name="currentLevel"
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      {state.ok ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Contacto creado.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isPending ? "Creando..." : "Crear contacto"}
      </button>
    </form>
  );
}
