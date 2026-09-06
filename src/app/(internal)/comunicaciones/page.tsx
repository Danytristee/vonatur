import { PreparedPage } from "@/features/app-shell/prepared-page";

export const dynamic = "force-dynamic";

type CommunicationsPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

export default async function CommunicationsPage({
  searchParams,
}: CommunicationsPageProps) {
  const params = await searchParams;

  return (
    <PreparedPage
      requestedOrganizationId={params.organization}
      title="Comunicaciones"
      description="Apartado preparado para campañas y mensajes, sin integración real con WhatsApp ni colas externas todavía."
      sectionTitle="Integración no habilitada"
      sectionDescription="La pantalla existe para mantener clara la arquitectura futura. No envía mensajes, no agenda trabajos y no llama servicios externos."
      steps={[
        "Definir audiencia desde consultoras y deudas.",
        "Preparar plantillas revisables.",
        "Conectar canales externos en una fase posterior.",
      ]}
    />
  );
}
