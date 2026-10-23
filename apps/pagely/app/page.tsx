"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getPagelyBenchmarkState, type PagelyBenchmarkState } from "./pagely-states";

declare global {
  interface Window {
    __PAGELY_BENCHMARK_STATE__?: PagelyBenchmarkState;
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
  runtimeStateKey: "__PAGELY_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function Icon({ name }: { name: "page" | "search" | "inbox" | "template" | "settings" | "home" | "plus" | "check" | "more" | "chev" | "share" | "sync" | "drag" | "x" | "user" | "clock" | "tag" | "chevron-right" | "star" | "link" | "comment" | "bell" | "side" | "lock" | "archive" | "copy" | "move" }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    page: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    inbox: <><path d="M22 12h-6l-2 3H10l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7.9z" /></>,
    template: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    chev: <path d="m8 10 4 4 4-4" />,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" /></>,
    sync: <><path d="M20 11a8 8 0 0 0-14.9-4" /><path d="M4 5v5h5" /><path d="M4 13a8 8 0 0 0 14.9 4" /><path d="M20 19v-5h-5" /></>,
    drag: <path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" />,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    tag: <><path d="M20.6 8.3 12 2 3.4 8.3A2 2 0 0 0 2.5 10v9a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-9a2 2 0 0 0-.9-1.7z" /><path d="M12 2v20" /></>,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    star: <polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 9 8.5 12 2" />,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    comment: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    side: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    archive: <><path d="M4 7h16" /><path d="M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" /><path d="M9 11h6" /><path d="M8 3h8l2 4H6z" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" /></>,
    move: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /><path d="M5 6v12" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

type MenuName = string | null;

function Dropdown({ open, children, className, style }: { open: boolean; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  if (!open) return null;
  return <div className={cx("absolute z-[80] mt-1 w-56 overflow-hidden rounded-md border border-[#343434] bg-[#252525] py-1 shadow-2xl", className)} style={style}>{children}</div>;
}

function MenuItem({ id, type, prereq, children }: { id: string; type?: string; prereq?: string; children: React.ReactNode }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#d6d6d6] hover:bg-[#333333]"
    >
      {children}
    </button>
  );
}

function useDraggablePanel(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ startX: number; startY: number; panelX: number; panelY: number } | null>(null);
  useEffect(() => {
    function move(e: MouseEvent) {
      if (!drag.current) return;
      setPos({ x: drag.current.panelX + e.clientX - drag.current.startX, y: drag.current.panelY + e.clientY - drag.current.startY });
    }
    function up() { drag.current = null; }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, []);
  return {
    pos,
    onMouseDown: (e: React.MouseEvent) => {
      drag.current = { startX: e.clientX, startY: e.clientY, panelX: pos.x, panelY: pos.y };
    },
  };
}

const milestones = [
  { slug: "api-contracts", title: "Finalize API contracts", owner: "Alex Rivera", status: "Done", statusColor: "bg-[#1f3a2a] text-[#8de6a8]" },
  { slug: "design-tokens", title: "Ship design tokens v2", owner: "Morgan Lee", status: "Done", statusColor: "bg-[#1f3a2a] text-[#8de6a8]" },
  { slug: "qa-suite", title: "Complete QA smoke suite", owner: "Sam Chen", status: "In progress", statusColor: "bg-[#223d57] text-[#8ecbff]" },
  { slug: "beta-onboarding", title: "Review beta onboarding", owner: "Taylor Brooks", status: "In progress", statusColor: "bg-[#223d57] text-[#8ecbff]" },
  { slug: "marketing-brief", title: "Approve marketing brief", owner: "Jordan Mills", status: "Not started", statusColor: "bg-[#343434] text-[#b8b8b8]" },
  { slug: "release-notes", title: "Draft release notes", owner: "Casey Stone", status: "Not started", statusColor: "bg-[#343434] text-[#b8b8b8]" },
  { slug: "demo-recorded", title: "Record stakeholder demo", owner: "Riley Grant", status: "Not started", statusColor: "bg-[#343434] text-[#b8b8b8]" },
  { slug: "go-nogo", title: "Sign go/no-go decision", owner: "Jamie Ross", status: "Not started", statusColor: "bg-[#343434] text-[#b8b8b8]" },
] as const;

const teamRows = [
  { name: "Jamie Ross", role: "Product Lead", pages: 14, status: "Active" },
  { name: "Alex Rivera", role: "Engineering", pages: 9, status: "Active" },
  { name: "Morgan Lee", role: "Design", pages: 11, status: "Active" },
  { name: "Sam Chen", role: "QA", pages: 6, status: "Active" },
] as const;

const sprintTasks = [
  { slug: "deploy-infra", title: "Deploy infra changes", owner: "Alex Rivera", status: "Blocked", statusColor: "bg-[#4b2525] text-[#ff9a9a]" },
  { slug: "notify-customers", title: "Notify customers", owner: "Morgan Lee", status: "In progress", statusColor: "bg-[#223d57] text-[#8ecbff]" },
  { slug: "update-docs", title: "Update docs site", owner: "Sam Chen", status: "In progress", statusColor: "bg-[#223d57] text-[#8ecbff]" },
  { slug: "archive-staging", title: "Archive staging environment", owner: "Taylor Brooks", status: "Done", statusColor: "bg-[#1f3a2a] text-[#8de6a8]" },
  { slug: "postmortem", title: "Schedule postmortem", owner: "Riley Grant", status: "Not started", statusColor: "bg-[#343434] text-[#b8b8b8]" },
] as const;

const linkedPages = [
  { title: "Sprint Retrospective", desc: "Q1 retrospective notes and action items", id: "pagely.linked.sprint-retro.open" },
  { title: "Brand Guidelines", desc: "Voice, tone, logo usage, and color palette", id: "pagely.linked.brand-guidelines.open" },
  { title: "API Reference", desc: "Endpoint docs for internal and external teams", id: "pagely.linked.api-reference.open" },
  { title: "Release Notes", desc: "Changelog for all Q2 shipped features", id: "pagely.linked.release-notes.open" },
  { title: "Customer Interviews", desc: "Synthesized feedback from 18 user sessions", id: "pagely.linked.customer-interviews.open" },
  { title: "Design System", desc: "Figma components, tokens, and accessibility notes", id: "pagely.linked.design-system.open" },
  { title: "Incident Runbook", desc: "On-call escalation paths and post-mortem template", id: "pagely.linked.incident-runbook.open" },
  { title: "Roadmap 2026", desc: "Themes, bets, and prioritised initiatives", id: "pagely.linked.roadmap-2026.open" },
] as const;

const sidebarPages = [
  { title: "Q2 Launch Plan", active: true, icon: "🚀" },
  { title: "Design System", active: false, icon: "🎨" },
  { title: "Team Handbook", active: false, icon: "📘" },
  { title: "OKRs 2026", active: false, icon: "🎯" },
  { title: "Meeting Notes", active: false, icon: "📝" },
  { title: "Product Roadmap", active: false, icon: "🗺️" },
] as const;

const comments = [
  { id: "launch-risk", author: "Jordan Mills", date: "May 14", text: "Please tighten the customer notice before this moves to final review.", anchor: "Launch risk" },
  { id: "api-contract", author: "Alex Rivera", date: "May 13", text: "Contract is merged. Add examples for pagination before publishing.", anchor: "Finalize API contracts" },
  { id: "qa-suite", author: "Sam Chen", date: "May 12", text: "Smoke suite is green locally. Waiting on staging credentials.", anchor: "Complete QA smoke suite" },
] as const;

const asyncNotices = {
  comment: {
    eyebrow: "Comment",
    title: "New comment from Jordan Mills",
    body: "Customer notice needs one last wording pass before final review.",
    meta: "Q2 Launch Plan · just now",
    icon: "comment",
    accent: "bg-[#3a3324] text-[#e5c777]",
    primaryLabel: "Go to thread",
    primaryId: "pagely.async.comment.go-to-thread",
    secondaryLabel: "Dismiss",
    secondaryId: "pagely.async.comment.dismiss",
  },
  deploy: {
    eyebrow: "Automation",
    title: "Deploy check finished",
    body: "Infrastructure deploy is still blocked by the staging credential check.",
    meta: "Deploy infra changes · 1 min ago",
    icon: "sync",
    accent: "bg-[#402928] text-[#ff9a9a]",
    primaryLabel: "Dismiss",
    primaryId: "pagely.async.deploy.dismiss",
    secondaryLabel: "View task",
    secondaryId: "pagely.async.deploy.view-task",
  },
  access: {
    eyebrow: "Request",
    title: "Access request received",
    body: "Taylor Brooks requested access to the launch customer notice.",
    meta: "Customer notice draft · pending",
    icon: "lock",
    accent: "bg-[#263447] text-[#8ecbff]",
    primaryLabel: "Open request",
    primaryId: "pagely.async.access.open-request",
    secondaryLabel: "Dismiss",
    secondaryId: "pagely.async.access.dismiss",
  },
  import: {
    eyebrow: "Import",
    title: "Import needs review",
    body: "Five imported pages have unresolved field mappings.",
    meta: "Confluence import · 5 items",
    icon: "page",
    accent: "bg-[#24382d] text-[#8de6a8]",
    primaryLabel: "Review mappings",
    primaryId: "pagely.async.import.review-mappings",
    secondaryLabel: "Later",
    secondaryId: "pagely.async.import.later",
  },
  reminder: {
    eyebrow: "Reminder",
    title: "Launch review starts soon",
    body: "The Q2 Launch review begins in 10 minutes.",
    meta: "Today · 3:30 PM",
    icon: "clock",
    accent: "bg-[#35312a] text-[#d6b767]",
    primaryLabel: "Snooze",
    primaryId: "pagely.async.reminder.snooze",
    secondaryLabel: "Dismiss",
    secondaryId: "pagely.async.reminder.dismiss",
  },
} as const;

export default function PagelyPage() {
  return (
    <Suspense fallback={<main className="h-screen bg-[#191919]" />}>
      <PagelyWorkspace />
    </Suspense>
  );
}

function PagelyWorkspace() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getPagelyBenchmarkState(stateId), [stateId]);

  const [uiState, setUiState] = useState(initialState);
  const resolveInitialMenu = (state: PagelyBenchmarkState): MenuName => state.activeMenu ?? (state.viewMenuOpen ? "views" : state.sortMenuOpen ? "sort" : state.moreMenuOpen ? "more" : null);
  const [activeMenu, setActiveMenu] = useState<MenuName>(resolveInitialMenu(initialState));
  const [searchOpen, setSearchOpen] = useState(initialState.searchOpen);
  const [importModalOpen, setImportModalOpen] = useState(initialState.importModalOpen);
  const [syncComplete, setSyncComplete] = useState(!(initialState.id === "3" && initialState.asyncDelayMs !== null));
  const [zoomActionVisible, setZoomActionVisible] = useState(!(initialState.id === "8" && initialState.asyncDelayMs !== null));
  const [asyncNoticeVisible, setAsyncNoticeVisible] = useState(!(initialState.asyncNoticeKind && initialState.asyncDelayMs !== null));
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({ roles: false, office: true, launch: true, roster: true, tasks: true, resources: true });
  const [activeComment, setActiveComment] = useState<string>(comments[0].id);

  const milestonesRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);
  const linkedRef = useRef<HTMLDivElement>(null);
  const panel = useDraggablePanel({ x: 750, y: 85 });

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(resolveInitialMenu(initialState));
    setSearchOpen(initialState.searchOpen);
    setImportModalOpen(initialState.importModalOpen);
    setSyncComplete(!(initialState.id === "3" && initialState.asyncDelayMs !== null));
    setZoomActionVisible(!(initialState.id === "8" && initialState.asyncDelayMs !== null));
    setAsyncNoticeVisible(!(initialState.asyncNoticeKind && initialState.asyncDelayMs !== null));
  }, [initialState]);

  useEffect(() => { window.__PAGELY_BENCHMARK_STATE__ = uiState; }, [uiState]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __PAGELY_BENCHMARK_STATE__?: Record<string, unknown> }).__PAGELY_BENCHMARK_STATE__ ?? null;
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (uiState.scrollTarget === "milestones") milestonesRef.current?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "roster") document.querySelector("[data-igg-id='pagely.toggle.roster']")?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "tasks") tasksRef.current?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "linked") linkedRef.current?.scrollIntoView({ block: "start" });
  }, [uiState.scrollTarget]);

  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const t = window.setTimeout(() => {
      if (uiState.id === "3") setSyncComplete(true);
      if (uiState.id === "8") setZoomActionVisible(true);
      if (uiState.asyncNoticeKind) setAsyncNoticeVisible(true);
    }, uiState.asyncDelayMs);
    return () => window.clearTimeout(t);
  }, [uiState.asyncDelayMs, uiState.id, uiState.asyncNoticeKind]);

  const toggleBlock = (key: string) => setOpenBlocks((prev) => ({ ...prev, [key]: !prev[key] }));
  const closeMenuFromOutsideClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-igg-type='menu_reveal']")) return;
    if (target.closest("[data-igg-type='hover_reveal']")) return;
    setActiveMenu(null);
  };

  return (
    <main onClick={closeMenuFromOutsideClick} className="flex h-screen overflow-hidden bg-[#191919] text-[#e7e2d8]">
      <aside className="flex h-screen w-[245px] shrink-0 flex-col border-r border-[#2b2b2b] bg-[#202020] text-[#b9b4aa]">
        <div className="flex h-[46px] items-center gap-2 border-b border-[#2b2b2b] px-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#333333] text-xs font-semibold">T</div>
          <span className="truncate text-sm font-semibold text-[#e7e2d8]">Team Workspace</span>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-visible px-2 py-3">
          <button className="mb-1 flex w-full items-center gap-2 rounded-md bg-[#343434] px-2 py-1.5 text-sm font-semibold text-[#f0ece3]"><Icon name="home" /> Home</button>
          <button data-igg-id="pagely.sidebar.search" onClick={() => setSearchOpen(true)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#2d2d2d]"><Icon name="search" /> Search</button>
          <button data-igg-id="pagely.sidebar.inbox" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#2d2d2d]"><Icon name="inbox" /> Inbox</button>
          <button data-igg-id="pagely.sidebar.templates" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#2d2d2d]"><Icon name="template" /> Templates</button>
          <div className="px-2 pb-1 pt-5 text-xs font-semibold text-[#8f8b83]">Shared</div>
          {sidebarPages.map((p, index) => (
            <SidebarPageRow key={p.title} page={p} index={index} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
          ))}
          <div className="mt-7 space-y-1 px-2 text-sm">
            <button className="flex w-full items-center gap-2 rounded-md py-1.5 text-[#b9b4aa] hover:bg-[#2d2d2d]"><Icon name="page" /> Library</button>
            <button className="flex w-full items-center gap-2 rounded-md py-1.5 text-[#b9b4aa] hover:bg-[#2d2d2d]"><Icon name="bell" /> Help</button>
          </div>
        </nav>
        <div className="border-t border-[#2b2b2b] p-3">
          <button data-igg-id="pagely.sidebar.new-page" className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#30302e] text-sm font-semibold text-[#d8d2c8] hover:bg-[#3a3a38]"><Icon name="plus" /> New</button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[46px] shrink-0 items-center border-b border-[#2b2b2b] bg-[#191919] px-4">
          <nav className="flex min-w-0 items-center gap-2 text-sm text-[#9b968e]">
            <button data-igg-id="pagely.breadcrumb.workspace" className="truncate hover:text-[#e7e2d8]">Product Hub</button>
            <Icon name="chevron-right" />
            <span className="truncate font-semibold text-[#e7e2d8]">🚀 Q2 Launch Plan</span>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 text-[#b9b4aa]">
            <span className="hidden text-sm text-[#8f8b83] lg:inline">Edited 8h ago</span>
            <div className="flex -space-x-2">
              {["JR", "AR", "ML", "SC"].map((initials) => (
                <div key={initials} data-igg-id={`pagely.header.member.${initials.toLowerCase()}`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#191919] bg-[#3b4a53] text-[10px] font-bold text-white">{initials}</div>
              ))}
            </div>
            <TooltipButton id="pagely.header.copy-link" label="Copy link"><Icon name="link" /></TooltipButton>
            <TooltipButton id="pagely.header.favorite" label="Add to favorites"><Icon name="star" /></TooltipButton>
            <TooltipButton id="pagely.more.duplicate" label="Duplicate"><Icon name="copy" /></TooltipButton>
            <TooltipButton id="pagely.more.move" label="Move to"><Icon name="move" /></TooltipButton>
            <TooltipButton id="pagely.more.archive" label="Archive"><Icon name="archive" /></TooltipButton>
            <button data-igg-id="pagely.header.settings" data-igg-type="popup_occlusion" data-igg-label="Settings" className="group group/tooltip relative flex h-8 w-8 items-center justify-center rounded-md text-[#a8a29a] hover:bg-[#2d2d2d] hover:text-[#f0ece3]">
              <Icon name="settings" />
              <span className="pointer-events-none absolute right-0 top-9 z-50 hidden whitespace-nowrap rounded bg-[#2b2b2b] px-2 py-1 text-xs text-[#f0ece3] shadow-xl group-hover:block group-hover/tooltip:block">Settings</span>
            </button>
            <div className="mx-1 h-5 w-px bg-[#343434]" />
            <button data-igg-id={uiState.id === "3" ? (syncComplete ? "pagely.header.sync-complete" : "pagely.header.syncing") : "pagely.header.sync"} data-igg-type="async_wait" data-igg-label="Sync database" className={cx("inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm hover:bg-[#2d2d2d]", !syncComplete && "cursor-wait text-[#d6b767]", syncComplete && uiState.id === "3" && "text-[#8de6a8]")}>
              <span className={cx("inline-flex", !syncComplete && "animate-spin")}><Icon name="sync" /></span>
              {uiState.id === "3" ? (syncComplete ? "Sync complete" : "Syncing") : "Sync"}
            </button>
            <button data-igg-id="pagely.header.share" data-igg-type="popup_occlusion" data-igg-label="Share" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#3a3a3a] bg-[#242424] px-3 text-sm font-medium text-[#f0ece3] hover:bg-[#303030]"><Icon name="share" /> Share</button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1080px] px-10 pb-28 pt-5">
            <article className="relative w-[760px]">
              <button className="mb-7 flex items-center gap-2 text-sm font-semibold text-[#9b968e] hover:text-[#f0ece3]">↓ Load more</button>
              <div className="mb-3 text-6xl">🚀</div>
              <h1 data-igg-id="pagely.page.title" className="mb-2 text-[42px] font-bold leading-tight text-[#f4f1ea]">Q2 Launch Plan</h1>
              <p className="mb-6 text-sm text-[#9f9a92]">Product Hub / Launch workspace</p>

              <div className="mb-7 grid gap-2 border-y border-[#2f2f2f] py-4 text-sm">
                <PropertyDropdown label="Status" value="In progress" menuKey="property-status" activeMenu={activeMenu} setActiveMenu={setActiveMenu} badge="bg-[#223d57] text-[#8ecbff]" items={[["pagely.property.status.done", "Done"], ["pagely.property.status.in-review", "In review"], ["pagely.property.status.blocked", "Blocked"], ["pagely.property.status.not-started", "Not started"]]} />
                <PropertyDropdown label="Owner" value="Jamie Ross" menuKey="property-owner" activeMenu={activeMenu} setActiveMenu={setActiveMenu} items={[["pagely.property.owner.alex", "Alex Rivera"], ["pagely.property.owner.morgan", "Morgan Lee"], ["pagely.property.owner.sam", "Sam Chen"]]} />
                <PropertyDropdown label="Due date" value="Jun 30, 2026" menuKey="property-due" activeMenu={activeMenu} setActiveMenu={setActiveMenu} items={[["pagely.property.due.today", "Today"], ["pagely.property.due.next-week", "Next week"], ["pagely.property.due.clear", "Clear date"]]} />
                <PropertyDropdown label="Priority" value="P0" menuKey="property-priority" activeMenu={activeMenu} setActiveMenu={setActiveMenu} badge="bg-[#4b2525] text-[#ff9a9a]" items={[["pagely.property.priority.p1", "P1"], ["pagely.property.priority.p2", "P2"], ["pagely.property.priority.none", "No priority"]]} />
              </div>

              <div className="group relative mb-7 rounded-md bg-[#3c3c39] px-5 py-4 text-sm leading-6 text-[#f0ece3]">
                <InlineComment
                  id="pagely.comment.launch-risk"
                  active={activeComment === "launch-risk"}
                  onClick={() => setActiveComment("launch-risk")}
                  author="Jordan Mills"
                  date="May 14"
                  text="Please tighten the customer notice before this moves to final review."
                />
                <div className="mb-1 font-semibold">📣 Launch risk</div>
                <p>All milestones require product sign-off before moving to Done. Use @mentions in comments to notify reviewers.</p>
              </div>

              <div className="mb-7 rounded-md border border-[#343434] bg-[#202020] p-4 text-sm leading-6 text-[#d8d2c8]">
                <div className="mb-2 flex items-center gap-2 text-[#f0ece3]"><Icon name="link" /> Related notes</div>
                <p>
                  Review the <Hyperlink id="pagely.link.inline.launch-brief">launch brief</Hyperlink>, the <Hyperlink id="pagely.link.inline.customer-notice">customer notice draft</Hyperlink>, and the <Hyperlink id="pagely.link.inline.release-calendar">release calendar</Hyperlink> before final sign-off.
                </p>
              </div>

              <ToggleBlock id="pagely.toggle.roles" title="Each member's role" subtitle="Questions, ownership, and escalation paths" open={openBlocks.roles} onToggle={() => toggleBlock("roles")}>
                <div className="rounded-md bg-[#30302d] p-4 text-sm leading-6 text-[#d8d2c8]">
                  <p>📣 If you have questions but do not know who to ask, start from the role map.</p>
                  <ul className="mt-3 list-disc space-y-1 pl-6">
                    <li>Ref: 🎉 Role and Responsibilities with TA</li>
                    <li>Product owns launch approval, engineering owns API contracts, design owns visual sign-off.</li>
                  </ul>
                </div>
              </ToggleBlock>

              <ToggleBlock id="pagely.toggle.office" title="Office information" subtitle="Access procedures, Wi-Fi, and visitor notes" open={openBlocks.office} onToggle={() => toggleBlock("office")}>
                <NotionHeading>Workspace Access</NotionHeading>
                <ul className="my-3 list-disc space-y-3 pl-6 text-[#d8d2c8]">
                  <li>Visitor check-in details are maintained by the workplace operations team.</li>
                  <li>For access procedures and Wi-Fi, refer to the page below.</li>
                  <li><button data-igg-id="pagely.link.access-guide" className="border-b border-[#746730] bg-[#403b22] px-1 text-[#f0e1a8]">🔐 Access guide</button></li>
                </ul>
              </ToggleBlock>

              <ToggleBlock id="pagely.toggle.launch" title="Launch checklist database" subtitle="Table view with comments and row actions" open={openBlocks.launch} onToggle={() => toggleBlock("launch")}>
                <section ref={milestonesRef} className="mb-6">
                  <div className="overflow-visible rounded-md border border-[#343434]">
                    {milestones.map((m) => (
                      <div key={m.slug} data-igg-id={`pagely.milestone.${m.slug}.row`} className={cx("group relative grid grid-cols-[1fr_130px_106px_82px] items-center gap-3 border-b border-[#2d2d2d] px-3 py-2.5 last:border-b-0 hover:bg-[#242424]", (m.slug === "api-contracts" || m.slug === "qa-suite") && "min-h-[92px]")}>
                        <span className={cx("text-sm", m.status === "Done" ? "text-[#817d76] line-through" : "text-[#e7e2d8]")}>{m.title}</span>
                        <span className="text-xs text-[#9b968e]">{m.owner}</span>
                        <div className="relative">
                          <button data-igg-id={`pagely.milestone.${m.slug}.status`} data-igg-type="menu_reveal" data-igg-label={`${m.title} status`} onClick={() => setActiveMenu(activeMenu === `milestone-${m.slug}-status` ? null : `milestone-${m.slug}-status`)} className={cx("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs", m.statusColor)}>{m.status}<Icon name="chev" /></button>
                          <Dropdown open={activeMenu === `milestone-${m.slug}-status`} className="left-0 top-6 w-44">
                            <MenuItem id={`pagely.milestone.${m.slug}.status.done`} type="menu_reveal" prereq={`pagely.milestone.${m.slug}.status`}><Icon name="check" /> Done</MenuItem>
                            <MenuItem id={`pagely.milestone.${m.slug}.status.review`} type="menu_reveal" prereq={`pagely.milestone.${m.slug}.status`}><Icon name="clock" /> In review</MenuItem>
                            <MenuItem id={`pagely.milestone.${m.slug}.status.blocked`} type="menu_reveal" prereq={`pagely.milestone.${m.slug}.status`}><Icon name="tag" /> Blocked</MenuItem>
                          </Dropdown>
                        </div>
                        <button data-igg-id={`pagely.milestone.${m.slug}.comment`} data-igg-type="hover_reveal" data-igg-prereq={`pagely.milestone.${m.slug}.row`} data-igg-label={`Comment on ${m.title}`} onClick={() => setActiveComment(m.slug === "api-contracts" ? "api-contract" : m.slug === "qa-suite" ? "qa-suite" : "launch-risk")} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#9b968e] opacity-0 hover:bg-[#303030] hover:text-[#f0ece3] group-hover:opacity-100"><Icon name="comment" /> Comment</button>
                        {m.slug === "api-contracts" && (
                          <InlineComment
                            id="pagely.comment.api-contract"
                            active={activeComment === "api-contract"}
                            onClick={() => setActiveComment("api-contract")}
                            author="Alex Rivera"
                            date="May 13"
                            text="API contract is merged. Docs still need examples for pagination."
                            compact
                          />
                        )}
                        {m.slug === "qa-suite" && (
                          <InlineComment
                            id="pagely.comment.qa-suite"
                            active={activeComment === "qa-suite"}
                            onClick={() => setActiveComment("qa-suite")}
                            author="Sam Chen"
                            date="May 12"
                            text="Smoke suite is green locally. Waiting on staging credentials."
                            compact
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </ToggleBlock>

              <ToggleBlock id="pagely.toggle.roster" title="Team roster" subtitle="People database" open={openBlocks.roster} onToggle={() => toggleBlock("roster")}>
                <div className="mb-2 flex items-center gap-2">
                  <div className="relative">
                    <button data-igg-id="pagely.views.button" data-igg-type="menu_reveal" data-igg-label="Views menu" onClick={() => setActiveMenu(activeMenu === "views" ? null : "views")} className="inline-flex h-7 items-center gap-1 rounded bg-[#2a2a2a] px-2 text-xs text-[#d8d2c8] hover:bg-[#333]">Table <Icon name="chev" /></button>
                    <Dropdown open={activeMenu === "views"} className="left-0 top-8">
                      <MenuItem id="pagely.views.board" type="menu_reveal" prereq="pagely.views.button"><Icon name="template" /> Board</MenuItem>
                      <MenuItem id="pagely.views.timeline" type="menu_reveal" prereq="pagely.views.button"><Icon name="clock" /> Timeline</MenuItem>
                      <MenuItem id="pagely.views.list" type="menu_reveal" prereq="pagely.views.button"><Icon name="page" /> List</MenuItem>
                    </Dropdown>
                  </div>
                  <div className="relative">
                    <button data-igg-id="pagely.sort.button" data-igg-type="menu_reveal" data-igg-label="Sort menu" onClick={() => setActiveMenu(activeMenu === "sort" ? null : "sort")} className="inline-flex h-7 items-center gap-1 rounded bg-[#2a2a2a] px-2 text-xs text-[#d8d2c8] hover:bg-[#333]">Sort <Icon name="chev" /></button>
                    <Dropdown open={activeMenu === "sort"} className="left-0 top-8">
                      <MenuItem id="pagely.sort.last-edited" type="menu_reveal" prereq="pagely.sort.button"><Icon name="clock" /> Last edited</MenuItem>
                      <MenuItem id="pagely.sort.priority" type="menu_reveal" prereq="pagely.sort.button"><Icon name="tag" /> Priority</MenuItem>
                    </Dropdown>
                  </div>
                </div>
                <div className="overflow-visible rounded-md border border-[#343434]">
                  {teamRows.map((row) => (
                    <div key={row.name} data-igg-id={`pagely.team.${row.name.toLowerCase().split(" ")[0]}`} className="relative grid grid-cols-[1fr_130px_70px_82px] items-center gap-3 border-b border-[#2d2d2d] px-3 py-2.5 last:border-b-0 hover:bg-[#242424]">
                      <span className="text-sm text-[#e7e2d8]">{row.name}</span><span className="text-xs text-[#9b968e]">{row.role}</span><span className="text-xs">{row.pages}</span>
                      <div className="relative">
                        <button data-igg-id={`pagely.team.${row.name.toLowerCase().split(" ")[0]}.status`} data-igg-type="menu_reveal" data-igg-label={`${row.name} status`} onClick={() => setActiveMenu(activeMenu === `team-${row.name}-status` ? null : `team-${row.name}-status`)} className="inline-flex items-center gap-1 rounded bg-[#1f3a2a] px-2 py-0.5 text-xs text-[#8de6a8]">{row.status}<Icon name="chev" /></button>
                        <Dropdown open={activeMenu === `team-${row.name}-status`} className={cx("right-0 w-40", row.name === "Sam Chen" ? "bottom-6" : "top-6")}>
                          <MenuItem id={`pagely.team.${row.name.toLowerCase().split(" ")[0]}.status.active`} type="menu_reveal">Active</MenuItem>
                          <MenuItem id={`pagely.team.${row.name.toLowerCase().split(" ")[0]}.status.away`} type="menu_reveal">Away</MenuItem>
                          <MenuItem id={`pagely.team.${row.name.toLowerCase().split(" ")[0]}.status.archived`} type="menu_reveal">Archived</MenuItem>
                        </Dropdown>
                      </div>
                    </div>
                  ))}
                </div>
              </ToggleBlock>

              <ToggleBlock id="pagely.toggle.tasks" title="Sprint tasks" subtitle="Delivery work for this week" open={openBlocks.tasks} onToggle={() => toggleBlock("tasks")}>
                <section ref={tasksRef} className="mb-6">
                  <div className="overflow-visible rounded-md border border-[#343434]">
                    {sprintTasks.map((task) => (
                      <div key={task.slug} className="relative grid grid-cols-[1fr_110px_102px_88px] items-center gap-3 border-b border-[#2d2d2d] px-3 py-3 last:border-b-0 hover:bg-[#242424]">
                        <div><div className="text-sm text-[#e7e2d8]">{task.title}</div><div className="text-xs text-[#8f8b83]">{task.owner}</div></div>
                        <span className="text-xs text-[#9b968e]">{task.owner.split(" ")[0]}</span>
                        <div className="relative">
                          <button data-igg-id={`pagely.tasks.${task.slug}.status`} data-igg-type="menu_reveal" data-igg-label={`${task.title} status`} onClick={() => setActiveMenu(activeMenu === `task-${task.slug}-status` ? null : `task-${task.slug}-status`)} className={cx("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs", task.statusColor)}>{task.status}<Icon name="chev" /></button>
                          <Dropdown open={activeMenu === `task-${task.slug}-status`} className={cx("left-0 w-44", task.slug === "postmortem" || task.slug === "archive-staging" ? "bottom-6" : "top-6")}>
                            <MenuItem id={`pagely.tasks.${task.slug}.status.blocked`} type="menu_reveal">Blocked</MenuItem>
                            <MenuItem id={`pagely.tasks.${task.slug}.status.progress`} type="menu_reveal">In progress</MenuItem>
                            <MenuItem id={`pagely.tasks.${task.slug}.status.done`} type="menu_reveal">Done</MenuItem>
                          </Dropdown>
                        </div>
                        <button data-igg-id={`pagely.tasks.${task.slug}.details`} data-igg-type="drag_occlusion" data-igg-label={`Details for ${task.title}`} className="rounded bg-[#2a2a2a] px-2 py-1 text-xs text-[#d8d2c8] hover:bg-[#333]">Details</button>
                      </div>
                    ))}
                  </div>
                </section>
              </ToggleBlock>

              <ToggleBlock id="pagely.toggle.resources" title="Linked resources" subtitle="Pages connected to this launch" open={openBlocks.resources} onToggle={() => toggleBlock("resources")}>
                <section ref={linkedRef} className="grid grid-cols-2 gap-2 pb-8">
                  {linkedPages.map((page) => (
                    <div key={page.id} className="rounded-md border border-[#343434] bg-[#202020] p-3 hover:bg-[#242424]">
                      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#e7e2d8]"><Icon name="page" /> {page.title}</div>
                      <p className="min-h-[34px] text-xs leading-4 text-[#9b968e]">{page.desc}</p>
                      <button data-igg-id={page.id} data-igg-type="off_screen" data-igg-label={`Open page for ${page.title}`} className="mt-2 rounded bg-[#2a2a2a] px-2 py-1 text-xs text-[#d8d2c8] hover:bg-[#333]">Open page</button>
                    </div>
                  ))}
                </section>
              </ToggleBlock>
            </article>
          </div>
        </div>
      </section>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-20">
          <div className="mx-auto w-[600px] overflow-hidden rounded-xl border border-[#343434] bg-[#242424] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#343434] px-3 py-3 text-[#d8d2c8]">
              <Icon name="search" />
              <input data-igg-id="pagely.search.input" className="h-9 flex-1 bg-transparent text-sm outline-none" defaultValue="retro" />
              <button data-igg-id="pagely.search.close" onClick={() => setSearchOpen(false)} className="rounded-md p-1.5 hover:bg-[#333]"><Icon name="x" /></button>
            </div>
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#8f8b83]">Pages</div>
              <button data-igg-id="pagely.search.result-retro" data-igg-type="menu_reveal" data-igg-prereq="pagely.sidebar.search" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#d8d2c8] hover:bg-[#333]"><Icon name="page" /> Q1 Launch Retrospective</button>
              <button data-igg-id="pagely.search.result-sprint" data-igg-type="menu_reveal" data-igg-prereq="pagely.sidebar.search" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#d8d2c8] hover:bg-[#333]"><Icon name="page" /> Sprint Retrospective</button>
            </div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="w-[480px] rounded-xl border border-[#343434] bg-[#242424] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#f0ece3]">Workspace import complete</h2>
                <p className="mt-2 text-sm text-[#a8a29a]">47 pages were imported from Confluence. Review before publishing to your team.</p>
              </div>
              <button data-igg-id="pagely.modal.close" onClick={() => setImportModalOpen(false)} className="rounded-md p-2 text-[#8f8b83] hover:bg-[#333]"><Icon name="x" /></button>
            </div>
            <div className="mt-4 rounded-lg border border-[#343434] bg-[#1c1c1c] p-3 text-sm text-[#c8c1b6]">
              <div className="flex justify-between"><span>Pages imported</span><strong>47</strong></div>
              <div className="mt-1 flex justify-between"><span>Attachments</span><strong>312</strong></div>
              <div className="mt-1 flex justify-between"><span>Needs review</span><strong className="text-[#e0b45c]">8</strong></div>
            </div>
            <button data-igg-id="pagely.modal.review-import" className="mt-5 rounded-md bg-[#f0ece3] px-4 py-2 text-sm font-medium text-[#191919] hover:bg-white">Review import</button>
          </div>
        </div>
      )}

      {uiState.id === "8" && zoomActionVisible && (
        <div className="fixed right-5 top-[58px] z-50 w-[330px] rounded-xl border border-[#3a3324] bg-[#24231f] p-4 text-sm text-[#ded7c9] shadow-2xl">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#3a3324] text-[#e5c777]">
              <Icon name="comment" />
            </div>
            <div>
              <div className="font-semibold text-[#f3eee4]">Zoom meeting detected</div>
              <div className="mt-1 text-xs leading-4 text-[#9f9a92]">Launch review ended 2 minutes ago. AI notes will be available shortly.</div>
            </div>
          </div>
          <button
            data-igg-id="pagely.zoom-ai.write-log"
            data-igg-type="async_wait"
            data-igg-label="Write Zoom AI meeting log"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#d6b767] text-xs font-semibold text-[#1d1a14] hover:bg-[#e5c777]"
          >
            Write meeting log
          </button>
        </div>
      )}

      {uiState.asyncNoticeKind && asyncNoticeVisible && (
        <AsyncNotice
          notice={asyncNotices[uiState.asyncNoticeKind]}
          onClose={() => setAsyncNoticeVisible(false)}
        />
      )}

      {uiState.detailsPanelOpen && (
        <div data-igg-id="pagely.drag.blocker" onMouseDown={panel.onMouseDown} className="fixed z-40 w-[430px] cursor-grab rounded-xl border border-[#343434] bg-[#242424] shadow-2xl active:cursor-grabbing" style={{ left: panel.pos.x, top: panel.pos.y }}>
          <div className="flex items-center justify-between rounded-t-xl border-b border-[#343434] bg-[#2a2a2a] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#f0ece3]"><Icon name="drag" /> Page details</div>
            <span className="text-xs text-[#8f8b83]">Drag to reposition</span>
          </div>
          <div className="space-y-3 p-4 text-sm text-[#c8c1b6]">
            <div><div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8f8b83]">Assignees</div><div className="flex items-center gap-2">{["JR", "AR", "ML"].map((i) => <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b4a53] text-[10px] font-bold text-white">{i}</div>)}<span className="text-xs">Jamie Ross, Alex Rivera, Morgan Lee</span></div></div>
            <div><div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8f8b83]">Due date</div><div className="flex items-center gap-1.5"><Icon name="clock" /> Jun 30, 2026 · 5 days remaining</div></div>
            <div><div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#8f8b83]">Comments</div>{comments.map((c) => <div key={c.id} className="mb-2 rounded-md border border-[#303030] bg-[#1c1c1c] px-3 py-2"><div className="mb-0.5 flex items-center gap-1.5"><span className="text-xs font-semibold text-[#e7e2d8]">{c.author}</span><span className="text-xs text-[#8f8b83]">{c.date}</span></div><p className="text-xs">{c.text}</p></div>)}</div>
          </div>
        </div>
      )}
    </main>
  );
}

function AsyncNotice({
  notice,
  onClose,
}: {
  notice: (typeof asyncNotices)[keyof typeof asyncNotices];
  onClose: () => void;
}) {
  return (
    <div className="fixed right-5 top-[58px] z-50 w-[372px] overflow-hidden rounded-[10px] border border-[#3b3b38] bg-[#252522] text-sm text-[#ded7c9] shadow-[0_18px_50px_rgba(0,0,0,0.42)]">
      <div className="flex items-center gap-2 border-b border-[#33332f] bg-[#2b2b27] px-4 py-2.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#363630] text-[11px] font-bold text-[#d8d2c8]">P</div>
        <span className="text-xs font-medium text-[#a8a29a]">Pagely</span>
        <span className="h-1 w-1 rounded-full bg-[#5f5a52]" />
        <span className="text-xs text-[#8f8b83]">{notice.eyebrow}</span>
        <button onClick={onClose} className="ml-auto rounded p-1 text-[#8f8b83] hover:bg-[#3a3a36] hover:text-[#f0ece3]" aria-label="Dismiss notification">
          <Icon name="x" />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", notice.accent)}>
            <Icon name={notice.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-[#f3eee4]">{notice.title}</div>
                <div className="mt-1 text-xs leading-4 text-[#9f9a92]">{notice.body}</div>
              </div>
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d6b767]" />
            </div>
            <div className="mt-2 text-[11px] text-[#77716a]">{notice.meta}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-[#33332f] pt-3">
          <button
            data-igg-id={notice.secondaryId}
            data-igg-type="async_wait"
            data-igg-label={notice.secondaryLabel}
            onClick={onClose}
            className="flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium text-[#b9b4aa] hover:bg-[#33332f] hover:text-[#f0ece3]"
          >
            {notice.secondaryLabel}
          </button>
          <button
            data-igg-id={notice.primaryId}
            data-igg-type="async_wait"
            data-igg-label={notice.primaryLabel}
            onClick={onClose}
            className="ml-auto flex h-8 items-center justify-center rounded-md bg-[#e4dfd4] px-3.5 text-xs font-semibold text-[#1c1b18] hover:bg-[#f3eee4]"
          >
            {notice.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleBlock({ id, title, subtitle, open, onToggle, children }: { id: string; title: string; subtitle: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <button data-igg-id={id} onClick={onToggle} className="group mb-2 flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-[#242424]">
        <span className={cx("text-[#9b968e] transition-transform", open && "rotate-90")}><Icon name="chevron-right" /></span>
        <span className="text-2xl font-bold text-[#f0ece3]">{title}</span>
      </button>
      <div className="mb-3 pl-8 text-sm text-[#8f8b83]">{subtitle}</div>
      {open && <div className="pl-8">{children}</div>}
    </section>
  );
}

function NotionHeading({ children }: { children: React.ReactNode }) {
  return <div className="my-3 rounded bg-[#4b4526] px-2 py-1 text-xl font-bold text-[#f0ece3]">{children}</div>;
}

function Hyperlink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <button data-igg-id={id} className="mx-0.5 border-b border-[#7b7044] bg-[#3a3521] px-1 text-[#f0df9b] hover:bg-[#4a4227]">
      {children}
    </button>
  );
}

function TooltipButton({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <button data-igg-id={id} data-igg-type="hover_tooltip" data-igg-label={label} className="group group/tooltip relative flex h-8 w-8 items-center justify-center rounded-md text-[#a8a29a] hover:bg-[#2d2d2d] hover:text-[#f0ece3]">
      {children}
      <span className="pointer-events-none absolute right-0 top-9 z-50 hidden whitespace-nowrap rounded bg-[#2b2b2b] px-2 py-1 text-xs text-[#f0ece3] shadow-xl group-hover:block group-hover/tooltip:block">{label}</span>
    </button>
  );
}

function PropertyDropdown({ label, value, menuKey, activeMenu, setActiveMenu, items, badge }: { label: string; value: string; menuKey: string; activeMenu: MenuName; setActiveMenu: (menu: MenuName) => void; items: Array<[string, string]>; badge?: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
      <span className="text-[#8f8b83]">{label}</span>
      <div className="relative w-fit">
        <button data-igg-id={`pagely.property.${menuKey}.button`} data-igg-type="menu_reveal" data-igg-label={`${label} property`} onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)} className={cx("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[#d8d2c8] hover:bg-[#2d2d2d]", badge)}>
          {value}<Icon name="chev" />
        </button>
        <Dropdown open={activeMenu === menuKey} className="left-0 top-7 w-48">
          {items.map(([id, text]) => (
            <MenuItem key={id} id={id} type="menu_reveal" prereq={`pagely.property.${menuKey}.button`}>{text}</MenuItem>
          ))}
        </Dropdown>
      </div>
    </div>
  );
}

function SidebarPageRow({ page, index, activeMenu, setActiveMenu }: { page: typeof sidebarPages[number]; index: number; activeMenu: MenuName; setActiveMenu: (menu: MenuName) => void }) {
  const slug = page.title.toLowerCase().replaceAll(" ", "-");
  const menuKey = `sidebar-${slug}`;
  return (
    <div className="group group/sidebar relative flex items-center rounded-md hover:bg-[#2d2d2d]">
      <button data-igg-id={`pagely.sidebar.page.${slug}`} className={cx("flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", page.active && "bg-[#2b2b2b] text-[#f0ece3]")}>
        <span className="w-5 text-center text-sm">{page.icon}</span><span className="truncate">{page.title}</span>
      </button>
      <button data-igg-id={`pagely.sidebar.page.${slug}.more`} data-igg-type="hover_reveal" data-igg-prereq={`pagely.sidebar.page.${slug}`} data-igg-label={`More for ${page.title}`} onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)} className="mr-1 hidden h-6 w-6 items-center justify-center rounded text-[#8f8b83] hover:bg-[#3a3a3a] hover:text-[#f0ece3] group-hover:flex group-hover/sidebar:flex">
        <Icon name="more" />
      </button>
      <Dropdown open={activeMenu === menuKey} className="fixed left-[238px] z-[140] w-56" style={{ top: 255 + index * 33 }}>
        <MenuItem id={`pagely.sidebar.page.${slug}.rename`} type="menu_reveal" prereq={`pagely.sidebar.page.${slug}.more`}>Rename</MenuItem>
        <MenuItem id={`pagely.sidebar.page.${slug}.duplicate`} type="menu_reveal" prereq={`pagely.sidebar.page.${slug}.more`}>Duplicate</MenuItem>
        <MenuItem id={`pagely.sidebar.page.${slug}.copy-link`} type="menu_reveal" prereq={`pagely.sidebar.page.${slug}.more`}>Copy link</MenuItem>
        <MenuItem id={`pagely.sidebar.page.${slug}.delete`} type="menu_reveal" prereq={`pagely.sidebar.page.${slug}.more`}>Delete</MenuItem>
      </Dropdown>
    </div>
  );
}

function InlineComment({ id, active, onClick, author, date, text, compact = false }: { id: string; active: boolean; onClick: () => void; author: string; date: string; text: string; compact?: boolean }) {
  return (
    <div
      data-igg-id={id}
      onClick={onClick}
      className={cx(
        "group group/comment absolute left-[calc(100%+22px)] z-20 w-[255px] rounded-lg border p-3 text-left shadow-xl hover:z-[120]",
        compact ? "top-0" : "top-1",
        active ? "border-[#5a554c] bg-[#24231f]" : "border-[#343434] bg-[#202020] hover:bg-[#252525]"
      )}
    >
      <div className="mb-1 flex items-center gap-2 text-xs">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3b4a53] text-[9px] font-bold text-white">{author.split(" ").map((part) => part[0]).join("")}</span>
        <span className="font-semibold text-[#e7e2d8]">{author}</span>
        <span className="ml-auto text-[#8f8b83]">{date}</span>
      </div>
      <p className="text-xs leading-5 text-[#c8c1b6]">{text}</p>
      <div className="mt-2 hidden items-center gap-1 border-t border-[#343434] pt-2 group-hover:flex group-hover/comment:flex">
        <button data-igg-id={`${id}.reply`} data-igg-type="hover_reveal" data-igg-prereq={id} className="rounded px-2 py-1 text-[11px] font-medium text-[#b9b4aa] hover:bg-[#333333] hover:text-[#f0ece3]">Reply</button>
        <button data-igg-id={`${id}.resolve`} data-igg-type="hover_reveal" data-igg-prereq={id} className="rounded px-2 py-1 text-[11px] font-medium text-[#b9b4aa] hover:bg-[#333333] hover:text-[#f0ece3]">Resolve</button>
        <button data-igg-id={`${id}.delete`} data-igg-type="hover_reveal" data-igg-prereq={id} className="ml-auto rounded px-2 py-1 text-[11px] font-medium text-[#d27878] hover:bg-[#3a2525] hover:text-[#ffb0b0]">Delete</button>
      </div>
    </div>
  );
}
