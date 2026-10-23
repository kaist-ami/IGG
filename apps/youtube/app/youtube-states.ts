export type YouTubeFilter =
  | "All"
  | "Music"
  | "Mix"
  | "Live"
  | "Recently uploaded"
  | "Watched"
  | "New for you";

export type YouTubeSort = "Top comments" | "Newest first";
export type YouTubeViewMode = "home" | "watch";

export type YouTubeBenchmarkState = {
  id: string;
  viewMode: YouTubeViewMode;
  query: string;
  activeFilter: YouTubeFilter;
  selectedVideoId: string;
  liked: Record<string, boolean>;
  saved: Record<string, boolean>;
  subscribed: Record<string, boolean>;
  expandedDescription: boolean;
  sortBy: YouTubeSort;
  history: string[];
  playing: boolean;
  playhead: number;
  adActive: boolean;
  skipCountdown: number;
  midrollShown: Record<string, boolean>;
  showMoreMenu: boolean;
  showFloatingPromo: boolean;
  hoveredInfoTarget: boolean;
  showTranscriptPanel: boolean;
  showQaPanel: boolean;
  searchFocused: boolean;
  initialScrollY: number | null;
  toastNotif: string | null;
};

function createBaseState(): YouTubeBenchmarkState {
  return {
    id: "1",
    viewMode: "home",
    query: "",
    activeFilter: "All",
    selectedVideoId: "v1",
    liked: {},
    saved: {},
    subscribed: {},
    expandedDescription: false,
    sortBy: "Top comments",
    history: ["v1"],
    playing: true,
    playhead: 0,
    adActive: false,
    skipCountdown: 0,
    midrollShown: {},
    showMoreMenu: false,
    showFloatingPromo: true,
    hoveredInfoTarget: false,
    showTranscriptPanel: false,
    showQaPanel: false,
    searchFocused: false,
    initialScrollY: null,
    toastNotif: null,
  };
}

export function getYouTubeBenchmarkState(stateId?: string | null): YouTubeBenchmarkState {
  const base = createBaseState();

  switch (stateId) {
    case "2":
      return {
        ...base,
        id: "2",
        viewMode: "watch",
        selectedVideoId: "v1",
        history: ["v1"],
        adActive: true,
        skipCountdown: 5,
      };
    case "3":
      return {
        ...base,
        id: "3",
        viewMode: "home",
        initialScrollY: 1750,
      };
    case "4":
      return {
        ...base,
        id: "4",
        viewMode: "watch",
        selectedVideoId: "v1",
        history: ["v1"],
        initialScrollY: 300,
      };
    case "5":
      return {
        ...base,
        id: "5",
        viewMode: "watch",
        selectedVideoId: "v1",
        history: ["v1"],
        initialScrollY: 1660,
      };
    case "6":
      return {
        ...base,
        id: "6",
        viewMode: "home",
        searchFocused: true,
      };
    case "7":
      return {
        ...base,
        id: "7",
        viewMode: "home",
        toastNotif: "subscriber-minjoon",
      };
    case "8":
      return {
        ...base,
        id: "8",
        viewMode: "home",
        toastNotif: "comment-ella",
      };
    case "9":
      return {
        ...base,
        id: "9",
        viewMode: "home",
        toastNotif: "reaction-groundingarena",
      };
    case "10":
      return {
        ...base,
        id: "10",
        viewMode: "home",
        toastNotif: "reply-jupli",
      };
    case "11":
      return {
        ...base,
        id: "11",
        viewMode: "home",
        toastNotif: "upload-mockui",
      };
    default:
      return base;
  }
}
