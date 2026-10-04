import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePartyStart, localDate, formatLocalDate } from '../utils/party-form.ts';

test('valid leap day preserves calendar date and local time', () => {
  const date = parsePartyStart('2028-02-29', '19:30');
  assert.ok(date);
  assert.equal(formatLocalDate(date), '2028-02-29');
  assert.equal(date.getHours(), 19);
  assert.equal(date.getMinutes(), 30);
});

test('invalid calendar days and out-of-range time never silently roll over', () => {
  for (const [date, time] of [['2026-02-29', '19:30'], ['2026-02-30', '19:30'], ['2026-13-01', '19:30'], ['2026-10-04', '24:00'], ['2026-10-04', '12:60'], ['', '19:00']]) {
    assert.equal(parsePartyStart(date, time), null);
  }
});

test('date shortcuts preserve local dates rather than UTC dates', () => {
  assert.equal(localDate(), formatLocalDate(new Date()));
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  assert.equal(localDate(1), formatLocalDate(tomorrow));
});
