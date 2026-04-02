/**
 * Date filtering utilities for sorting and filtering data by date ranges
 */

export type DateRangeFilter = "today" | "week" | "month" | "all";

/**
 * Get date range for filtering
 */
export function getDateRange(
  filter: DateRangeFilter
): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "all":
      start.setFullYear(start.getFullYear() - 10);
      break;
  }

  return { start, end };
}

/**
 * Filter items by date field
 */
export function filterByDateRange<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T,
  filter: DateRangeFilter
): T[] {
  const { start, end } = getDateRange(filter);

  return items.filter((item) => {
    const date = new Date(item[dateField]);
    return date >= start && date <= end;
  });
}

/**
 * Sort items by date field
 */
export function sortByDate<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T,
  order: "asc" | "desc" = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField]).getTime();
    const dateB = new Date(b[dateField]).getTime();

    return order === "asc" ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDateDisplay(date);
}
