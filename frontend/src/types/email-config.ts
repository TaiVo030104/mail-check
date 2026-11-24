export interface SaveEmailConfigDto {
  email: string;
  password: string;
  provider: "gmail" | "outlook" | "yahoo" | "other";
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
