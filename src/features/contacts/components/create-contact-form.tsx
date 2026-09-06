"use client";

import { useActionState, useEffect, useId } from "react";

import { createContact } from "@/features/contacts/actions";
import type { ContactActionState } from "@/features/contacts/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ContactActionState = {
  ok: false,
  message: null,
};

type CreateContactFormProps = {
  organizationId: string;
  onSuccess?: () => void;
};

export function CreateContactForm({
  organizationId,
  onSuccess,
}: CreateContactFormProps) {
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

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor={ids.externalCode}>Código de consultora</Label>
          <Input id={ids.externalCode} name="externalCode" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={ids.fullName}>Nombre completo</Label>
          <Input id={ids.fullName} name="fullName" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={ids.phone}>Teléfono</Label>
            <Input id={ids.phone} name="phone" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={ids.district}>Distrito</Label>
            <Input id={ids.district} name="district" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Agregando..." : "Agregar consultora"}
      </Button>
    </form>
  );
}
