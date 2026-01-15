import { formatDistanceToNow, isPast } from 'date-fns';

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
      <span className={`text-xs text-orange-600 dark:text-orange-400 ${className}`}>
        ⏰ Waking up...
      </span>
    );
  }

  // Format relative time
  const relativeTime = formatDistanceToNow(snoozeDate, { addSuffix: false });
  
  return (
    <span className={`text-xs text-muted-foreground ${className}`}>
      ⏰ Wake up in {relativeTime}
    </span>
  );
}
