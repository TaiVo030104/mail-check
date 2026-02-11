import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOnlineStatus } from "@/hooks/use-offline";

export function OfflineStatusBanner() {
  const isOnline = useOnlineStatus();
  const [showNotification, setShowNotification] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowNotification(true);
      setWasOffline(true);
    } else if (wasOffline) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showNotification) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 w-full max-w-md -translate-x-1/2 px-4">
      <Alert
        variant={isOnline ? "default" : "destructive"}
        className="shadow-lg animate-in slide-in-from-top-5"
      >
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
          <AlertDescription>
            {isOnline ? (
              <span className="font-medium">Back online! Data is syncing...</span>
            ) : (
              <span className="font-medium">You're offline. Viewing cached data.</span>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
