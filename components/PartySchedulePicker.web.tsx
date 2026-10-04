import { Text, View } from 'react-native';
import { CSSProperties } from 'react';
import { useTheme } from '../hooks/useTheme';
import { formatLocalDate, localDate } from '../utils/party-form';
import { PartySchedulePickerProps } from './PartySchedulePicker.types';
import { ui } from './ServiceUI';

export function PartySchedulePicker({ date, time, onDateChange, onTimeChange, disabled }: PartySchedulePickerProps) {
  const c = useTheme();
  const maximum = new Date(); maximum.setMonth(maximum.getMonth() + 6);
  const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 52, border: `1px solid ${c.border}`,
    borderRadius: 14, padding: 14, fontSize: 16, color: c.textPrimary, background: c.inputBg, fontFamily: 'inherit', colorScheme: c.background === '#FAFAFA' ? 'light' : 'dark' };
  return <View style={{ gap: 14 }}>
    <View style={{ gap: 8 }}><Text style={[ui.label, { color: c.textPrimary }]}>날짜</Text>
      <input aria-label="날짜" type="date" value={date} min={localDate()} max={formatLocalDate(maximum)} onChange={(event) => onDateChange(event.target.value)} disabled={disabled} style={inputStyle} />
    </View>
    <View style={{ gap: 8 }}><Text style={[ui.label, { color: c.textPrimary }]}>시간</Text>
      <input aria-label="시간" type="time" value={time} onChange={(event) => onTimeChange(event.target.value)} disabled={disabled} style={inputStyle} />
    </View>
    <Text style={[ui.caption, { color: c.textSecondary }]}>기기에 설정된 현지 시간을 기준으로 해요.</Text>
  </View>;
}
