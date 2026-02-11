export interface Draft {
  _id: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftDto {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
}

export type UpdateDraftDto = Partial<CreateDraftDto>;
