import api from './apiClient';

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
  providerType: 'gmail' | 'imap' | 'database';
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

export const kanbanService = {
  async initializeBoard(): Promise<KanbanBoard> {
    const response = await api.post('kanban/initialize');
    return response.data;
  },

  async getBoard(): Promise<KanbanBoard> {
    const response = await api.get('kanban/board');
    return response.data;
  },

  async createColumn(data: CreateColumnDto): Promise<KanbanColumn> {
    const response = await api.post('kanban/columns', data);
    return response.data;
  },

  async updateColumn(columnId: string, data: UpdateColumnDto): Promise<KanbanColumn> {
    const response = await api.put(`kanban/columns/${columnId}`, data);
    return response.data;
  },

  async deleteColumn(columnId: string): Promise<{ message: string; movedCards: number }> {
    const response = await api.delete(`kanban/columns/${columnId}`);
    return response.data;
  },

  async moveCard(data: MoveCardDto): Promise<{ message: string; emailId: string; synced: boolean }> {
    const response = await api.post('kanban/cards/move', data);
    return response.data;
  },

  async addEmail(emailId: string, columnId?: string): Promise<{ message: string; emailId: string; columnId: string }> {
    const response = await api.post('kanban/cards/add', { emailId, columnId });
    return response.data;
  },

  async removeEmail(emailId: string): Promise<{ message: string; emailId: string }> {
    const response = await api.delete(`kanban/cards/${emailId}`);
    return response.data;
  },
};
