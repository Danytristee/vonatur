"use client";

import { useActionState, useId } from "react";

import { createDraftCycle } from "@/features/cycles/actions";
import type { CycleActionState } from "@/features/cycles/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CycleActionState = {
  ok: false,
  message: null,
};

type CreateCycleFormProps = {
  organizationId: string;
};

export function CreateCycleForm({ organizationId }: CreateCycleFormProps) {
  const [state, formAction, isPending] = useActionState(
    createDraftCycle,
    initialState,
  );
  const currentYear = new Date().getFullYear();
  const yearId = useId();
  const cycleNumberId = useId();

  return (
    <Card asChild className="p-4">
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="organizationId" value={organizationId} />

        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-foreground">
            Crear ciclo
          </h2>
          <p className="text-sm text-muted-foreground">
            El ciclo nuevo se crea como borrador hasta que lo actives.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={yearId}>Año</Label>
            <Input
              id={yearId}
              name="year"
              type="number"
              min="2000"
              max="2200"
              defaultValue={currentYear}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={cycleNumberId}>Ciclo</Label>
            <Input
              id={cycleNumberId}
              name="cycleNumber"
              type="number"
              min="1"
              max="19"
              required
            />
          </div>
        </div>

        {state.message ? (
          <Alert variant="destructive">{state.message}</Alert>
        ) : null}

        {state.ok ? <Alert variant="success">Ciclo creado.</Alert> : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear borrador"}
        </Button>
      </form>
    </Card>
  );
}
