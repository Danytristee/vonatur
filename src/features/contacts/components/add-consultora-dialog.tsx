"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

import { CreateContactForm } from "@/features/contacts/components/create-contact-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AddConsultoraDialogProps = {
  organizationId: string;
};

export function AddConsultoraDialog({
  organizationId,
}: AddConsultoraDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <UserPlus aria-hidden="true" />
          Agregar consultora
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar consultora</DialogTitle>
          <DialogDescription>
            Usa el código de consultora que vendrá en los archivos de deuda.
          </DialogDescription>
        </DialogHeader>
        <CreateContactForm
          organizationId={organizationId}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
