export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const plural = (value: number, unit: string) => {
    return value === 1 ? `${value} ${unit} ago` : `${value} ${unit}s ago`;
  };

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return plural(Math.floor(diffSeconds / 60), 'min');
  if (diffSeconds < 86400) return plural(Math.floor(diffSeconds / 3600), 'hr');
  if (diffSeconds < 604800) return plural(Math.floor(diffSeconds / 86400), 'day');
  if (diffSeconds < 2629743) return plural(Math.floor(diffSeconds / 604800), 'week');

  return date.toLocaleDateString();
}