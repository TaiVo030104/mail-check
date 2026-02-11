export interface KanbanColumn {
  id: string;
  title: string;
  description?: string;
  position: number;
  gmailLabel?: string;
  label?: string;
  color?: string;
  isDefault: boolean;
  cards: KanbanCard[];
}

export interface KanbanCard {
  emailId: string;
  position: number;
  emailProvider?: string;
}

export interface KanbanBoard {
  providerType: "gmail" | "imap" | "database";
  columns: KanbanColumn[];
}

export interface CreateColumnDto {
  id: string;
  title: string;
  description?: string;
  position?: number;
  gmailLabel?: string;
  color?: string;
  label?: string;
}

export interface UpdateColumnDto {
  title?: string;
  description?: string;
  position?: number;
  gmailLabel?: string;
  color?: string;
  label?: string;
}

export interface MoveCardDto {
  emailId: string;
  fromColumn: string;
  toColumn: string;
  position?: number;
}

export interface ReorderColumnsDto {
  columns: Array<{ id: string; position: number }>;
}
