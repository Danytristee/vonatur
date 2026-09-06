import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const isSupabaseConfigured = hasSupabaseBrowserEnv();

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();

    if (claims) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <section className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid gap-2">
          <p className="text-sm font-medium text-emerald-700">Vonatur</p>
          <h1 className="text-2xl font-semibold text-zinc-950">Iniciar sesión</h1>
          <p className="text-sm leading-6 text-zinc-600">
            Accede con tu cuenta autorizada para entrar al panel interno de tu
            organización.
          </p>
        </div>

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
            Configura `NEXT_PUBLIC_SUPABASE_URL` y
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` para habilitar el
            inicio de sesión.
          </div>
        )}
      </section>
    </main>
  );
}
