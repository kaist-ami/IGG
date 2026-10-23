export type DocsLibraryTab = "recent" | "owned" | "shared" | "starred";
export type DocsEditorMode = "editing" | "suggesting" | "viewing";
export type DocsRightPanel = "comments" | "activity" | "outline";
export type DocsScreen = "home" | "editor";
export type DocsAlignment = "left" | "center" | "right";

export type DocsBenchmarkState = {
  id: string;
  screen: DocsScreen;
  tab: DocsLibraryTab;
  query: string;
  currentDocId: string;
  showTemplates: boolean;
  showQaTools: boolean;
  editorMode: DocsEditorMode;
  font: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  alignment: DocsAlignment;
  zoom: number;
  rightPanel: DocsRightPanel;
  showShare: boolean;
  showFind: boolean;
  searchTerm: string;
  replaceTerm: string;
  showAutosaveToast: boolean;
  autosaveToastDelayMs: number | null;
  asyncReviewDelayMs: number | null;
  asyncReviewMode: "apply" | "publish" | null;
  autoBannerDelayMs: number | null;
  autoBannerTargetIndex: number | null;
  initialScrollY: number | null;
};

function createBaseState(): DocsBenchmarkState {
  return {
    id: "1",
    screen: "home",
    tab: "recent",
    query: "",
    currentDocId: "doc-benchmark",
    showTemplates: true,
    showQaTools: false,
    editorMode: "editing",
    font: "Arial",
    fontSize: 11,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    alignment: "left",
    zoom: 100,
    rightPanel: "comments",
    showShare: false,
    showFind: false,
    searchTerm: "benchmark",
    replaceTerm: "task",
    showAutosaveToast: false,
    autosaveToastDelayMs: null,
    asyncReviewDelayMs: null,
    asyncReviewMode: null,
    autoBannerDelayMs: null,
    autoBannerTargetIndex: null,
    initialScrollY: 3600,
  };
}

export function getDocsBenchmarkState(stateId?: string | null): DocsBenchmarkState {
  const base = createBaseState();

  switch (stateId) {
    case "2":
      return {
        ...base,
        id: "2",
        screen: "home",
        tab: "recent",
        query: "",
        initialScrollY: 0,
      };
    case "3":
      return {
        ...base,
        id: "3",
        screen: "editor",
        currentDocId: "doc-benchmark",
        rightPanel: "comments",
        initialScrollY: 1280,
      };
    case "4":
      return {
        ...base,
        id: "4",
        screen: "editor",
        currentDocId: "doc-benchmark",
        showQaTools: false,
        rightPanel: "comments",
        initialScrollY: 0,
      };
    case "5":
      return {
        ...base,
        id: "5",
        screen: "editor",
        currentDocId: "doc-benchmark",
        rightPanel: "comments",
        initialScrollY: 0,
      };
    case "6":
      return {
        ...base,
        id: "6",
        screen: "editor",
        currentDocId: "doc-benchmark",
        showFind: false,
        initialScrollY: 0,
      };
    case "7":
      return {
        ...base,
        id: "7",
        screen: "editor",
        currentDocId: "doc-benchmark",
        rightPanel: "comments",
        asyncReviewDelayMs: 5000,
        asyncReviewMode: "apply",
        initialScrollY: 0,
      };
    case "9":
      return {
        ...base,
        id: "9",
        screen: "editor",
        currentDocId: "doc-benchmark",
        rightPanel: "comments",
        asyncReviewDelayMs: 5000,
        asyncReviewMode: "publish",
        initialScrollY: 0,
      };
    case "8":
      return { ...base, id: "8", screen: "home", initialScrollY: 0, autoBannerDelayMs: 2200, autoBannerTargetIndex: 1 };
    default:
      return base;
  }
}
