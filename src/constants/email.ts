export const EmailFolder = {
  INBOX: "inbox",
  STARRED: "starred",
  SENT: "sent",
  DRAFTS: "drafts",
  ARCHIVE: "archive",
  TRASH: "trash",
  SNOOZED: "snoozed",
} as const;

export type EmailFolder = (typeof EmailFolder)[keyof typeof EmailFolder];

export const EmailPriority = {
  HIGH: "high",
  NORMAL: "normal",
  LOW: "low",
} as const;

export type EmailPriority = (typeof EmailPriority)[keyof typeof EmailPriority];

export const SortOrder = {
  NEWEST: "newest",
  OLDEST: "oldest",
  SENDER_ASC: "sender-asc",
  SENDER_DESC: "sender-desc",
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export const ComposeMode = {
  NEW: "new",
  REPLY: "reply",
  REPLY_ALL: "replyAll",
  FORWARD: "forward",
} as const;

export type ComposeMode = (typeof ComposeMode)[keyof typeof ComposeMode];

export const EmailProvider = {
  GMAIL: "gmail",
  OUTLOOK: "outlook",
  YAHOO: "yahoo",
  OTHER: "other",
} as const;

export type EmailProvider = (typeof EmailProvider)[keyof typeof EmailProvider];

export const ViewMode = {
  EMAIL: "email",
  KANBAN: "kanban",
} as const;

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];
