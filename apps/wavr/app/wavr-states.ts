export type WavrBenchmarkState = {
  id: string;
  view: "album" | "home";
  scrollTarget: "top" | "artists" | "banner" | "trending";
  trackMoreOpen: boolean;
  libraryFilterOpen: boolean;
  playerMoreOpen: boolean;
  searchOpen: boolean;
  deviceDialogOpen: boolean;
  asyncDelayMs: number | null;
  autoBannerDelayMs: number | null;
  bannerSlide: number;
  queuePanelOpen: boolean;
  floatingPlayerOpen: boolean;
  floatingPlayerDock: "right" | "left";
  asyncNoticeKind: "release" | "concert" | "playlist" | "friend" | "download" | null;
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1":  "Album detail — Liked Songs playlist",
  "2":  "Album detail — Fans also like section visible",
  "3":  "Album detail — Track more menu open",
  "4":  "Search overlay open",
  "5":  "Device picker dialog occluding content",
  "6":  "Auto rotating featured banner — starts on Neon Drift (slide 0)",
  "7":  "Auto rotating featured banner — starts on Lena Shore (slide 2)",
  "8":  "Floating player occludes track list — drag to move",
  "9":  "Async notification — new release ready",
  "10": "Async notification — nearby concert tickets",
  "11": "Async notification — playlist refreshed",
  "12": "Async notification — friend activity",
  "13": "Async notification — downloads ready",
  "14": "Floating player occludes left artist follows — drag to move",
};

function baseState(): WavrBenchmarkState {
  return {
    id: "1",
    view: "album",
    scrollTarget: "top",
    trackMoreOpen: false,
    libraryFilterOpen: false,
    playerMoreOpen: false,
    searchOpen: false,
    deviceDialogOpen: false,
    asyncDelayMs: null,
    autoBannerDelayMs: null,
    bannerSlide: 0,
    queuePanelOpen: false,
    floatingPlayerOpen: false,
    floatingPlayerDock: "right",
    asyncNoticeKind: null,
  };
}

export function getWavrBenchmarkState(stateId?: string | null): WavrBenchmarkState {
  const base = baseState();
  switch (stateId) {
    case "2":  return { ...base, id: "2",  scrollTarget: "artists" };
    case "3":  return { ...base, id: "3",  trackMoreOpen: true };
    case "4":  return { ...base, id: "4",  searchOpen: true };
    case "5":  return { ...base, id: "5",  deviceDialogOpen: true };
    case "6":  return { ...base, id: "6",  autoBannerDelayMs: 1700, bannerSlide: 0 };
    case "7":  return { ...base, id: "7",  autoBannerDelayMs: 1700, bannerSlide: 2 };
    case "8":  return { ...base, id: "8",  floatingPlayerOpen: true };
    case "9":  return { ...base, id: "9",  asyncDelayMs: 1800, asyncNoticeKind: "release" };
    case "10": return { ...base, id: "10", view: "home", asyncDelayMs: 2200, asyncNoticeKind: "concert" };
    case "11": return { ...base, id: "11", view: "home", asyncDelayMs: 2000, asyncNoticeKind: "playlist" };
    case "12": return { ...base, id: "12", asyncDelayMs: 2400, asyncNoticeKind: "friend" };
    case "13": return { ...base, id: "13", asyncDelayMs: 2100, asyncNoticeKind: "download" };
    case "14": return { ...base, id: "14", floatingPlayerOpen: true, floatingPlayerDock: "left" };
    default:   return base;
  }
}
