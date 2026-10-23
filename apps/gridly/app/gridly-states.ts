export type GridlyBenchmarkState = {
  id: string;
  scrollTarget: "top" | "middle" | "bottom";
  fileMenuOpen: boolean;
  insertMenuOpen: boolean;
  filterMenuOpen: boolean;
  sheetMenuOpen: boolean;
  searchOpen: boolean;
  popupOpen: boolean;
  exportDialog: "pdf" | "csv" | null;
  narrowColumns: boolean;
  asyncDelayMs: number | null;
  asyncTarget: "refresh" | "meet" | "share" | "pdf" | "csv" | null;
  autoBannerDelayMs: number | null;
  insightSlide: number;
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default sheet view",
  "2": "Save completed popup occluding page",
  "3": "Narrow spreadsheet columns view",
  "4": "Refresh data is syncing",
  "5": "Meet link is being prepared",
  "6": "Share settings are loading",
  "7": "PDF export dialog is generating a file",
  "8": "CSV export dialog is generating a file",
  "9": "Procurement insight banner visible before navigating to Enterprise expansion",
  "12": "Search dialog open",
};

function baseState(): GridlyBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    fileMenuOpen: false,
    insertMenuOpen: false,
    filterMenuOpen: false,
    sheetMenuOpen: false,
    searchOpen: false,
    popupOpen: false,
    exportDialog: null,
    narrowColumns: false,
    asyncDelayMs: null,
    asyncTarget: null,
    autoBannerDelayMs: 2200,
    insightSlide: 0,
  };
}

export function getGridlyBenchmarkState(stateId?: string | null): GridlyBenchmarkState {
  const base = baseState();
  switch (stateId) {
    case "2": return { ...base, id: "2", popupOpen: true };
    case "3": return { ...base, id: "3", scrollTarget: "middle", narrowColumns: true };
    case "4": return { ...base, id: "4", asyncDelayMs: 5200, asyncTarget: "refresh" };
    case "5": return { ...base, id: "5", asyncDelayMs: 5200, asyncTarget: "meet" };
    case "6": return { ...base, id: "6", asyncDelayMs: 5200, asyncTarget: "share" };
    case "7": return { ...base, id: "7", exportDialog: "pdf", asyncDelayMs: 5200, asyncTarget: "pdf" };
    case "8": return { ...base, id: "8", exportDialog: "csv", asyncDelayMs: 5200, asyncTarget: "csv" };
    case "9": return { ...base, id: "9", autoBannerDelayMs: null, insightSlide: 1 };
    case "12": return { ...base, id: "12", searchOpen: true };
    default: return base;
  }
}
