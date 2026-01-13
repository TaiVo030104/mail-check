import { useQuery } from '@tanstack/react-query';
import api from '@/services/apiClient';

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

// Fetch frontend build info from public folder
async function fetchFrontendInfo(): Promise<BuildInfo | null> {
  try {
    const response = await fetch('/build-info.json');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Fetch backend build info from API
async function fetchBackendInfo(): Promise<BackendInfo | null> {
  try {
    const response = await api.get('/info');
    return response.data;
  } catch {
    return null;
  }
}

export function useFrontendInfo() {
  return useQuery({
    queryKey: ['frontendInfo'],
    queryFn: fetchFrontendInfo,
    staleTime: Infinity, // Build info doesn't change during runtime
    gcTime: Infinity,
  });
}

export function useBackendInfo() {
  return useQuery({
    queryKey: ['backendInfo'],
    queryFn: fetchBackendInfo,
    staleTime: 60000, // Refetch every minute for uptime
  });
}
