import type { ChannelExtractRow, DebtReportRow } from "./schemas";
import type { RowError } from "./validate-rows";

export type ReportParseSummary = {
  totalRows: number;
  validRows: number;
  errors: RowError[];
};

export type DebtReviewRow = {
  externalCode: string;
  reason: "no_channel_extract_match" | "phone_mismatch";
};

export type ImportPreview = {
  channelExtract: ReportParseSummary;
  debtReport: ReportParseSummary;
  contactsNew: number;
  contactsUpdated: number;
  debtsMatched: number;
  debtsNeedingReview: DebtReviewRow[];
  payload: {
    contacts: ChannelExtractRow[];
    debts: DebtReportRow[];
  };
};

export type ImportPreviewState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; preview: ImportPreview };

export type ImportConfirmState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "done";
      summary: {
        contactsCreated: number;
        contactsUpdated: number;
        auditLogEntries: number;
        debtsInserted: number;
      };
    };
