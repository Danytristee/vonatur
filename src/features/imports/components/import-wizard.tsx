"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { confirmCycleImport, previewCycleImport } from "@/features/imports/actions";
import type { DraftCycle } from "@/features/imports/queries";
import type { ImportConfirmState, ImportPreviewState } from "@/features/imports/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type ImportWizardProps = {
  organizationId: string;
  draftCycle: DraftCycle;
};

const reasonLabels: Record<string, string> = {
  no_channel_extract_match: "No aparece en el Extracto de Canal",
  phone_mismatch: "El teléfono no coincide entre reportes",
};

export function ImportWizard({ organizationId, draftCycle }: ImportWizardProps) {
  const [previewState, setPreviewState] = useState<ImportPreviewState>({
    status: "idle",
  });
  const [confirmState, setConfirmState] = useState<ImportConfirmState>({
    status: "idle",
  });
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isConfirmPending, startConfirmTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handlePreviewSubmit(formData: FormData) {
    formData.set("organizationId", organizationId);
    formData.set("cycleId", draftCycle.id);

    startPreviewTransition(async () => {
      const result = await previewCycleImport(formData);
      setPreviewState(result);
      setConfirmState({ status: "idle" });
    });
  }

  function handleConfirm() {
    if (previewState.status !== "ready") {
      return;
    }

    const { payload } = previewState.preview;

    startConfirmTransition(async () => {
      const result = await confirmCycleImport({
        organizationId,
        cycleId: draftCycle.id,
        contacts: payload.contacts,
        debts: payload.debts,
      });
      setConfirmState(result);
    });
  }

  function handleStartOver() {
    setPreviewState({ status: "idle" });
    setConfirmState({ status: "idle" });
    formRef.current?.reset();
  }

  if (confirmState.status === "done") {
    const { summary } = confirmState;
    return (
      <Card className="grid gap-4 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-muted">
            <CheckCircle2
              className="size-5 text-success-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Ciclo {draftCycle.cycleNumber} · {draftCycle.year} activado
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              El ciclo anterior quedó archivado en el historial. Ya puedes ver
              las consultoras y deudas actualizadas.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Consultoras nuevas" value={summary.contactsCreated} />
          <SummaryStat label="Consultoras actualizadas" value={summary.contactsUpdated} />
          <SummaryStat label="Deudas importadas" value={summary.debtsInserted} />
          <SummaryStat label="Cambios registrados" value={summary.auditLogEntries} />
        </dl>
      </Card>
    );
  }

  return (
    <Card className="grid gap-5 p-6">
      <CardHeader className="p-0">
        <CardTitle>
          Iniciar ciclo {draftCycle.cycleNumber} · {draftCycle.year}
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Sube los dos reportes oficiales. Nada se guarda hasta que confirmes
          la vista previa — el ciclo activo actual sigue funcionando mientras
          tanto.
        </p>
      </CardHeader>

      <CardContent className="grid gap-5 p-0">
        <form
          ref={formRef}
          action={handlePreviewSubmit}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FileField
            id="channelExtractFile"
            label="Extracto de Canal (.xlsx)"
            accept=".xlsx"
          />
          <FileField
            id="debtReportFile"
            label="Reporte de Deudas (.xls)"
            accept=".xls,.xlsx"
          />

          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPreviewPending}>
              <Upload aria-hidden="true" />
              {isPreviewPending ? "Analizando archivos..." : "Ver vista previa"}
            </Button>
          </div>
        </form>

        {previewState.status === "error" ? (
          <Alert variant="destructive">{previewState.message}</Alert>
        ) : null}

        {previewState.status === "ready" ? (
          <PreviewSummary
            preview={previewState.preview}
            isConfirmPending={isConfirmPending}
            confirmError={
              confirmState.status === "error" ? confirmState.message : null
            }
            onConfirm={handleConfirm}
            onStartOver={handleStartOver}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function FileField({
  id,
  label,
  accept,
}: {
  id: string;
  label: string;
  accept: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-input bg-card px-3 text-sm text-muted-foreground has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/20">
        <FileSpreadsheet className="size-4 shrink-0" aria-hidden="true" />
        <input
          id={id}
          name={id}
          type="file"
          accept={accept}
          required
          className="w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground"
        />
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function PreviewSummary({
  preview,
  isConfirmPending,
  confirmError,
  onConfirm,
  onStartOver,
}: {
  preview: Extract<ImportPreviewState, { status: "ready" }>["preview"];
  isConfirmPending: boolean;
  confirmError: string | null;
  onConfirm: () => void;
  onStartOver: () => void;
}) {
  const totalErrors =
    preview.channelExtract.errors.length + preview.debtReport.errors.length;

  return (
    <div className="grid gap-4 rounded-xl border border-border bg-background p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Vista previa antes de confirmar
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nada se ha guardado todavía.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Consultoras nuevas" value={preview.contactsNew} />
        <SummaryStat
          label="Consultoras actualizadas"
          value={preview.contactsUpdated}
        />
        <SummaryStat label="Deudas a importar" value={preview.debtsMatched} />
        <SummaryStat
          label="Filas por revisar"
          value={preview.debtsNeedingReview.length}
        />
      </dl>

      {totalErrors > 0 ? (
        <Alert variant="warning">
          {totalErrors} fila{totalErrors === 1 ? "" : "s"} con datos
          incompletos fueron excluidas automáticamente. El resto de la
          importación continúa normalmente.
        </Alert>
      ) : null}

      {preview.debtsNeedingReview.length > 0 ? (
        <div className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle
              className="size-4 text-warning"
              aria-hidden="true"
            />
            Deudas excluidas de esta importación (revisión manual)
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-border">
                {preview.debtsNeedingReview.map((row, index) => (
                  <tr key={`${row.externalCode}-${index}`}>
                    <td className="px-3 py-2 font-medium text-foreground">
                      {row.externalCode}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <Badge variant="warning">
                        {reasonLabels[row.reason] ?? row.reason}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {confirmError ? <Alert variant="destructive">{confirmError}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onConfirm} disabled={isConfirmPending}>
          {isConfirmPending ? "Confirmando..." : "Confirmar e iniciar ciclo"}
        </Button>
        <Button variant="outline" onClick={onStartOver} disabled={isConfirmPending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
