import { redirect } from "next/navigation";

import { InternalShell } from "@/features/app-shell/internal-shell";
import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

function SupabaseSetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-lg">
        <h1 className="mb-3 text-lg font-semibold">
          Supabase no está configurado
        </h1>
        <Alert variant="warning">
          Agrega `NEXT_PUBLIC_SUPABASE_URL` y
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` para
          habilitar el acceso interno de Vonatur.
        </Alert>
      </section>
    </main>
  );
}

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseBrowserEnv()) {
    return <SupabaseSetupRequired />;
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims) {
    redirect("/login");
  }

  const [
    organizations,
    {
      data: { user },
    },
  ] = await Promise.all([getCurrentUserOrganizations(), supabase.auth.getUser()]);

  return (
    <InternalShell
      organizations={organizations}
      userEmail={user?.email ?? "Usuario Vonatur"}
    >
      {children}
    </InternalShell>
  );
}
