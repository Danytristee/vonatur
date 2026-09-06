import { updateContact } from "@/features/contacts/actions";
import type { ContactListItem } from "@/features/contacts/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ContactsTableProps = {
  contacts: ContactListItem[];
};

export function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center shadow-none">
        <h2 className="text-base font-semibold text-foreground">
          Aún no hay contactos
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Crea contactos base para que luego las importaciones puedan
          emparejarse por código.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-border text-sm">
          <thead className="bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Distrito</th>
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
