import type {
  Attachment,
  Email,
  EmailDetail,
  EmailFilters,
  EmailListResponse,
  EmailSelectionResponse,
  Mailbox,
  ReplyEmailDto,
  SendEmailDto,
  UploadAttachmentResponse,
} from "@/types/email";

import api from "./api-client";

export type {
  Attachment,
  AttachmentDto,
  Email,
  EmailDetail,
  EmailFilters,
  EmailListResponse,
  EmailSelectionResponse,
  Mailbox,
  ReplyEmailDto,
  SendEmailDto,
  UploadAttachmentResponse,
} from "@/types/email";

export const emailService = {
  async getMailboxes(): Promise<Mailbox[]> {
    const response = await api.get("emails/mailboxes");
    return response.data;
  },

  async getEmailsByFolder(
    folder: string,
    page: number = 1,
    limit: number = 50,
    filters?: EmailFilters
  ): Promise<EmailListResponse> {
    const params: Record<string, string | number | boolean> = { page, limit };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.from) params.from = filters.from;
      if (filters.unread !== undefined) params.unread = filters.unread;
      if (filters.starred !== undefined) params.starred = filters.starred;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.hasAttachments !== undefined) params.hasAttachments = filters.hasAttachments;
      if (filters.sort) params.sort = filters.sort;
    }

    const response = await api.get(`emails/folder/${folder}`, { params });
    return response.data;
  },

  async getEmailSelection(folder: string, filters?: EmailFilters): Promise<EmailSelectionResponse> {
    const params: Record<string, string | number | boolean> = {};

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.from) params.from = filters.from;
      if (filters.unread !== undefined) params.unread = filters.unread;
      if (filters.starred !== undefined) params.starred = filters.starred;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.hasAttachments !== undefined) params.hasAttachments = filters.hasAttachments;
      if (filters.sort) params.sort = filters.sort;
    }

    const response = await api.get(`emails/folder/${folder}/ids`, { params });
    return response.data;
  },

  async getEmailById(id: string): Promise<EmailDetail> {
    const response = await api.get(`emails/${id}`);
    return response.data;
  },

  async sendEmail(data: SendEmailDto): Promise<{ message: string }> {
    const response = await api.post("emails/send", data);
    return response.data;
  },

  async replyEmail(id: string, data: ReplyEmailDto): Promise<{ message: string }> {
    const response = await api.post(`emails/${id}/reply`, data);
    return response.data;
  },

  async toggleStar(id: string): Promise<{ message: string; isStarred: boolean }> {
    const response = await api.patch(`emails/${id}/star`);
    return response.data;
  },

  async markAsRead(id: string, isRead: boolean): Promise<{ message: string; isRead: boolean }> {
    const response = await api.patch(`emails/${id}/read`, { isRead });
    return response.data;
  },

  async deleteEmail(id: string): Promise<{ message: string }> {
    const response = await api.delete(`emails/${id}`);
    return response.data;
  },

  async seedMockEmails(): Promise<{ message: string }> {
    const response = await api.post("emails/seed");
    return response.data;
  },

  async uploadAttachment(file: File): Promise<UploadAttachmentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("emails/attachments/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async uploadMultipleAttachments(files: File[]): Promise<UploadAttachmentResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    const response = await api.post("emails/attachments/upload-multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getAttachmentDownloadUrl(
    attachmentId: string
  ): Promise<{ url: string; expiresIn: number }> {
    const response = await api.get(`emails/attachments/${attachmentId}/url`);
    return response.data;
  },

  async downloadAttachment(
    attachmentId: string,
    filename: string,
    emailId?: string
  ): Promise<void> {
    const params = emailId ? { emailId } : {};
    const endpoint = `emails/attachments/${attachmentId}/download`;

    const response = await api.get(endpoint, {
      params,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async deleteAttachment(attachmentId: string): Promise<{ message: string }> {
    const response = await api.delete(`emails/attachments/${attachmentId}`);
    return response.data;
  },

  async getEmailAttachments(emailId: string): Promise<Attachment[]> {
    const response = await api.get(`emails/${emailId}/attachments`);
    return response.data;
  },

  async bulkDelete(emailIds: string[]): Promise<{ message: string; deleted: number }> {
    const response = await api.post("emails/bulk/delete", { emailIds });
    return response.data;
  },

  async bulkToggleStar(
    emailIds: string[],
    star: boolean
  ): Promise<{ message: string; modified: number }> {
    const response = await api.post("emails/bulk/star", { emailIds, star });
    return response.data;
  },

  async bulkMarkAsRead(
    emailIds: string[],
    isRead: boolean
  ): Promise<{ message: string; modified: number }> {
    const response = await api.post("emails/bulk/read", { emailIds, isRead });
    return response.data;
  },

  async updateEmailLabels(
    emailId: string,
    labels: string[]
  ): Promise<{ message: string; labels: string[] }> {
    const response = await api.put(`emails/${emailId}/labels`, { labels });
    return response.data;
  },

  async snoozeEmail(
    emailId: string,
    snoozeUntil: string
  ): Promise<{ message: string; snoozeUntil: string }> {
    const response = await api.post(`email/snooze/${emailId}`, { snoozeUntil });
    return response.data;
  },

  async snoozeEmailWithPreset(
    emailId: string,
    preset: string,
    customDate?: string
  ): Promise<{ message: string; snoozeUntil: string }> {
    const response = await api.post(`email/snooze/${emailId}/preset`, { preset, customDate });
    return response.data;
  },

  async unsnoozeEmail(emailId: string): Promise<{ message: string }> {
    const response = await api.delete(`email/snooze/${emailId}`);
    return response.data;
  },

  async getSnoozedEmails(): Promise<{ emails: Email[]; total: number }> {
    const response = await api.get("email/snooze");
    return response.data;
  },

  async summarizeEmail(
    emailId: string
  ): Promise<{ summary: string; summarizedAt: string; cached: boolean }> {
    const response = await api.post(`email/ai/summarize/${emailId}`);
    return response.data;
  },

  async generateReplyDraft(emailId: string): Promise<{ draft: string }> {
    const response = await api.post(`email/ai/generate-reply/${emailId}`);
    return response.data;
  },
};
