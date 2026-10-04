import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../hooks/useTheme';
import { formatLocalDate, parsePartyStart } from '../utils/party-form';
import { PartySchedulePickerProps } from './PartySchedulePicker.types';
import { Button, Panel, ui } from './ServiceUI';

export function PartySchedulePicker({ date, time, onDateChange, onTimeChange, disabled }: PartySchedulePickerProps) {
  const c = useTheme();
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const value = parsePartyStart(date, time) || new Date(Date.now() + 3600000);
  const maximum = new Date(); maximum.setMonth(maximum.getMonth() + 6);
  const picker = mode && <DateTimePicker value={value} mode={mode} display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    minimumDate={mode === 'date' ? new Date() : undefined} maximumDate={mode === 'date' ? maximum : undefined}
    locale="ko-KR" onChange={(event, selected) => {
      if (Platform.OS === 'android') setMode(null);
      if (event.type === 'dismissed' || !selected) return;
      if (mode === 'date') onDateChange(formatLocalDate(selected));
      else onTimeChange(`${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`);
    }} />;
  return <View style={{ gap: 14 }}>
    {[{ kind: 'date' as const, label: '날짜', value: date }, { kind: 'time' as const, label: '시간', value: time }].map((item) => <View key={item.kind} style={{ gap: 8 }}>
      <Text style={[ui.label, { color: c.textPrimary }]}>{item.label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${item.label} 선택`} accessibilityHint={item.value} disabled={disabled} onPress={() => setMode(item.kind)}
        style={[ui.input, { borderColor: c.border, backgroundColor: c.inputBg, justifyContent: 'center' }]}><Text style={{ color: c.textPrimary, fontSize: 16 }}>{item.value} ⌄</Text></Pressable>
    </View>)}
    <Text style={[ui.caption, { color: c.textSecondary }]}>휴대폰에 설정된 현지 시간을 기준으로 해요.</Text>
    {Platform.OS === 'ios' ? <Modal visible={!!mode} transparent animationType="slide" onRequestClose={() => setMode(null)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: c.dimmed, padding: 20 }}><Panel>{picker}<Button label="선택 완료" onPress={() => setMode(null)} /></Panel></View>
    </Modal> : picker}
  </View>;
}
