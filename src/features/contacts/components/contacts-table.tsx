import { updateContact } from "@/features/contacts/actions";
import type { ContactListItem } from "@/features/contacts/types";

type ContactsTableProps = {
  contacts: ContactListItem[];
};

export function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-zinc-950">
          Aún no hay contactos
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Crea contactos base para que luego las importaciones puedan emparejarse
          por código.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-normal text-zinc-600">
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
          <tbody className="divide-y divide-zinc-100">
            {contacts.map((contact) => (
              <tr key={contact.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="grid gap-1">
                    <span className="font-semibold text-zinc-950">
                      {contact.externalCode}
                    </span>
                    <span className="text-xs text-zinc-500">No editable</span>
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
                  <input
                    id={`fullName-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="fullName"
                    defaultValue={contact.fullName ?? ""}
                    className="h-9 w-56 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`phone-${contact.id}`}>
                    Teléfono
                  </label>
                  <input
                    id={`phone-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="phone"
                    defaultValue={contact.phone ?? ""}
                    className="h-9 w-36 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <label
                    className="sr-only"
                    htmlFor={`currentStatus-${contact.id}`}
                  >
                    Estado
                  </label>
                  <input
                    id={`currentStatus-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="currentStatus"
                    defaultValue={contact.currentStatus ?? ""}
                    className="h-9 w-32 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <label
                    className="sr-only"
                    htmlFor={`currentLevel-${contact.id}`}
                  >
                    Nivel
                  </label>
                  <input
                    id={`currentLevel-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="currentLevel"
                    defaultValue={contact.currentLevel ?? ""}
                    className="h-9 w-28 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`district-${contact.id}`}>
                    Distrito
                  </label>
                  <input
                    id={`district-${contact.id}`}
                    form={`contact-${contact.id}`}
                    name="district"
                    defaultValue={contact.district ?? ""}
                    className="h-9 w-36 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    form={`contact-${contact.id}`}
                    type="submit"
                    className="h-9 rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                  >
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
