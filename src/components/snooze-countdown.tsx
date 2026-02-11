import { formatDistanceToNow, isPast } from "date-fns";
import { Clock } from "lucide-react";

interface SnoozeCountdownProps {
  snoozeUntil?: Date | string;
  className?: string;
}

export function SnoozeCountdown({ snoozeUntil, className = "" }: SnoozeCountdownProps) {
  if (!snoozeUntil) return null;

  const snoozeDate = new Date(snoozeUntil);

  if (isPast(snoozeDate)) {
    return (
      <span
        className={`flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 ${className}`}
      >
        <Clock className="size-3" /> Waking up...
      </span>
    );
  }

  const relativeTime = formatDistanceToNow(snoozeDate, { addSuffix: false });

  return (
    <span className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Clock className="size-3" /> Wake up in {relativeTime}
    </span>
  );
}
