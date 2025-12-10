import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { emailService } from '@/services/email';
import { toast } from 'sonner';

interface SnoozeDialogProps {
  emailId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SnoozeDialog({
  emailId,
  open,
  onOpenChange,
  onSuccess,
}: SnoozeDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);

  const snoozePresets = [
    {
      label: 'Chiều nay (6 PM)',
      preset: 'later_today',
    },
    {
      label: 'Ngày mai (9 AM)',
      preset: 'tomorrow',
    },
    {
      label: 'Cuối tuần (Thứ 7 9 AM)',
      preset: 'this_weekend',
    },
    {
      label: 'Tuần sau (Thứ 2 9 AM)',
      preset: 'next_week',
    },
  ];

  const handlePresetSnooze = async (preset: string) => {
    setIsLoading(true);
    try {
      await emailService.snoozeEmailWithPreset(emailId, preset);
      toast.success('Email đã được tạm hoãn!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Không thể tạm hoãn email. Vui lòng thử lại.');
      console.error('Error snoozing email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSnooze = async () => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }

    setIsLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const snoozeDate = new Date(selectedDate);
      snoozeDate.setHours(hours, minutes, 0, 0);

      // Check if date is in the future
      if (snoozeDate <= new Date()) {
        toast.error('Thời gian tạm hoãn phải ở tương lai');
        return;
      }

      await emailService.snoozeEmail(emailId, snoozeDate.toISOString());
      toast.success(
        `Email sẽ quay lại vào ${format(snoozeDate, 'dd/MM/yyyy HH:mm', { locale: vi })}`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Không thể tạm hoãn email. Vui lòng thử lại.');
      console.error('Error snoozing email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tạm hoãn Email
          </DialogTitle>
          <DialogDescription>
            Chọn thời gian để email này quay lại hộp thư đến của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preset options */}
          <div className="space-y-2">
            <Label>Lựa chọn nhanh</Label>
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
                Hoặc chọn thời gian tùy chỉnh
              </span>
            </div>
          </div>

          {/* Custom date/time picker */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Chọn ngày
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
                <Clock className="h-4 w-4" />
                Chọn giờ
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
              {isLoading ? 'Đang xử lý...' : 'Tạm hoãn đến thời gian này'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
