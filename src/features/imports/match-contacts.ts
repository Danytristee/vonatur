import type { ChannelExtractRow, DebtReportRow } from "./schemas";

export type DebtMatch =
  | { status: "matched"; debtRow: DebtReportRow }
  | {
      status: "needs_review";
      reason: "no_channel_extract_match" | "phone_mismatch";
      debtRow: DebtReportRow;
    };

/**
 * Correlates Debt Report rows against the Channel Extract by `external_code`
 * only — names are never used to match. Phone is a secondary signal: a
 * mismatch is flagged for review, never used to silently reject or accept a
 * match. `existingExternalCodes` covers consultants already known to the
 * organization from a previous cycle who may not appear in this cycle's
 * Channel Extract (e.g. no longer active) but can still be correlated.
 */
export function matchDebtsToContacts(
  channelRows: ChannelExtractRow[],
  debtRows: DebtReportRow[],
  existingExternalCodes: ReadonlySet<string>,
): DebtMatch[] {
  const channelByCode = new Map(
    channelRows.map((row) => [row.external_code, row]),
  );

  return debtRows.map((debtRow) => {
    const channelRow = channelByCode.get(debtRow.external_code);

    if (!channelRow) {
      if (existingExternalCodes.has(debtRow.external_code)) {
        return { status: "matched", debtRow };
      }

      return {
        status: "needs_review",
        reason: "no_channel_extract_match",
        debtRow,
      };
    }

    if (
      channelRow.phone &&
      debtRow.phone &&
      channelRow.phone !== debtRow.phone
    ) {
      return { status: "needs_review", reason: "phone_mismatch", debtRow };
    }

    return { status: "matched", debtRow };
  });
}
