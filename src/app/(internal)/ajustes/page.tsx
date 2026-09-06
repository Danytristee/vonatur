import { PreparedPage } from "@/features/app-shell/prepared-page";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;

  return (
    <PreparedPage
      requestedOrganizationId={params.organization}
      title="Organización"
      description="Configuración base de la organización, membresías y datos operativos."
      sectionTitle="Ajustes preparados"
      sectionDescription="La pertenencia actual se controla con organization_members. La edición administrativa completa queda reservada para una fase posterior."
      steps={[
        "Mostrar datos de la organización actual.",
        "Revisar miembros y roles.",
        "Agregar formularios de administración con RLS y validación explícita.",
      ]}
    />
  );
}
