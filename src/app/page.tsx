import { redirect } from "next/navigation";

import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!hasSupabaseBrowserEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  redirect(claims ? "/dashboard" : "/login");
}
