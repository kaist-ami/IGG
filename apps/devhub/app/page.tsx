"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getDevhubBenchmarkState, type DevhubBenchmarkState } from "./devhub-states";

declare global {
  interface Window {
    __DEVHUB_BENCHMARK_STATE__?: DevhubBenchmarkState;
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
  runtimeStateKey: "__DEVHUB_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function Icon({ name }: { name: "repo" | "branch" | "code" | "pull" | "issue" | "check" | "bell" | "star" | "fork" | "file" | "folder" | "kebab" | "search" | "x" | "play" | "shield" }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    repo: <><path d="M5 4h11a3 3 0 0 1 3 3v13H7a2 2 0 0 1-2-2V4z" /><path d="M7 18V6" /><path d="M9 8h6" /></>,
    branch: <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M6 8.5v7" /><path d="M8.5 6H12a6 6 0 0 1 6 6v3.5" /></>,
    code: <><polyline points="8 7 3 12 8 17" /><polyline points="16 7 21 12 16 17" /><path d="M14 4 10 20" /></>,
    pull: <><circle cx="6" cy="18" r="2.5" /><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M6 8.5v7" /><path d="M8.5 6H18" /></>,
    issue: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    star: <polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 9 8.5 12 2" />,
    fork: <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M6 8.5c0 5 6 4 6 7" /><path d="M18 8.5c0 5-6 4-6 7" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
    folder: <path d="M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    kebab: <><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    play: <polygon points="8 5 19 12 8 19 8 5" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

type MenuName = "branch" | "code" | "filter" | "actions" | null;

const files: Array<{ kind: "folder" | "file"; name: string; message: string; time: string; id: string }> = [
  { kind: "folder", name: ".github", message: "Tighten preview workflow permissions", time: "35 minutes ago", id: "devhub.file.github" },
  { kind: "folder", name: ".changeset", message: "Prepare release notes for audit package", time: "1 hour ago", id: "devhub.file.changeset" },
  { kind: "folder", name: "apps", message: "Move route handlers behind workspace flags", time: "2 hours ago", id: "devhub.file.apps" },
  { kind: "folder", name: "packages", message: "Share command menu focus guards", time: "4 hours ago", id: "devhub.file.packages" },
  { kind: "folder", name: "services", message: "Add billing event replay worker", time: "5 hours ago", id: "devhub.file.services" },
  { kind: "folder", name: "infra", message: "Pin canary deployment pools", time: "yesterday", id: "devhub.file.infra" },
  { kind: "folder", name: "scripts", message: "Stabilize preview cleanup", time: "yesterday", id: "devhub.file.scripts" },
  { kind: "folder", name: "docs", message: "Document workspace bootstrap", time: "2 days ago", id: "devhub.file.docs" },
  { kind: "file", name: ".env.example", message: "Expose audit stream defaults", time: "2 days ago", id: "devhub.file.env-example" },
  { kind: "file", name: "next.config.ts", message: "Enable image allowlist", time: "2 days ago", id: "devhub.file.next-config" },
  { kind: "file", name: "package.json", message: "Bump Playwright traces", time: "3 days ago", id: "devhub.file.package-json" },
  { kind: "file", name: "turbo.json", message: "Cache route manifest checks", time: "3 days ago", id: "devhub.file.turbo-json" },
  { kind: "file", name: "README.md", message: "Refresh local setup notes", time: "last week", id: "devhub.file.readme" },
] as const;

const packages = [
  ["Billing Service", "Handles invoices, card updates, usage exports", "devhub.packages.billing.open"],
  ["Realtime Gateway", "WebSocket presence and review notifications", "devhub.packages.realtime.open"],
  ["Design Tokens", "Theme primitives for Shell and Docs surfaces", "devhub.packages.tokens.open"],
  ["Audit Pipeline", "Event compaction and retention policies", "devhub.packages.audit.open"],
] as const;

const issueRows = [
  ["Mina Patel", "Invoice export drops Korean customer names", "P1", "devhub.issues.mina.assign"],
  ["Owen Miller", "Search shortcut steals focus in modal", "P2", "devhub.issues.owen.assign"],
  ["Rosa Kim", "Review badge count stale after force push", "P2", "devhub.issues.rosa.assign"],
  ["Theo Grant", "Webhook retry timeline overflows on mobile", "P3", "devhub.issues.theo.assign"],
] as const;

const auditRows = [
  ["db/migrations/2026-05-01-add-review-locks.sql", "Add lock timeout fallback", "devhub.audit.review-locks.resolve"],
  ["apps/web/app/pull/[id]/timeline.tsx", "Memoize collapsed event groups", "devhub.audit.timeline.resolve"],
  ["packages/auth/src/session-store.ts", "Clamp stale token window", "devhub.audit.session.resolve"],
  ["apps/api/src/routes/check-runs.ts", "Retry provider 429 responses", "devhub.audit.checks.resolve"],
  ["packages/ui/src/components/command-menu.tsx", "Restore roving focus order", "devhub.audit.command.resolve"],
] as const;

const releaseSlides = [
  { label: "v2.18 canary", title: "Trace viewer snapshots are ready", target: "devhub.release.trace-viewer.open" },
  { label: "v2.19 beta", title: "Preview deploy metrics are live", target: "devhub.release.preview-metrics.open" },
  { label: "v2.20 rc", title: "Policy engine launch checklist", target: "devhub.release.policy-engine.open" },
];

const notificationItems = [
  ["devhub.notification.kai-review", "Kai Nakamura requested your review", "PR #4821 - repository header hydration"],
  ["devhub.notification.audit-failed", "Nightly audit workflow failed", "checks.yml needs attention"],
  ["devhub.notification.mina-mentioned", "Mina Patel mentioned you", "Invoice export triage thread"],
  ["devhub.notification.preview-ready", "Preview deploy is ready", "orbit-web-4821.vercel.app"],
  ["devhub.notification.security-alert", "New security alert opened", "lodash advisory requires review"],
] as const;

const fileTreeItems = [
  { depth: 0, kind: "folder", name: ".github", id: "devhub.tree.github" },
  { depth: 1, kind: "folder", name: "workflows", id: "devhub.tree.github.workflows" },
  { depth: 2, kind: "file", name: "audit.yml", id: "devhub.tree.github.workflows.audit" },
  { depth: 2, kind: "file", name: "preview.yml", id: "devhub.tree.github.workflows.preview" },
  { depth: 1, kind: "file", name: "CODEOWNERS", id: "devhub.tree.github.codeowners" },
  { depth: 0, kind: "folder", name: ".changeset", id: "devhub.tree.changeset" },
  { depth: 1, kind: "file", name: "config.json", id: "devhub.tree.changeset.config" },
  { depth: 0, kind: "folder", name: "apps", id: "devhub.tree.apps" },
  { depth: 1, kind: "folder", name: "devhub", id: "devhub.tree.apps.devhub" },
  { depth: 2, kind: "file", name: "page.tsx", id: "devhub.tree.apps.devhub.page" },
  { depth: 1, kind: "folder", name: "mailo", id: "devhub.tree.apps.mailo" },
  { depth: 2, kind: "file", name: "page.tsx", id: "devhub.tree.apps.mailo.page" },
  { depth: 1, kind: "folder", name: "youtube", id: "devhub.tree.apps.youtube" },
  { depth: 2, kind: "file", name: "youtube-states.ts", id: "devhub.tree.apps.youtube.states" },
  { depth: 0, kind: "folder", name: "packages", id: "devhub.tree.packages" },
  { depth: 1, kind: "folder", name: "auth", id: "devhub.tree.packages.auth" },
  { depth: 2, kind: "file", name: "session-store.ts", id: "devhub.tree.packages.auth.session" },
  { depth: 1, kind: "folder", name: "ui", id: "devhub.tree.packages.ui" },
  { depth: 2, kind: "file", name: "command-menu.tsx", id: "devhub.tree.packages.ui.command" },
  { depth: 0, kind: "folder", name: "services", id: "devhub.tree.services" },
  { depth: 1, kind: "folder", name: "billing", id: "devhub.tree.services.billing" },
  { depth: 2, kind: "file", name: "invoice-worker.ts", id: "devhub.tree.services.billing.invoice" },
  { depth: 0, kind: "folder", name: "infra", id: "devhub.tree.infra" },
  { depth: 1, kind: "file", name: "main.tf", id: "devhub.tree.infra.main" },
  { depth: 1, kind: "file", name: "variables.tf", id: "devhub.tree.infra.variables" },
  { depth: 0, kind: "folder", name: "scripts", id: "devhub.tree.scripts" },
  { depth: 1, kind: "folder", name: "review", id: "devhub.tree.scripts.review" },
  { depth: 2, kind: "file", name: "build-review-dataset.mjs", id: "devhub.tree.scripts.review.build" },
  { depth: 0, kind: "folder", name: "docs", id: "devhub.tree.docs" },
  { depth: 1, kind: "file", name: "architecture.md", id: "devhub.tree.docs.architecture" },
  { depth: 1, kind: "file", name: "contributing.md", id: "devhub.tree.docs.contributing" },
  { depth: 0, kind: "file", name: ".env.example", id: "devhub.tree.env-example" },
  { depth: 0, kind: "file", name: "next.config.ts", id: "devhub.tree.next-config" },
  { depth: 0, kind: "file", name: "package.json", id: "devhub.tree.package-json" },
  { depth: 0, kind: "file", name: "turbo.json", id: "devhub.tree.turbo-json" },
  { depth: 0, kind: "file", name: "README.md", id: "devhub.tree.readme" },
] as const;

function useDraggablePanel(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ startX: number; startY: number; panelX: number; panelY: number } | null>(null);

  useEffect(() => {
    function move(event: MouseEvent) {
      if (!drag.current) return;
      setPos({
        x: drag.current.panelX + event.clientX - drag.current.startX,
        y: drag.current.panelY + event.clientY - drag.current.startY,
      });
    }
    function up() {
      drag.current = null;
    }
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

function isTreeItemVisible(id: string, depth: number, openFolders: Set<string>): boolean {
  if (depth === 0) return true;
  const parts = id.split(".");
  for (let d = 0; d < depth; d++) {
    if (!openFolders.has(parts.slice(0, 3 + d).join("."))) return false;
  }
  return true;
}

function computeTreeMinWidth(openFolders: Set<string>): number {
  let maxDepth = 0;
  for (const item of fileTreeItems) {
    if (isTreeItemVisible(item.id, item.depth, openFolders)) {
      maxDepth = Math.max(maxDepth, item.depth);
    }
  }
  return [120, 148, 190, 240][Math.min(maxDepth, 3)];
}

const defaultOpenFolderIds = new Set(
  fileTreeItems.filter((i) => i.kind === "folder" && i.depth < 3).map((i) => i.id)
);

function useResizableWidth(initial: number, minWidth: number) {
  const [width, setWidth] = useState(initial);
  const drag = useRef<{ startX: number; width: number } | null>(null);
  const minRef = useRef(minWidth);

  useEffect(() => {
    minRef.current = minWidth;
    setWidth((w) => Math.max(minWidth, w));
  }, [minWidth]);

  useEffect(() => {
    function move(event: MouseEvent) {
      if (!drag.current) return;
      setWidth(Math.max(minRef.current, Math.min(360, drag.current.width + event.clientX - drag.current.startX)));
    }
    function up() {
      drag.current = null;
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, []);

  return {
    width,
    setWidth,
    onMouseDown: (event: React.MouseEvent) => {
      event.preventDefault();
      drag.current = { startX: event.clientX, width };
    },
  };
}

function Button({ id, type, prereq, label, children, className, onClick, disabled }: { id: string; type?: string; prereq?: string; label?: string; children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      data-igg-label={label}
      aria-disabled={disabled ? "true" : undefined}
      onClick={disabled ? undefined : onClick}
      className={cx(
        "inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-sm font-medium text-[#24292f] hover:bg-[#eef1f4]",
        disabled && "cursor-wait opacity-55",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Dropdown({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return (
    <div className={cx("absolute z-40 mt-2 w-64 overflow-hidden rounded-md border border-[#d0d7de] bg-white shadow-xl", className)}>
      {children}
    </div>
  );
}

function MenuItem({ id, type, prereq, children }: { id: string; type?: string; prereq?: string; children: React.ReactNode }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      data-igg-label={typeof children === "string" ? children : undefined}
      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#0969da] hover:text-white"
    >
      {children}
    </button>
  );
}

function FileTreeSidebar({ width, onResizeStart, openFolders, onToggleFolder }: { width: number; onResizeStart: (event: React.MouseEvent) => void; openFolders: Set<string>; onToggleFolder: (id: string) => void }) {
  return (
    <aside
      data-igg-id="devhub.file-tree.panel"
      className="sticky top-16 h-[calc(100vh-64px)] shrink-0 overflow-hidden border-r border-[#d0d7de] bg-white"
      style={{ width }}
    >
      <div className="flex h-full">
        <div className="min-w-0 flex-1">
          <div className="flex h-14 items-center justify-between border-b border-[#d0d7de] px-4">
            <div className="font-semibold">Files</div>
            <button data-igg-id="devhub.file-tree.collapse" className="rounded-md border border-[#d0d7de] px-2 py-1 text-xs text-[#57606a]">Tree</button>
          </div>
          <div className="border-b border-[#d0d7de] p-3">
            <button data-igg-id="devhub.file-tree.branch-main" className="flex w-full items-center justify-between rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-sm">
              <span className="truncate">main</span>
              <Icon name="branch" />
            </button>
          </div>
          <div className="h-[calc(100%-112px)] overflow-y-auto py-2 text-sm">
            {fileTreeItems.filter((item) => isTreeItemVisible(item.id, item.depth, openFolders)).map((item) => (
              <button
                key={item.id}
                data-igg-id={item.id}
                data-igg-type={item.kind === "file" ? "menu_reveal" : undefined}
                data-igg-prereq={item.kind === "file" && item.depth > 0 ? fileTreeItems.find(p => p.kind === "folder" && item.id.startsWith(p.id + ".") && p.depth === item.depth - 1)?.id : undefined}
                onClick={item.kind === "folder" ? () => onToggleFolder(item.id) : undefined}
                className="flex w-full min-w-[320px] items-center gap-2 px-3 py-1.5 text-left hover:bg-[#f6f8fa]"
                style={{ paddingLeft: 12 + item.depth * 18 }}
              >
                <Icon name={item.kind === "folder" ? "folder" : "file"} />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div
          data-igg-id="devhub.file-tree.resize-handle"
          data-igg-type="drag_occlusion"
          onMouseDown={onResizeStart}
          className="w-2 cursor-col-resize border-l border-[#d0d7de] bg-[#f6f8fa] hover:bg-[#ddf4ff]"
          aria-label="Resize file tree"
        />
      </div>
    </aside>
  );
}

function DevhubPage() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getDevhubBenchmarkState(stateId), [stateId]);
  const [uiState, setUiState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState<MenuName>(
    initialState.branchMenuOpen ? "branch" :
    initialState.codeMenuOpen ? "code" :
    initialState.filterMenuOpen ? "filter" :
    initialState.actionsMenuOpen ? "actions" : null,
  );
  const [quickOpen, setQuickOpen] = useState(initialState.quickSwitcherOpen);
  const [modalOpen, setModalOpen] = useState(initialState.blockingModalOpen);
  const [notificationsOpen, setNotificationsOpen] = useState(initialState.notificationsOpen);
  const [releaseSlide, setReleaseSlide] = useState(initialState.releaseSlide);
  const [releaseTimerReset, setReleaseTimerReset] = useState(0);
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [openFolders, setOpenFolders] = useState(new Set<string>());
  const treeMinWidth = useMemo(() => computeTreeMinWidth(openFolders), [openFolders]);
  const fileTree = useResizableWidth(initialState.fileTreeOpen ? 220 : 280, treeMinWidth);
  const middleRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const panel = useDraggablePanel({ x: 780, y: 210 });

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(
      initialState.branchMenuOpen ? "branch" :
      initialState.codeMenuOpen ? "code" :
      initialState.filterMenuOpen ? "filter" :
      initialState.actionsMenuOpen ? "actions" : null,
    );
    setQuickOpen(initialState.quickSwitcherOpen);
    setModalOpen(initialState.blockingModalOpen);
    setNotificationsOpen(initialState.notificationsOpen);
    setReleaseSlide(initialState.releaseSlide);
    setReleaseTimerReset(0);
    setAsyncReady(initialState.asyncDelayMs === null);
    setOpenFolders(new Set<string>());
    fileTree.setWidth(initialState.fileTreeOpen ? 220 : 280);
  }, [initialState]);

  useEffect(() => {
    window.__DEVHUB_BENCHMARK_STATE__ = uiState;
  }, [uiState]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __DEVHUB_BENCHMARK_STATE__?: Record<string, unknown> }).__DEVHUB_BENCHMARK_STATE__ ?? null;
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
    if (uiState.scrollTarget === "audit") auditRef.current?.scrollIntoView({ block: "center" });
  }, [uiState.scrollTarget]);

  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const timer = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.asyncDelayMs]);

  useEffect(() => {
    if (uiState.autoBannerDelayMs === null) return;
    const timer = window.setTimeout(() => {
      setReleaseSlide((current) => (current + 1) % releaseSlides.length);
    }, uiState.autoBannerDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.autoBannerDelayMs, releaseSlide, releaseTimerReset]);

  const slide = releaseSlides[releaseSlide];

  function selectReleaseSlide(index: number) {
    setReleaseSlide(index);
    setReleaseTimerReset((current) => current + 1);
  }

  function toggleFolder(id: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f8fa]">
      <header className="sticky top-0 z-30 border-b border-[#d0d7de] bg-[#24292f] text-white">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#24292f]"><Icon name="repo" /></div>
          <button data-igg-id="devhub.header.search" data-igg-type="menu_reveal" data-igg-label="Search field" onClick={() => setQuickOpen(true)} className="flex h-9 w-[360px] items-center gap-2 rounded-md border border-[#57606a] bg-[#1f2328] px-3 text-sm text-[#c9d1d9]">
            <Icon name="search" /> Search or jump to...
          </button>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <button data-igg-id="devhub.nav.pull-requests" className="rounded-md px-3 py-2 hover:bg-[#32383f]">Pull requests</button>
            <button data-igg-id="devhub.nav.issues" className="rounded-md px-3 py-2 hover:bg-[#32383f]">Issues</button>
            <button data-igg-id="devhub.nav.marketplace" className="rounded-md px-3 py-2 hover:bg-[#32383f]">Marketplace</button>
            <button data-igg-id="devhub.nav.explore" className="rounded-md px-3 py-2 hover:bg-[#32383f]">Explore</button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                data-igg-id="devhub.header.notifications"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative rounded-md p-2 hover:bg-[#32383f]"
              >
                <Icon name="bell" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#cf222e]" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-md border border-[#d0d7de] bg-white text-[#24292f] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-[#d0d7de] px-4 py-3">
                    <div className="font-semibold">Notifications</div>
                    <span className="rounded-full bg-[#ddf4ff] px-2 py-0.5 text-xs font-medium text-[#0969da]">Live</span>
                  </div>
                  {!asyncReady ? (
                    <div className="px-4 py-5">
                      <div className="flex items-center gap-3 text-sm font-medium text-[#24292f]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d0d7de] border-t-[#0969da]" />
                        Checking new repository activity
                      </div>
                      <div className="mt-4 space-y-3">
                        {[0, 1, 2].map((item) => (
                          <div key={item} className="flex items-start gap-3">
                            <div className="h-8 w-8 animate-pulse rounded-full bg-[#d8dee4]" />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="h-3 w-3/4 animate-pulse rounded bg-[#d8dee4]" />
                              <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#eaeef2]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#d8dee4]">
                      {notificationItems.map(([id, title, detail]) => (
                        <button
                          key={id}
                          data-igg-id={id}
                          data-igg-type="async_wait"
                          className="block w-full px-4 py-3 text-left hover:bg-[#f6f8fa]"
                        >
                          <div className="text-sm font-semibold text-[#24292f]">{title}</div>
                          <div className="mt-1 text-xs text-[#57606a]">{detail}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button data-igg-id="devhub.header.new" className="rounded-md px-3 py-2 text-sm hover:bg-[#32383f]">New</button>
            <button data-igg-id="devhub.header.avatar" className="h-8 w-8 rounded-full bg-[#2da44e] text-sm font-bold">AP</button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#d0d7de] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl">
              <Icon name="repo" />
              <span className="text-[#57606a]">aperture-labs</span>
              <span>/</span>
              <strong data-igg-id="devhub.repo.name">orbit</strong>
              <span className="rounded-full border border-[#d0d7de] px-2 py-0.5 text-xs text-[#57606a]">Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Button id="devhub.repo.watch" type="popup_occlusion" label="Watch button"><Icon name="bell" /> Watch</Button>
              <Button id="devhub.repo.star" type="popup_occlusion" label="Star button"><Icon name="star" /> Star</Button>
              <Button id="devhub.repo.fork" type="popup_occlusion" label="Fork button"><Icon name="fork" /> Fork</Button>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1 border-b border-[#d8dee4] text-sm">
            {["Code", "Issues", "Pull requests", "Actions", "Projects", "Wiki", "Security", "Insights"].map((tab) => (
              <button key={tab} data-igg-id={`devhub.tabs.${tab.toLowerCase().replaceAll(" ", "-")}`} className={cx("flex items-center gap-2 border-b-2 px-3 py-3", tab === "Code" ? "border-[#fd8c73] font-semibold" : "border-transparent text-[#57606a] hover:border-[#d0d7de]")}>
                {tab === "Issues" ? <Icon name="issue" /> : tab === "Pull requests" ? <Icon name="pull" /> : tab === "Actions" ? <Icon name="play" /> : tab === "Security" ? <Icon name="shield" /> : <Icon name="code" />}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={cx(uiState.fileTreeOpen ? "flex" : "mx-auto grid max-w-[1280px] grid-cols-[1fr_320px] gap-6 px-6 py-6")}>
        {uiState.fileTreeOpen && <FileTreeSidebar width={fileTree.width} onResizeStart={fileTree.onMouseDown} openFolders={openFolders} onToggleFolder={toggleFolder} />}
        <div className={cx(uiState.fileTreeOpen ? "grid min-w-0 flex-1 grid-cols-[1fr_320px] gap-6 px-6 py-6" : "contents")}>
        <div className="space-y-6">
          <section className="rounded-md border border-[#d0d7de] bg-white">
            <div className="flex items-center justify-between border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button id="devhub.branch.button" type="menu_reveal" label="Branch selector" onClick={() => setActiveMenu(activeMenu === "branch" ? null : "branch")}><Icon name="branch" /> main</Button>
                  <Dropdown open={activeMenu === "branch"}>
                    <MenuItem id="devhub.branch.release-2026" type="menu_reveal" prereq="devhub.branch.button">release/2026.05</MenuItem>
                    <MenuItem id="devhub.branch.feature-command-k" type="menu_reveal" prereq="devhub.branch.button">feature/command-k</MenuItem>
                    <MenuItem id="devhub.branch.hotfix-webhook-retry" type="menu_reveal" prereq="devhub.branch.button">hotfix/webhook-retry</MenuItem>
                  </Dropdown>
                </div>
                <Button id="devhub.branches.count">18 branches</Button>
                <Button id="devhub.tags.count">42 tags</Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button id="devhub.code.button" type="menu_reveal" label="Code menu" onClick={() => setActiveMenu(activeMenu === "code" ? null : "code")}><Icon name="code" /> Code</Button>
                  <Dropdown open={activeMenu === "code"} className="right-0">
                    <MenuItem id="devhub.code.clone-ssh" type="menu_reveal" prereq="devhub.code.button">Clone with SSH</MenuItem>
                    <MenuItem id="devhub.code.open-codespace" type="menu_reveal" prereq="devhub.code.button">Open in Codespaces</MenuItem>
                    <MenuItem id="devhub.code.download-zip" type="menu_reveal" prereq="devhub.code.button">Download ZIP</MenuItem>
                  </Dropdown>
                </div>
                <Button id="devhub.add-file">Add file</Button>
              </div>
            </div>
            <div className="grid grid-cols-[240px_1fr_92px] gap-3 border-b border-[#d8dee4] bg-[#f6f8fa] px-4 py-2 text-xs font-semibold text-[#57606a]">
              <div>Name</div>
              <div>Latest commit</div>
              <div className="text-right">Updated</div>
            </div>
            <div className="divide-y divide-[#d8dee4]">
              {files.map(({ kind, name, message, time, id }) => (
                <div key={id} data-igg-id={id} className="grid grid-cols-[240px_1fr_92px] items-center gap-3 px-4 py-3 text-sm hover:bg-[#f6f8fa]">
                  <div className="flex items-center gap-2 font-medium text-[#0969da]">{kind === "folder" ? <Icon name="folder" /> : <Icon name="file" />}{name}</div>
                  <div className="truncate text-[#57606a]">{message}</div>
                  <div className="text-right text-xs text-[#57606a]">{time}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-3 gap-4">
            {["Open pull requests", "Merged this week", "Checks passing"].map((title, index) => (
              <div key={title} className="rounded-md border border-[#d0d7de] bg-white p-4">
                <div className="text-sm text-[#57606a]">{title}</div>
                <div className="mt-2 text-3xl font-semibold">{[14, 38, "97%"][index]}</div>
                <button data-igg-id={`devhub.metrics.${index === 0 ? "open-prs" : index === 1 ? "merged" : "checks"}`} className="mt-3 text-sm font-medium text-[#0969da] hover:underline">View details</button>
              </div>
            ))}
          </section>

          <section ref={middleRef} className="rounded-md border border-[#d0d7de] bg-white">
            <div className="flex items-center justify-between border-b border-[#d0d7de] px-4 py-3">
              <h2 className="font-semibold">Pull request queue</h2>
              <div className="relative">
                <Button id="devhub.pr.filter.button" type="menu_reveal" label="Pull request filter menu" onClick={() => setActiveMenu(activeMenu === "filter" ? null : "filter")}>Filters</Button>
                <Dropdown open={activeMenu === "filter"} className="right-0">
                  <MenuItem id="devhub.pr.filter.needs-review" type="menu_reveal" prereq="devhub.pr.filter.button">Needs review</MenuItem>
                  <MenuItem id="devhub.pr.filter.checks-failing" type="menu_reveal" prereq="devhub.pr.filter.button">Checks failing</MenuItem>
                  <MenuItem id="devhub.pr.filter.assigned-to-me" type="menu_reveal" prereq="devhub.pr.filter.button">Assigned to me</MenuItem>
                </Dropdown>
              </div>
            </div>
            <div className="divide-y divide-[#d8dee4]">
              {[
                ["#4821", "Reduce hydration work in repository header", "Kai Nakamura", "devhub.pr.kai.review"],
                ["#4820", "Move release notes into signed artifacts", "Maya Singh", "devhub.pr.maya.review"],
                ["#4819", "Fix command menu focus restoration", "Jules Martin", "devhub.pr.jules.review"],
                ["#4818", "Add org-level webhook retry budget", "Nadia Park", "devhub.pr.nadia.review"],
              ].map(([num, title, person, id]) => (
                <div key={num} data-igg-id={`${id}.row`} className="group flex items-center gap-3 px-4 py-4 hover:bg-[#f6f8fa]">
                  <Icon name="pull" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-[#57606a]">{num} opened by {person} after 12 commits</div>
                  </div>
                  <button data-igg-id={id} data-igg-type="hover_reveal" data-igg-prereq={`${id}.row`} data-igg-label={`Review ${person}'s pull request`} className="opacity-0 group-hover:opacity-100 rounded-md bg-[#2da44e] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2c974b]">Review</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-[#d0d7de] bg-white">
            <div className="flex items-center justify-between border-b border-[#d0d7de] px-4 py-3">
              <h2 className="font-semibold">Issues needing triage</h2>
              <Button id="devhub.issues.new">New issue</Button>
            </div>
            <div className="divide-y divide-[#d8dee4]">
              {issueRows.map(([owner, title, priority, id]) => (
                <div key={id} data-igg-id={`${id}.row`} className="group flex items-center gap-3 px-4 py-4 hover:bg-[#f6f8fa]">
                  <Icon name="issue" />
                  <div className="flex-1">
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-[#57606a]">Reported by {owner} - {priority}</div>
                  </div>
                  <button data-igg-id={id} data-igg-type="hover_reveal" data-igg-prereq={`${id}.row`} data-igg-label={`Assign ${owner}'s issue`} className="opacity-0 group-hover:opacity-100 rounded-md border border-[#d0d7de] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#eef1f4]">Assign</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-[#d0d7de] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Release spotlight</h2>
              <div className="flex gap-1">
                {releaseSlides.map((item, index) => (
                  <button key={item.label} data-igg-id={`devhub.release.dot-${index + 1}`} onClick={() => selectReleaseSlide(index)} className={cx("h-3 w-3 rounded-full border", releaseSlide === index ? "border-[#0969da] bg-[#0969da]" : "border-[#d0d7de] bg-white")} />
                ))}
              </div>
            </div>
            <div key={releaseSlide} className="rounded-md border border-[#d8dee4] bg-gradient-to-r from-[#ddf4ff] to-white p-5 animate-[fadeIn_0.4s_ease]">
              <div className="text-sm font-semibold text-[#0969da]">{slide.label}</div>
              <div className="mt-1 text-2xl font-semibold">{slide.title}</div>
              <button data-igg-id={slide.target} data-igg-type="auto_transition" className="mt-4 rounded-md bg-[#0969da] px-4 py-2 text-sm font-medium text-white hover:bg-[#0759bd]">Open release brief</button>
            </div>
          </section>

          <section ref={auditRef} className="rounded-md border border-[#d0d7de] bg-white">
            <div className="flex items-center justify-between border-b border-[#d0d7de] px-4 py-3">
              <h2 className="font-semibold">Audit diff review</h2>
              <Button id="devhub.audit.run" type="async_wait" label="Run audit checks" disabled={!asyncReady}><Icon name="play" /> Run audit checks</Button>
            </div>
            <div className="divide-y divide-[#d8dee4]">
              {auditRows.map(([file, title, id]) => (
                <div key={id} className="grid grid-cols-[1fr_180px] gap-4 px-4 py-5">
                  <div>
                    <div className="font-mono text-sm text-[#0969da]">{file}</div>
                    <div className="mt-1 text-sm text-[#57606a]">{title}</div>
                    <div className="mt-3 rounded-md bg-[#f6f8fa] p-3 font-mono text-xs leading-6">
                      <div className="text-[#cf222e]">- const status = runProvider(payload)</div>
                      <div className="text-[#116329]">+ const status = await runProviderWithBackoff(payload)</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button data-igg-id={id} data-igg-type="drag_occlusion" data-igg-label={`Resolve ${title}`} className="rounded-md bg-[#2da44e] px-4 py-2 text-sm font-medium text-white hover:bg-[#2c974b]">Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section ref={bottomRef} className="space-y-4 pb-32">
            <h2 className="text-lg font-semibold">Packages and operations</h2>
            <div className="grid grid-cols-2 gap-4">
              {packages.map(([name, desc, id]) => (
                <div key={id} className="rounded-md border border-[#d0d7de] bg-white p-4">
                  <div className="font-semibold">{name}</div>
                  <p className="mt-1 text-sm text-[#57606a]">{desc}</p>
                  <button data-igg-id={id} data-igg-type="off_screen" data-igg-label={`Open ${name}`} className="mt-4 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 py-1.5 text-sm font-medium hover:bg-[#eef1f4]">Open package</button>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-[#d0d7de] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Repository operations</h2>
                  <p className="text-sm text-[#57606a]">Administrative shortcuts for maintainers.</p>
                </div>
                <div className="relative">
                  <Button id="devhub.repo.actions.button" type="menu_reveal" label="Repository actions menu" onClick={() => setActiveMenu(activeMenu === "actions" ? null : "actions")}><Icon name="kebab" /> Actions</Button>
                  <Dropdown open={activeMenu === "actions"} className="right-0">
                    <MenuItem id="devhub.repo.actions.transfer" type="menu_reveal" prereq="devhub.repo.actions.button">Transfer ownership</MenuItem>
                    <MenuItem id="devhub.repo.actions.archive" type="menu_reveal" prereq="devhub.repo.actions.button">Archive repository</MenuItem>
                  </Dropdown>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <button data-igg-id="devhub.ops.deployments" data-igg-type="off_screen" className="rounded-md border border-[#d0d7de] p-3 text-left hover:bg-[#f6f8fa]">Deployments</button>
                <button data-igg-id="devhub.ops.environments" data-igg-type="off_screen" className="rounded-md border border-[#d0d7de] p-3 text-left hover:bg-[#f6f8fa]">Environments</button>
                <button data-igg-id="devhub.ops.webhooks" data-igg-type="off_screen" className="rounded-md border border-[#d0d7de] p-3 text-left hover:bg-[#f6f8fa]">Webhooks</button>
                <button data-igg-id="devhub.ops.security-log" data-igg-type="off_screen" className="rounded-md border border-[#d0d7de] p-3 text-left hover:bg-[#f6f8fa]">Security log</button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-[#d0d7de] bg-white p-4">
            <h2 className="font-semibold">About</h2>
            <p className="mt-2 text-sm text-[#57606a]">Production repository for Orbit, a collaboration suite used by engineering, support, and design teams.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {["typescript", "nextjs", "playwright", "design-systems"].map((topic) => (
                <button key={topic} data-igg-id={`devhub.topic.${topic}`} data-igg-type={topic === "typescript" || topic === "nextjs" ? "drag_occlusion" : topic === "playwright" ? "popup_occlusion" : undefined} className="rounded-full bg-[#ddf4ff] px-2 py-1 text-[#0969da]">{topic}</button>
              ))}
            </div>
          </section>
          <section className="rounded-md border border-[#d0d7de] bg-white p-4">
            <h2 className="font-semibold">Contributors</h2>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {["AP", "MS", "KN", "JP", "RM", "TG", "NK", "OM", "LC", "IR"].map((name) => (
                <button key={name} data-igg-id={`devhub.contributor.${name.toLowerCase()}`} className="h-9 rounded-full bg-[#dbeafe] text-xs font-bold text-[#0969da] hover:ring-2 hover:ring-[#0969da]">{name}</button>
              ))}
            </div>
          </section>
          <section className="rounded-md border border-[#d0d7de] bg-white p-4">
            <h2 className="font-semibold">Security</h2>
            <button data-igg-id="devhub.security.dependabot" data-igg-type="popup_occlusion" className="mt-3 w-full rounded-md border border-[#d0d7de] px-3 py-2 text-left text-sm hover:bg-[#f6f8fa]">Dependabot alerts</button>
            <button data-igg-id="devhub.security.code-scanning" data-igg-type="popup_occlusion" className="mt-2 w-full rounded-md border border-[#d0d7de] px-3 py-2 text-left text-sm hover:bg-[#f6f8fa]">Code scanning alerts</button>
          </section>
        </aside>
        </div>
      </div>

      {quickOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 p-24">
          <div className="mx-auto w-[640px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#d0d7de] p-3">
              <Icon name="search" />
              <input data-igg-id="devhub.quick.input" className="h-10 flex-1 outline-none" defaultValue="orbit" />
              <button data-igg-id="devhub.quick.close" onClick={() => setQuickOpen(false)} className="rounded-md p-2 hover:bg-[#f6f8fa]"><Icon name="x" /></button>
            </div>
            <div className="divide-y divide-[#d8dee4]">
              <button data-igg-id="devhub.quick.result-pr-4821" data-igg-type="menu_reveal" data-igg-prereq="devhub.header.search" className="w-full px-4 py-3 text-left hover:bg-[#0969da] hover:text-white">Pull request #4821 - repository header hydration</button>
              <button data-igg-id="devhub.quick.result-actions" data-igg-type="menu_reveal" data-igg-prereq="devhub.header.search" className="w-full px-4 py-3 text-left hover:bg-[#0969da] hover:text-white">Actions - nightly audit workflow</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24292f]/45 backdrop-blur-sm animate-[fadeIn_0.25s_ease]">
          <div className="w-[480px] rounded-lg bg-white p-6 shadow-2xl animate-[fadeIn_0.3s_ease]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Dependabot alert: high severity</h2>
                <p className="mt-2 text-sm text-[#57606a]">A high-severity vulnerability was found in <code className="rounded bg-[#f6f8fa] px-1 py-0.5 font-mono text-xs">lodash@4.17.20</code> (CVE-2021-23337). This affects 3 workflows in this repository.</p>
              </div>
              <button data-igg-id="devhub.modal.close" onClick={() => setModalOpen(false)} className="rounded-md p-2 hover:bg-[#f6f8fa]"><Icon name="x" /></button>
            </div>
            <button data-igg-id="devhub.modal.review" className="mt-5 rounded-md bg-[#cf222e] px-4 py-2 text-sm font-medium text-white">View Dependabot alert</button>
          </div>
        </div>
      )}

      {uiState.reviewPanelOpen && (
        <div
          data-igg-id="devhub.review.blocker"
          onMouseDown={panel.onMouseDown}
          className="fixed z-40 w-[430px] cursor-grab rounded-lg border border-[#d0d7de] bg-white shadow-2xl active:cursor-grabbing"
          style={{ left: panel.pos.x, top: panel.pos.y }}
        >
          <div className="flex items-center justify-between border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-3">
            <div className="font-semibold">Morgan Reed requested changes</div>
            <Icon name="kebab" />
          </div>
          <div className="p-4 text-sm">
            <p className="text-[#57606a]">Please resolve the highlighted diff items before merging the audit hardening branch.</p>
            <div className="mt-4 rounded-md bg-[#fff8c5] p-3">Check retry logic and session clamp behavior before approving.</div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border border-[#d0d7de] px-3 py-1.5">Comment</button>
              <button className="rounded-md bg-[#cf222e] px-3 py-1.5 text-white">Request changes</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f8fa]" />}>
      <DevhubPage />
    </Suspense>
  );
}
