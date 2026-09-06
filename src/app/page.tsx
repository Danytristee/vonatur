import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-2xl">
        <p className="text-sm font-medium text-emerald-700">Vonatur</p>
        <div className="mt-4 grid gap-4">
          <h1 className="max-w-xl text-3xl font-semibold tracking-normal">
            Panel operativo para ciclos comerciales
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600">
            Vonatur organiza ciclos, contactos, importaciones y deudas con
            aislamiento por organización desde el inicio.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Ir al dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
