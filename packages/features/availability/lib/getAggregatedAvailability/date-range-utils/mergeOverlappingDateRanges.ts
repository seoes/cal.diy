import type { DateRange } from "@calcom/features/schedules/lib/date-ranges";
import { isCurrentRangeOverlappingNext, sortDateRangesByStart } from "./mergeOverlappingDateRanges.utils";

export function mergeOverlappingDateRanges(dateRanges: DateRange[]) {
  sortDateRangesByStart(dateRanges);

  const mergedDateRanges: DateRange[] = [];

  let currentRange = dateRanges[0];
  if (!currentRange) {
    return [];
  }

  for (let i = 1; i < dateRanges.length; i++) {
    const nextRange = dateRanges[i];

    if (isCurrentRangeOverlappingNext(currentRange, nextRange)) {
      currentRange = {
        start: currentRange.start,
        end: currentRange.end.valueOf() > nextRange.end.valueOf() ? currentRange.end : nextRange.end,
      };
    } else {
      mergedDateRanges.push(currentRange);
      currentRange = nextRange;
    }
  }
  mergedDateRanges.push(currentRange);

  return mergedDateRanges;
}
