import { theme } from '@/src/theme';
import { useContentWidth } from '@/src/hooks/use-content-width';
import { useBreakpoint } from '@/src/hooks/use-breakpoint';

interface Options {
  /** Desktop column count is derived from this target width unless desktopColumns is set. */
  minCardWidth?: number;
  desktopColumns?: number;
  horizontalPadding?: number;
  gap?: number;
}

/** 2 columns mobile / 3 tablet / 4-5 desktop (width-driven unless overridden). Replaces the hardcoded `/2` grid math in home.tsx and seller/[id].tsx. */
export function useGridColumns(options: Options = {}) {
  const {
    minCardWidth = 160,
    desktopColumns,
    horizontalPadding = theme.spacing.xl * 2,
    gap = theme.spacing.md,
  } = options;
  const contentWidth = useContentWidth();
  const { isMobile, isTablet } = useBreakpoint();
  const available = Math.max(0, contentWidth - horizontalPadding);

  let columns: number;
  if (isMobile) columns = 2;
  else if (isTablet) columns = 3;
  else columns = desktopColumns ?? Math.min(5, Math.max(4, Math.floor((available + gap) / (minCardWidth + gap))));

  const cardWidth = (available - gap * (columns - 1)) / columns;
  return { columns, cardWidth, contentWidth };
}
