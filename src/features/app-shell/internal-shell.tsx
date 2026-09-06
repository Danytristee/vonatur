"use client";

import {
  Building2,
  ChevronDown,
  CircleDollarSign,
  Contact,
  Home,
  Megaphone,
  MessageSquareText,
  RotateCcw,
  Settings,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { signOut } from "@/features/auth/actions";
import type { CurrentUserOrganization } from "@/lib/organizations/queries";

const navigationItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/ciclos", label: "Ciclos", icon: RotateCcw },
  { href: "/importaciones", label: "Importaciones", icon: Upload },
  { href: "/contactos", label: "Contactos", icon: Contact },
  { href: "/deudas", label: "Deudas", icon: CircleDollarSign },
  { href: "/promociones", label: "Promociones", icon: Megaphone },
  { href: "/comunicaciones", label: "Comunicaciones", icon: MessageSquareText },
  { href: "/ajustes", label: "Organización", icon: Settings },
] as const;

type InternalShellProps = {
  children: ReactNode;
  organizations: CurrentUserOrganization[];
  userEmail: string;
};

export function InternalShell({
  children,
  organizations,
  userEmail,
}: InternalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedOrganizationId = searchParams.get("organization");
  const selectedOrganizationId =
    organizations.find(
      (organization) => organization.id === requestedOrganizationId,
    )?.id ??
    organizations[0]?.id ??
    "";

  function handleOrganizationChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("organization", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-zinc-200 bg-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-5 px-4 py-4">
            <div className="flex items-center gap-3 px-2">
              <div className="flex size-10 items-center justify-center rounded-md bg-emerald-700 text-sm font-bold text-white">
                V
              </div>
              <div>
                <p className="text-base font-semibold">Vonatur</p>
                <p className="text-xs text-zinc-500">Gestión comercial</p>
              </div>
            </div>

            <div className="grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <label
                className="text-xs font-semibold uppercase tracking-normal text-zinc-500"
                htmlFor="organization"
              >
                Organización
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <select
                  id="organization"
                  value={selectedOrganizationId}
                  disabled={organizations.length === 0}
                  onChange={(event) => handleOrganizationChange(event.target.value)}
                  className="h-10 w-full appearance-none rounded-md border border-zinc-300 bg-white pl-9 pr-9 text-sm font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
                >
                  {organizations.length === 0 ? (
                    <option value="">Sin organización</option>
                  ) : (
                    organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>

            <nav
              className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1"
              aria-label="Secciones internas"
            >
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={
                      selectedOrganizationId
                        ? `${item.href}?organization=${selectedOrganizationId}`
                        : item.href
                    }
                    className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-3 rounded-md border border-zinc-200 bg-white p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {userEmail}
                </p>
                <p className="text-xs text-zinc-500">Usuario actual</p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
