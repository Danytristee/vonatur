"use client";

import {
  Building2,
  CircleDollarSign,
  Contact,
  Home,
  LogOut,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const selectedOrganizationName = organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  )?.name;
  const userInitial = userEmail.trim().charAt(0).toUpperCase() || "U";

  function handleOrganizationChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("organization", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-border bg-card lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-6 px-4 py-5">
            <div className="flex items-center gap-3 px-1">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                V
              </div>
              <div>
                <p className="text-base font-semibold leading-tight">Vonatur</p>
                <p className="text-xs text-muted-foreground">Gestión comercial</p>
              </div>
            </div>

            <div className="grid gap-1.5">
              <span className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Organización
              </span>
              <Select
                value={selectedOrganizationId || undefined}
                onValueChange={handleOrganizationChange}
                disabled={organizations.length === 0}
              >
                <SelectTrigger aria-label="Seleccionar organización">
                  <Building2
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <SelectValue placeholder="Sin organización">
                    {selectedOrganizationName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    aria-current={isActive ? "page" : undefined}
                    className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {userEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">Sesión activa</p>
                </div>
              </div>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
