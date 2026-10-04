export function parsePartyStart(date: string, time: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(`${date.trim()} ${time.trim()}`);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const result = new Date(year, month - 1, day, hour, minute);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day || result.getHours() !== hour || result.getMinutes() !== minute) return null;
  return result;
}

export function localDate(days = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
