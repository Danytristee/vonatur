import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";
import { getSupabaseBrowserEnv } from "./env";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseBrowserEnv();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
