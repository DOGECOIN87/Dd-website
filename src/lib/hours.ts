import type { DayHours, Location } from '../data/locations';

type Clock = { weekday: number; minutes: number };

const dayIndex: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function chicagoClock(date = new Date()): Clock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '0';
  return { weekday: dayIndex[get('weekday')] ?? 0, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const minutesFrom = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

export function timeLabel(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return minute === 0 ? `${displayHour} ${suffix}` : `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export type OpenStatus = { kind: 'open' | 'closed' | 'unknown'; label: string };

export function openStatus(location: Location, now = new Date()): OpenStatus {
  if (!location.hours) return { kind: 'unknown', label: 'Hours vary' };
  const clock = chicagoClock(now);
  const today = location.hours[clock.weekday];
  const yesterday = location.hours[(clock.weekday + 6) % 7];
  if (yesterday && minutesFrom(yesterday.close) <= minutesFrom(yesterday.open) && clock.minutes < minutesFrom(yesterday.close)) {
    return { kind: 'open', label: `Open · closes ${timeLabel(yesterday.close)}` };
  }
  if (today) {
    const opens = minutesFrom(today.open);
    const closes = minutesFrom(today.close);
    // For an overnight schedule, hours before `close` belong to yesterday's entry above.
    if (clock.minutes >= opens && (closes <= opens || clock.minutes < closes)) {
      return { kind: 'open', label: `Open · closes ${timeLabel(today.close)}` };
    }
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const day = (clock.weekday + offset) % 7;
    const hours = location.hours[day];
    if (!hours) continue;
    if (offset === 0 && clock.minutes < minutesFrom(hours.open)) {
      return { kind: 'closed', label: `Closed · opens ${timeLabel(hours.open)}` };
    }
    if (offset > 0) {
      const suffix = offset === 1 ? ' tomorrow' : '';
      return { kind: 'closed', label: `Closed · opens ${timeLabel(hours.open)}${suffix}` };
    }
  }
  return { kind: 'unknown', label: 'Hours vary' };
}

export function todayIndex(now = new Date()) {
  return chicagoClock(now).weekday;
}
