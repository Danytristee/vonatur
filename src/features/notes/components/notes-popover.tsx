"use client";

import { StickyNote, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { createNote, deleteNote, listContactNotes } from "@/features/notes/actions";
import type { NoteActionState, NoteItem } from "@/features/notes/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const initialState: NoteActionState = { ok: false, message: null };

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

type NotesPopoverProps = {
  organizationId: string;
  contactId: string;
  contactLabel: string;
};

export function NotesPopover({
  organizationId,
  contactId,
  contactLabel,
}: NotesPopoverProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[] | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [createState, createAction, isCreating] = useActionState(
    createNote,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  function loadNotes() {
    startLoading(async () => {
      const result = await listContactNotes(organizationId, contactId);
      setNotes(result);
    });
  }

  useEffect(() => {
    if (open && notes === null) {
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (createState.ok) {
      formRef.current?.reset();
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createState]);

  function handleDelete(noteId: string) {
    startDeleting(async () => {
      const formData = new FormData();
      formData.set("organizationId", organizationId);
      formData.set("noteId", noteId);
      const result = await deleteNote(initialState, formData);
      if (result.ok) {
        loadNotes();
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Notas de ${contactLabel}`}
        >
          <StickyNote aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Notas · {contactLabel}
          </h3>

          <div className="grid max-h-48 gap-2 overflow-y-auto">
            {isLoading && notes === null ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : notes && notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin notas todavía.</p>
            ) : (
              notes?.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border border-border bg-secondary/50 p-2 text-xs"
                >
                  <p className="whitespace-pre-wrap text-foreground">{note.body}</p>
                  <div className="mt-1 flex items-center justify-between text-muted-foreground">
                    <span>{dateFormatter.format(new Date(note.createdAt))}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      disabled={isDeleting}
                      aria-label="Borrar nota"
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form ref={formRef} action={createAction} className="grid gap-2">
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="contactId" value={contactId} />
            <textarea
              name="body"
              rows={2}
              required
              placeholder="Ej. prometió pagar el viernes"
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
            {createState.message ? (
              <p className="text-xs text-destructive">{createState.message}</p>
            ) : null}
            <Button type="submit" size="sm" disabled={isCreating}>
              {isCreating ? "Guardando..." : "Agregar nota"}
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
