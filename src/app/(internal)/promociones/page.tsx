import { PreparedPage } from "@/features/app-shell/prepared-page";

export const dynamic = "force-dynamic";

type PromotionsPageProps = {
  searchParams: Promise<{
    organization?: string;
  }>;
};

export default async function PromotionsPage({
  searchParams,
}: PromotionsPageProps) {
  const params = await searchParams;

  return (
    <PreparedPage
      requestedOrganizationId={params.organization}
      title="Promociones"
      description="Espacio reservado para piezas comerciales vinculadas a ciclos y niveles."
      sectionTitle="Promociones pendientes"
      sectionDescription="Más adelante este módulo permitirá organizar promociones por ciclo y segmento, sin mezclarlas con la activación segura de importaciones."
      steps={[
        "Asociar promociones a un ciclo.",
        "Definir público por nivel o estado comercial.",
        "Preparar contenido antes de enviarlo por canales externos.",
      ]}
    />
  );
}
