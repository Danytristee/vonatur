"use client";

import { AlertTriangle } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InternalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-destructive">Vonatur</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            No pudimos cargar esta sección
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Revisa la conexión con Supabase, las políticas RLS y que tu
            usuario tenga membresía en la organización.
          </p>
        </div>
      </div>

      <Card className="border-destructive/20 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive-muted">
            <AlertTriangle
              className="size-5 text-destructive-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-foreground">
              Error de carga
            </h2>
            <Alert variant="destructive" className="border-0 bg-transparent p-0">
              {error.message}
            </Alert>
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={reset}
          className="mt-4"
        >
          Intentar de nuevo
        </Button>
      </Card>
    </div>
  );
}
