import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "@/constants/query-keys";
import api from "@/services/api-client";

interface BuildInfo {
  version: string;
  name?: string;
  buildTime: string;
  environment: string;
  git: {
    commit: string;
    commitShort: string;
    branch: string;
    tag: string;
    author: string;
    date: string;
    message: string;
  };
  deployment: {
    deployedAt: string;
    deployedBy: string;
  };
}

interface BackendInfo extends BuildInfo {
  service: string;
  status: string;
  uptime: number;
  runtime: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: {
      used: number;
      total: number;
    };
  };
}

async function fetchFrontendInfo(): Promise<BuildInfo | null> {
  try {
    const response = await fetch("/build-info.json");
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchBackendInfo(): Promise<BackendInfo | null> {
  try {
    const response = await api.get("/info");
    return response.data;
  } catch {
    return null;
  }
}

export function useFrontendInfo() {
  return useQuery({
    queryKey: QueryKeys.appInfo.frontend,
    queryFn: fetchFrontendInfo,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useBackendInfo() {
  return useQuery({
    queryKey: QueryKeys.appInfo.backend,
    queryFn: fetchBackendInfo,
    staleTime: 60000,
    retry: 2,
    retryDelay: 1000,
  });
}
