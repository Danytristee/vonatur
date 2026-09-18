"use client";

import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import {
  type LoginActionState,
  signInWithPassword,
} from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginActionState = {
  message: null,
};

// Cheap client-side friction on top of Supabase Auth's own server-side rate
// limiting: after a few failed attempts in a row, pause the form briefly
// instead of letting every keystroke retrigger a request.
const FAILURES_BEFORE_COOLDOWN = 3;
const COOLDOWN_SECONDS = 15;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const consecutiveFailures = useRef(0);
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    if (!state.message) {
      return;
    }

    consecutiveFailures.current += 1;
    if (consecutiveFailures.current >= FAILURES_BEFORE_COOLDOWN) {
      consecutiveFailures.current = 0;
      setCooldown(COOLDOWN_SECONDS);
    }
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

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

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={passwordId}>Contraseña</Label>
          <Link
            href="/olvide-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pl-10 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {state.message ? (
        <Alert variant="destructive">{state.message}</Alert>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isPending || cooldown > 0}
        className="w-full"
      >
        {isPending
          ? "Ingresando..."
          : cooldown > 0
            ? `Espera ${cooldown}s`
            : "Iniciar sesión"}
      </Button>
    </form>
  );
}
