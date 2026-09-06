export type DebtSummary = {
  commercialStatus: string | null;
  currentBalanceTotal: number;
  debtCount: number;
};

export type ContactListItem = {
  id: string;
  organizationId: string;
  externalCode: string;
  fullName: string | null;
  phone: string | null;
  currentStatus: string | null;
  currentLevel: string | null;
  district: string | null;
  updatedAt: string;
  debtSummary: DebtSummary | null;
};

export type ContactFilterOptions = {
  statuses: string[];
  levels: string[];
  districts: string[];
};

export type ContactFilters = {
  search?: string;
  status?: string;
  level?: string;
  district?: string;
};

export type ContactActionState = {
  ok: boolean;
  message: string | null;
};
