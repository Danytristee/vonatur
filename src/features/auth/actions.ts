"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  message: string | null;
};

const GENERIC_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";

// Credential errors stay deliberately vague so the form does not reveal which
// emails exist. Everything else gets a precise message, because those failures
// are operational and the person in front of the screen cannot fix what the UI
// will not name.
function toLoginMessage(code: string | undefined, status: number | undefined) {
  switch (code) {
    case "invalid_credentials":
    case "user_not_found":
      return GENERIC_CREDENTIALS_MESSAGE;
    case "email_not_confirmed":
      return "Tu correo aún no está confirmado. Confírmalo en Supabase (Authentication → Users) antes de entrar.";
    case "user_banned":
      return "Este usuario está bloqueado en Supabase.";
    case "email_provider_disabled":
      return "El acceso con correo y contraseña está deshabilitado en el proyecto de Supabase.";
    case "over_request_rate_limit":
      return "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.";
    default:
      break;
  }

  if (status === 401 || status === 400) {
    return GENERIC_CREDENTIALS_MESSAGE;
  }

  return `No pudimos iniciar sesión. Detalle técnico: ${code ?? "sin código"}${
    status ? ` (${status})` : ""
  }.`;
}

export async function signInWithPassword(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Full detail goes to the server log (Vercel runtime logs) so a failed
    // sign-in is diagnosable without widening what the browser is told.
    console.error("[auth] signInWithPassword failed", {
      code: error.code,
      status: error.status,
      name: error.name,
      message: error.message,
    });

    // A retryable fetch error means the request never reached Auth: wrong URL,
    // wrong project ref, or the service is unreachable from the deployment.
    if (error.name === "AuthRetryableFetchError") {
      return {
        message:
          "No pudimos contactar a Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y la llave publicable del despliegue.",
      };
    }

    return { message: toLoginMessage(error.code, error.status) };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
