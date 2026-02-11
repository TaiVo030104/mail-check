import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailService } from "@/services/email";

interface SnoozeDialogProps {
  emailId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SnoozeDialog({ emailId, open, onOpenChange, onSuccess }: SnoozeDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const getSnoozePresets = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const laterTodayLabel = currentHour < 15 ? "Later today (6 PM)" : "Tomorrow morning (9 AM)";

    let weekendLabel = "This weekend (Sat 9 AM)";
    if (currentDay === 6 || currentDay === 0 || (currentDay === 5 && currentHour >= 15)) {
      weekendLabel = "Next weekend (Sat 9 AM)";
    }

    const nextMonday = new Date(now);
    const daysUntilNextMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
    const nextMondayFormatted = nextMonday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return [
      {
        label: laterTodayLabel,
        preset: "later_today",
      },
      {
        label: "Tomorrow (9 AM)",
        preset: "tomorrow",
      },
      {
        label: weekendLabel,
        preset: "this_weekend",
      },
      {
        label: `Next week (Mon ${nextMondayFormatted}, 9 AM)`,
        preset: "next_week",
      },
    ];
  };

  const snoozePresets = getSnoozePresets();

  const handlePresetSnooze = async (preset: string) => {
    setIsLoading(true);
    try {
      await emailService.snoozeEmailWithPreset(emailId, preset);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["kanban"] }),
        queryClient.invalidateQueries({ queryKey: ["emails"] }),
      ]);

      toast.success("Email snoozed successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to snooze email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSnooze = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    setIsLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const snoozeDate = new Date(selectedDate);
      snoozeDate.setHours(hours, minutes, 0, 0);

      if (snoozeDate <= new Date()) {
        toast.error("Snooze time must be in the future");
        return;
      }

      await emailService.snoozeEmail(emailId, snoozeDate.toISOString());

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["kanban"] }),
        queryClient.invalidateQueries({ queryKey: ["emails"] }),
      ]);

      toast.success(`Email will return on ${format(snoozeDate, "dd/MM/yyyy HH:mm")}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to snooze email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Snooze Email
          </DialogTitle>
          <DialogDescription>Choose when this email should return to your inbox</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {}
          <div className="space-y-2">
            <Label>Quick options</Label>
            <div className="grid grid-cols-2 gap-2">
              {snoozePresets.map((preset) => (
                <Button
                  key={preset.preset}
                  variant="outline"
                  onClick={() => handlePresetSnooze(preset.preset)}
                  disabled={isLoading}
                  className="justify-start"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or pick a custom time
              </span>
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-date" className="flex items-center gap-2">
                <CalendarIcon className="size-4" />
                Select date
              </Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-time" className="flex items-center gap-2">
                <Clock className="size-4" />
                Select time
              </Label>
              <Input
                id="custom-time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleCustomSnooze}
              disabled={isLoading || !selectedDate}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Snooze until this time"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
