import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { Alert } from "@/components/ui/alert";
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-7 grid justify-items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            V
          </div>
          <div className="grid gap-1">
            <h1 className="text-2xl font-semibold text-foreground">
              Bienvenida a Vonatur
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Ingresa con tu cuenta para ver tus ciclos, contactos y deudas.
            </p>
          </div>
        </div>

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <Alert variant="warning">
            Configura `NEXT_PUBLIC_SUPABASE_URL` y
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` para
            habilitar el inicio de sesión.
          </Alert>
        )}
      </section>
    </main>
  );
}
