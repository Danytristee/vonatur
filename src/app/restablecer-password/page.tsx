import Link from "next/link";

import { LoginHero } from "@/features/auth/components/login-hero";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { Alert } from "@/components/ui/alert";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const isSupabaseConfigured = hasSupabaseBrowserEnv();

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Alert variant="warning">
          Configura `NEXT_PUBLIC_SUPABASE_URL` y
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` para
          habilitar el restablecimiento de contraseña.
        </Alert>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  return (
    <main className="flex min-h-screen bg-card">
      <LoginHero />

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              V
            </div>
            <span className="text-base font-semibold text-foreground">
              Vonatur
            </span>
          </div>

          <div className="mb-7 grid gap-1">
            <h2 className="text-2xl font-semibold text-foreground">
              Define tu contraseña nueva
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Tiene que tener al menos 8 caracteres.
            </p>
          </div>

          {claims ? (
            <ResetPasswordForm />
          ) : (
            <div className="grid gap-5">
              <Alert variant="warning">
                Este enlace ya expiró o no es válido. Solicita uno nuevo.
              </Alert>
              <Link
                href="/olvide-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Solicitar un enlace nuevo
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
