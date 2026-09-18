"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useActionState, useId, useState } from "react";

import {
  type UpdatePasswordActionState,
  updatePassword,
} from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UpdatePasswordActionState = {
  message: null,
};

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const passwordId = useId();
  const confirmPasswordId = useId();

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor={passwordId}>Contraseña nueva</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
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

      <div className="grid gap-2">
        <Label htmlFor={confirmPasswordId}>Confirma la contraseña</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={confirmPasswordId}
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="pl-10"
          />
        </div>
      </div>

      {state.message ? <Alert variant="destructive">{state.message}</Alert> : null}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Guardando..." : "Guardar contraseña nueva"}
      </Button>
    </form>
  );
}
