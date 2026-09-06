import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({
  action,
  description,
  eyebrow = "Vonatur",
  title,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-emerald-700">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
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
    <section className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-10 items-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
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
    <section className="grid gap-4 rounded-md border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      {steps.length > 0 ? (
        <ol className="grid gap-2 text-sm text-zinc-700">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export function NoOrganizationState() {
  return (
    <EmptyState
      title="Tu usuario aún no tiene organización"
      description="Crea la primera organización y su membresía en Supabase. Cuando exista un registro en organization_members para tu usuario, Vonatur mostrará los datos internos de esa organización."
    />
  );
}
