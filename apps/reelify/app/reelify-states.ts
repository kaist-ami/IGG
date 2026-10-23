export type ReelifyBenchmarkState = {
  id: string;
  scrollTarget: "top" | "footer" | "new-releases" | "sci-fi";
  cardMenuSlug: string | null;
  profileMenuOpen: boolean;
  filterMenuOpen: boolean;
  searchOpen: boolean;
  movieModalOpen: boolean;
  asyncDelayMs: number | null;
  asyncNoticeKind: "for-you" | "local" | "weekend" | null;
  autoBannerDelayMs: number | null;
  bannerSlide: number;
  infoPanelOpen: boolean;
  miniPlayerOpen: boolean;
  miniPlayerPos: { x: number; y: number };
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default view",
  "2": "Scrolled to New Releases section",
  "3": "Scrolled to Sci-Fi & Fantasy section",
  "4": "Mini player at bottom-left occludes footer links",
  "5": "Mini player at bottom-right occludes footer links",
  "6": "For You recommendation notification appears after delay",
  "7": "Local picks recommendation notification appears after delay",
  "8": "Weekend watchlist recommendation notification appears after delay",
};

function baseState(): ReelifyBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    cardMenuSlug: null,
    profileMenuOpen: false,
    filterMenuOpen: false,
    searchOpen: false,
    movieModalOpen: false,
    asyncDelayMs: null,
    asyncNoticeKind: null,
    autoBannerDelayMs: 4500,
    bannerSlide: 0,
    infoPanelOpen: false,
    miniPlayerOpen: false,
    miniPlayerPos: { x: 80, y: 560 },
  };
}

export function getReelifyBenchmarkState(stateId?: string | null): ReelifyBenchmarkState {
  const base = baseState();
  switch (stateId) {
    case "2": return { ...base, id: "2", scrollTarget: "new-releases" };
    case "3": return { ...base, id: "3", scrollTarget: "sci-fi" };
    case "4": return { ...base, id: "4", scrollTarget: "footer", miniPlayerOpen: true, miniPlayerPos: { x: 80, y: 560 } };
    case "5": return { ...base, id: "5", scrollTarget: "footer", miniPlayerOpen: true, miniPlayerPos: { x: 690, y: 560 } };
    case "6": return { ...base, id: "6", asyncDelayMs: 3400, asyncNoticeKind: "for-you" };
    case "7": return { ...base, id: "7", asyncDelayMs: 3600, asyncNoticeKind: "local" };
    case "8": return { ...base, id: "8", asyncDelayMs: 3800, asyncNoticeKind: "weekend" };
    default: return base;
  }
}
