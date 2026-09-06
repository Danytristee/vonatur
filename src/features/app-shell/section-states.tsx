import { Building2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({
  action,
  description,
  eyebrow = "Vonatur",
  title,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  description,
  title,
}: EmptyStateProps) {
  return (
    <Card
      role="status"
      className="border-dashed bg-card/60 p-8 text-center shadow-none"
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent">
        <Sparkles className="size-6 text-accent-foreground" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-5">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </Card>
  );
}

type PreparedSectionProps = {
  title: string;
  description: string;
  steps?: string[];
};

export function PreparedSection({
  description,
  steps = [],
  title,
}: PreparedSectionProps) {
  return (
    <Card className="p-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {steps.length > 0 ? (
        <ol className="mt-4 grid gap-3 text-sm text-foreground/90">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </Card>
  );
}

export function NoOrganizationState() {
  return (
    <Card className="p-8 text-center shadow-none">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent">
        <Building2 className="size-6 text-accent-foreground" aria-hidden="true" />
      </div>
      <CardContent className="p-0 pt-4">
        <h2 className="text-base font-semibold text-foreground">
          Tu usuario aún no tiene organización
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Crea la primera organización y su membresía en Supabase. Cuando
          exista un registro en organization_members para tu usuario, Vonatur
          mostrará los datos internos de esa organización.
        </p>
      </CardContent>
    </Card>
  );
}
