import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-6",
  {
    variants: {
      variant: {
        info: "border-border bg-secondary text-secondary-foreground",
        success: "border-primary/20 bg-success-muted text-success-muted-foreground",
        warning: "border-warning/30 bg-warning-muted text-warning-muted-foreground",
        destructive:
          "border-destructive/20 bg-destructive-muted text-destructive-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

type AlertProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant, className }))} {...props} />
  );
}
