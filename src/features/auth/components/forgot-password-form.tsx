"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useActionState, useId } from "react";

import {
  type ForgotPasswordActionState,
  requestPasswordReset,
} from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ForgotPasswordActionState = {
  status: "idle",
  message: null,
};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const emailId = useId();

  if (state.status === "sent") {
    return (
      <div className="grid gap-5">
        <Alert variant="success">{state.message}</Alert>
        <Link
          href="/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Correo electrónico</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
            className="pl-10"
          />
        </div>
      </div>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">{state.message}</Alert>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
