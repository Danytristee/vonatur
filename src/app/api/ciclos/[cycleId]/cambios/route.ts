import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";

import { assertOrganizationMembership } from "@/lib/organizations/authorization";
import { createClient } from "@/lib/supabase/server";

const FIELD_LABELS: Record<string, string> = {
  full_name: "Nombre completo",
  phone: "Teléfono",
  current_status: "Estado",
  current_level: "Nivel",
  district: "Distrito",
};

const SOURCE_LABELS: Record<string, string> = {
  import: "Importación",
  manual: "Edición manual",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> },
) {
  const { cycleId } = await params;
  const organizationId = request.nextUrl.searchParams.get("organization");

  if (!organizationId) {
    return NextResponse.json(
      { message: "Falta la organización." },
      { status: 400 },
    );
  }

  try {
    await assertOrganizationMembership(organizationId);
  } catch {
    return NextResponse.json(
      { message: "No tienes acceso a esta organización." },
      { status: 403 },
    );
  }

  const supabase = await createClient();

  const { data: cycle, error: cycleError } = await supabase
    .from("cycles")
    .select("year, cycle_number")
    .eq("id", cycleId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (cycleError || !cycle) {
    return NextResponse.json({ message: "Ciclo no encontrado." }, { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("audit_logs")
    .select(
      "field_name, old_value, new_value, source, created_at, contacts(external_code, full_name)",
    )
    .eq("organization_id", organizationId)
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: "No pudimos generar el reporte." },
      { status: 500 },
    );
  }

  const sheetRows = rows.map((row) => ({
    Código: row.contacts?.external_code ?? "",
    Nombre: row.contacts?.full_name ?? "",
    "Campo modificado": FIELD_LABELS[row.field_name] ?? row.field_name,
    "Valor anterior": row.old_value ?? "",
    "Valor nuevo": row.new_value ?? "",
    Origen: SOURCE_LABELS[row.source] ?? row.source,
    Fecha: new Date(row.created_at).toLocaleString("es-PE"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cambios del ciclo");
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="cambios-ciclo-${cycle.cycle_number}-${cycle.year}.xlsx"`,
    },
  });
}
