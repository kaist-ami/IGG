export type ChirpBenchmarkState = {
  id: string;
  scrollTarget: "top" | "follow" | "spotlight";
  tweetMoreOpen: boolean;
  composeMediaOpen: boolean;
  profileMenuOpen: boolean;
  searchOpen: boolean;
  phoneDialogOpen: boolean;
  asyncDelayMs: number | null;
  composeUploadRequired: boolean;
  autoBannerDelayMs: number | null;
  bannerSlide: number;
  dmPanelOpen: boolean;
  dmUploadPanelOpen: boolean;
  notificationType: "follow-request" | "mention" | "milestone" | null;
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default feed view",
  "2": "Lower feed posts visible",
  "3": "Phone verification dialog occluding feed",
  "4": "Compose file upload pending",
  "5": "DM file upload panel open",
  "6": "Follow request notification pending",
  "7": "Mention notification pending",
  "8": "Like milestone notification pending",
};

function baseState(): ChirpBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    tweetMoreOpen: false,
    composeMediaOpen: false,
    profileMenuOpen: false,
    searchOpen: false,
    phoneDialogOpen: false,
    asyncDelayMs: null,
    composeUploadRequired: false,
    autoBannerDelayMs: null,
    bannerSlide: 0,
    dmPanelOpen: false,
    dmUploadPanelOpen: false,
    notificationType: null,
  };
}

export function getChirpBenchmarkState(stateId?: string | null): ChirpBenchmarkState {
  const base = baseState();
  switch (stateId) {
    case "2": return { ...base, id: "2", scrollTarget: "follow" };
    case "3": return { ...base, id: "3", phoneDialogOpen: true };
    case "4": return { ...base, id: "4", composeUploadRequired: true };
    case "5": return { ...base, id: "5", dmUploadPanelOpen: true };
    case "6": return { ...base, id: "6", asyncDelayMs: 4500, notificationType: "follow-request" };
    case "7": return { ...base, id: "7", asyncDelayMs: 4000, notificationType: "mention" };
    case "8": return { ...base, id: "8", asyncDelayMs: 5000, notificationType: "milestone" };
    default: return base;
  }
}
