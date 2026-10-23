export type PagelyBenchmarkState = {
  id: string;
  scrollTarget: "top" | "milestones" | "roster" | "tasks" | "linked";
  activeMenu: string | null;
  viewMenuOpen: boolean;
  sortMenuOpen: boolean;
  moreMenuOpen: boolean;
  searchOpen: boolean;
  importModalOpen: boolean;
  asyncDelayMs: number | null;
  asyncNoticeKind: "comment" | "deploy" | "access" | "import" | "reminder" | null;
  autoBannerDelayMs: number | null;
  bannerSlide: number;
  detailsPanelOpen: boolean;
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default page view",
  "2": "Linked resources visible",
  "3": "Sync button pending",
  "4": "Status property menu open over owner property",
  "5": "Owner property menu open over due date property",
  "6": "Shared page menu open over page properties",
  "7": "Sprint task status menu open",
  "8": "Zoom meeting log action appears after delay",
  "9": "Jordan Mills comment notification appears after delay",
  "10": "Deploy status notification appears after delay",
  "11": "Access request notification appears after delay",
  "12": "Import review notification appears after delay",
  "13": "Launch reminder notification appears after delay",
};

function baseState(): PagelyBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    activeMenu: null,
    viewMenuOpen: false,
    sortMenuOpen: false,
    moreMenuOpen: false,
    searchOpen: false,
    importModalOpen: false,
    asyncDelayMs: null,
    asyncNoticeKind: null,
    autoBannerDelayMs: null,
    bannerSlide: 0,
    detailsPanelOpen: false,
  };
}

export function getPagelyBenchmarkState(stateId?: string | null): PagelyBenchmarkState {
  const base = baseState();
  switch (stateId) {
    case "2": return { ...base, id: "2", scrollTarget: "linked" };
    case "3": return { ...base, id: "3", asyncDelayMs: 3200 };
    case "4": return { ...base, id: "4", activeMenu: "property-status" };
    case "5": return { ...base, id: "5", activeMenu: "property-owner" };
    case "6": return { ...base, id: "6", activeMenu: "sidebar-team-handbook" };
    case "7": return { ...base, id: "7", scrollTarget: "tasks", activeMenu: "task-notify-customers-status" };
    case "8": return { ...base, id: "8", asyncDelayMs: 5000 };
    case "9": return { ...base, id: "9", asyncDelayMs: 3400, asyncNoticeKind: "comment" };
    case "10": return { ...base, id: "10", asyncDelayMs: 3600, asyncNoticeKind: "deploy" };
    case "11": return { ...base, id: "11", asyncDelayMs: 3800, asyncNoticeKind: "access" };
    case "12": return { ...base, id: "12", asyncDelayMs: 4000, asyncNoticeKind: "import" };
    case "13": return { ...base, id: "13", asyncDelayMs: 4200, asyncNoticeKind: "reminder" };
    default: return base;
  }
}
