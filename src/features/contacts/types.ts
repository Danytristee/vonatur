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
};

export type ContactActionState = {
  ok: boolean;
  message: string | null;
};
