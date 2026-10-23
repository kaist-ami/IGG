export type WayfindBenchmarkState = {
  id: string;
  scrollTarget: "top" | "middle" | "bottom" | "route" | "footer";
  layersMenuOpen: boolean;
  travelMenuOpen: boolean;
  savedMenuOpen: boolean;
  searchOpen: boolean;
  popupOpen: boolean;
  routePanelOpen: boolean;
  asyncDelayMs: number | null;
  autoBannerDelayMs: number | null;
  promoSlide: number;
  mapPanStart: { x: number; y: number };
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
  "1": "Default city map view",
  "2": "Sidebar footer visible",
  "3": "Location permission popup open",
  "4": "Live map updates pending",
  "5": "Map starts west of Blue Line Station",
  "6": "Map starts west of Civic Garden Library",
  "7": "Map starts west of North Pier Museum",
  "8": "Map starts west of Eastview Park",
  "9": "Map starts east of Atlas Pharmacy",
  "10": "Map starts east of West Gate Parking",
  "11": "Map starts northwest of South Marina Pier",
  "12": "Map starts east of Harbor Bike Rental",
  "13": "Map starts east of Garden Square",
  "14": "Map starts west of Juniper Market Hall",
};

function baseState(): WayfindBenchmarkState {
  return {
    id: "1",
    scrollTarget: "top",
    layersMenuOpen: false,
    travelMenuOpen: false,
    savedMenuOpen: false,
    searchOpen: false,
    popupOpen: false,
    routePanelOpen: false,
    asyncDelayMs: null,
    autoBannerDelayMs: null,
    promoSlide: 0,
    mapPanStart: { x: 300, y: 180 },
  };
}

export function getWayfindBenchmarkState(stateId?: string | null): WayfindBenchmarkState {
  const base = baseState();
  switch (stateId) {
    case "2": return { ...base, id: "2", scrollTarget: "footer" };
    case "3": return { ...base, id: "3", popupOpen: true };
    case "4": return { ...base, id: "4", asyncDelayMs: 3200 };
    case "5": return { ...base, id: "5", mapPanStart: { x: 50, y: 180 } };
    case "6": return { ...base, id: "6", mapPanStart: { x: 500, y: 180 } };
    case "7": return { ...base, id: "7", mapPanStart: { x: 900, y: 180 } };
    case "8": return { ...base, id: "8", mapPanStart: { x: 760, y: 180 } };
    case "9": return { ...base, id: "9", mapPanStart: { x: 760, y: 180 } };
    case "10": return { ...base, id: "10", mapPanStart: { x: 600, y: 180 } };
    case "11": return { ...base, id: "11", mapPanStart: { x: 0, y: 0 } };
    case "12": return { ...base, id: "12", mapPanStart: { x: 1400, y: 180 } };
    case "13": return { ...base, id: "13", mapPanStart: { x: 1300, y: 180 } };
    case "14": return { ...base, id: "14", mapPanStart: { x: 0, y: 180 } };
    default: return base;
  }
}
