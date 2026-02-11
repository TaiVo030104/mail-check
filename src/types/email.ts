export interface Attachment {
  id: string;
  attachmentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
}

export interface AttachmentDto {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
  s3Key: string;
}

export interface UploadAttachmentResponse {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
  s3Key: string;
}

export interface Mailbox {
  id: string;
  name: string;
  count: number;
  icon: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  isRead: boolean;
  isStarred: boolean;
  sentAt: string;
  folder: string;
  attachments?: Attachment[];
  hasAttachments?: boolean;
  labels?: string[];
  priority?: "high" | "normal" | "low";
  isSnoozed?: boolean;
  snoozeUntil?: string;
  snoozedAt?: string;
  aiSummary?: string;
  summarizedAt?: string;
  gmailMessageId?: string;
}

export interface EmailDetail extends Email {
  body: string;
  readAt: string;
  attachments?: Attachment[];
  cc?: string;
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextPageToken?: string;
  hasMore: boolean;
}

export interface EmailSelectionResponse {
  emailIds: string[];
  total: number;
}

export interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
  attachments?: AttachmentDto[];
}

export interface ReplyEmailDto {
  body: string;
  replyAll?: boolean;
}

export interface EmailFilters {
  search?: string;
  from?: string;
  unread?: boolean;
  starred?: boolean;
  startDate?: Date;
  endDate?: Date;
  hasAttachments?: boolean;
  sort?: "newest" | "oldest" | "sender-asc" | "sender-desc";
}

export interface EmailFilterValues {
  from?: string;
  unread?: boolean;
  starred?: boolean;
  startDate?: Date;
  endDate?: Date;
  hasAttachments?: boolean;
  sort?: "newest" | "oldest" | "sender-asc" | "sender-desc";
}
