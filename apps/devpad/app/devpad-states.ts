export type DevpadBenchmarkState = {
  id: string;
  scrollTarget: "top" | "middle" | "bottom" | "panel";
  fileMenuOpen: boolean;
  viewMenuOpen: boolean;
  terminalMenuOpen: boolean;
  sourceMenuOpen: boolean;
  commandOpen: boolean;
  popupOpen: boolean;
  blockerOpen: boolean;
  asyncDelayMs: number | null;
  autoBannerDelayMs: number | null;
  tipIndex: number;
  allExplorerFoldersOpen: boolean;
  explorerPreset: "default" | "all" | "appsMixed" | "datasetClosed" | "scriptsClosed" | "configClosed";
  rightPanelCollapsed: boolean;
  terminalPanelCollapsed: boolean;
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default Devpad editor workspace",
  "2": "Review Assistant attachment upload pending",
  "3": "All explorer folders expanded for file search",
  "4": "Explorer apps expanded with wayfind collapsed",
  "5": "Explorer apps folder collapsed before file search",
  "6": "Explorer scripts folder collapsed",
  "7": "Assistant panel nearly collapsed",
  "8": "Terminal panel nearly collapsed"
};

function baseState(): DevpadBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    fileMenuOpen: false,
    viewMenuOpen: false,
    terminalMenuOpen: false,
    sourceMenuOpen: false,
    commandOpen: false,
    popupOpen: false,
    blockerOpen: false,
    asyncDelayMs: null,
    autoBannerDelayMs: null,
    tipIndex: 0,
    allExplorerFoldersOpen: false,
    explorerPreset: "default",
    rightPanelCollapsed: false,
    terminalPanelCollapsed: false,
  };
}

export function getDevpadBenchmarkState(stateId?: string | null): DevpadBenchmarkState {
  const base = baseState();
  switch (stateId) {
    case "2": return { ...base, id: "2", asyncDelayMs: 4200 };
    case "3": return { ...base, id: "3", allExplorerFoldersOpen: true, explorerPreset: "all" };
    case "4": return { ...base, id: "4", explorerPreset: "appsMixed" };
    case "5": return { ...base, id: "5", explorerPreset: "datasetClosed" };
    case "6": return { ...base, id: "6", explorerPreset: "scriptsClosed" };
    case "7": return { ...base, id: "7", rightPanelCollapsed: true };
    case "8": return { ...base, id: "8", terminalPanelCollapsed: true };
    default: return base;
  }
}
