"use client";

import { Check, Pencil, X } from "lucide-react";
import { useId, useState, useTransition } from "react";

import { updateContact } from "@/features/contacts/actions";
import type { ContactActionState, ContactListItem } from "@/features/contacts/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ContactActionState = { ok: false, message: null };

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function statusBadgeVariant(status: string | null) {
  if (!status) return "outline" as const;
  const normalized = status.toLowerCase();
  if (normalized.includes("inactiva")) return "warning" as const;
  if (normalized.includes("activa")) return "success" as const;
  return "outline" as const;
}

export function ContactRow({ contact }: { contact: ContactListItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState<ContactActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const formId = useId();
  const phoneId = useId();
  const statusId = useId();
  const levelId = useId();
  const districtId = useId();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateContact(initialState, formData);
      setState(result);
      if (result.ok) {
        setIsEditing(false);
      }
    });
  }

  const debt = contact.debtSummary;
  const isPaid = debt?.commercialStatus?.toLowerCase().includes("pagad");

  return (
    <tr className="align-top">
      <td className="sticky left-0 z-[1] bg-card px-4 py-3">
        <span className="font-semibold text-foreground">
          {contact.externalCode}
        </span>
      </td>
      <td className="px-4 py-3 text-foreground">
        {contact.fullName ?? "—"}
        {isEditing ? (
          <form id={formId} action={handleSubmit}>
            <input
              type="hidden"
              name="organizationId"
              value={contact.organizationId}
            />
            <input type="hidden" name="contactId" value={contact.id} />
          </form>
        ) : null}
      </td>

      {isEditing ? (
        <>
          <td className="px-4 py-2">
            <label className="sr-only" htmlFor={phoneId}>
              Teléfono
            </label>
            <Input
              id={phoneId}
              form={formId}
              name="phone"
              defaultValue={contact.phone ?? ""}
              className="h-9 min-w-32"
            />
          </td>
          <td className="px-4 py-2">
            <label className="sr-only" htmlFor={statusId}>
              Estado
            </label>
            <Input
              id={statusId}
              form={formId}
              name="currentStatus"
              defaultValue={contact.currentStatus ?? ""}
              className="h-9 min-w-28"
            />
          </td>
          <td className="px-4 py-2">
            <label className="sr-only" htmlFor={levelId}>
              Nivel
            </label>
            <Input
              id={levelId}
              form={formId}
              name="currentLevel"
              defaultValue={contact.currentLevel ?? ""}
              className="h-9 min-w-24"
            />
          </td>
          <td className="px-4 py-2">
            <label className="sr-only" htmlFor={districtId}>
              Distrito
            </label>
            <Input
              id={districtId}
              form={formId}
              name="district"
              defaultValue={contact.district ?? ""}
              className="h-9 min-w-32"
            />
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-foreground/90">{contact.phone ?? "—"}</td>
          <td className="px-4 py-3">
            {contact.currentStatus ? (
              <Badge variant={statusBadgeVariant(contact.currentStatus)}>
                {contact.currentStatus}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
          <td className="px-4 py-3 text-foreground/90">
            {contact.currentLevel ?? "—"}
          </td>
          <td className="px-4 py-3 text-foreground/90">
            {contact.district ?? "—"}
          </td>
        </>
      )}

      <td className="px-4 py-3">
        {debt ? (
          <div className="grid gap-1">
            <Badge variant={isPaid ? "success" : "warning"}>
              {debt.commercialStatus ?? "Sin situación"}
            </Badge>
            <span className="text-sm font-medium text-foreground">
              {currencyFormatter.format(debt.currentBalanceTotal)}
            </span>
            <span className="text-xs text-muted-foreground">
              {debt.debtCount} título{debt.debtCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sin deuda</span>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              form={formId}
              size="icon"
              disabled={isPending}
              aria-label="Guardar cambios"
            >
              <Check aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isPending}
              onClick={() => {
                setState(initialState);
                setIsEditing(false);
              }}
              aria-label="Cancelar edición"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil aria-hidden="true" />
            Editar
          </Button>
        )}
        {state.message && isEditing ? (
          <p className="mt-2 max-w-48 text-right text-xs text-destructive">
            {state.message}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
