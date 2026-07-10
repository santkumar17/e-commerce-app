import { theme } from '@/src/theme';

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Tone = 'positive' | 'caution' | 'negative' | 'neutral';

const STATUS_TONE: Record<string, Tone> = {
  approved: 'positive',
  delivered: 'positive',
  pending: 'caution',
  shipped: 'caution',
  rejected: 'negative',
  cancelled: 'negative',
  draft: 'neutral',
  placed: 'neutral',
};

/** Badge background tinted from the matching theme token, for order/product status pills. */
export function statusColor(status: string): { backgroundColor: string } {
  switch (STATUS_TONE[status] ?? 'neutral') {
    case 'positive': return { backgroundColor: hexToRgba(theme.color.success, 0.18) };
    case 'caution': return { backgroundColor: hexToRgba(theme.color.warning, 0.22) };
    case 'negative': return { backgroundColor: hexToRgba(theme.color.error, 0.16) };
    default: return { backgroundColor: theme.color.surfaceTertiary };
  }
}
