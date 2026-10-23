"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getWayfindBenchmarkState, type WayfindBenchmarkState } from "./wayfind-states";

declare global {
  interface Window {
    __WAYFIND_BENCHMARK_STATE__?: WayfindBenchmarkState;
  }
}

function resolveReviewElement(selector?: string | null) {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
}

function buildReviewSelector(element: HTMLElement | null) {
  if (!element) return null;
  const tagged = element.closest("[data-igg-id]") as HTMLElement | null;
  const iggId = tagged?.getAttribute("data-igg-id");
  return iggId ? `[data-igg-id='${iggId}']` : null;
}

const { installReviewCapture, executeReviewAction } = createReviewRuntime({
  runtimeStateKey: "__WAYFIND_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type IconName = "map" | "search" | "layers" | "route" | "star" | "x" | "pin" | "car" | "walk" | "train" | "bell" | "drag" | "locate" | "food" | "cafe" | "hotel" | "bank" | "bus" | "compass" | "terrain";

function Icon({ name }: { name: IconName }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    map: <><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3z" /><path d="M9 3v15M15 6v15" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
    route: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 0 8h-1a4 4 0 0 0-4 4h9" /></>,
    star: <polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 9 8.5 12 2" />,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    pin: <><path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
    car: <><path d="M5 12 7 6h10l2 6" /><rect x="3" y="12" width="18" height="7" rx="2" /><path d="M7 19v2M17 19v2" /></>,
    walk: <><circle cx="12" cy="4" r="2" /><path d="M10 22 12 14l-3-3 2-4 4 3 3 1" /><path d="M13 14l4 8" /></>,
    train: <><rect x="6" y="3" width="12" height="14" rx="2" /><path d="M8 21h8M9 17l-2 4M15 17l2 4M8 8h8" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    drag: <><path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
    locate: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    food: <><path d="M7 2v9" /><path d="M4 2v6a3 3 0 0 0 6 0V2" /><path d="M7 11v11" /><path d="M17 2v20" /><path d="M14 2h3a3 3 0 0 1 0 6h-3" /></>,
    cafe: <><path d="M5 8h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2" /><path d="M4 21h14" /><path d="M7 3v2M11 3v2M15 3v2" /></>,
    hotel: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 10h2a2 2 0 0 1 2 2v9" /><path d="M8 7h.01M12 7h.01M8 11h.01M12 11h.01M8 15h.01M12 15h.01" /><path d="M2 21h20" /></>,
    bank: <><path d="m3 9 9-6 9 6" /><path d="M4 10h16" /><path d="M6 10v8M10 10v8M14 10v8M18 10v8" /><path d="M4 18h16" /><path d="M3 21h18" /></>,
    bus: <><rect x="5" y="3" width="14" height="15" rx="2" /><path d="M7 8h10M8 18v2M16 18v2" /><circle cx="8.5" cy="14.5" r="1" /><circle cx="15.5" cy="14.5" r="1" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><polygon points="12 5 13.8 12 12 19 10.2 12" fill="currentColor" stroke="none" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeWidth={1.2} /></>,
    terrain: <><path d="M2 20 8 9l4 5 3.5-5L22 20H2z" /><path d="M16 9 18.5 5 21 9" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

type Menu = "layers" | "travel" | "saved" | null;

function Button({ id, type, prereq, children, className, onClick, disabled }: { id: string; type?: string; prereq?: string; children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      aria-disabled={disabled ? "true" : undefined}
      onClick={disabled ? undefined : onClick}
      className={cx("inline-flex h-9 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50", disabled && "cursor-wait opacity-55", className)}
    >
      {children}
    </button>
  );
}

function Dropdown({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return <div className={cx("absolute z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl", className)}>{children}</div>;
}

function MenuItem({ id, type, prereq, children }: { id: string; type?: string; prereq?: string; children: React.ReactNode }) {
  return <button data-igg-id={id} data-igg-type={type} data-igg-prereq={prereq} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-600 hover:text-white">{children}</button>;
}

function useDraggablePanel(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ startX: number; startY: number; panelX: number; panelY: number } | null>(null);
  useEffect(() => {
    function move(event: MouseEvent) {
      if (!drag.current) return;
      setPos({ x: drag.current.panelX + event.clientX - drag.current.startX, y: drag.current.panelY + event.clientY - drag.current.startY });
    }
    function up() { drag.current = null; }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, []);
  return {
    pos,
    onMouseDown: (event: React.MouseEvent) => {
      drag.current = { startX: event.clientX, startY: event.clientY, panelX: pos.x, panelY: pos.y };
    },
  };
}

const places = [
  ["Moss & Maple Cafe", "Coffee · 4.7 · Open until 8 PM", "wayfind.place.moss-maple.directions"],
  ["Civic Garden Library", "Library · 4.8 · Quiet study rooms", "wayfind.place.civic-library.directions"],
  ["Juniper Market Hall", "Food hall · 4.5 · 18 vendors", "wayfind.place.juniper-market.directions"],
  ["Harbor Bike Rental", "Bicycle rental · 4.6 · Open now", "wayfind.place.harbor-bike.directions"],
  ["Blue Line Station", "Transit · Platforms 1-4", "wayfind.place.blue-line.directions"],
  ["Riverfront Hotel", "Hotel · 4.4 · EV charging", "wayfind.place.riverfront-hotel.directions"],
  ["Atlas Pharmacy", "Pharmacy · 24 hours", "wayfind.place.atlas-pharmacy.directions"],
  ["North Pier Museum", "Museum · 4.9 · Tickets available", "wayfind.place.north-pier.directions"],
] as const;

const routeStops = [
  ["Moss & Maple Cafe", "6 min walk · Turn left on Harbor Rd", "wayfind.route.moss-maple.open"],
  ["Civic Garden Library", "11 min walk · Via Greenway path", "wayfind.route.civic-library.open"],
  ["Juniper Market Hall", "8 min transit · N14 bus, 2 stops", "wayfind.route.juniper-market.open"],
  ["Harbor Bike Rental", "14 min bike · Along waterfront trail", "wayfind.route.harbor-bike.open"],
  ["Blue Line Station", "5 min walk · North entrance on Pier St", "wayfind.route.blue-line.open"],
] as const;

const pinDetails: Record<string, { name: string; category: string; rating: string; status: string; desc: string; tags: string[] }> = {
  "wayfind.map.pin.moss-maple":       { name: "Moss & Maple Cafe",     category: "Coffee & Bakery",  rating: "4.7", status: "Open until 8 PM",   desc: "Cozy neighborhood cafe with seasonal brews, fresh pastries, and a sunny garden terrace.", tags: ["Wi-Fi", "Outdoor seating", "Takeout"] },
  "wayfind.map.pin.atlas-pharmacy":   { name: "Atlas Pharmacy",        category: "Pharmacy",          rating: "4.3", status: "Open 24 hours",      desc: "Full-service pharmacy with delivery, compounding, and travel vaccination services.", tags: ["24h", "Delivery", "Drive-thru"] },
  "wayfind.map.pin.harbor-bike":      { name: "Harbor Bike Rental",    category: "Bicycle Rental",    rating: "4.6", status: "Open now",           desc: "Waterfront bike rental with city cruisers, e-bikes, and guided trail maps.", tags: ["E-bikes", "Helmets included", "Maps"] },
  "wayfind.map.pin.garden-sq":        { name: "Garden Square",         category: "Park",              rating: "4.8", status: "Open all hours",     desc: "Quiet green space in the city center with benches, a fountain, and weekend farmers market.", tags: ["Free entry", "Dog friendly", "Market Sat"] },
  "wayfind.map.pin.juniper-market":   { name: "Juniper Market Hall",   category: "Food Hall",         rating: "4.5", status: "Open until 10 PM",   desc: "Indoor market with 18 vendors — artisan cheese, ramen, craft beer, and more.", tags: ["18 vendors", "Craft beer", "Late hours"] },
  "wayfind.map.pin.blue-line":        { name: "Blue Line Station",     category: "Transit",           rating: "4.2", status: "Next train: 4 min",  desc: "Major transit hub with platforms 1–4. Direct service to Airport and North Pier.", tags: ["Platform 1–4", "Airport", "Accessible"] },
  "wayfind.map.pin.riverfront-hotel": { name: "Riverfront Hotel",      category: "Hotel · 4★",        rating: "4.4", status: "Rooms available",    desc: "Waterfront hotel with harbor views, rooftop bar, spa, and EV charging stations.", tags: ["Harbor view", "EV charging", "Rooftop bar"] },
  "wayfind.map.pin.civic-library":    { name: "Civic Garden Library",  category: "Library",           rating: "4.8", status: "Open until 9 PM",   desc: "Award-winning public library with quiet study rooms, maker lab, and rooftop reading garden.", tags: ["Study rooms", "Maker lab", "Wi-Fi"] },
  "wayfind.map.pin.north-pier":       { name: "North Pier Museum",     category: "Museum",            rating: "4.9", status: "Open until 6 PM",   desc: "Landmark maritime museum with interactive exhibits, a historic lightship, and harbor tours.", tags: ["Guided tours", "Kids friendly", "Gift shop"] },
  "wayfind.map.pin.eastview-park":    { name: "Eastview Park",         category: "Park & Recreation", rating: "4.6", status: "Open all hours",     desc: "Spacious hilltop park with jogging trails, a skate area, and panoramic city views.", tags: ["Jogging trail", "Skate area", "City views"] },
  "wayfind.map.pin.west-gate":        { name: "West Gate Parking",     category: "Parking",           rating: "4.1", status: "Open 24 hours",     desc: "Covered parking garage at the west entrance with EV chargers and weekend event rates.", tags: ["EV chargers", "Covered", "Event rates"] },
  "wayfind.map.pin.south-marina":     { name: "South Marina Pier",     category: "Ferry Terminal",    rating: "4.4", status: "Next ferry: 12 min", desc: "Harbor ferry pier with ticket kiosks, bike racks, and a waterside waiting area.", tags: ["Ferry", "Tickets", "Bike racks"] },
};

const promos = [
  { label: "Weekend guide", title: "New gallery walks near North Pier", target: "wayfind.promo.gallery.open" },
  { label: "Transit update", title: "Blue Line express buses added", target: "wayfind.promo.blue-line.open" },
  { label: "Food crawl", title: "Juniper Market late-night map", target: "wayfind.promo.juniper.open" },
];

export default function WayfindPage() {
  return (
    <Suspense fallback={<main className="flex h-screen flex-col overflow-hidden bg-slate-100" />}>
      <WayfindApp />
    </Suspense>
  );
}

function WayfindApp() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getWayfindBenchmarkState(stateId), [stateId]);
  const [uiState, setUiState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState<Menu>(initialState.layersMenuOpen ? "layers" : initialState.travelMenuOpen ? "travel" : initialState.savedMenuOpen ? "saved" : null);
  const [popupOpen, setPopupOpen] = useState(initialState.popupOpen);
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [slideIndex, setSlideIndex] = useState(initialState.promoSlide);
  const middleRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const panel = useDraggablePanel({ x: 1010, y: 250 });
  const MAP_W = 2500; const VIEW_W = 1050; const MAX_PAN_X = MAP_W - VIEW_W; const MAX_PAN_Y = 380;
  const [mapPan, setMapPan] = useState(initialState.mapPanStart);
  const mapDrag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<{ id: string; svgX: number; svgY: number } | null>(null);

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(initialState.layersMenuOpen ? "layers" : initialState.travelMenuOpen ? "travel" : initialState.savedMenuOpen ? "saved" : null);
    setPopupOpen(initialState.popupOpen);
    setAsyncReady(initialState.asyncDelayMs === null);
    setSlideIndex(initialState.promoSlide);
    setMapPan(initialState.mapPanStart);
    setSelectedPin(null);
  }, [initialState]);

  useEffect(() => { window.__WAYFIND_BENCHMARK_STATE__ = uiState; }, [uiState]);
  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __WAYFIND_BENCHMARK_STATE__?: Record<string, unknown> }).__WAYFIND_BENCHMARK_STATE__ ?? null;
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);
  useEffect(() => {
    if (uiState.scrollTarget === "middle") middleRef.current?.scrollIntoView({ block: "center" });
    if (uiState.scrollTarget === "bottom") bottomRef.current?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "route") routeRef.current?.scrollIntoView({ block: "center" });
    if (uiState.scrollTarget === "footer") footerRef.current?.scrollIntoView({ block: "end" });
  }, [uiState.scrollTarget]);
  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const timer = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.asyncDelayMs]);
  useEffect(() => {
    if (uiState.autoBannerDelayMs === null) return;
    const timer = window.setInterval(() => setSlideIndex((value) => (value + 1) % promos.length), uiState.autoBannerDelayMs);
    return () => window.clearInterval(timer);
  }, [uiState.autoBannerDelayMs]);

  const promo = promos[slideIndex];

  function onMapMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    mapDrag.current = { startX: e.clientX, startY: e.clientY, ox: mapPan.x, oy: mapPan.y };
    e.preventDefault();
  }
  function onMapMouseMove(e: React.MouseEvent) {
    if (!mapDrag.current) return;
    setMapPan({
      x: Math.min(MAX_PAN_X, Math.max(0, mapDrag.current.ox - (e.clientX - mapDrag.current.startX))),
      y: Math.min(MAX_PAN_Y, Math.max(0, mapDrag.current.oy - (e.clientY - mapDrag.current.startY))),
    });
  }
  function onMapMouseUp() { mapDrag.current = null; }

  return (
    <main className="relative flex h-screen overflow-hidden bg-slate-100">
      <header className="pointer-events-none absolute left-[402px] right-4 top-4 z-30 flex h-11 items-center justify-between gap-2">
        <div className="pointer-events-auto flex h-full min-w-0 items-center gap-2">
          <div className="group relative h-11">
            <button data-igg-id="wayfind.locate.button" data-igg-type="popup_occlusion" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-blue-600 shadow-md hover:bg-blue-50">
              <Icon name="locate" />
            </button>
            <div className="absolute left-0 top-12 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg group-hover:opacity-100">Current location</div>
          </div>

          <div className="group relative h-11">
            <button data-igg-id="wayfind.compass.button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50">
              <Icon name="compass" />
            </button>
            <div className="absolute left-0 top-12 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg group-hover:opacity-100">Reset north</div>
          </div>

          <div className="flex h-11 shrink-0 items-center rounded-md border border-slate-200 bg-white text-sm text-slate-700 shadow-md">
            <button className="shrink-0 px-3 font-semibold hover:bg-slate-50">Daejeon</button>
            <span className="text-slate-300">›</span>
            <button className="shrink-0 px-3 font-semibold hover:bg-slate-50">Yuseong-gu</button>
            <span className="text-slate-300">›</span>
            <button className="shrink-0 px-3 font-semibold hover:bg-slate-50">Gwanpyeong-dong</button>
            <div className="flex h-full shrink-0 items-center gap-2 border-l border-slate-200 px-3 text-slate-600">
              <span className="text-amber-400">●</span>
              <span className="font-medium">26°C</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex h-full shrink-0 items-center gap-1.5">


          <div className="group relative h-11">
            <button data-igg-id="wayfind.travel.button" data-igg-type="menu_reveal" onClick={() => setActiveMenu(activeMenu === "travel" ? null : "travel")} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50">
              <Icon name="route" />
            </button>
            <div className="absolute right-0 top-12 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg group-hover:opacity-100">Travel modes</div>
            <Dropdown open={activeMenu === "travel"} className="right-0">
              <MenuItem id="wayfind.travel.driving" type="menu_reveal" prereq="wayfind.travel.button"><Icon name="car" /> Driving</MenuItem>
              <MenuItem id="wayfind.travel.walking" type="menu_reveal" prereq="wayfind.travel.button"><Icon name="walk" /> Walking</MenuItem>
              <MenuItem id="wayfind.travel.transit" type="menu_reveal" prereq="wayfind.travel.button"><Icon name="train" /> Transit</MenuItem>
            </Dropdown>
          </div>

          <div className="group relative h-11">
            <button data-igg-id="wayfind.terrain.button" className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50">
              <Icon name="terrain" />
            </button>
            <div className="absolute right-0 top-12 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg group-hover:opacity-100">Terrain view</div>
          </div>

          <div className="group relative h-11">
            <button data-igg-id="wayfind.layers.button" data-igg-type="menu_reveal" onClick={() => setActiveMenu(activeMenu === "layers" ? null : "layers")} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50">
              <Icon name="layers" />
            </button>
            <div className="absolute right-0 top-12 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg group-hover:opacity-100">Map layers</div>
            <Dropdown open={activeMenu === "layers"} className="right-0">
              <MenuItem id="wayfind.layers.transit" type="menu_reveal" prereq="wayfind.layers.button"><Icon name="train" /> Transit</MenuItem>
              <MenuItem id="wayfind.layers.bike" type="menu_reveal" prereq="wayfind.layers.button"><Icon name="route" /> Bike lanes</MenuItem>
              <MenuItem id="wayfind.layers.satellite" type="menu_reveal" prereq="wayfind.layers.button"><Icon name="map" /> Satellite</MenuItem>
            </Dropdown>
          </div>

          <div className="group relative h-11">
            <button data-igg-id="wayfind.saved.button" data-igg-type="menu_reveal" onClick={() => setActiveMenu(activeMenu === "saved" ? null : "saved")} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50">
              <Icon name="star" />
            </button>
            <div className="absolute right-0 top-12 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg group-hover:opacity-100">Saved lists</div>
            <Dropdown open={activeMenu === "saved"} className="right-0">
              <MenuItem id="wayfind.saved.want-to-go" type="menu_reveal" prereq="wayfind.saved.button">Want to go</MenuItem>
              <MenuItem id="wayfind.saved.favorites" type="menu_reveal" prereq="wayfind.saved.button">Favorites</MenuItem>
            </Dropdown>
          </div>

          <button
            data-igg-id="wayfind.traffic.refresh"
            data-igg-type="async_wait"
            aria-disabled={!asyncReady ? "true" : undefined}
            className={cx("flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold shadow-md hover:bg-slate-50", !asyncReady ? "cursor-wait opacity-60 text-slate-400" : "text-slate-700")}
          >
            {asyncReady
              ? <>Update traffic</>
              : <><svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Updating</>}
          </button>
          <button className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-50">Export</button>
          <button className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-blue-600 shadow-md hover:bg-blue-50">Login</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside data-igg-id="wayfind.sidebar.scroll" className="flex w-[390px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
          <div className="bg-blue-600 px-5 pb-4 pt-5 text-white">
            <div className="flex items-center gap-3">
              <button data-igg-id="wayfind.sidebar.menu" className="rounded-md p-2 hover:bg-white/10">
                <span className="block h-0.5 w-5 bg-white" />
                <span className="mt-1.5 block h-0.5 w-5 bg-white" />
                <span className="mt-1.5 block h-0.5 w-5 bg-white" />
              </button>
              <div className="text-xl font-semibold tracking-tight">Wayfind</div>
              <button data-igg-id="wayfind.sidebar.local-search" className="ml-auto text-sm text-blue-100 hover:text-white">Search this map</button>
            </div>
            <button data-igg-id="wayfind.sidebar.search-box" className="mt-5 flex h-12 w-full items-center justify-between rounded-md bg-white px-4 text-left text-slate-500 shadow-sm">
              <span>Search places or addresses</span>
              <Icon name="search" />
            </button>
            <div className="mt-4 grid grid-cols-5 text-center text-sm font-medium">
              {["Search", "Route", "Bus", "Subway", "MY"].map((label, index) => (
                <button key={label} data-igg-id={`wayfind.sidebar.tab.${label.toLowerCase()}`} className={cx("rounded-md py-2 hover:bg-white/10", index === 0 && "bg-blue-700")}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-100 px-5 py-4">
            <div className="mb-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-semibold text-slate-900">Downtown waterfront</div>
                <div className="text-xs text-slate-400">Updated 10:24 AM</div>
              </div>
              <div className="mt-0.5 text-sm text-slate-500">Clear · 26° · Light traffic</div>
            </div>
            <div className="mb-3 text-sm font-semibold text-slate-900">Nearby</div>
            <div className="grid grid-cols-6 gap-3 text-center">
              {[
                ["Food", "food"],
                ["Cafe", "cafe"],
                ["Bus", "bus"],
                ["Subway", "train"],
                ["Hotel", "hotel"],
                ["Bank", "bank"],
              ].map(([label, icon]) => (
                <button key={label} data-igg-id={`wayfind.sidebar.nearby.${label.toLowerCase()}`} className="text-xs text-slate-500 hover:text-slate-900">
                  <span className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                    <Icon name={icon as IconName} />
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-800">{promo.title}</div>
                <div className="text-xs text-slate-500">{promo.label}</div>
              </div>
              <button data-igg-id={promo.target} data-igg-type={promo.target.includes("juniper") ? "auto_transition" : undefined} data-igg-wait-ms={promo.target.includes("juniper") ? "3600" : undefined} className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Open</button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {places.slice(0, 4).map(([name, meta, id], index) => (
              <div key={id} data-igg-id={`${id}.card`} className="group p-4 hover:bg-blue-50">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Icon name="pin" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{name}</div>
                    <div className="mt-1 text-sm text-slate-500">{meta}</div>
                    <div className="mt-3 flex gap-2">
                      <button data-igg-id={id} data-igg-type="hover_reveal" data-igg-prereq={`${id}.card`} className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white opacity-0 group-hover:opacity-100">Directions</button>
                      <button data-igg-id={`wayfind.place.${index}.save`} data-igg-type="hover_reveal" data-igg-prereq={`${id}.card`} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm opacity-0 group-hover:opacity-100">Save</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={middleRef} className="border-t border-slate-100">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">More nearby</div>
            <div className="divide-y divide-slate-100">
              {places.slice(4).map(([name, meta, id]) => (
                <div key={id} data-igg-id={`${id}.card`} className="group flex items-center gap-3 px-4 py-3 hover:bg-blue-50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Icon name="pin" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-xs text-slate-500">{meta}</div>
                  </div>
                  <button data-igg-id={id} data-igg-type="hover_reveal" data-igg-prereq={`${id}.card`} className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">Directions</button>
                </div>
              ))}
            </div>
          </div>

          <div ref={routeRef} className="border-t border-slate-100">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">Route stops</div>
            <div className="divide-y divide-slate-100">
              {routeStops.map(([name, hint, id]) => (
                <div key={id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-xs text-slate-500">{hint}</div>
                  </div>
                  <button data-igg-id={id} data-igg-type="drag_occlusion" className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Open</button>
                </div>
              ))}
            </div>
          </div>

          <div ref={bottomRef} className="border-t border-slate-100">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">Area info</div>
            <div className="divide-y divide-slate-100">
              {[
                ["Parking availability", "14 garages near waterfront", "wayfind.bottom.parking.open"],
                ["EV charging map", "8 stations available", "wayfind.bottom.ev.open"],
                ["Ferry terminal status", "Next departure in 22 min", "wayfind.bottom.ferry.open"],
                ["Accessible entrances", "All ramps updated today", "wayfind.bottom.accessible.open"],
                ["Night bus routes", "N14 and N22 until 2 AM", "wayfind.bottom.night-bus.open"],
                ["Bike repair stands", "5 stands near Harbor Bike", "wayfind.bottom.bike-repair.open"],
                ["Public restrooms", "11 locations, 4 open 24h", "wayfind.bottom.restrooms.open"],
                ["Weekend closures", "Harbor Road closed Sat–Sun", "wayfind.bottom.closures.open"],
                ["Bike parking map", "32 racks near transit stops", "wayfind.bottom.bike-parking.open"],
                ["Lost and found desk", "Open at North Pier terminal", "wayfind.bottom.lost-found.open"],
              ].map(([name, desc, id]) => (
                <div key={id} className="flex items-center justify-between px-4 py-3 hover:bg-blue-50">
                  <div>
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                  </div>
                  <button data-igg-id={id} data-igg-type="off_screen" className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Open</button>
                </div>
              ))}
            </div>
          </div>

          <div ref={footerRef} className="border-t border-slate-100 p-4">
            <div className="space-y-1 text-sm">
              {[
                ["Share or embed map", "wayfind.sidebar.share-map"],
                ["Add missing place", "wayfind.sidebar.add-place"],
                ["Edit the map", "wayfind.sidebar.edit-map"],
                ["Help and feedback", "wayfind.sidebar.help"],
              ].map(([label, id]) => (
                <button key={id} data-igg-id={id} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50">
                  <Icon name="map" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div
          className="map-grid relative min-h-0 flex-1 overflow-hidden bg-[#e8e0d5] cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMapMouseDown}
          onMouseMove={onMapMouseMove}
          onMouseUp={onMapMouseUp}
          onMouseLeave={onMapMouseUp}
        >
          {/* Pannable map container */}
          <div className="absolute" style={{ width: 2500, height: 1600, transform: `translate(${-mapPan.x}px, ${-mapPan.y}px)` }}>
          <svg width="2500" height="1600" viewBox="0 0 2500 1600">
            {/* Base land */}
            <rect width="2500" height="1600" fill="#e8e0d5" />

            {/* === WATER === */}
            {/* Main river — crosses full width */}
            <path d="M0 900 Q300 870 600 910 Q900 950 1200 920 Q1500 890 1800 930 Q2100 960 2500 940 L2500 1000 Q2100 1020 1800 990 Q1500 960 1200 980 Q900 1005 600 970 Q300 935 0 960 Z" fill="#a8c8e8" />
            <path d="M0 960 Q300 940 600 970 Q900 1000 1200 975 Q1500 950 1800 985 Q2100 1010 2500 995" fill="none" stroke="#90b8d8" strokeWidth="2" />
            {/* Harbor inlet — bottom right */}
            <path d="M1800 1600 Q1850 1400 1900 1200 Q1950 1050 2000 1000 Q2100 950 2200 980 Q2350 1020 2500 1000 L2500 1600 Z" fill="#a0c0e0" />
            <path d="M1800 1600 Q1860 1420 1910 1220 Q1960 1060 2010 1010" fill="none" stroke="#88b0d0" strokeWidth="2" />
            {/* Small pond — upper left */}
            <ellipse cx="200" cy="350" rx="70" ry="45" fill="#b8d8f0" />

            {/* === PARKS === */}
            {/* Large park — upper left (Riverside Park) */}
            <ellipse cx="280" cy="220" rx="220" ry="140" fill="#b8d4a0" />
            <ellipse cx="275" cy="215" rx="190" ry="118" fill="#c4dca8" />
            {[[200,165],[240,155],[285,162],[320,178],[340,200],[305,218],[270,228],[235,220],[205,200],[260,185],[300,195]].map(([x,y],i) => <circle key={`pt1-${i}`} cx={x} cy={y} r="10" fill="#9ac484" />)}
            <text x="275" y="215" fontSize="11" fill="#5a8a4a" fontFamily="sans-serif" textAnchor="middle" fontWeight="500">Riverside Park</text>

            {/* Medium park — center */}
            <rect x="980" y="500" width="140" height="100" rx="12" fill="#c8deb0" />
            {[[1000,520],[1030,515],[1060,522],[1090,530],[1080,545],[1050,552],[1020,548],[1000,538]].map(([x,y],i) => <circle key={`pt2-${i}`} cx={x} cy={y} r="8" fill="#9ac484" />)}
            <text x="1050" y="558" fontSize="9" fill="#5a8a4a" fontFamily="sans-serif" textAnchor="middle">Garden Sq</text>

            {/* Harbor park — bottom right */}
            <ellipse cx="1650" cy="1350" rx="160" ry="110" fill="#b8d4a0" />
            <ellipse cx="1648" cy="1348" rx="135" ry="90" fill="#c4dca8" />
            {[[1580,1310],[1620,1300],[1660,1308],[1695,1322],[1710,1345],[1680,1365],[1645,1375],[1610,1368],[1582,1348]].map(([x,y],i) => <circle key={`pt3-${i}`} cx={x} cy={y} r="9" fill="#9ac484" />)}
            <text x="1650" y="1350" fontSize="10" fill="#5a8a4a" fontFamily="sans-serif" textAnchor="middle">Harbor Park</text>

            {/* Small park top right */}
            <ellipse cx="2100" cy="280" rx="120" ry="80" fill="#c4dca8" />
            {[[2040,255],[2080,248],[2115,254],[2145,268],[2155,288],[2125,300],[2090,306],[2058,295]].map(([x,y],i) => <circle key={`pt4-${i}`} cx={x} cy={y} r="8" fill="#9ac484" />)}
            <text x="2100" y="282" fontSize="9" fill="#5a8a4a" fontFamily="sans-serif" textAnchor="middle">Eastview Park</text>

            {/* === CITY BLOCKS === */}
            {/* Dense center grid */}
            {Array.from({length:14},(_,col) => Array.from({length:9},(_,row) => (
              <rect key={`bc-${col}-${row}`} x={620+col*76} y={120+row*78} width="64" height="66" rx="3" fill="#ede8e0" stroke="#d8d0c4" strokeWidth="0.6" />
            )))}
            {/* Upper left grid (lighter/residential) */}
            {Array.from({length:6},(_,col) => Array.from({length:5},(_,row) => (
              <rect key={`bul-${col}-${row}`} x={540+col*68} y={80+row*70} width="56" height="58" rx="3" fill="#f0ece6" stroke="#dcd4c8" strokeWidth="0.5" />
            )))}
            {/* Right side blocks */}
            {Array.from({length:8},(_,col) => Array.from({length:7},(_,row) => (
              <rect key={`br2-${col}-${row}`} x={1700+col*72} y={80+row*76} width="60" height="63" rx="3" fill="#ede8e0" stroke="#d8d0c4" strokeWidth="0.6" />
            )))}
            {/* Far right sparse */}
            {Array.from({length:5},(_,col) => Array.from({length:4},(_,row) => (
              <rect key={`bfr-${col}-${row}`} x={2130+col*64} y={400+row*85} width="52" height="72" rx="3" fill="#f0ece6" stroke="#dcd4c8" strokeWidth="0.5" />
            )))}
            {/* Lower center */}
            {Array.from({length:10},(_,col) => Array.from({length:4},(_,row) => (
              <rect key={`blc-${col}-${row}`} x={700+col*74} y={1060+row*72} width="62" height="60" rx="3" fill="#ede8e0" stroke="#d8d0c4" strokeWidth="0.6" />
            )))}
            {/* Industrial / warehouse blocks — far left */}
            {Array.from({length:4},(_,col) => Array.from({length:3},(_,row) => (
              <rect key={`bi-${col}-${row}`} x={60+col*110} y={650+row*100} width="95" height="85" rx="4" fill="#e4e0d8" stroke="#ccc8c0" strokeWidth="0.8" />
            )))}

            {/* === MAJOR ROADS === */}
            {/* East-West arterials */}
            {[680, 820, 960].map(y => (
              <g key={`major-h-${y}`}>
                <line x1="0" y1={y} x2="2500" y2={y} stroke="#fff" strokeWidth="10" />
                <line x1="0" y1={y} x2="2500" y2={y} stroke="#f0ebe3" strokeWidth="7" />
              </g>
            ))}
            {/* North-South arterials */}
            {[850, 1150, 1500].map(x => (
              <g key={`major-v-${x}`}>
                <line x1={x} y1="0" x2={x} y2="1600" stroke="#fff" strokeWidth="10" />
                <line x1={x} y1="0" x2={x} y2="1600" stroke="#f0ebe3" strokeWidth="7" />
              </g>
            ))}
            {/* Diagonal boulevard */}
            <line x1="400" y1="0" x2="1600" y2="1600" stroke="#fff" strokeWidth="9" />
            <line x1="400" y1="0" x2="1600" y2="1600" stroke="#f0ebe3" strokeWidth="6" />
            {/* Coastal highway */}
            <path d="M0 830 Q400 810 800 820 Q1100 826 1400 810 Q1700 795 2000 815 Q2250 830 2500 820" fill="none" stroke="#fff" strokeWidth="11" />
            <path d="M0 830 Q400 810 800 820 Q1100 826 1400 810 Q1700 795 2000 815 Q2250 830 2500 820" fill="none" stroke="#f0ebe3" strokeWidth="8" />

            {/* === SECONDARY ROADS === */}
            {[180,280,380,480,560,620,740,880,1000,1080,1200,1300,1420].map(y => (
              <line key={`sy-${y}`} x1="0" y1={y} x2="2500" y2={y} stroke="#f5f0e8" strokeWidth="4" />
            ))}
            {[160,340,520,700,1020,1200,1360,1680,1860,2040,2200,2380].map(x => (
              <line key={`sx-${x}`} x1={x} y1="0" x2={x} y2="1600" stroke="#f5f0e8" strokeWidth="4" />
            ))}

            {/* === MINOR STREETS === */}
            {[120,155,210,245,310,345,440,475,600,635,785,870,915,1040,1120,1165,1240,1325,1380,1455,1500,1540].map(y => (
              <line key={`my-${y}`} x1="0" y1={y} x2="2500" y2={y} stroke="#f0ece4" strokeWidth="2" />
            ))}
            {[80,120,240,280,420,460,580,620,760,800,940,980,1100,1140,1280,1320,1440,1480,1580,1620,1740,1780,1900,1940,2060,2100,2260,2300,2420].map(x => (
              <line key={`mx-${x}`} x1={x} y1="0" x2={x} y2="1600" stroke="#f0ece4" strokeWidth="2" />
            ))}

            {/* === TRANSIT LINE === */}
            <path d="M0 750 Q300 740 600 748 Q900 756 1150 740 Q1400 724 1700 735 Q2000 746 2500 730" fill="none" stroke="#4a90d9" strokeWidth="4" strokeDasharray="10 4" opacity="0.75" />
            {/* Transit stations */}
            {[[420,748],[850,752],[1150,740],[1500,732],[1850,740]].map(([x,y],i) => (
              <circle key={`ts-${i}`} cx={x} cy={y} r="7" fill="#fff" stroke="#4a90d9" strokeWidth="2.5" />
            ))}

            {/* === ROUNDABOUTS === */}
            <circle cx="850" cy="680" r="28" fill="#f0ebe3" stroke="#e0d8cc" strokeWidth="2" />
            <circle cx="850" cy="680" r="16" fill="#d8d0c4" />
            <circle cx="1150" cy="820" r="24" fill="#f0ebe3" stroke="#e0d8cc" strokeWidth="2" />
            <circle cx="1150" cy="820" r="14" fill="#d8d0c4" />
            <circle cx="1500" cy="680" r="24" fill="#f0ebe3" stroke="#e0d8cc" strokeWidth="2" />
            <circle cx="1500" cy="680" r="14" fill="#d8d0c4" />

            {/* === ROAD LABELS === */}
            <text x="500" y="672" fontSize="11" fill="#888" fontFamily="sans-serif" textAnchor="middle">Harbor Rd</text>
            <text x="1200" y="672" fontSize="11" fill="#888" fontFamily="sans-serif" textAnchor="middle">Waterfront Blvd</text>
            <text x="2000" y="672" fontSize="11" fill="#888" fontFamily="sans-serif" textAnchor="middle">East Harbor Dr</text>
            <text x="843" y="350" fontSize="11" fill="#888" fontFamily="sans-serif" transform="rotate(90,843,350)">Pier St</text>
            <text x="843" y="1100" fontSize="11" fill="#888" fontFamily="sans-serif" transform="rotate(90,843,1100)">Pier St</text>
            <text x="1143" y="450" fontSize="11" fill="#888" fontFamily="sans-serif" transform="rotate(90,1143,450)">Canal Rd</text>
            <text x="1493" y="350" fontSize="11" fill="#888" fontFamily="sans-serif" transform="rotate(90,1493,350)">Harbor Ave</text>
            <text x="650" y="130" fontSize="10" fill="#999" fontFamily="sans-serif">Greenway Path</text>
            <text x="1700" y="130" fontSize="10" fill="#999" fontFamily="sans-serif">North Pier Rd</text>

            {/* === WATER LABELS === */}
            <text x="900" y="948" fontSize="14" fill="#6090b0" fontFamily="sans-serif" fontStyle="italic">Harborway Channel</text>
            <text x="2150" y="1280" fontSize="12" fill="#6090b0" fontFamily="sans-serif" fontStyle="italic" transform="rotate(-70,2150,1280)">Harbor Inlet</text>

            {/* === TRANSIT LABEL === */}
            <text x="600" y="740" fontSize="10" fill="#4a90d9" fontFamily="sans-serif">Blue Line</text>

            {/* === SCALE BAR === */}
            <rect x="40" y="1570" width="120" height="4" fill="#888" />
            <text x="40" y="1564" fontSize="10" fill="#888" fontFamily="sans-serif">500 m</text>
          </svg>
          </div>
          {[
            ["Moss & Maple",     "wayfind.map.pin.moss-maple",       370,  295],
            ["Atlas Pharmacy",   "wayfind.map.pin.atlas-pharmacy",   190,  560],
            ["Harbor Bike",      "wayfind.map.pin.harbor-bike",      630,  840],
            ["Garden Square",    "wayfind.map.pin.garden-sq",        1010, 490],
            ["Juniper Market",   "wayfind.map.pin.juniper-market",   1090, 720],
            ["Blue Line",        "wayfind.map.pin.blue-line",        1500, 740],
            ["Riverfront Hotel", "wayfind.map.pin.riverfront-hotel", 1310, 880],
            ["Civic Library",    "wayfind.map.pin.civic-library",    1840, 360],
            ["North Pier",       "wayfind.map.pin.north-pier",       2170, 580],
            ["Eastview Park",    "wayfind.map.pin.eastview-park",    2080, 240],
            ["West Gate",        "wayfind.map.pin.west-gate",        70,   260],
            ["South Marina",     "wayfind.map.pin.south-marina",     1380, 1180],
          ].map(([label, id, svgX, svgY]) => {
            const active = selectedPin?.id === id;
            return (
              <button
                key={id as string}
                data-igg-id={id}
                data-igg-type="popup_occlusion"
                onClick={() => setSelectedPin(active ? null : { id: id as string, svgX: svgX as number, svgY: svgY as number })}
                className={cx("absolute z-10 flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg transition-colors", active ? "bg-blue-600 text-white" : "bg-white text-blue-700 hover:bg-blue-600 hover:text-white")}
                style={{ left: (svgX as number) - mapPan.x, top: (svgY as number) - mapPan.y }}
              >
                <Icon name="pin" /> {label as string}
              </button>
            );
          })}
          {selectedPin && (() => {
            const detail = pinDetails[selectedPin.id];
            if (!detail) return null;
            const screenX = selectedPin.svgX - mapPan.x;
            const screenY = selectedPin.svgY - mapPan.y;
            return (
              <div
                className="absolute z-20 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl"
                style={{ left: screenX + 10, top: Math.max(8, screenY - 180) }}
              >
                <div className="flex items-start justify-between p-4 pb-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">{detail.category}</div>
                    <div className="mt-0.5 text-base font-bold text-slate-800 leading-tight">{detail.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-amber-500">★ {detail.rating}</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">{detail.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPin(null)} className="shrink-0 rounded-full p-1 hover:bg-slate-100"><Icon name="x" /></button>
                </div>
                <div className="px-4 pb-3 text-sm text-slate-600">{detail.desc}</div>
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {detail.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-slate-100 p-3">
                  <button data-igg-id={`${selectedPin.id}.directions`} className="flex-1 rounded-full bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700">Directions</button>
                  <button data-igg-id={`${selectedPin.id}.save`} className="flex-1 rounded-full border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Save</button>
                </div>
              </div>
            );
          })()}
          <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
            <Button id="wayfind.map.zoom-in" type="popup_occlusion">+</Button>
            <Button id="wayfind.map.zoom-out" type="popup_occlusion">-</Button>
          </div>
        </div>
      </div>


      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[470px] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Use your current location?</h2>
                <p className="mt-2 text-sm text-slate-500">Wayfind can show nearby places and faster routes.</p>
              </div>
              <button data-igg-id="wayfind.popup.close" onClick={() => setPopupOpen(false)} className="rounded-md p-2 hover:bg-slate-100"><Icon name="x" /></button>
            </div>
            <button data-igg-id="wayfind.popup.allow" onClick={() => setPopupOpen(false)} className="mt-5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">Allow location</button>
          </div>
        </div>
      )}

      {uiState.routePanelOpen && (
        <div
          data-igg-id="wayfind.route.blocker"
          onMouseDown={panel.onMouseDown}
          className="fixed z-40 w-[380px] cursor-grab rounded-2xl border border-slate-200 bg-white shadow-2xl active:cursor-grabbing"
          style={{ left: panel.pos.x, top: panel.pos.y }}
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 font-semibold"><Icon name="drag" /> Route options</div>
            <span className="text-xs text-slate-500">Drag panel</span>
          </div>
          <div className="p-4 text-sm text-slate-600">
            <p>Fastest route: 18 min by transit, transfer at Blue Line Station.</p>
            <div className="mt-3 rounded-xl bg-blue-50 p-3">Avoiding Harbor Road construction saves 6 minutes.</div>
          </div>
        </div>
      )}
    </main>
  );
}
