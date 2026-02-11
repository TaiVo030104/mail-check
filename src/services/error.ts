import type { AxiosError } from "axios";

export function getErrorMessage(err: unknown, fallback = "An error occurred") {
  if (err == null) return fallback;

  const e = err as AxiosError<{ message?: string; error?: string } | string>;
  if (e?.isAxiosError) {
    const data = e?.response?.data;
    if (data) {
      if (typeof data === "string") return data;
      if (data.message) return String(data.message);
      if (data.error) return String(data.error);
    }
    if (e.message) return e.message;
    return fallback;
  }

  if (err instanceof Error) return err.message;

  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}
