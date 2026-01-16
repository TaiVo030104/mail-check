import { formatDistanceToNow, isPast } from 'date-fns';
import { Clock } from 'lucide-react';

interface SnoozeCountdownProps {
  snoozeUntil?: Date | string;
  className?: string;
}

export function SnoozeCountdown({ snoozeUntil, className = '' }: SnoozeCountdownProps) {
  if (!snoozeUntil) return null;

  const snoozeDate = new Date(snoozeUntil);
  
  // Check if already expired
  if (isPast(snoozeDate)) {
    return (
      <span className={`text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 ${className}`}>
        <Clock className="h-3 w-3" /> Waking up...
      </span>
    );
  }

  // Format relative time
  const relativeTime = formatDistanceToNow(snoozeDate, { addSuffix: false });
  
  return (
    <span className={`text-xs text-muted-foreground flex items-center gap-1 ${className}`}>
      <Clock className="h-3 w-3" /> Wake up in {relativeTime}
    </span>
  );
}
