import type { DateRange } from "@calcom/features/schedules/lib/date-ranges";

/**
 * Sort ranges by start time ascending (mutates the input array).
 */
export function sortDateRangesByStart(dateRanges: DateRange[]): void {
  dateRanges.sort((a, b) => a.start.valueOf() - b.start.valueOf());
}

export function isCurrentRangeOverlappingNext(currentRange: DateRange, nextRange: DateRange): boolean {
  return (
    currentRange.start.valueOf() <= nextRange.start.valueOf() &&
    currentRange.end.valueOf() > nextRange.start.valueOf()
  );
}
