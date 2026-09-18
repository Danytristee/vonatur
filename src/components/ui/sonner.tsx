"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      theme="light"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
          success: "!border-primary/20 !bg-success-muted !text-success-muted-foreground",
          error:
            "!border-destructive/20 !bg-destructive-muted !text-destructive-muted-foreground",
          warning: "!border-warning/30 !bg-warning-muted !text-warning-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
