export interface PartySchedulePickerProps {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  disabled?: boolean;
}
