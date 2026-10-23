export type DevhubBenchmarkState = {
  id: string;
  scrollTarget: "top" | "middle" | "bottom" | "audit";
  branchMenuOpen: boolean;
  codeMenuOpen: boolean;
  filterMenuOpen: boolean;
  actionsMenuOpen: boolean;
  reviewPanelOpen: boolean;
  fileTreeOpen: boolean;
  quickSwitcherOpen: boolean;
  notificationsOpen: boolean;
  blockingModalOpen: boolean;
  asyncDelayMs: number | null;
  autoBannerDelayMs: number | null;
  releaseSlide: number;
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default repository top view with auto-rotating release banner",
  "2": "Notifications popover open while new alerts arrive.",
  "3": "Blocking security modal open",
  "4": "Repository file tree sidebar is open and narrowed, hiding deep filenames until resized.",
};

function baseState(): DevhubBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    branchMenuOpen: false,
    codeMenuOpen: false,
    filterMenuOpen: false,
    actionsMenuOpen: false,
    reviewPanelOpen: false,
    fileTreeOpen: false,
    quickSwitcherOpen: false,
    notificationsOpen: false,
    blockingModalOpen: false,
    asyncDelayMs: null,
    autoBannerDelayMs: 1800,
    releaseSlide: 0,
  };
}

export function getDevhubBenchmarkState(stateId?: string | null): DevhubBenchmarkState {
  const base = baseState();

  switch (stateId) {
    case "2":
      return { ...base, id: "2", notificationsOpen: true, asyncDelayMs: 5600 };
    case "3":
      return { ...base, id: "3", blockingModalOpen: true };
    case "4":
      return { ...base, id: "4", fileTreeOpen: true };
    default:
      return base;
  }
}
