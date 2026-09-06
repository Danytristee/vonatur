import { PreparedPage } from "@/features/app-shell/prepared-page";

export const dynamic = "force-dynamic";

type DebtsPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

export default async function DebtsPage({ searchParams }: DebtsPageProps) {
  const params = await searchParams;

  return (
    <PreparedPage
      requestedOrganizationId={params.organization}
      title="Deudas"
      description="Vista preparada para consultar saldos por consultora y ciclo una vez confirmada una importación."
      sectionTitle="Sin deudas importadas"
      sectionDescription="Las deudas se cargarán desde Debt Report y podrán existir varias filas por contacto dentro de un mismo ciclo."
      steps={[
        "Elegir un ciclo activo o histórico.",
        "Filtrar por consultora, vencimiento, estado o nivel.",
        "Revisar saldos sin registrar pagos todavía.",
      ]}
    />
  );
}
