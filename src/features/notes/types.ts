export type NoteItem = {
  id: string;
  body: string;
  createdAt: string;
};

export type NoteActionState = {
  ok: boolean;
  message: string | null;
};
