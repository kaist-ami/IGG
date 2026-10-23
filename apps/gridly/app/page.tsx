"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getGridlyBenchmarkState, type GridlyBenchmarkState } from "./gridly-states";

declare global {
  interface Window {
    __GRIDLY_BENCHMARK_STATE__?: GridlyBenchmarkState;
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
  runtimeStateKey: "__GRIDLY_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
const columnLetters = Array.from({ length: 13 }, (_, index) => String.fromCharCode(65 + index));
const defaultColumnWidths = [44, 98, 134, 142, 52, 92, 190, 176, 104, 96, 128, 128, 520];
const narrowColumnWidths = [44, 98, 44, 142, 52, 92, 190, 176, 104, 96, 128, 128, 520];
const defaultRowHeight = 29;

function Icon({ name }: { name: "sheet" | "search" | "plus" | "chev" | "filter" | "share" | "x" | "chart" | "refresh" | "drag" | "check" | "star" | "cloud" | "print" | "undo" | "video" | "sparkle" }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    sheet: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M10 3v18" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chev: <path d="m8 10 4 4 4-4" />,
    filter: <><path d="M3 5h18" /><path d="M6 12h12" /><path d="M10 19h4" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" /><rect x="12" y="7" width="3" height="9" /><rect x="17" y="9" width="3" height="7" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.9-4" /><path d="M4 5v5h5" /><path d="M4 13a8 8 0 0 0 14.9 4" /><path d="M20 19v-5h-5" /></>,
    drag: <><path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    star: <polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 9 8.5 12 2" />,
    cloud: <><path d="M17.5 19H8a5 5 0 0 1-.7-9.9A7 7 0 0 1 20 12.3 3.5 3.5 0 0 1 17.5 19z" /></>,
    print: <><path d="M7 8V3h10v5" /><path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M7 14h10v7H7z" /></>,
    undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-2" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
    sparkle: <><path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8L12 3z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

type Menu = "file" | "insert" | "filter" | "sheet" | null;

function Button({ id, type, prereq, label, children, className, onClick, disabled }: { id: string; type?: string; prereq?: string; label?: string; children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      data-igg-label={label}
      aria-disabled={disabled ? "true" : undefined}
      onClick={disabled ? undefined : onClick}
      className={cx("inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50", disabled && "cursor-wait opacity-55", className)}
    >
      {children}
    </button>
  );
}

function Dropdown({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return <div className={cx("absolute z-40 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl", className)}>{children}</div>;
}

function MenuItem({ id, type, prereq, children, className }: { id: string; type?: string; prereq?: string; children: React.ReactNode; className?: string }) {
  return (
    <button data-igg-id={id} data-igg-type={type} data-igg-prereq={prereq} className={cx("flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-emerald-600 hover:text-white", className)}>
      {children}
    </button>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return <span className={cx("h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}


const sheetHeaders = [
  "Region",
  "Segment",
  "Account",
  "Stage",
  "Commit?",
  "Owner",
  "Product Mix",
  "Forecast Basis",
  "Weighted ARR",
  "Close %",
  "Next Step",
  "Source Link",
  "Notes",
] as const;

const rows = [
  ["AMER", "Enterprise", "Northwind Health", "Commit", "✔", "Mina Park", "Platform + AI", "Renewal baseline", "$428,000", "92", "Legal redlines", "deal/northwind", "Expansion SKU approved; finance wants invoice split."],
  ["AMER", "Mid-market", "Acme Retail", "Best case", "✗", "Oliver Chen", "Analytics", "Manager judgment", "$182,000", "68", "Security review", "deal/acme-retail", "Champion changed teams; keep downside case visible."],
  ["APAC", "Enterprise", "Kairo Labs", "Commit", "✔", "Sofia Kim", "Platform", "Weighted pipeline", "$734,000", "81", "Procurement packet", "deal/kairo-labs", "Regional VP requested board-level reference call."],
  ["EMEA", "Strategic", "Bluepeak Energy", "Commit", "✔", "Noah Reed", "AI + Support", "Renewal baseline", "$291,000", "74", "Finalize order form", "deal/bluepeak", "Usage trend supports premium support attach."],
  ["AMER", "SMB", "Evergreen Foods", "Risk", "✗", "Priya Shah", "Core seats", "Churn model", "$126,000", "35", "Exec escalation", "deal/evergreen", "Needs save plan; open P1 support issue affects timing."],
  ["EMEA", "Enterprise", "Helio Bank", "Best case", "✔", "Mateo Ruiz", "Security suite", "Pilot conversion", "$549,000", "88", "Vendor checklist", "deal/helio-bank", "Legal requires updated DPA before signature."],
  ["APAC", "Mid-market", "Maple Foods", "Pipeline", "✗", "Iris Chen", "Analytics", "Weighted pipeline", "$337,500", "63", "Pricing approval", "deal/maple-foods", "Discount exception sits with revenue desk."],
  ["AMER", "Media", "Orbit Media", "Commit", "✔", "Leah Martin", "Platform + AI", "Renewal baseline", "$214,000", "78", "Mutual close plan", "deal/orbit-media", "Customer asked for additional admin training."],
  ["EMEA", "Public Sector", "CivicGrid", "Best case", "✗", "Theo Grant", "Compliance", "Manager judgment", "$318,000", "59", "Budget confirmation", "deal/civicgrid", "Procurement window closes before quarter end."],
  ["APAC", "Enterprise", "Sunrise Robotics", "Commit", "✔", "Jules Martin", "Automation", "Usage model", "$462,000", "84", "Implementation plan", "deal/sunrise", "Expansion depends on sandbox performance report."],
  ["AMER", "Strategic", "Aperture Labs", "Commit", "✔", "Nadia Park", "Full suite", "Weighted pipeline", "$980,000", "89", "Board approval", "deal/aperture", "CFO aligned; board approval scheduled Friday."],
  ["EMEA", "Mid-market", "Canary Supply", "Pipeline", "✗", "Rosa Kim", "Core seats", "Inbound forecast", "$96,000", "42", "Discovery recap", "deal/canary", "Low confidence until technical buyer is identified."],
  ["AMER", "Enterprise", "Redwood Cloud", "Best case", "✔", "Kai Nakamura", "Platform", "Renewal baseline", "$603,000", "71", "SOW review", "deal/redwood", "Professional services scope is the blocker."],
  ["APAC", "Strategic", "Ninefold Games", "Risk", "✗", "Evan Brooks", "AI + Analytics", "Churn model", "$255,000", "38", "Usage recovery", "deal/ninefold", "Usage dropped after migration; CS owner assigned."],
  ["EMEA", "Enterprise", "Vector Rail", "Commit", "✔", "Maya Singh", "Compliance", "Weighted pipeline", "$512,000", "82", "Security appendix", "deal/vector-rail", "Security team approved architecture diagram."],
  ["AMER", "Healthcare", "Meridian Care", "Best case", "✗", "Lena Ortiz", "Platform + Support", "Manager judgment", "$377,000", "66", "Contract language", "deal/meridian", "Indemnity clause needs counsel review."],
  ["APAC", "SMB", "BrightCart", "Pipeline", "✗", "Dae Kim", "Core seats", "Inbound forecast", "$74,000", "47", "Trial activation", "deal/brightcart", "Trial has strong adoption but no economic buyer yet."],
  ["EMEA", "Strategic", "Northstar Telco", "Commit", "✔", "Amara Cole", "Full suite", "Usage model", "$870,000", "86", "Migration plan", "deal/northstar", "Migration budget already reserved."],
  ["AMER", "Enterprise", "Silverline Auto", "Pipeline", "✗", "Owen Miller", "Analytics", "Weighted pipeline", "$205,000", "52", "Champion map", "deal/silverline", "Second stakeholder meeting not scheduled."],
  ["APAC", "Enterprise", "Horizon Bio", "Best case", "✔", "Tara Singh", "AI + Compliance", "Pilot conversion", "$442,000", "76", "Pilot readout", "deal/horizon-bio", "Pilot readout shows 31% reduction in manual review."],
  ["EMEA", "Mid-market", "Fjord Studio", "Risk", "✗", "Iris Chen", "Core seats", "Churn model", "$88,000", "29", "Save offer", "deal/fjord", "Competitor procurement opened last week."],
  ["AMER", "Public Sector", "MetroWorks", "Commit", "✔", "Noah Reed", "Compliance", "Renewal baseline", "$330,000", "79", "Budget memo", "deal/metroworks", "Budget memo prepared; waiting on department lead."],
  ["APAC", "Strategic", "Lotus Freight", "Best case", "✔", "Sofia Kim", "Automation", "Manager judgment", "$620,000", "73", "Ops validation", "deal/lotus", "Operations sponsor wants benchmark appendix."],
  ["EMEA", "Enterprise", "Atlas Mining", "Pipeline", "✗", "Mateo Ruiz", "Platform", "Weighted pipeline", "$418,000", "58", "Site visit", "deal/atlas", "Site visit moved into final week of quarter."],
  ["AMER", "SMB", "Pinecone Dental", "Pipeline", "✗", "Leah Martin", "Core seats", "Inbound forecast", "$41,000", "44", "Decision call", "deal/pinecone", "Owner requested monthly payment terms."],
  ["APAC", "Media", "Waveform TV", "Commit", "✔", "Jules Martin", "Analytics + AI", "Usage model", "$298,000", "83", "Renewal quote", "deal/waveform", "Renewal quote accepted pending procurement ID."],
  ["EMEA", "Healthcare", "Greenfield Clinics", "Best case", "✗", "Rosa Kim", "Security suite", "Pilot conversion", "$267,000", "61", "DPA review", "deal/greenfield", "Data residency question escalated to solutions."],
  ["AMER", "Strategic", "Summit Capital", "Commit", "✔", "Nadia Park", "Full suite", "Renewal baseline", "$1,120,000", "91", "Signature routing", "deal/summit", "Signature routing through parent company."],
  ["APAC", "Mid-market", "Harbor Retail", "Risk", "✗", "Dae Kim", "Analytics", "Churn model", "$139,000", "33", "Executive sponsor", "deal/harbor", "Usage concentration risk in one department."],
  ["EMEA", "Public Sector", "BoroughNet", "Pipeline", "✗", "Maya Singh", "Compliance", "Manager judgment", "$221,000", "50", "RFP response", "deal/boroughnet", "RFP response due next Monday."],
  ["AMER", "Enterprise", "Cobalt Systems", "Best case", "✔", "Kai Nakamura", "Platform + AI", "Weighted pipeline", "$585,000", "77", "Technical close", "deal/cobalt", "Technical close plan shared with SE team."],
  ["APAC", "Enterprise", "Zenith Motors", "Commit", "✔", "Tara Singh", "Automation", "Usage model", "$690,000", "85", "Procurement PO", "deal/zenith", "Procurement requested revised payment schedule."],
  ["EMEA", "SMB", "Copperline", "Pipeline", "✗", "Owen Miller", "Core seats", "Inbound forecast", "$58,000", "41", "Trial workshop", "deal/copperline", "Trial workshop scheduled but low attendance risk."],
  ["AMER", "Media", "Beacon News", "Commit", "✔", "Mina Park", "Analytics", "Renewal baseline", "$176,000", "80", "Content policy", "deal/beacon", "Policy review complete; awaiting procurement queue."],
  ["APAC", "Healthcare", "Mosaic Health", "Best case", "✗", "Amara Cole", "Compliance + AI", "Pilot conversion", "$351,000", "69", "Clinical sponsor", "deal/mosaic", "Clinical sponsor asked for workflow comparison."],
  ["EMEA", "Enterprise", "Ironwood Cloud", "Risk", "✗", "Theo Grant", "Platform", "Churn model", "$309,000", "36", "Retention plan", "deal/ironwood", "Delayed rollout has lowered renewal confidence."],
  ["AMER", "Strategic", "Quantum Freight", "Commit", "✔", "Priya Shah", "Full suite", "Weighted pipeline", "$940,000", "87", "Final approval", "deal/quantum", "CEO sponsor confirmed target go-live date."],
] as const;

const auditRows = [
  ["A42", "Revenue variance", "=IFERROR(VLOOKUP(account_id, assumptions, 4), 0)", "gridly.audit.revenue.review"],
  ["B42", "Discount formula", "=IF(D42>0.8, C42*0.92, C42*Forecast!B7)", "gridly.audit.discount.review"],
  ["C42", "Forecast delta", "=SUMIF(Forecast!A:A, A42, Forecast!C:C)-C42", "gridly.audit.forecast.review"],
  ["D42", "Owner capacity", "=COUNTIF(owners, E42)/Assumptions!C3", "gridly.audit.capacity.review"],
  ["E42", "Close date risk", "=NETWORKDAYS(TODAY(), F42, holidays!A:A)", "gridly.audit.close-date.review"],
] as const;

const dashboards = [
  ["Revenue Dashboard", "Pipeline by segment and owner", "gridly.dashboards.revenue.open"],
  ["Forecast Model", "Weighted commit and best case scenarios", "gridly.dashboards.forecast.open"],
  ["Renewal Tracker", "Quarterly renewal health", "gridly.dashboards.renewal.open"],
  ["Partner Scorecard", "Co-sell activity and SLA trends", "gridly.dashboards.partner.open"],
  ["Support Load", "Escalations by account tier", "gridly.dashboards.support.open"],
  ["Executive Summary", "Board-ready narrative and charts", "gridly.dashboards.executive.open"],
  ["Security Exceptions", "Pending approvals and owners", "gridly.dashboards.security.open"],
  ["Capacity Plan", "Hiring plan and territory pressure", "gridly.dashboards.capacity.open"],
] as const;

const insightSlides = [
  { label: "Pipeline insight", title: "Enterprise expansion is above plan", target: "gridly.insight.enterprise.open" },
  { label: "Risk insight", title: "Procurement delays need attention", target: "gridly.insight.procurement.open" },
  { label: "Board insight", title: "Gross retention summary is ready", target: "gridly.insight.retention.open" },
];

const cellDropdownOptions: Record<number, string[]> = {
  3: ["Commit", "Best case", "Pipeline", "Risk"],
  4: ["✔", "✗"],
  5: ["Mina Park", "Oliver Chen", "Sofia Kim", "Noah Reed", "Priya Shah", "Mateo Ruiz", "Nadia Park", "Tara Singh"],
  7: ["Renewal baseline", "Weighted pipeline", "Manager judgment", "Pilot conversion", "Usage model", "Churn model", "Inbound forecast"],
  10: ["Legal redlines", "Security review", "Procurement packet", "Pricing approval", "Exec escalation", "Board approval", "Final approval"],
};

function slugifyCellOption(value: string) {
  return value.toLowerCase().replace("✔", "yes").replace("✗", "no").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function SheetCell({ value, columnIndex }: { value: string; columnIndex: number }) {
  if (columnIndex === 2 || columnIndex === 11 || value.startsWith("deal/")) {
    return <span className="truncate font-medium text-[#1155cc] underline underline-offset-2">{value}</span>;
  }
  if (columnIndex === 3) {
    const stageClass =
      value === "Commit" ? "bg-[#b7e1cd] text-[#0b8043]" :
      value === "Best case" ? "bg-[#cfe2f3] text-[#174ea6]" :
      value === "Risk" ? "bg-[#f4cccc] text-[#a61c00]" :
      "bg-[#ffe599] text-[#5f4212]";
    return <span className={cx("inline-flex h-5 min-w-[104px] items-center rounded-full px-2", stageClass)}>{value}</span>;
  }
  if (columnIndex === 4) {
    return <span className={cx("grid h-6 w-full place-items-center", value === "✔" ? "bg-[#b7e1cd] text-[#0b8043]" : "bg-[#e6e6e6] text-[#555]")}>{value}</span>;
  }
  if (columnIndex === 7) {
    return (
      <span className={cx(
        "inline-flex h-5 min-w-[132px] items-center rounded-full px-2 font-medium",
        value.includes("Renewal") ? "bg-[#b7e1a1] text-[#137333]" :
        value.includes("Churn") ? "bg-[#f4cccc] text-[#a61c00]" :
        value.includes("Pilot") ? "bg-[#d9c2e9] text-[#674ea7]" :
        value.includes("Usage") ? "bg-[#cfe2f3] text-[#174ea6]" :
        "bg-[#ffe599] text-[#5f4212]",
      )}>
        {value}
      </span>
    );
  }
  if (columnIndex === 8 || columnIndex === 9) {
    return <span className="block text-right tabular-nums">{value}</span>;
  }
  if (columnIndex === 10 && value) {
    return <span className="inline-flex max-w-full truncate rounded-full bg-[#eeeeee] px-2 text-[#3c4043]">{value}</span>;
  }
  if (columnIndex === 12 && value) {
    return <span className="truncate">{value}</span>;
  }
  return <span className="truncate">{value}</span>;
}

function GridlyPage() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getGridlyBenchmarkState(stateId), [stateId]);
  const [uiState, setUiState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState<Menu>(initialState.fileMenuOpen ? "file" : initialState.insertMenuOpen ? "insert" : initialState.filterMenuOpen ? "filter" : initialState.sheetMenuOpen ? "sheet" : null);
  const [searchOpen, setSearchOpen] = useState(initialState.searchOpen);
  const [popupOpen, setPopupOpen] = useState(initialState.popupOpen);
  const [exportDialog, setExportDialog] = useState(initialState.exportDialog);
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [slideIndex, setSlideIndex] = useState(initialState.insightSlide);
  const [slideTimerReset, setSlideTimerReset] = useState(0);
  const [activeCellDropdown, setActiveCellDropdown] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState(initialState.narrowColumns ? narrowColumnWidths : defaultColumnWidths);
  const [rowHeights, setRowHeights] = useState(() => rows.map(() => defaultRowHeight));
  const resizeDrag = useRef<
    | { kind: "column"; index: number; startX: number; startWidth: number }
    | { kind: "row"; index: number; startY: number; startHeight: number }
    | null
  >(null);
  const horizontalDrag = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const middleRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const sheetScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(initialState.fileMenuOpen ? "file" : initialState.insertMenuOpen ? "insert" : initialState.filterMenuOpen ? "filter" : initialState.sheetMenuOpen ? "sheet" : null);
    setSearchOpen(initialState.searchOpen);
    setPopupOpen(initialState.popupOpen);
    setExportDialog(initialState.exportDialog);
    setAsyncReady(initialState.asyncDelayMs === null);
    setSlideIndex(initialState.insightSlide);
    setSlideTimerReset(0);
    setActiveCellDropdown(null);
    setColumnWidths(initialState.narrowColumns ? narrowColumnWidths : defaultColumnWidths);
  }, [initialState]);

  useEffect(() => {
    function move(event: MouseEvent) {
      if (horizontalDrag.current && sheetScrollRef.current) {
        const deltaX = event.clientX - horizontalDrag.current.startX;
        sheetScrollRef.current.scrollLeft = horizontalDrag.current.startScrollLeft + deltaX * 1.25;
        return;
      }
      if (!resizeDrag.current) return;
      if (resizeDrag.current.kind === "column") {
        const { index, startX, startWidth } = resizeDrag.current;
        setColumnWidths((current) => current.map((width, colIndex) => (
          colIndex === index ? Math.max(44, Math.min(720, startWidth + event.clientX - startX)) : width
        )));
      } else {
        const { index, startY, startHeight } = resizeDrag.current;
        setRowHeights((current) => current.map((height, rowIndex) => (
          rowIndex === index ? Math.max(24, Math.min(120, startHeight + event.clientY - startY)) : height
        )));
      }
    }
    function up() {
      resizeDrag.current = null;
      horizontalDrag.current = null;
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, []);

  useEffect(() => { window.__GRIDLY_BENCHMARK_STATE__ = uiState; }, [uiState]);
  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __GRIDLY_BENCHMARK_STATE__?: Record<string, unknown> }).__GRIDLY_BENCHMARK_STATE__ ?? null;
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
  }, [uiState.scrollTarget]);
  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const timer = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.asyncDelayMs]);
  useEffect(() => {
    if (uiState.autoBannerDelayMs === null) return;
    const timer = window.setTimeout(() => setSlideIndex((value) => (value + 1) % insightSlides.length), uiState.autoBannerDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.autoBannerDelayMs, slideIndex, slideTimerReset]);

  const slide = insightSlides[slideIndex];
  const gridTemplateColumns = `44px ${columnWidths.map((width) => `${width}px`).join(" ")}`;
  const sheetMinWidth = 44 + columnWidths.reduce((sum, width) => sum + width, 0);
  const asyncPending = uiState.asyncDelayMs !== null && !asyncReady;
  const asyncTarget = uiState.asyncTarget;
  const exportType = exportDialog ?? uiState.exportDialog;
  const isAsyncTarget = (target: NonNullable<GridlyBenchmarkState["asyncTarget"]>) => asyncTarget === target;
  const targetPending = (target: NonNullable<GridlyBenchmarkState["asyncTarget"]>) => asyncPending && isAsyncTarget(target);
  const targetReady = (target: NonNullable<GridlyBenchmarkState["asyncTarget"]>) => uiState.asyncDelayMs !== null && asyncReady && isAsyncTarget(target);
  const statusText = (() => {
    if (!asyncTarget) return "Last edit was seconds ago";
    if (asyncReady) {
      const ready: Record<NonNullable<GridlyBenchmarkState["asyncTarget"]>, string> = {
        refresh: "Refresh ready",
        meet: "Meet link ready",
        share: "Sharing ready",
        pdf: "PDF export ready",
        csv: "CSV export ready",
      };
      return ready[asyncTarget];
    }
    const pending: Record<NonNullable<GridlyBenchmarkState["asyncTarget"]>, string> = {
      refresh: "Refreshing data...",
      meet: "Preparing Meet link...",
      share: "Loading share settings...",
      pdf: "Generating PDF export...",
      csv: "Generating CSV export...",
    };
    return pending[asyncTarget];
  })();

  function selectInsightSlide(index: number) {
    setSlideIndex(index);
    setSlideTimerReset((value) => value + 1);
  }

  function startColumnResize(index: number, event: React.MouseEvent) {
    event.preventDefault();
    resizeDrag.current = { kind: "column", index, startX: event.clientX, startWidth: columnWidths[index] };
  }

  function startRowResize(index: number, event: React.MouseEvent) {
    event.preventDefault();
    resizeDrag.current = { kind: "row", index, startY: event.clientY, startHeight: rowHeights[index] };
  }

  function startHorizontalSheetDrag(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const startedOnScrollbarBand = event.clientY >= rect.bottom - 30;
    if (!startedOnScrollbarBand || target.scrollWidth <= target.clientWidth) return;
    event.preventDefault();
    horizontalDrag.current = { startX: event.clientX, startScrollLeft: target.scrollLeft };
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#edf2f7] text-[#202124]">
      <header className="shrink-0 border-b border-[#dfe3eb] bg-[#f8fbff]">
        <div className="flex h-14 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#0f9d58] text-white"><Icon name="sheet" /></div>
          <div className="min-w-[360px]">
            <div className="flex items-center gap-2">
              <div className="text-lg font-medium">Q3 Revenue Forecast</div>
              <span className="group relative">
                <button className="rounded p-1 text-slate-600 hover:bg-slate-100"><Icon name="star" /></button>
                <span className="pointer-events-none absolute left-1/2 top-8 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-[#202124] px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:opacity-100">Star file</span>
              </span>
              <span className="group relative">
                <button className="rounded p-1 text-slate-600 hover:bg-slate-100"><Icon name="cloud" /></button>
                <span className="pointer-events-none absolute left-1/2 top-8 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-[#202124] px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:opacity-100">Saved to Drive</span>
              </span>
            </div>
            <nav className="flex items-center gap-1 text-[13px] text-[#202124]">
              <div className="relative">
                <button data-igg-id="gridly.file.button" data-igg-type="menu_reveal" onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")} className="inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors hover:bg-[#e8eaed]">File</button>
                <Dropdown open={activeMenu === "file"}>
                  <MenuItem id="gridly.file.make-copy" type="menu_reveal" prereq="gridly.file.button">Make a copy</MenuItem>
                  <MenuItem id="gridly.file.prepare-pdf" type="menu_reveal" prereq="gridly.file.button">Export as PDF</MenuItem>
                  <MenuItem id="gridly.file.prepare-csv" type="menu_reveal" prereq="gridly.file.button">Export as CSV</MenuItem>
                  <MenuItem id="gridly.file.version-history" type="menu_reveal" prereq="gridly.file.button">Version history</MenuItem>
                </Dropdown>
              </div>
              <button className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">Edit</button>
              <button className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">View</button>
              <div className="relative">
                <button data-igg-id="gridly.insert.button" data-igg-type="menu_reveal" onClick={() => setActiveMenu(activeMenu === "insert" ? null : "insert")} className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">Insert</button>
                <Dropdown open={activeMenu === "insert"}>
                  <MenuItem id="gridly.insert-chart" type="menu_reveal" prereq="gridly.insert.button">Chart</MenuItem>
                  <MenuItem id="gridly.insert-pivot-table" type="menu_reveal" prereq="gridly.insert.button">Pivot table</MenuItem>
                  <MenuItem id="gridly.insert-comment" type="menu_reveal" prereq="gridly.insert.button">Comment</MenuItem>
                </Dropdown>
              </div>
              <button className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">Format</button>
              <div className="relative">
                <button data-igg-id="gridly.filter.button" data-igg-type="menu_reveal" onClick={() => setActiveMenu(activeMenu === "filter" ? null : "filter")} className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">Data</button>
                <Dropdown open={activeMenu === "filter"}>
                  <MenuItem id="gridly.filter.high-probability" type="menu_reveal" prereq="gridly.filter.button">Filter by success rate</MenuItem>
                  <MenuItem id="gridly.filter-at-risk" type="menu_reveal" prereq="gridly.filter.button">Filter open-source rows</MenuItem>
                </Dropdown>
              </div>
              <button className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">Tools</button>
              <button className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">Extensions</button>
              <button className="rounded px-2 py-0.5 hover:bg-[#e8eaed]">Help</button>
            </nav>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="group relative">
              <button data-igg-id="gridly.refresh.button" data-igg-type={isAsyncTarget("refresh") ? "async_wait" : undefined} aria-disabled={targetPending("refresh") ? "true" : undefined} className={cx("relative rounded-full p-2 text-slate-600 transition-colors hover:bg-[#e8eaed]", targetPending("refresh") && "cursor-wait bg-[#e8f0fe] text-[#174ea6]", targetReady("refresh") && "bg-[#e6f4ea] text-[#137333] ring-2 ring-[#34a853]/30")}>
                <Icon name="refresh" />
                {targetPending("refresh") && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-[#1a73e8]" />}
                {targetReady("refresh") && <span className="absolute -right-1 -top-1 rounded-full bg-[#34a853] p-0.5 text-white"><Icon name="check" /></span>}
              </button>
              <button
                data-igg-id="gridly.header.refresh.action"
                data-igg-type="hover_reveal"
                data-igg-prereq="gridly.refresh.button"
                data-igg-label="Refresh data hover action"
                className="absolute left-1/2 top-10 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#202124] px-2 py-1 text-xs text-white shadow-lg group-hover:block"
              >
                {targetPending("refresh") ? "Refreshing data" : "Refresh data"}
              </button>
            </span>
            <span className="group relative">
              <button data-igg-id="gridly.header.meet" data-igg-type={isAsyncTarget("meet") ? "async_wait" : undefined} aria-disabled={targetPending("meet") ? "true" : undefined} className={cx("relative rounded-full p-2 text-slate-600 transition-colors hover:bg-[#e8eaed]", targetPending("meet") && "cursor-wait bg-[#fef7e0] text-[#b06000]", targetReady("meet") && "bg-[#e6f4ea] text-[#137333] ring-2 ring-[#34a853]/30")}>
                <Icon name="video" />
              </button>
              <span className="pointer-events-none absolute left-1/2 top-10 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-[#202124] px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:opacity-100">{targetPending("meet") ? "Preparing Meet link" : "Start Meet call"}</span>
            </span>
            <button data-igg-id="gridly.share.button" data-igg-type={isAsyncTarget("share") ? "async_wait" : "popup_occlusion"} aria-disabled={targetPending("share") ? "true" : undefined} className={cx("inline-flex h-10 items-center gap-2 rounded-full bg-[#c2e7ff] px-4 text-sm font-medium text-[#001d35] transition-colors hover:bg-[#b3dcf2]", targetPending("share") && "cursor-wait bg-[#e8f0fe] ring-2 ring-[#1a73e8]/30", targetReady("share") && "bg-[#e6f4ea] text-[#137333] ring-2 ring-[#34a853]/25 hover:bg-[#dff1e4]")}>
              <Icon name="share" />
              Share
            </button>
            <span className="group relative">
              <button data-igg-id="gridly.header.profile" className="grid h-9 w-9 place-items-center rounded-full bg-[#8b5a2b] font-bold text-white">G</button>
              <span className="pointer-events-none absolute right-0 top-10 z-50 whitespace-nowrap rounded bg-[#202124] px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:opacity-100">Gridly account</span>
            </span>
          </div>
        </div>
        <div className="flex h-11 items-center gap-2 px-5">
          <button className="rounded p-1.5 text-slate-600 hover:bg-[#e8eaed]"><Icon name="print" /></button>
          <button className="rounded p-1.5 text-slate-600 hover:bg-[#e8eaed]"><Icon name="undo" /></button>
          <select className="h-8 rounded border-0 bg-transparent px-2 text-sm">
            <option>100%</option>
            <option>75%</option>
            <option>125%</option>
          </select>
          <span className="h-6 w-px bg-[#dfe3eb]" />
          <button className="rounded px-2 py-1 text-sm font-bold hover:bg-[#e8eaed]">B</button>
          <button className="rounded px-2 py-1 text-sm italic hover:bg-[#e8eaed]">I</button>
          <button className="rounded px-2 py-1 text-sm underline hover:bg-[#e8eaed]">U</button>
          <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-[#e8eaed]"><Icon name="filter" /> Filter</button>
          <button className="rounded-full bg-[#d2e3fc] px-4 py-1.5 text-sm text-[#174ea6]">View only</button>
          <div className={cx("ml-auto flex h-8 w-[260px] items-center gap-2 rounded-full bg-[#e9eef6] px-3 text-sm text-slate-500 transition-colors", asyncPending && "bg-[#fef7e0] text-[#8a4b00]", uiState.asyncDelayMs !== null && asyncReady && "bg-[#e6f4ea] text-[#137333]")}>
            {asyncPending && <LoadingSpinner className="h-3.5 w-3.5" />}
            {uiState.asyncDelayMs !== null && asyncReady && <Icon name="check" />}
            {statusText}
          </div>
        </div>
      </header>

      <section className="shrink-0 border-b border-[#dfe3eb] bg-white">
        <div className="flex h-8 items-center text-sm">
          <div className="w-28 border-r border-[#dfe3eb] px-3 font-medium text-slate-700">A1:AD1</div>
          <div className="w-10 border-r border-[#dfe3eb] text-center italic text-slate-400">fx</div>
          <input data-igg-id="gridly.formula.input" className="h-full flex-1 px-3 font-mono text-[13px] outline-none" defaultValue="=SUMIF(Stage:Stage,&quot;Commit&quot;,Weighted_ARR:Weighted_ARR)+SUMIF(Stage:Stage,&quot;Best case&quot;,Weighted_ARR:Weighted_ARR)*0.6" />
        </div>
      </section>

      <section className="shrink-0 border-b border-[#dfe3eb] bg-[#fffef7] px-5 py-1.5">
        <div className="flex h-8 items-center gap-3 text-sm">
          <div className="inline-flex items-center gap-2 font-medium text-[#5f4212]"><Icon name="sparkle" /> {slide.label}</div>
          <div className="min-w-0 flex-1 truncate text-[#202124]">{slide.title}</div>
          <button data-igg-id={slide.target} data-igg-type="auto_transition" className="rounded border border-[#d0d7de] bg-white px-3 py-1 text-xs font-medium text-[#137333] hover:bg-[#f1f8f4]">Open insight</button>
          <div className="flex items-center gap-0.5">
            <button data-igg-id="gridly.insight.prev" onClick={() => selectInsightSlide((slideIndex - 1 + insightSlides.length) % insightSlides.length)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#e8eaed] text-[#5f6368]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
            <button data-igg-id="gridly.insight.next" onClick={() => selectInsightSlide((slideIndex + 1) % insightSlides.length)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#e8eaed] text-[#5f6368]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
          </div>
        </div>
      </section>

      <section ref={middleRef} className="flex min-h-0 flex-1 bg-white">
        <div ref={sheetScrollRef} data-igg-id="gridly.sheet.scroll" onMouseDown={startHorizontalSheetDrag} className="min-w-0 flex-1 overflow-auto">
          <div ref={auditRef} style={{ minWidth: sheetMinWidth }}>
            <div
              className="sticky top-0 z-20 grid bg-[#d7e3f8] text-center text-xs font-semibold text-[#183153]"
              style={{ gridTemplateColumns }}
            >
              <div className="sticky left-0 z-30 border-b border-r border-[#b7c5d9] bg-[#eef3fb]" />
              {columnLetters.map((col, index) => (
                <div key={col} className="relative border-b border-r border-[#b7c5d9]">
                  <button data-igg-id={`gridly.column.${col.toLowerCase()}`} className="h-full w-full py-1 hover:bg-[#c5d6f4]">{col}</button>
                  <div
                    data-igg-id={`gridly.column.${col.toLowerCase()}.resize`}
                    data-igg-type="drag_occlusion"
                    data-igg-label={`Resize column ${col}`}
                    onMouseDown={(event) => startColumnResize(index, event)}
                    className="absolute -right-1 top-0 z-40 h-full w-2 cursor-col-resize hover:bg-[#1a73e8]"
                  />
                </div>
              ))}
            </div>
            <div className="grid text-[13px] leading-5" style={{ gridTemplateColumns }}>
              <div className="sticky left-0 z-10 border-b border-r border-[#d9dce1] bg-[#f8fafd] px-2 text-center text-xs text-slate-600">1</div>
              <div className="col-span-13 border-b border-[#f2c94c] bg-[#fff2cc] px-2 font-semibold text-[#5f4212]">⚠ Q3 forecast workbook. Commit and best-case rows are refreshed from CRM each morning; risk notes are owned by regional directors.</div>
              <div className="sticky left-0 z-10 border-b border-r border-[#d9dce1] bg-[#f8fafd] px-2 text-center text-xs text-slate-600">2</div>
              {sheetHeaders.map((header) => (
                <div key={header} className="border-b border-r border-[#d9dce1] bg-white px-2 py-1.5 text-center font-bold">{header}</div>
              ))}
              {rows.map((row, rowIndex) => (
                <div key={`${row[2]}-${rowIndex}`} className="contents" data-igg-id={`gridly.row.${rowIndex + 3}`}>
                  <button
                    data-igg-id={`gridly.row.${rowIndex + 3}.select`}
                    data-igg-label={`Select row ${rowIndex + 3}`}
                    className="sticky left-0 z-10 border-b border-r border-[#d9dce1] bg-[#f8fafd] px-2 text-center text-xs text-slate-600 hover:bg-[#e8f0fe]"
                    style={{ height: rowHeights[rowIndex] }}
                  >
                    {rowIndex + 3}
                    <span
                      data-igg-id={`gridly.row.${rowIndex + 3}.resize`}
                      data-igg-type="drag_occlusion"
                      data-igg-label={`Resize row ${rowIndex + 3}`}
                      onMouseDown={(event) => startRowResize(rowIndex, event)}
                      className="absolute bottom-[-3px] left-0 z-40 h-2 w-full cursor-row-resize hover:bg-[#1a73e8]"
                    />
                  </button>
                  {row.map((cell, colIndex) => {
                    const cellId = `gridly.cell.${String.fromCharCode(97 + colIndex)}${rowIndex + 3}`;
                    const dropdownOptions = cellDropdownOptions[colIndex];
                    const dropdownOpen = activeCellDropdown === cellId;
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        data-igg-id={cellId}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveCellDropdown(dropdownOptions ? (dropdownOpen ? null : cellId) : null)}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && dropdownOptions) {
                            event.preventDefault();
                            setActiveCellDropdown(dropdownOpen ? null : cellId);
                          }
                        }}
                        className={cx(
                          "relative min-w-0 overflow-visible border-b border-r border-[#e0e0e0] bg-white px-2 py-0.5 text-left hover:z-10 hover:outline hover:outline-2 hover:outline-[#1a73e8]",
                          dropdownOpen && "z-40 outline outline-2 outline-[#1a73e8]",
                          colIndex === 12 && "font-normal",
                          colIndex === 0 || colIndex === 1 || colIndex === 8 || colIndex === 9 ? "text-right" : "",
                        )}
                        style={{ height: rowHeights[rowIndex] }}
                      >
                        <div className={cx("flex h-full min-w-0 items-start gap-1 overflow-hidden", colIndex === 8 || colIndex === 9 ? "justify-end" : "justify-between")}>
                          <SheetCell value={cell} columnIndex={colIndex} />
                          {dropdownOptions && <span className="ml-auto shrink-0 text-[10px] text-[#5f6368]">▾</span>}
                        </div>
                        {dropdownOpen && dropdownOptions && (
                          <div className="absolute left-1 top-7 z-50 w-48 overflow-hidden rounded-md border border-[#dadce0] bg-white py-1 text-left text-sm shadow-xl">
                            {dropdownOptions.map((option) => (
                              <button
                                key={option}
                                data-igg-id={`gridly.dropdown.${cellId.replace("gridly.cell.", "")}.${slugifyCellOption(option)}`}
                                data-igg-type="menu_reveal"
                                data-igg-prereq={cellId}
                                data-igg-label={`Set ${cellId.replace("gridly.cell.", "").toUpperCase()} to ${option}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActiveCellDropdown(null);
                                }}
                                className="block w-full px-3 py-1.5 text-left hover:bg-[#e8f0fe]"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="hidden w-14 shrink-0 border-l border-[#dfe3eb] bg-[#f8fbff] py-4 xl:block">
          {[
            ["31", "calendar", "Open calendar"],
            ["💡", "insight", "Add insight note"],
            ["✓", "tasks", "Open task list"],
            ["📍", "location", "Attach location"],
            ["+", "add-on", "Get add-ons"],
            ["▸", "collapse", "Collapse panel"],
          ].map(([item, key, label]) => (
            <div key={key} data-igg-id={`gridly.side.${key}`} className="group relative mx-auto mb-5 h-8 w-8">
              <button className="grid h-8 w-8 place-items-center rounded-full text-sm hover:bg-[#e8eaed]">{item}</button>
              <button
                data-igg-id={`gridly.side.${key}.action`}
                data-igg-type="hover_reveal"
                data-igg-prereq={`gridly.side.${key}`}
                data-igg-label={label}
                className="absolute right-10 top-0 hidden h-8 whitespace-nowrap rounded-md border border-[#dadce0] bg-white px-3 text-xs font-medium text-[#202124] shadow-lg group-hover:block"
              >
                {label}
              </button>
            </div>
          ))}
        </aside>
      </section>

      <div className="z-20 flex h-12 shrink-0 items-center gap-1 border-t border-[#dfe3eb] bg-[#f8fbff] px-4 text-sm">
        <button className="grid h-8 w-8 place-items-center rounded hover:bg-[#e8eaed]">☰</button>
        <button className="grid h-8 w-8 place-items-center rounded hover:bg-[#e8eaed]"><Icon name="plus" /></button>
        {[
          ["Forecast", "gridly.sheet.button"],
          ["Pipeline Detail", "gridly.sheet.forecast"],
          ["Assumptions", "gridly.sheet.assumptions"],
          ["Renewals", "gridly.sheet.renewals"],
          ["Board Pack", "gridly.sheet-board-pack"],
          ["Import Log", "gridly.sheet.import-log"],
        ].map(([label, id], index) => (
          <button
            key={id}
            data-igg-id={id}
            data-igg-type={index === 0 ? "menu_reveal" : undefined}
            className={cx(
              "h-10 px-4 hover:bg-[#edf2f7]",
              index === 0 && "border-t-2 border-[#188038] bg-[#dfe8f7] font-semibold text-[#174ea6]",
            )}
          >
            {label}
          </button>
        ))}
        <div ref={bottomRef} className="ml-auto h-2 w-[420px] rounded-full bg-[#d4d8dd]" />
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 p-24">
          <div className="mx-auto w-[620px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-200 p-3">
              <Icon name="search" />
              <input data-igg-id="gridly.search.input" className="h-10 flex-1 outline-none" defaultValue="retention" />
              <button data-igg-id="gridly.search.close" onClick={() => setSearchOpen(false)} className="rounded-md p-2 hover:bg-slate-100"><Icon name="x" /></button>
            </div>
            <button data-igg-id="gridly.search.result-retention" data-igg-type="menu_reveal" data-igg-prereq="gridly.search.button" className="w-full px-4 py-3 text-left hover:bg-emerald-600 hover:text-white">Gross retention summary</button>
            <button data-igg-id="gridly.search.result-procurement" data-igg-type="menu_reveal" data-igg-prereq="gridly.search.button" className="w-full px-4 py-3 text-left hover:bg-emerald-600 hover:text-white">Procurement delays</button>
          </div>
        </div>
      )}

      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[470px] rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Save complete</h2>
                <p className="mt-2 text-sm text-slate-500">Your latest sheet edits were saved to the Q3 revenue workbook.</p>
              </div>
              <button data-igg-id="gridly.popup.close" onClick={() => setPopupOpen(false)} className="rounded-md p-2 hover:bg-slate-100"><Icon name="x" /></button>
            </div>
            <button data-igg-id="gridly.popup.review-import" className="mt-5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">View saved changes</button>
          </div>
        </div>
      )}

      {exportType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm">
          <div className="w-[430px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className={cx("flex items-center gap-3 border-b border-slate-200 px-5 py-4", asyncPending ? "bg-[#fff8e1]" : "bg-[#e6f4ea]")}>
              <div className={cx("grid h-9 w-9 place-items-center rounded-full", asyncPending ? "bg-[#fbbc04]/20 text-[#b06000]" : "bg-[#34a853] text-white")}>
                {asyncPending ? <LoadingSpinner /> : <Icon name="check" />}
              </div>
              <div>
                <div className="font-semibold">{exportType === "pdf" ? "PDF export" : "CSV export"}</div>
                <div className={cx("text-sm", asyncPending ? "text-[#8a4b00]" : "text-[#137333]")}>{asyncPending ? "Preparing the export file..." : "Export ready"}</div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {exportType === "pdf" ? "Q3 Revenue Forecast.pdf" : "Q3 Revenue Forecast.csv"}
              </div>
              <button
                data-igg-id={exportType === "pdf" ? "gridly.file.download-pdf" : "gridly.file.download-csv"}
                data-igg-type="async_wait"
                aria-disabled={asyncPending ? "true" : undefined}
                className={cx("inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors", asyncPending ? "cursor-wait bg-[#fef7e0] text-[#8a4b00]" : "bg-[#34a853] text-white hover:bg-[#2d9248]")}
              >
                {!asyncPending && <Icon name="check" />}
                {asyncPending ? "Generating file…" : `Download ${exportType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#edf2f7]" />}>
      <GridlyPage />
    </Suspense>
  );
}
