"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { forgotPasswordSchema, resetPasswordSchema } from "./schemas";

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

export type ForgotPasswordActionState = {
  status: "idle" | "sent" | "error";
  message: string | null;
};

const GENERIC_RESET_SENT_MESSAGE =
  "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.";

// Deliberately not derived from the Origin/Host request headers: those are
// attacker-controllable and using them here would let a forged header poison
// the password-reset email with a link to an attacker's domain.
function resolveOrigin() {
  const origin = process.env.APP_ORIGIN;

  if (!origin) {
    throw new Error(
      "APP_ORIGIN no está configurado. Defínelo con la URL pública del despliegue para generar enlaces de restablecimiento de contraseña.",
    );
  }

  return origin;
}

// Supabase never reveals whether an email is registered, so every outcome
// short of a genuine operational failure (rate limit, connectivity) returns
// the same "sent" message — the form must not become an email-enumeration
// oracle.
export async function requestPasswordReset(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Ingresa un correo válido.",
    };
  }

  const supabase = await createClient();
  const origin = resolveOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/auth/confirm?next=/restablecer-password` },
  );

  if (error) {
    console.error("[auth] resetPasswordForEmail failed", {
      code: error.code,
      status: error.status,
      name: error.name,
      message: error.message,
    });

    if (
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit"
    ) {
      return {
        status: "error",
        message:
          "Ya enviamos un enlace recientemente. Espera unos minutos e inténtalo de nuevo.",
      };
    }

    if (error.name === "AuthRetryableFetchError") {
      return {
        status: "error",
        message:
          "No pudimos contactar a Supabase. Intenta de nuevo en un momento.",
      };
    }

    // Any other failure (including "email not found") stays generic below.
  }

  return { status: "sent", message: GENERIC_RESET_SENT_MESSAGE };
}

export type UpdatePasswordActionState = {
  message: string | null;
};

export async function updatePassword(
  _previousState: UpdatePasswordActionState,
  formData: FormData,
): Promise<UpdatePasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisa la contraseña.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.error("[auth] updateUser (password) failed", {
      code: error.code,
      status: error.status,
      name: error.name,
      message: error.message,
    });

    if (error.code === "same_password") {
      return { message: "La nueva contraseña debe ser distinta a la actual." };
    }

    if (error.name === "AuthRetryableFetchError") {
      return {
        message:
          "No pudimos contactar a Supabase. Intenta de nuevo en un momento.",
      };
    }

    return {
      message:
        "No pudimos actualizar la contraseña. El enlace pudo expirar — solicita uno nuevo.",
    };
  }

  redirect("/dashboard");
}
