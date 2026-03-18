import {format, startOfDay, endOfDay, subDays, parseISO} from 'date-fns';

export function todayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayStartTimestamp(): number {
  return startOfDay(new Date()).getTime();
}

export function todayEndTimestamp(): number {
  return endOfDay(new Date()).getTime();
}

export function daysAgoTimestamp(days: number): number {
  return startOfDay(subDays(new Date(), days)).getTime();
}

export function dateStringToTimestamp(dateStr: string): number {
  return parseISO(dateStr).getTime();
}

export function formatDisplayDate(timestamp: number): string {
  return format(new Date(timestamp), 'MMM d, yyyy');
}

export function formatDisplayTime(timestamp: number): string {
  return format(new Date(timestamp), 'h:mm a');
}

export function getDateRange(days: number): {start: number; end: number} {
  return {
    start: daysAgoTimestamp(days),
    end: endOfDay(new Date()).getTime(),
  };
}
