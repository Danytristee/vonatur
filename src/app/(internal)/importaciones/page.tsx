import { PreparedPage } from "@/features/app-shell/prepared-page";

export const dynamic = "force-dynamic";

type ImportsPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const params = await searchParams;

  return (
    <PreparedPage
      requestedOrganizationId={params.organization}
      title="Importaciones"
      description="Centro del flujo seguro para reemplazar un ciclo comercial desde los archivos oficiales."
      sectionTitle="Flujo pendiente de construir"
      sectionDescription="Esta sección queda reservada para subir Channel Extract y Debt Report. La activación de ciclos depende de completar este flujo con preview y confirmación."
      steps={[
        "Subir los dos archivos requeridos.",
        "Parsear y validar columnas esperadas.",
        "Correlacionar registros por external_code.",
        "Mostrar preview de altas, cambios y alertas.",
        "Confirmar, persistir y activar el ciclo.",
      ]}
    />
  );
}
