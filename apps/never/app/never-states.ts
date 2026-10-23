export type NeverLang = "ko" | "en" | "ja";

export type NeverBenchmarkState = {
  id: string;
  scrollTarget: "top" | "bottom";
  initialScrollY: number | null;
  lang: NeverLang;
  query: string;
  searchFocused: boolean;
  pressView: 0 | 1;
  selectedPress: number | null;
  showMore: boolean;
  openTopics: number[];
  trendingExpanded: boolean;
  weatherExpanded: boolean;
  loginOpen: boolean;
  cookieBanner: boolean;
  shortcutsExpanded: boolean;
  moreNavOpen: boolean;
  adIdx: number;
  ad2Idx: number;
  tickerIdx: number;
};

function createBaseState(): NeverBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    initialScrollY: null,
    lang: "en",
    query: "",
    searchFocused: false,
    pressView: 0,
    selectedPress: null,
    showMore: false,
    openTopics: [],
    trendingExpanded: false,
    weatherExpanded: false,
    loginOpen: false,
    cookieBanner: true,
    shortcutsExpanded: false,
    moreNavOpen: false,
    adIdx: 0,
    ad2Idx: 0,
    tickerIdx: 0,
  };
}

export function getNeverBenchmarkState(stateId?: string | null): NeverBenchmarkState {
  const base = createBaseState();

  switch (stateId) {
    case "2":
      return {
        ...base,
        id: "2",
        searchFocused: true,
      };
    case "3":
      return {
        ...base,
        id: "3",
        loginOpen: true,
      };
    default:
      return base;
  }
}
