import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Only a same-origin, single-slash path is safe to redirect to. Anything else
// (an absolute URL, a protocol-relative "//evil.com", or the "@evil.com"
// userinfo trick) is an open-redirect vector, so it falls back to "/".
function sanitizeNextPath(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/";
  }

  return rawNext;
}

// Supabase's password-recovery email links land here with a PKCE `code`. It
// must be exchanged for a session before the destination page can call
// `auth.updateUser`, so this redirect hop always runs first.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirect(`${origin}${next}`);
    }
  }

  redirect(`${origin}/olvide-password?expired=1`);
}
