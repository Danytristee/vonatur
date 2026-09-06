"use client";

export default function InternalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-red-700">Vonatur</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">
            No pudimos cargar esta sección
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Revisa la conexión con Supabase, las políticas RLS y que tu usuario
            tenga membresía en la organización.
          </p>
        </div>
      </div>

      <section className="rounded-md border border-red-200 bg-red-50 p-5">
        <h2 className="text-base font-semibold text-red-950">
          Error de carga
        </h2>
        <p className="mt-2 text-sm leading-6 text-red-900">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
        >
          Intentar de nuevo
        </button>
      </section>
    </div>
  );
}
