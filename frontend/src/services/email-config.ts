import type { EmailConfigResponse, SaveEmailConfigDto } from "@/types/email-config";

import api from "./api-client";

export type { EmailConfigResponse, SaveEmailConfigDto } from "@/types/email-config";

export const emailConfigService = {
  async saveEmailConfig(config: SaveEmailConfigDto): Promise<EmailConfigResponse> {
    const { data } = await api.post<EmailConfigResponse>("/user/email-config", config);
    return data;
  },

  async getEmailConfig(): Promise<EmailConfigResponse | null> {
    try {
      const { data } = await api.get<EmailConfigResponse>("/user/email-config");
      return data;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number } };
      if (axiosErr.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async removeEmailConfig(): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>("/user/email-config");
    return data;
  },
};
