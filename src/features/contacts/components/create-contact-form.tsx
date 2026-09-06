"use client";

import { useActionState, useId } from "react";

import { createContact } from "@/features/contacts/actions";
import type { ContactActionState } from "@/features/contacts/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ContactActionState = {
  ok: false,
  message: null,
};

type CreateContactFormProps = {
  organizationId: string;
};

export function CreateContactForm({ organizationId }: CreateContactFormProps) {
  const [state, formAction, isPending] = useActionState(
    createContact,
    initialState,
  );
  const ids = {
    externalCode: useId(),
    fullName: useId(),
    phone: useId(),
    district: useId(),
    currentStatus: useId(),
    currentLevel: useId(),
  };

  return (
    <Card asChild className="p-4">
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="organizationId" value={organizationId} />

        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-foreground">
            Crear contacto
          </h2>
          <p className="text-sm text-muted-foreground">
            Usa el código de consultora que vendrá en los archivos de deuda.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={ids.externalCode}>Código de consultora</Label>
            <Input id={ids.externalCode} name="externalCode" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={ids.fullName}>Nombre completo</Label>
            <Input id={ids.fullName} name="fullName" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <div className="grid gap-2">
              <Label htmlFor={ids.phone}>Teléfono</Label>
              <Input id={ids.phone} name="phone" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={ids.district}>Distrito</Label>
              <Input id={ids.district} name="district" />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <div className="grid gap-2">
              <Label htmlFor={ids.currentStatus}>Estado</Label>
              <Input id={ids.currentStatus} name="currentStatus" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={ids.currentLevel}>Nivel</Label>
              <Input id={ids.currentLevel} name="currentLevel" />
            </div>
          </div>
        </div>

        {state.message ? (
          <Alert variant="destructive">{state.message}</Alert>
        ) : null}

        {state.ok ? <Alert variant="success">Contacto creado.</Alert> : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear contacto"}
        </Button>
      </form>
    </Card>
  );
}
