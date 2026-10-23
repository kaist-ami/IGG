export type DayplanBenchmarkState = {
  id: string;
  scrollTarget: "top" | "middle" | "bottom" | "join";
  viewMenuOpen: boolean;
  createMenuOpen: boolean;
  calendarMenuOpen: boolean;
  shareMenuOpen: boolean;
  searchOpen: boolean;
  popupOpen: boolean;
  dragPanelOpen: boolean;
  asyncDelayMs: number | null;
  joinAsyncTarget: string | null;
  joinAsyncDelayMs: number | null;
  autoBannerDelayMs: number | null;
  bannerSlide: number;
  popupEventId: string | null;
  popupEventPos: { x: number; y: number } | null;
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default week calendar view with auto rotating focus banner",
  "2": "Agenda section visible",
  "3": "Sync button waiting for availability",
  "4": "Join link generating for 5:15 PM meeting",
  "5": "Join link generating for 6:30 PM meeting",
  "6": "Design Review popup open, blocking May 13 events",
  "7": "Rendering Pipeline Sync popup open, blocking May 20 events",
  "8": "Lumina AI Collab popup open, blocking May 21 events",
};

function baseState(): DayplanBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    viewMenuOpen: false,
    createMenuOpen: false,
    calendarMenuOpen: false,
    shareMenuOpen: false,
    searchOpen: false,
    popupOpen: false,
    dragPanelOpen: false,
    asyncDelayMs: null,
    joinAsyncTarget: null,
    joinAsyncDelayMs: null,
    autoBannerDelayMs: 2400,
    bannerSlide: 0,
    popupEventId: null,
    popupEventPos: null,
  };
}

export function getDayplanBenchmarkState(stateId?: string | null): DayplanBenchmarkState {
  const base = baseState();

  switch (stateId) {
    case "2":
      return { ...base, id: "2", scrollTarget: "middle" };
    case "3":
      return { ...base, id: "3", asyncDelayMs: 5000 };
    case "4":
      return { ...base, id: "4", scrollTarget: "join", joinAsyncTarget: "dayplan.agenda.leah.join", joinAsyncDelayMs: 5000 };
    case "5":
      return { ...base, id: "5", scrollTarget: "join", joinAsyncTarget: "dayplan.agenda.tara.join", joinAsyncDelayMs: 5000 };
    case "6":
      return { ...base, id: "6", popupEventId: "design-review", popupEventPos: { x: 870, y: 200 } };
    case "7":
      return { ...base, id: "7", popupEventId: "may20-render", popupEventPos: { x: 900, y: 260 } };
    case "8":
      return { ...base, id: "8", popupEventId: "may21-lumina", popupEventPos: { x: 880, y: 260 } };
    default:
      return base;
  }
}
