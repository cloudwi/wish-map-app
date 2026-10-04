export type PartyDateFilter = 'ANY' | 'TODAY' | 'THIS_WEEK';

export function getPartyDateUpperBound(filter: PartyDateFilter): string | undefined {
  if (filter === 'ANY') return undefined;
  const end = new Date();
  const days = filter === 'TODAY' ? 1 : ((8 - end.getDay()) % 7 || 7);
  end.setDate(end.getDate() + days);
  end.setHours(0, 0, 0, 0);
  return end.toISOString();
}

export function formatPartyDate(startsAt: string): string {
  const date = new Date(startsAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sameDay = (other: Date) => date.getFullYear() === other.getFullYear()
    && date.getMonth() === other.getMonth() && date.getDate() === other.getDate();
  const day = sameDay(today) ? '오늘' : sameDay(tomorrow) ? '내일'
    : date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });
  return `${day} ${date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}`;
}
