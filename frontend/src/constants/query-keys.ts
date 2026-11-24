export const QueryKeys = {
  auth: {
    all: ["authUser"] as const,
    profile: () => ["authUser", "detail"] as const,
  },
  emails: {
    all: ["emails"] as const,
    folder: (folder: string, page?: number, limit?: number, filters?: unknown) =>
      ["emails", folder, page, limit, filters] as const,
    infinite: (folder: string, limit?: number, filters?: unknown) =>
      ["emails-infinite", folder, limit, filters] as const,
    detail: (id: string) => ["email", id] as const,
    mailboxes: ["mailboxes"] as const,
  },
  drafts: {
    all: ["drafts"] as const,
    detail: (id: string) => ["drafts", id] as const,
  },
  kanban: {
    all: ["kanban"] as const,
    board: () => ["kanban", "board"] as const,
  },
  search: {
    all: ["search"] as const,
    results: (query: string, folder?: string) => ["search", query, folder] as const,
  },
  emailConfig: {
    all: ["emailConfig"] as const,
  },
  appInfo: {
    frontend: ["frontendInfo"] as const,
    backend: ["backendInfo"] as const,
  },
} as const;
