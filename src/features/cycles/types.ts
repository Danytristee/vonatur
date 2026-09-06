export type CycleStatus = "draft" | "active" | "archived";

export type CycleListItem = {
  id: string;
  organizationId: string;
  year: number;
  cycleNumber: number;
  status: CycleStatus;
  activatedAt: string | null;
  updatedAt: string;
};

export type CycleActionState = {
  message: string | null;
  ok: boolean;
};
