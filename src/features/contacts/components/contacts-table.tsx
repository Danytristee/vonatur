import { ContactRow } from "@/features/contacts/components/contact-row";
import type { ContactListItem } from "@/features/contacts/types";
import { Card } from "@/components/ui/card";

type ContactsTableProps = {
  contacts: ContactListItem[];
};

export function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center shadow-none">
        <h2 className="text-base font-semibold text-foreground">
          No se encontraron consultoras
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajusta la búsqueda o los filtros, o agrega una consultora nueva.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="max-h-[68vh] min-h-96 overflow-auto">
        <table className="w-full min-w-[880px] divide-y divide-border text-sm">
          <thead className="sticky top-0 z-[2] bg-secondary text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-[3] bg-secondary px-4 py-3">
                Código
              </th>
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
              <ContactRow key={contact.id} contact={contact} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
