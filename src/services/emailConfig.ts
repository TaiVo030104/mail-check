import api from './apiClient';

export interface SaveEmailConfigDto {
  email: string;
  password: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'other';
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
}

export interface EmailConfigResponse {
  email: string;
  provider: string;
  isConfigured: boolean;
  lastVerified?: string;
}

export const emailConfigService = {
  /**
   * Save IMAP/SMTP email configuration
   */
  async saveEmailConfig(config: SaveEmailConfigDto): Promise<EmailConfigResponse> {
    const { data } = await api.post<EmailConfigResponse>('/user/email-config', config);
    return data;
  },

  /**
   * Get current email configuration
   */
  async getEmailConfig(): Promise<EmailConfigResponse | null> {
    try {
      const { data } = await api.get<EmailConfigResponse>('/user/email-config');
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Remove email configuration
   */
  async removeEmailConfig(): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>('/user/email-config');
    return data;
  },
};
