export type DebtListItem = {
  id: string;
  contactId: string;
  externalCode: string;
  fullName: string | null;
  level: string | null;
  situation: string | null;
  maturityStatus: string | null;
  titleValue: number | null;
  principalBalance: number | null;
  currentBalance: number | null;
  dueDate: string | null;
  daysOverdue: number | null;
};

export type DebtFilterOptions = {
  levels: string[];
  situations: string[];
  maturityStatuses: string[];
};

export type DebtFilters = {
  search?: string;
  level?: string;
  situation?: string;
  maturityStatus?: string;
};
