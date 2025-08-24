import { formatRelativeTime } from '../time';

describe('formatRelativeTime', () => {
  it('handles pluralization correctly for minutes', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago
    expect(formatRelativeTime(date.toISOString())).toBe('2 mins ago');
  });

  it('handles singular correctly for minutes', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 1 * 60 * 1000); // 1 minute ago
    expect(formatRelativeTime(date.toISOString())).toBe('1 min ago');
  });

  it('returns just now for seconds difference', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 10 * 1000);
    expect(formatRelativeTime(date.toISOString())).toBe('just now');
  });
});
