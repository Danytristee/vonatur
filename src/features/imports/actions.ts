"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertOrganizationMembership } from "@/lib/organizations/authorization";
import { createClient } from "@/lib/supabase/server";

import {
  CHANNEL_EXTRACT_HEADER_MAP,
  CHANNEL_EXTRACT_REQUIRED_HEADERS,
  DEBT_REPORT_HEADER_MAP,
  DEBT_REPORT_REQUIRED_HEADERS,
} from "./column-maps";
import { matchDebtsToContacts } from "./match-contacts";
import { parseWorkbookRows } from "./parse-workbook";
import { getExistingExternalCodes } from "./queries";
import { channelExtractRowSchema, debtReportRowSchema } from "./schemas";
import type { ChannelExtractRow, DebtReportRow } from "./schemas";
import type { ImportConfirmState, ImportPreviewState } from "./types";
import { validateRows } from "./validate-rows";

const previewInputSchema = z.object({
  organizationId: z.uuid(),
  cycleId: z.uuid(),
});

function missingColumnsMessage(reportName: string, missing: string[]) {
  return `${reportName}: faltan las columnas ${missing.join(", ")}.`;
}

async function assertDraftCycle(organizationId: string, cycleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cycles")
    .select("status")
    .eq("id", cycleId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos revisar el ciclo.", { cause: error });
  }

  if (!data || data.status !== "draft") {
    throw new Error("El ciclo debe existir y estar en borrador.");
  }
}

export async function previewCycleImport(
  formData: FormData,
): Promise<ImportPreviewState> {
  const parsedInput = previewInputSchema.safeParse({
    organizationId: formData.get("organizationId"),
    cycleId: formData.get("cycleId"),
  });

  if (!parsedInput.success) {
    return { status: "error", message: "Selecciona un ciclo válido." };
  }

  const { organizationId, cycleId } = parsedInput.data;
  const channelExtractFile = formData.get("channelExtractFile");
  const debtReportFile = formData.get("debtReportFile");

  if (!(channelExtractFile instanceof File) || channelExtractFile.size === 0) {
    return { status: "error", message: "Sube el archivo Extracto de Canal." };
  }

  if (!(debtReportFile instanceof File) || debtReportFile.size === 0) {
    return { status: "error", message: "Sube el archivo Reporte de Deudas." };
  }

  try {
    await assertOrganizationMembership(organizationId);
    await assertDraftCycle(organizationId, cycleId);

    const [channelBuffer, debtBuffer] = await Promise.all([
      channelExtractFile.arrayBuffer().then((buffer) => Buffer.from(buffer)),
      debtReportFile.arrayBuffer().then((buffer) => Buffer.from(buffer)),
    ]);

    const channelParsed = parseWorkbookRows(
      channelBuffer,
      CHANNEL_EXTRACT_HEADER_MAP,
      CHANNEL_EXTRACT_REQUIRED_HEADERS,
    );

    if (channelParsed.missingColumns.length > 0) {
      return {
        status: "error",
        message: missingColumnsMessage(
          "Extracto de Canal",
          channelParsed.missingColumns,
        ),
      };
    }

    const debtParsed = parseWorkbookRows(
      debtBuffer,
      DEBT_REPORT_HEADER_MAP,
      DEBT_REPORT_REQUIRED_HEADERS,
    );

    if (debtParsed.missingColumns.length > 0) {
      return {
        status: "error",
        message: missingColumnsMessage(
          "Reporte de Deudas",
          debtParsed.missingColumns,
        ),
      };
    }

    const channelValidation = validateRows(
      channelParsed.rows,
      channelExtractRowSchema,
    );
    const debtValidation = validateRows(debtParsed.rows, debtReportRowSchema);

    const existingExternalCodes = await getExistingExternalCodes(organizationId);

    const matches = matchDebtsToContacts(
      channelValidation.valid,
      debtValidation.valid,
      existingExternalCodes,
    );

    const matchedDebts: DebtReportRow[] = [];
    const debtsNeedingReview: { externalCode: string; reason: "no_channel_extract_match" | "phone_mismatch" }[] = [];

    for (const match of matches) {
      if (match.status === "matched") {
        matchedDebts.push(match.debtRow);
      } else {
        debtsNeedingReview.push({
          externalCode: match.debtRow.external_code,
          reason: match.reason,
        });
      }
    }

    const contactsNew = channelValidation.valid.filter(
      (row) => !existingExternalCodes.has(row.external_code),
    ).length;
    const contactsUpdated = channelValidation.valid.length - contactsNew;

    return {
      status: "ready",
      preview: {
        channelExtract: {
          totalRows: channelParsed.rows.length,
          validRows: channelValidation.valid.length,
          errors: channelValidation.errors,
        },
        debtReport: {
          totalRows: debtParsed.rows.length,
          validRows: debtValidation.valid.length,
          errors: debtValidation.errors,
        },
        contactsNew,
        contactsUpdated,
        debtsMatched: matchedDebts.length,
        debtsNeedingReview,
        payload: {
          contacts: channelValidation.valid,
          debts: matchedDebts,
        },
      },
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "No pudimos leer los archivos. Verifica el formato.",
    };
  }
}

const confirmInputSchema = z.object({
  organizationId: z.uuid(),
  cycleId: z.uuid(),
  // Re-validated with the same row schemas used at preview time: the payload
  // crosses back from the client, which is an untrusted boundary even though
  // every value already passed through these schemas once.
  contacts: z.array(channelExtractRowSchema).min(1),
  debts: z.array(debtReportRowSchema),
});

export async function confirmCycleImport(input: {
  organizationId: string;
  cycleId: string;
  contacts: ChannelExtractRow[];
  debts: DebtReportRow[];
}): Promise<ImportConfirmState> {
  const parsed = confirmInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: "La vista previa ya no es válida. Vuelve a subir los archivos.",
    };
  }

  const { organizationId, cycleId, contacts, debts } = parsed.data;

  try {
    await assertOrganizationMembership(organizationId);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("confirm_cycle_import", {
      p_organization_id: organizationId,
      p_cycle_id: cycleId,
      p_contacts: contacts,
      p_debts: debts,
    });

    if (error) {
      if (error.code === "P0001") {
        return {
          status: "error",
          message: "El ciclo ya no está en borrador. Actualiza la página.",
        };
      }

      console.error("confirm_cycle_import failed", error);
      return {
        status: "error",
        message: "No pudimos confirmar la importación.",
      };
    }

    const summary = data as {
      contactsCreated: number;
      contactsUpdated: number;
      auditLogEntries: number;
      debtsInserted: number;
    };

    revalidatePath("/consultoras");
    revalidatePath("/ciclos");
    revalidatePath("/deudas");
    revalidatePath("/importaciones");
    revalidatePath("/dashboard");

    return { status: "done", summary };
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error("confirm_cycle_import threw a non-Error value", error);
    }

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "No pudimos confirmar la importación.",
    };
  }
}
