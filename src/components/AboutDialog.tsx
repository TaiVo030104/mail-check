import { useState } from 'react';
import { Info, GitBranch, Clock, User, Server, Activity, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFrontendInfo, useBackendInfo } from '@/hooks/react-query/useAppInfo';
import { formatDistanceToNow } from 'date-fns';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { data: frontendInfo, isLoading: frontendLoading } = useFrontendInfo();
  const { data: backendInfo, isLoading: backendLoading, isError: backendError } = useBackendInfo();
  const [copiedFrontend, setCopiedFrontend] = useState(false);
  const [copiedBackend, setCopiedBackend] = useState(false);

  const copyToClipboard = async (text: string, type: 'frontend' | 'backend') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'frontend') {
        setCopiedFrontend(true);
        setTimeout(() => setCopiedFrontend(false), 2000);
      } else {
        setCopiedBackend(true);
        setTimeout(() => setCopiedBackend(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About Application
          </DialogTitle>
          <DialogDescription>
            Version information and deployment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Frontend Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Server className="h-4 w-4" />
                Frontend
              </h3>
              {frontendInfo && (
                <div className="flex gap-2">
                  {frontendInfo.git && frontendInfo.git.commitShort !== 'unknown' && (
                    <Badge variant="outline" className="font-mono text-xs">
                      <GitBranch className="h-3 w-3 mr-1" />
                      {frontendInfo.git.commitShort}
                    </Badge>
                  )}
                  <Badge variant={frontendInfo.environment === 'production' ? 'default' : 'secondary'}>
                    {frontendInfo.environment}
                  </Badge>
                </div>
              )}
            </div>

            {frontendLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : frontendInfo ? (
              <div className="space-y-2 rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="text-sm font-mono">{frontendInfo.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Environment</p>
                    <p className="text-sm font-mono">{frontendInfo.environment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Build Time</p>
                    <p className="text-sm">
                      {new Date(frontendInfo.buildTime).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(frontendInfo.buildTime), { addSuffix: true })}
                    </p>
                  </div>
                  {frontendInfo.git && frontendInfo.git.commitShort !== 'unknown' && (
                    <div>
                      <p className="text-xs text-muted-foreground">Commit</p>
                      <p className="text-sm font-mono flex items-center gap-2">
                        {frontendInfo.git.commitShort}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(frontendInfo.git.commit, 'frontend')}
                          className="h-5 w-5 p-0"
                        >
                          {copiedFrontend ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </p>
                      <p className="text-xs text-muted-foreground">{frontendInfo.git.branch}</p>
                    </div>
                  )}
                </div>

                {frontendInfo.git && frontendInfo.git.commit !== 'unknown' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Last Commit</p>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Message:</span>{' '}
                          <span className="italic">{frontendInfo.git.message}</span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-muted-foreground">Author:</span>{' '}
                            {frontendInfo.git.author}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>{' '}
                            {new Date(frontendInfo.git.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Frontend info not available</p>
            )}
          </div>

          <Separator />

          {/* Backend Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Backend
              </h3>
              {backendInfo && (
                <div className="flex gap-2">
                  {backendInfo.git && backendInfo.git.commitShort !== 'unknown' && (
                    <Badge variant="outline" className="font-mono text-xs">
                      <GitBranch className="h-3 w-3 mr-1" />
                      {backendInfo.git.commitShort}
                    </Badge>
                  )}
                  <Badge variant={backendInfo.status === 'running' ? 'default' : 'destructive'}>
                    {backendInfo.status}
                  </Badge>
                  <Badge variant={backendInfo.environment === 'production' ? 'default' : 'secondary'}>
                    {backendInfo.environment}
                  </Badge>
                </div>
              )}
            </div>

            {backendLoading ? (
              <div className="space-y-2 rounded-lg border p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Connecting to backend...</p>
              </div>
            ) : backendInfo ? (
              <div className="space-y-2 rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="text-sm font-mono">{backendInfo.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Environment</p>
                    <p className="text-sm font-mono">{backendInfo.environment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Build Time</p>
                    <p className="text-sm">
                      {new Date(backendInfo.buildTime).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(backendInfo.buildTime), { addSuffix: true })}
                    </p>
                  </div>
                  {backendInfo.git && backendInfo.git.commitShort !== 'unknown' && (
                    <div>
                      <p className="text-xs text-muted-foreground">Commit</p>
                      <p className="text-sm font-mono flex items-center gap-2">
                        {backendInfo.git.commitShort}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(backendInfo.git.commit, 'backend')}
                          className="h-5 w-5 p-0"
                        >
                          {copiedBackend ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </p>
                      <p className="text-xs text-muted-foreground">{backendInfo.git.branch}</p>
                    </div>
                  )}
                </div>

                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="text-sm">{formatUptime(backendInfo.uptime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Node Version</p>
                    <p className="text-sm font-mono">{backendInfo.runtime.nodeVersion}</p>
                  </div>
                </div>

                {backendInfo.runtime.memory && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Memory Used:</span>{' '}
                        {backendInfo.runtime.memory.used} MB
                      </div>
                      <div>
                        <span className="text-muted-foreground">Memory Total:</span>{' '}
                        {backendInfo.runtime.memory.total} MB
                      </div>
                    </div>
                  </>
                )}

                {backendInfo.git && backendInfo.git.commit !== 'unknown' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Last Commit</p>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Message:</span>{' '}
                          <span className="italic">{backendInfo.git.message}</span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-muted-foreground">Author:</span>{' '}
                            {backendInfo.git.author}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>{' '}
                            {new Date(backendInfo.git.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : backendError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">⚠️ Backend Connection Failed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unable to connect to backend server. Please check if the backend is running.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Backend info not available</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
