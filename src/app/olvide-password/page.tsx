import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { LoginHero } from "@/features/auth/components/login-hero";
import { Alert } from "@/components/ui/alert";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ expired?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const isSupabaseConfigured = hasSupabaseBrowserEnv();
  const params = await searchParams;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();

    if (claims) {
      redirect("/dashboard");
    }
  }

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
              Recupera tu contraseña
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Ingresa tu correo y te enviamos un enlace para definir una
              contraseña nueva.
            </p>
          </div>

          {isSupabaseConfigured ? (
            <div className="grid gap-5">
              {params.expired ? (
                <Alert variant="warning">
                  Ese enlace ya expiró o no es válido. Solicita uno nuevo.
                </Alert>
              ) : null}
              <ForgotPasswordForm />
            </div>
          ) : (
            <Alert variant="warning">
              Configura `NEXT_PUBLIC_SUPABASE_URL` y
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` para
              habilitar la recuperación de contraseña.
            </Alert>
          )}
        </div>
      </div>
    </main>
  );
}
