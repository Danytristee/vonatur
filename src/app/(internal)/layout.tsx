import { redirect } from "next/navigation";

import { InternalShell } from "@/features/app-shell/internal-shell";
import { getCurrentUserOrganizations } from "@/lib/organizations/queries";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function SupabaseSetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-lg rounded-md border border-amber-200 bg-amber-50 p-5">
        <h1 className="text-lg font-semibold text-amber-950">
          Supabase no está configurado
        </h1>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Agrega `NEXT_PUBLIC_SUPABASE_URL` y
          `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` para habilitar
          el acceso interno de Vonatur.
        </p>
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
