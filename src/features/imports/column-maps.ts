import { normalizeHeader } from "./utils/normalize-header";

/**
 * Canonical source headers, exactly as they appear in the real reports.
 * `CICLO DE CAPTACION` is spelled without an accent in the real Debt Report —
 * that is not a typo to "fix", see docs/PROJECT_CONTEXT.md.
 */
export const CHANNEL_EXTRACT_REQUIRED_HEADERS = [
  "CÓDIGO DE CONSULTORA",
  "NOMBRE DE CONSULTORA",
  "ESTADO",
  "NIVEL",
  "PUNTOS ACUMULADOS",
  "TELÉFONO",
  "DISTRITO",
] as const;

export const DEBT_REPORT_REQUIRED_HEADERS = [
  "CODIGO",
  "NOMBRE",
  "TELEFONO",
  "SITUACION COMERCIAL",
  "NIVEL",
  "VALOR TÍTULO",
  "SALDO PRINCIPAL",
  "SALDO ACTUALIZADO",
  "SITUACION",
  "VENCIMIENTO",
  "CICLO DE CAPTACION",
  "FECHA DE VENCIMIENTO",
  "DIAS DE RETRASO",
] as const;

function toHeaderMap(pairs: [string, string][]): Record<string, string> {
  return Object.fromEntries(
    pairs.map(([header, field]) => [normalizeHeader(header), field]),
  );
}

export const CHANNEL_EXTRACT_HEADER_MAP = toHeaderMap([
  ["CÓDIGO DE CONSULTORA", "external_code"],
  ["NOMBRE DE CONSULTORA", "full_name"],
  ["ESTADO", "status"],
  ["NIVEL", "level"],
  ["PUNTOS ACUMULADOS", "accumulated_points"],
  ["TELÉFONO", "phone"],
  ["DISTRITO", "district"],
]);

export const DEBT_REPORT_HEADER_MAP = toHeaderMap([
  ["CODIGO", "external_code"],
  ["NOMBRE", "full_name"],
  ["TELEFONO", "phone"],
  ["SITUACION COMERCIAL", "commercial_status"],
  ["NIVEL", "level"],
  ["VALOR TÍTULO", "title_value"],
  ["SALDO PRINCIPAL", "principal_balance"],
  ["SALDO ACTUALIZADO", "current_balance"],
  ["SITUACION", "situation"],
  ["VENCIMIENTO", "maturity_status"],
  ["CICLO DE CAPTACION", "acquisition_cycle"],
  ["FECHA DE VENCIMIENTO", "due_date"],
  ["DIAS DE RETRASO", "days_overdue"],
]);
