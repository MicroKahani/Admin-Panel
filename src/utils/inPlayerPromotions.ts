import { parsePromoBannerTimestampsInput } from './promoBannerTimestamps';

export type PromotionFormRow = {
  /** Stable key for React lists */
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  timestampsText: string;
};

export function newPromotionRow(): PromotionFormRow {
  return {
    id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    timestampsText: '',
  };
}

/** Build API payload; drops invalid rows. */
export function promotionRowsToPayload(rows: PromotionFormRow[]) {
  return rows
    .map((r) => ({
      title: r.title.trim(),
      subtitle: r.subtitle.trim() || undefined,
      imageUrl: r.imageUrl.trim(),
      linkUrl: r.linkUrl.trim(),
      timestampsSec: parsePromoBannerTimestampsInput(r.timestampsText),
    }))
    .filter((p) => p.title && p.linkUrl && p.timestampsSec.length > 0);
}

export interface EpisodePromotionApiShape {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl: string;
  timestampsSec: number[];
}

export function episodePromotionsToFormRows(
  list: EpisodePromotionApiShape[] | undefined
): PromotionFormRow[] {
  if (!list?.length) return [];
  return list.map((p) => ({
    id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: p.title || '',
    subtitle: p.subtitle || '',
    imageUrl: p.imageUrl || '',
    linkUrl: p.linkUrl || '',
    timestampsText: (p.timestampsSec || []).join(', '),
  }));
}
