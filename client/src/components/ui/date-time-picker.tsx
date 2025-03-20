import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export function DateTimePicker({ value, onChange, onBlur, disabled }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value || undefined);
  const [selectedHour, setSelectedHour] = React.useState<string>(
    value ? format(value, "HH") : format(new Date(), "HH")
  );
  const [selectedMinute, setSelectedMinute] = React.useState<string>(
    value ? format(value, "mm") : format(new Date(), "mm")
  );

  // Update the final date when any component changes
  React.useEffect(() => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(selectedHour, 10));
      newDate.setMinutes(parseInt(selectedMinute, 10));
      onChange(newDate);
    }
  }, [selectedDate, selectedHour, selectedMinute, onChange]);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Function to disable past dates
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP HH:mm") : <span>Pick date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={disablePastDates}
          initialFocus
        />
        <div className="border-t p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium">Time</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedHour}
              onValueChange={setSelectedHour}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent position="popper" className="h-[200px]">
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xl text-muted-foreground">:</span>
            <Select
              value={selectedMinute}
              onValueChange={setSelectedMinute}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Minute" />
              </SelectTrigger>
              <SelectContent position="popper" className="h-[200px]">
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}