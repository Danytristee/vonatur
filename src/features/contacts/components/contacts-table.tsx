import { updateContact } from "@/features/contacts/actions";
import type { ContactListItem } from "@/features/contacts/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ContactsTableProps = {
  contacts: ContactListItem[];
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function DebtCell({ contact }: { contact: ContactListItem }) {
  if (!contact.debtSummary) {
    return <span className="text-xs text-muted-foreground">Sin deuda</span>;
  }

  const { commercialStatus, currentBalanceTotal, debtCount } = contact.debtSummary;
  const isPaid = commercialStatus?.toLowerCase().includes("pagad");

  return (
    <div className="grid gap-1">
      <Badge variant={isPaid ? "success" : "warning"}>
        {commercialStatus ?? "Sin situación"}
      </Badge>
      <span className="text-sm font-medium text-foreground">
        {currencyFormatter.format(currentBalanceTotal)}
      </span>
      <span className="text-xs text-muted-foreground">
        {debtCount} título{debtCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center shadow-none">
        <h2 className="text-base font-semibold text-foreground">
          No se encontraron consultoras
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajusta la búsqueda o los filtros, o crea una consultora nueva.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] divide-y divide-border text-sm">
          <thead className="bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Distrito</th>
              <th className="px-4 py-3">Deuda (ciclo activo)</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact) => (
              <tr key={contact.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="grid gap-1">
                    <span className="font-semibold text-foreground">
                      {contact.externalCode}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      No editable
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <form action={updateContact} id={`contact-${contact.id}`} />
                  <input
                    form={`contact-${contact.id}`}
                    type="hidden"
                    name="contactId"
                    value={contact.id}
                  />
                  <input
                    form={`contact-${contact.id}`}
                    type="hidden"
                    name="organizationId"
                    value={contact.organizationId}
                  />
                  <label className="sr-only" htmlFor={`fullName-${contact.id}`}>
                    Nombre completo
                  </label>
                  <Input
                    id={`fullName-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="fullName"
                    defaultValue={contact.fullName ?? ""}
                    className="h-9 w-56"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`phone-${contact.id}`}>
                    Teléfono
                  </label>
                  <Input
                    id={`phone-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="phone"
                    defaultValue={contact.phone ?? ""}
                    className="h-9 w-36"
                  />
                </td>
                <td className="px-4 py-3">
                  <label
                    className="sr-only"
                    htmlFor={`currentStatus-${contact.id}`}
                  >
                    Estado
                  </label>
                  <Input
                    id={`currentStatus-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="currentStatus"
                    defaultValue={contact.currentStatus ?? ""}
                    className="h-9 w-32"
                  />
                </td>
                <td className="px-4 py-3">
                  <label
                    className="sr-only"
                    htmlFor={`currentLevel-${contact.id}`}
                  >
                    Nivel
                  </label>
                  <Input
                    id={`currentLevel-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="currentLevel"
                    defaultValue={contact.currentLevel ?? ""}
                    className="h-9 w-28"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`district-${contact.id}`}>
                    Distrito
                  </label>
                  <Input
                    id={`district-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="district"
                    defaultValue={contact.district ?? ""}
                    className="h-9 w-36"
                  />
                </td>
                <td className="px-4 py-3">
                  <DebtCell contact={contact} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    form={`contact-${contact.id}`}
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="h-9"
                  >
                    Guardar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
