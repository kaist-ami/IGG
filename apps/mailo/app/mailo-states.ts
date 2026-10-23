export type MailoTab = "primary" | "social" | "promotions";

export type MailoBenchmarkState = {
  id: string;
  activeTab: MailoTab;
  composeOpen: boolean;
  composeTo: string | null;
  composeSubject: string | null;
  composeAttachment: string | null;
  upgradeModalOpen: boolean;
  sidebarWidth: number;
  sendCountdown: number;
  listScrollTop: number;
  searchPanelOpen: boolean;
  asyncDelayMs: number | null;
  incomingMailIndex: number | null;
  autoBannerDelayMs: number | null;
  autoBannerStartIndex: number;
};

function createBaseState(): MailoBenchmarkState {
  return {
    id: "1",
    activeTab: "primary",
    composeOpen: false,
    composeTo: null,
    composeSubject: null,
    composeAttachment: null,
    upgradeModalOpen: false,
    sidebarWidth: 240,
    sendCountdown: 0,
    listScrollTop: 0,
    searchPanelOpen: false,
    asyncDelayMs: null,
    incomingMailIndex: null,
    autoBannerDelayMs: null,
    autoBannerStartIndex: 0,
  };
}

export function getMailoBenchmarkState(stateId?: string | null): MailoBenchmarkState {
  const base = createBaseState();
  switch (stateId) {
    case "2":
      return { ...base, id: "2", listScrollTop: 1000 };
    case "3":
      return { ...base, id: "3", upgradeModalOpen: true };
    case "4":
      return { ...base, id: "4", sidebarWidth: 64 };
    case "5":
      return { ...base, id: "5", searchPanelOpen: true };
    case "6":
      return { ...base, id: "6", asyncDelayMs: 4000, incomingMailIndex: 0 };
    case "7":
      return { ...base, id: "7", asyncDelayMs: 4000, incomingMailIndex: 1 };
    case "8":
      return { ...base, id: "8", asyncDelayMs: 4000, incomingMailIndex: 2 };
    case "9":
      return { ...base, id: "9", asyncDelayMs: 4000, incomingMailIndex: 3 };
    case "10":
      return {
        ...base,
        id: "10",
        composeOpen: true,
        composeTo: "Jisu Kim",
        composeSubject: "Re: Q3 design review",
        composeAttachment: "Q3_Report.pptx",
        asyncDelayMs: 4000,
      };
    case "11":
      return { ...base, id: "11", autoBannerDelayMs: 4000, autoBannerStartIndex: 1 };
    default:
      return base;
  }
}
