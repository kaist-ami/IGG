"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getDevpadBenchmarkState, type DevpadBenchmarkState } from "./devpad-states";

declare global {
  interface Window {
    __DEVPAD_BENCHMARK_STATE__?: DevpadBenchmarkState;
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
  runtimeStateKey: "__DEVPAD_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type Menu = "file" | "view" | "terminal" | "source" | null;

function Icon({ name }: { name: "files" | "search" | "git" | "bug" | "extensions" | "play" | "gear" | "x" | "branch" | "split" | "panel" | "drag" }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    files: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /><path d="M4 6h2v16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    git: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 4 4v6" /><path d="M6 8v8" /></>,
    bug: <><rect x="7" y="8" width="10" height="12" rx="4" /><path d="M9 4l2 4M15 4l-2 4M4 13h3M17 13h3M5 19l3-2M19 19l-3-2" /></>,
    extensions: <><rect x="5" y="5" width="6" height="6" rx="1" /><rect x="13" y="5" width="6" height="6" rx="1" /><rect x="5" y="13" width="6" height="6" rx="1" /><rect x="13" y="13" width="6" height="6" rx="1" /></>,
    play: <polygon points="8 5 19 12 8 19 8 5" />,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3a7 7 0 0 0-1.7 1L5.1 6l-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    branch: <><path d="M6 3v12" /><circle cx="6" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M9 6h4a5 5 0 0 1 5 5v1" /><circle cx="18" cy="15" r="3" /></>,
    split: <><path d="M4 5h16M4 19h16M12 5v14" /></>,
    panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 14h18" /></>,
    drag: <><path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function TargetButton({ id, type, prereq, children, className, onClick, disabled }: { id: string; type?: string; prereq?: string; children: React.ReactNode; className?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      aria-disabled={disabled ? "true" : undefined}
      onClick={disabled ? undefined : onClick}
      className={cx("inline-flex h-8 items-center gap-2 rounded border border-[#3c3c3c] bg-[#2d2d30] px-3 text-xs font-medium text-[#cccccc] hover:border-[#007acc] hover:bg-[#37373d] hover:text-white", disabled && "cursor-wait opacity-50", className)}
    >
      {children}
    </button>
  );
}

function MenuItem({ id, type, prereq, children }: { id: string; type?: string; prereq?: string; children: React.ReactNode }) {
  return (
    <button data-igg-id={id} data-igg-type={type} data-igg-prereq={prereq} className="flex h-8 w-full items-center justify-between px-3 text-left text-xs text-[#d4d4d4] hover:bg-[#094771]">
      {children}
    </button>
  );
}

function FileRow({ depth, file, icon = "TS", id, className }: { depth: number; file: string; icon?: string; id?: string; className?: string }) {
  return (
    <div data-igg-id={id} className={cx("flex h-7 items-center gap-2 text-[#cccccc] hover:bg-[#2a2d2e]", className)} style={{ paddingLeft: 16 + depth * 16 }}>
      <span className={cx("shrink-0 text-[11px]", icon === "{}" ? "text-[#b5cea8]" : icon === "CSS" || icon === "YML" ? "text-[#ce9178]" : "text-[#d7ba7d]")}>{icon}</span>
      <span className="truncate">{file}</span>
    </div>
  );
}

function HoverFileRow({ depth, file, icon = "TS", rowId, previewId, renameId }: { depth: number; file: string; icon?: string; rowId: string; previewId: string; renameId: string }) {
  return (
    <div data-igg-id={rowId} className="group/hfr flex h-7 items-center gap-2 text-[#cccccc] hover:bg-[#2a2d2e]" style={{ paddingLeft: 16 + depth * 16 }}>
      <span className={cx("shrink-0 text-[11px]", icon === "{}" ? "text-[#b5cea8]" : icon === "CSS" || icon === "YML" ? "text-[#ce9178]" : "text-[#d7ba7d]")}>{icon}</span>
      <span className="flex-1 truncate">{file}</span>
      <div className="mr-1 flex items-center gap-0.5 opacity-0 group-hover/hfr:opacity-100">
        <button data-igg-id={previewId} data-igg-type="hover_reveal" data-igg-prereq={rowId} className="rounded px-1.5 py-0.5 text-[10px] text-[#858585] hover:bg-[#3a3d3e] hover:text-white">Open</button>
        <button data-igg-id={renameId} data-igg-type="hover_reveal" data-igg-prereq={rowId} className="rounded px-1.5 py-0.5 text-[10px] text-[#858585] hover:bg-[#3a3d3e] hover:text-white">Rename</button>
      </div>
    </div>
  );
}

function FolderRow({ depth, name, open, onClick, muted = false, id }: { depth: number; name: string; open: boolean; onClick: () => void; muted?: boolean; id?: string }) {
  return (
    <button data-igg-id={id} onClick={onClick} className={cx("flex h-7 w-full items-center gap-2 text-left hover:bg-[#2a2d2e]", muted ? "text-[#858585]" : "text-[#cccccc]")} style={{ paddingLeft: 16 + depth * 16 }}>
      <span className="w-4 shrink-0 text-[#858585]">{open ? "⌄" : "›"}</span>
      <span className={muted ? "text-[#858585]" : "text-[#c586c0]"}>{name}</span>
    </button>
  );
}

function Dropdown({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="absolute left-0 top-7 z-40 w-64 border border-[#454545] bg-[#252526] py-1 shadow-2xl">{children}</div>;
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

function useHorizontalResize(initial: number, min: number, max: number, direction: "left" | "right" = "right") {
  const [width, setWidth] = useState(initial);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);
  useEffect(() => {
    function move(event: MouseEvent) {
      if (!drag.current) return;
      const delta = direction === "right" ? event.clientX - drag.current.startX : drag.current.startX - event.clientX;
      setWidth(Math.max(min, Math.min(max, drag.current.startWidth + delta)));
    }
    function up() { drag.current = null; }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [direction, max, min]);
  return {
    width,
    onMouseDown: (event: React.MouseEvent) => {
      event.preventDefault();
      drag.current = { startX: event.clientX, startWidth: width };
    },
  };
}

function useVerticalResize(initial: number, min: number, max: number) {
  const [height, setHeight] = useState(initial);
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);
  useEffect(() => {
    function move(event: MouseEvent) {
      if (!drag.current) return;
      setHeight(Math.max(min, Math.min(max, drag.current.startHeight - (event.clientY - drag.current.startY))));
    }
    function up() { drag.current = null; }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
  }, [max, min]);
  return {
    height,
    onMouseDown: (event: React.MouseEvent) => {
      event.preventDefault();
      drag.current = { startY: event.clientY, startHeight: height };
    },
  };
}

const hoverTargets = [
  ["devpad.file.auth.open-preview", "Open Preview", "auth.ts"],
  ["devpad.file.auth.rename", "Rename", "auth.ts"],
  ["devpad.file.routes.open-preview", "Open Preview", "routes.ts"],
  ["devpad.file.routes.rename", "Rename", "routes.ts"],
  ["devpad.file.editorconfig.open-preview", "Open Preview", ".editorconfig"],
  ["devpad.file.editorconfig.rename", "Rename", ".editorconfig"],
  ["devpad.file.pipeline.open-preview", "Open Preview", "pipeline.yml"],
  ["devpad.file.pipeline.rename", "Rename", "pipeline.yml"],
] as const;

const tips = [
  { title: "TypeScript server finished indexing apps/devpad", target: "devpad.tip.billing.apply" },
  { title: "Workspace index is ready for packages/api", target: "devpad.tip.index.open" },
  { title: "Refactor preview generated for command bus", target: "devpad.tip.refactor.open" },
];

function DevpadContent() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getDevpadBenchmarkState(stateId), [stateId]);
  const uiState = initialState;
  const [activeMenu, setActiveMenu] = useState<Menu>(initialState.fileMenuOpen ? "file" : initialState.viewMenuOpen ? "view" : initialState.terminalMenuOpen ? "terminal" : initialState.sourceMenuOpen ? "source" : null);
  const [commandOpen, setCommandOpen] = useState(initialState.commandOpen);
  const [popupOpen, setPopupOpen] = useState(initialState.popupOpen);
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [uploadMidpoint, setUploadMidpoint] = useState(false);
  const [tipIndex, setTipIndex] = useState(initialState.tipIndex);
  const middleRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const blocker = useDraggablePanel({ x: 850, y: 560 });
  const leftPanel = useHorizontalResize(310, 220, 460);
  const rightPanel = useHorizontalResize(initialState.rightPanelCollapsed ? 104 : 360, 72, 520, "left");
  const terminalPanel = useVerticalResize(initialState.terminalPanelCollapsed ? 86 : 230, 64, 420);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [assistantTab, setAssistantTab] = useState<"chat" | "history">("chat");
  const [chatInput, setChatInput] = useState("");
  const [messageMenu, setMessageMenu] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState([
    { role: "User", time: "2:18 PM", text: "The DevPad screen still feels too flat. Can you make it closer to a real code editor?" },
    { role: "Review Assistant", time: "2:19 PM", text: "I added a persistent explorer, editor tabs, terminal panel, and a resizable assistant pane. The benchmark targets are still attached to the same controls." },
    { role: "User", time: "2:22 PM", text: "The left sidebar needs more project depth, not a fake tools block." },
    { role: "Review Assistant", time: "2:23 PM", text: "Agreed. I moved those actions into realistic project files under .vscode and config, then expanded lib, scripts, review, and dataset folders." },
    { role: "User", time: "2:27 PM", text: "The assistant panel also needs to look like an actual chat area." },
    { role: "Review Assistant", time: "2:28 PM", text: "I will keep the chat scrollable, add thread history, remove artificial numbering, and make the composer feel usable." },
  ]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    const preset = initialState.explorerPreset;
    const allOpen = initialState.allExplorerFoldersOpen || preset === "all";
    const appsMixed = preset === "appsMixed";
    const datasetClosed = preset === "datasetClosed";
    const scriptsClosed = preset === "scriptsClosed";
    const configClosed = preset === "configClosed";
    return {
      workspace: true,
      apps: !datasetClosed && !scriptsClosed && !configClosed,
      dayplan: allOpen || appsMixed,
      devhub: allOpen || appsMixed,
      devpad: true,
      gridly: allOpen,
      wayfind: allOpen,
      app: true,
      "dayplan.app": allOpen || appsMixed,
      "dayplan.components": allOpen || appsMixed,
      "dayplan.features": allOpen || appsMixed,
      "devhub.app": allOpen || appsMixed,
      "devhub.components": allOpen || appsMixed,
      "devhub.features": allOpen || appsMixed,
      "devpad.app": true,
      "devpad.components": true,
      "devpad.features": true,
      "gridly.app": allOpen,
      "gridly.components": allOpen,
      "gridly.features": allOpen,
      "wayfind.app": allOpen,
      "wayfind.components": allOpen,
      "wayfind.features": allOpen,
      components: true,
      features: true,
      lib: allOpen,
      scripts: allOpen,
      review: allOpen,
      interaction: allOpen,
      vscode: allOpen,
      config: allOpen,
      dataset: allOpen,
      openEditors: false,
    };
  });
  const toggleFolder = (folder: string) => setOpenFolders((current) => ({ ...current, [folder]: !current[folder] }));
  const collapseExplorerFolders = () => setOpenFolders((current) => Object.fromEntries(Object.keys(current).map((key) => [key, key === "workspace"])));
  const renderAppFolder = (app: "dayplan" | "devhub" | "devpad" | "gridly" | "wayfind") => {
    const open = openFolders[app];
    const depth = 1;
    const stateFile = `${app}-states.ts`;
    return (
      <div key={app}>
        <FolderRow depth={depth} name={app} open={open} onClick={() => toggleFolder(app)} id={`devpad.explorer.folder.${app}`} />
        {open && <>
          <FolderRow depth={depth + 1} name="app" open={openFolders[`${app}.app`] ?? true} onClick={() => toggleFolder(`${app}.app`)} id={`devpad.explorer.folder.${app}.app`} />
          {(openFolders[`${app}.app`] ?? true) && <>
            <FileRow depth={depth + 2} file="page.tsx" icon="TSX" id={app === "devpad" ? "devpad.explorer.src.app" : undefined} className={app === "devpad" ? "bg-[#37373d] text-white" : undefined} />
            <FileRow depth={depth + 2} file={stateFile} icon="TS" id={app === "devpad" ? "devpad.explorer.src.api" : `devpad.explorer.${app}.states`} />
            <FileRow depth={depth + 2} file="layout.tsx" icon="TSX" />
            <FileRow depth={depth + 2} file="globals.css" icon="CSS" />
          </>}
          <FolderRow depth={depth + 1} name="components" open={openFolders[`${app}.components`] ?? app === "devpad"} onClick={() => toggleFolder(`${app}.components`)} id={`devpad.explorer.folder.${app}.components`} />
          {(openFolders[`${app}.components`] ?? app === "devpad") && <>
            <FileRow depth={depth + 2} file="CommandPalette.tsx" icon="TSX" id={app === "devpad" ? "devpad.explorer.components.command" : undefined} />
            <FileRow depth={depth + 2} file="ResizablePanel.tsx" icon="TSX" id={app === "devpad" ? "devpad.explorer.components.resizable" : undefined} />
            <FileRow depth={depth + 2} file="StatusBadge.tsx" icon="TSX" id={app === "devpad" ? "devpad.explorer.components.badge" : `devpad.explorer.${app}.status-badge`} />
          </>}
          <FolderRow depth={depth + 1} name="features" open={openFolders[`${app}.features`] ?? app === "devpad"} onClick={() => toggleFolder(`${app}.features`)} id={`devpad.explorer.folder.${app}.features`} />
          {(openFolders[`${app}.features`] ?? app === "devpad") && <>
            <FileRow depth={depth + 2} file="reviewRunner.ts" icon="TS" id={app === "devpad" ? "devpad.explorer.features.review" : undefined} />
            <FileRow depth={depth + 2} file="searchIndex.ts" icon="TS" id={app === "devpad" ? "devpad.explorer.features.search" : undefined} />
            <FileRow depth={depth + 2} file="terminalPanel.ts" icon="TS" id={app === "devpad" ? "devpad.explorer.features.terminal" : undefined} />
            {app === "devpad" && <>
              <HoverFileRow depth={depth + 2} file="auth.ts" icon="TS" rowId="devpad.file.auth.ts" previewId="devpad.file.auth.open-preview" renameId="devpad.file.auth.rename" />
              <HoverFileRow depth={depth + 2} file="routes.ts" icon="TS" rowId="devpad.file.routes.ts" previewId="devpad.file.routes.open-preview" renameId="devpad.file.routes.rename" />
            </>}
          </>}
          {app === "devpad" && <>
            <HoverFileRow depth={depth + 1} file=".editorconfig" icon="YML" rowId="devpad.file.editorconfig" previewId="devpad.file.editorconfig.open-preview" renameId="devpad.file.editorconfig.rename" />
            <HoverFileRow depth={depth + 1} file="pipeline.yml" icon="YML" rowId="devpad.file.pipeline.yml" previewId="devpad.file.pipeline.open-preview" renameId="devpad.file.pipeline.rename" />
          </>}
          <FileRow depth={depth + 1} file="package.json" icon="{}" />
          <FileRow depth={depth + 1} file="tsconfig.json" icon="TS" />
        </>}
      </div>
    );
  };
  const sendChatMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatMessages((messages) => [
      ...messages,
      { role: "User", time: "now", text: trimmed },
      { role: "Review Assistant", time: "now", text: "Updated the DevPad mockup notes. I will keep the panel interactive and grounded in the current editor state." },
    ]);
    setChatInput("");
  };

  useEffect(() => { window.__DEVPAD_BENCHMARK_STATE__ = uiState; }, [uiState]);
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight });
  }, [chatMessages, assistantTab]);
  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __DEVPAD_BENCHMARK_STATE__?: Record<string, unknown> }).__DEVPAD_BENCHMARK_STATE__ ?? null;
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
    if (uiState.scrollTarget === "panel") panelRef.current?.scrollIntoView({ block: "center" });
  }, [uiState.scrollTarget]);
  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    setAsyncReady(false);
    setUploadMidpoint(false);
    const midpointTimer = window.setTimeout(() => setUploadMidpoint(true), Math.floor(uiState.asyncDelayMs / 2));
    const readyTimer = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => {
      window.clearTimeout(midpointTimer);
      window.clearTimeout(readyTimer);
    };
  }, [uiState.asyncDelayMs]);
  useEffect(() => {
    if (uiState.autoBannerDelayMs === null) return;
    const timer = window.setTimeout(() => setTipIndex(1), uiState.autoBannerDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.autoBannerDelayMs]);

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-[#0b0b0b] text-[#d4d4d4]">
      <div className="flex shrink-0 h-11 items-center border-b border-[#2b2b2b] bg-[#181818] px-4 text-xs text-[#cccccc] shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mr-5 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2 text-[#858585]">
          <button className="rounded px-2 py-1 hover:bg-[#2a2a2a]">‹</button>
          <button className="rounded px-2 py-1 hover:bg-[#2a2a2a]">›</button>
        </div>
        <button data-igg-id="devpad.command.open" onClick={() => setCommandOpen(true)} className="mx-auto flex h-7 w-[520px] items-center justify-center rounded-md border border-[#3c3c3c] bg-[#202020] text-sm text-[#cccccc] hover:bg-[#2a2a2a]">
          IGG-benchmark
        </button>
        <div className="w-[78px]" />
      </div>

      <header className="flex shrink-0 h-8 items-center border-b border-[#2b2b2b] bg-[#1f1f1f] text-xs text-[#cccccc]">
        <div className="flex h-full w-36 items-center pl-14 font-semibold text-white">Devpad</div>
        {["file", "view", "terminal", "source"].map((menu) => (
          <div key={menu} className="relative h-full">
            <button
              data-igg-id={`devpad.menu.${menu}`}
              onClick={() => setActiveMenu(activeMenu === menu ? null : menu as Menu)}
              className={cx("h-full px-3 capitalize hover:bg-[#505050]", activeMenu === menu && "bg-[#505050]")}
            >
              {menu === "source" ? "Source Control" : menu}
            </button>
            <Dropdown open={activeMenu === menu}>
              {menu === "file" && <>
                <MenuItem id="devpad.menu.file.new-window" type="menu_reveal" prereq="devpad.menu.file">New Window <span>Ctrl+Shift+N</span></MenuItem>
                <MenuItem id="devpad.menu.file.save-workspace" type="menu_reveal" prereq="devpad.menu.file">Save Workspace As...</MenuItem>
              </>}
              {menu === "view" && <>
                <MenuItem id="devpad.menu.view.toggle-minimap" type="menu_reveal" prereq="devpad.menu.view">Toggle Minimap</MenuItem>
                <MenuItem id="devpad.menu.view.open-problems" type="menu_reveal" prereq="devpad.menu.view">Problems Panel</MenuItem>
              </>}
              {menu === "terminal" && <>
                <MenuItem id="devpad.menu.terminal.run-build" type="menu_reveal" prereq="devpad.menu.terminal">Run Build</MenuItem>
                <MenuItem id="devpad.menu.terminal.kill-terminal" type="menu_reveal" prereq="devpad.menu.terminal">Kill Active Terminal</MenuItem>
              </>}
              {menu === "source" && <>
                <MenuItem id="devpad.menu.source.stage-all" type="menu_reveal" prereq="devpad.menu.source">Stage All Changes</MenuItem>
                <MenuItem id="devpad.menu.source.sync" type="menu_reveal" prereq="devpad.menu.source">Sync Changes</MenuItem>
              </>}
            </Dropdown>
          </div>
        ))}
        <div className="ml-auto mr-4" />
      </header>

      <section
        className="grid min-h-0 flex-1"
        style={{ gridTemplateColumns: `50px ${leftPanel.width}px 6px minmax(420px,1fr) 6px ${rightPanel.width}px` }}
      >
        <aside className="flex min-h-0 flex-col border-r border-[#252525] bg-[#181818]">
          <div className="flex-1">
            {[
              ["files", "devpad.activity.explorer", "", true],
              ["search", "devpad.activity.search", "", false],
              ["git", "devpad.activity.source", "8", false],
              ["bug", "devpad.activity.run", "", false],
              ["extensions", "devpad.activity.extensions", "", false],
            ].map(([icon, id, badge, active]) => {
              const labels: Record<string, string> = { files: "Explorer", search: "Search", git: "Source Control", bug: "Run & Debug", extensions: "Extensions" };
              return (
                <div key={id as string} className="group relative">
                  <button data-igg-id={id as string} className={cx("relative flex h-[54px] w-full items-center justify-center text-[#858585] hover:text-white", active && "text-white")}>
                    {active && <span className="absolute left-0 top-0 h-full w-0.5 bg-[#007acc]" />}
                    <Icon name={icon as "files"} />
                    {badge && <span className="absolute right-1 top-7 rounded-full bg-[#007acc] px-1.5 text-[10px] font-semibold text-white">{badge}</span>}
                  </button>
                  <div className="pointer-events-none absolute left-[52px] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded bg-[#252526] px-2 py-1 text-[11px] text-[#cccccc] shadow-lg ring-1 ring-[#454545] opacity-0 transition-opacity group-hover:opacity-100">{labels[icon as string]}</div>
                </div>
              );
            })}
          </div>
          <button className="flex h-[52px] w-full items-center justify-center text-[#858585] hover:text-white"><Icon name="gear" /></button>
        </aside>

        <aside data-igg-id="devpad.explorer.scroll" data-igg-scroll="explorer" className="devpad-scrollbar min-h-0 overflow-y-auto border-r border-[#252525] bg-[#1f1f1f] pb-20 text-[13px]">
          <div data-igg-id="devpad.explorer.header" className="group/eh flex h-10 items-center justify-between px-4 text-[11px] uppercase tracking-wide text-[#cccccc]">
            <span>Explorer</span>
            <div className="flex items-center gap-2 text-[#a8a8a8]">
              <div className="group relative"><button data-igg-id="devpad.explorer.new-file" data-igg-type="hover_reveal" data-igg-prereq="devpad.explorer.new-file" className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#2a2d2e] hover:text-white"><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg></button><div className="pointer-events-none absolute right-0 top-6 z-50 whitespace-nowrap rounded bg-[#252526] px-2 py-1 text-[11px] text-[#cccccc] shadow-lg ring-1 ring-[#454545] opacity-0 group-hover:opacity-100">New File</div></div>
              <div className="group relative"><button data-igg-id="devpad.explorer.new-folder" data-igg-type="hover_reveal" data-igg-prereq="devpad.explorer.new-folder" className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#2a2d2e] hover:text-white"><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg></button><div className="pointer-events-none absolute right-0 top-6 z-50 whitespace-nowrap rounded bg-[#252526] px-2 py-1 text-[11px] text-[#cccccc] shadow-lg ring-1 ring-[#454545] opacity-0 group-hover:opacity-100">New Folder</div></div>
              <div className="group relative"><button data-igg-id="devpad.explorer.refresh" data-igg-type="hover_reveal" data-igg-prereq="devpad.explorer.refresh" className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#2a2d2e] hover:text-white"><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button><div className="pointer-events-none absolute right-0 top-6 z-50 whitespace-nowrap rounded bg-[#252526] px-2 py-1 text-[11px] text-[#cccccc] shadow-lg ring-1 ring-[#454545] opacity-0 group-hover:opacity-100">Refresh</div></div>
              <div className="group relative"><button data-igg-id="devpad.explorer.collapse-all" data-igg-type="hover_reveal" data-igg-prereq="devpad.explorer.collapse-all" onClick={collapseExplorerFolders} className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#2a2d2e] hover:text-white"><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg></button><div className="pointer-events-none absolute right-0 top-6 z-50 whitespace-nowrap rounded bg-[#252526] px-2 py-1 text-[11px] text-[#cccccc] shadow-lg ring-1 ring-[#454545] opacity-0 group-hover:opacity-100">Collapse All</div></div>
            </div>
          </div>
          <div className="border-t border-[#2b2b2b]">
            <button onClick={() => toggleFolder("workspace")} className="flex h-8 w-full items-center justify-between px-4 text-left text-[12px] font-semibold uppercase text-[#cccccc] hover:bg-[#2a2d2e]">
              <span>{openFolders.workspace ? "⌄" : "›"} IGG-BENCHMARK</span>
              <span className="text-[#858585]">main*</span>
            </button>
            {openFolders.workspace && <>
              <button onClick={() => toggleFolder("claude")} className="flex h-7 w-full items-center gap-2 px-4 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">›</span><span className="text-[#c586c0]">.claude</span></button>
              <button onClick={() => toggleFolder("vscode")} className="flex h-7 w-full items-center gap-2 px-4 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">{openFolders.vscode ? "⌄" : "›"}</span><span className="text-[#c586c0]">.vscode</span></button>
              {openFolders.vscode && <>
                <FileRow depth={1} file="extensions.json" icon="{}" />
                <FileRow depth={1} file="launch.json" icon="{}" id="devpad.bottom.matcher.configure" />
                <FileRow depth={1} file="settings.json" icon="{}" id="devpad.bottom.profile.open" />
                <FileRow depth={1} file="keybindings.json" icon="{}" id="devpad.bottom.tests.run-all" />
              </>}
              <button data-igg-id="devpad.explorer.folder.apps" onClick={() => toggleFolder("apps")} className="flex h-7 w-full items-center gap-2 px-4 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">{openFolders.apps ? "⌄" : "›"}</span><span className="text-[#c586c0]">apps</span></button>
              {openFolders.apps && <>
                {(["dayplan", "devhub", "devpad", "gridly", "wayfind"] as const).map(renderAppFolder)}
              </>}
              <div ref={bottomRef}>
                <button data-igg-id="devpad.explorer.folder.config" onClick={() => toggleFolder("config")} className="flex h-7 w-full items-center gap-2 px-4 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">{openFolders.config ? "⌄" : "›"}</span><span className="text-[#c586c0]">config</span></button>
              </div>
              {openFolders.config && <>
                <FileRow depth={1} file="devcontainer.json" icon="{}" id="devpad.bottom.remote.attach" />
                <FileRow depth={1} file="docker-compose.yml" icon="YML" id="devpad.bottom.docker.switch" />
                <FileRow depth={1} file="ports.json" icon="{}" id="devpad.bottom.ports.add" />
                <FileRow depth={1} file="snippets.code-snippets" icon="{}" id="devpad.bottom.snippets.open" />
                <FileRow depth={1} file="workspace-trust.json" icon="{}" id="devpad.bottom.trust.manage" />
              </>}
              <button onClick={() => toggleFolder("lib")} className="flex h-7 w-full items-center gap-2 px-4 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">{openFolders.lib ? "⌄" : "›"}</span><span className="text-[#c586c0]">lib</span></button>
              {openFolders.lib && [
                ["review-runtime.ts", "devpad.explorer.lib.review-runtime"],
                ["interaction-contract.mjs", "devpad.explorer.lib.interaction-contract"],
                ["state-fixtures.ts", "devpad.explorer.lib.state-fixtures"],
                ["capture-driver.ts", "devpad.explorer.lib.capture-driver"],
                ["benchmark-schema.ts", "devpad.explorer.lib.benchmark-schema"],
              ].map(([file, id]) => (
                <div key={file} data-igg-id={id} className="flex h-7 items-center gap-2 px-8 text-[#cccccc] hover:bg-[#2a2d2e]">
                  <span className="text-[#d7ba7d]">{file.endsWith(".mjs") ? "JS" : "TS"}</span><span className="truncate">{file}</span>
                </div>
              ))}
              <button data-igg-id="devpad.explorer.folder.scripts" onClick={() => toggleFolder("scripts")} className="flex h-7 w-full items-center gap-2 px-4 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">{openFolders.scripts ? "⌄" : "›"}</span><span className="text-[#c586c0]">scripts</span></button>
              {openFolders.scripts && <>
                <button data-igg-id="devpad.explorer.folder.scripts.review" onClick={() => toggleFolder("review")} className="flex h-7 w-full items-center gap-2 px-8 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">{openFolders.review ? "⌄" : "›"}</span><span className="text-[#c586c0]">review</span></button>
                {openFolders.review && [
                  ["build-review-dataset.mjs", ""],
                  ["serve-review.mjs", ""],
                  ["validate-targets.mjs", ""],
                  ["capture-samples.mjs", ""],
                ].map(([file]) => (
                  <div key={file} data-igg-id={file === "capture-samples.mjs" ? "devpad.explorer.scripts.review.capture-samples" : undefined} className="flex h-7 items-center gap-2 px-12 text-[#cccccc] hover:bg-[#2a2d2e]">
                    <span className="text-[#d7ba7d]">JS</span><span className="truncate">{file}</span>
                  </div>
                ))}
              </>}
              <button data-igg-id="devpad.explorer.folder.dataset" onClick={() => toggleFolder("dataset")} className="flex h-7 w-full items-center gap-2 px-4 text-left text-[#cccccc] hover:bg-[#2a2d2e]"><span className="w-4 text-[#858585]">{openFolders.dataset ? "⌄" : "›"}</span><span className="text-[#c586c0]">dataset</span></button>
              {openFolders.dataset && <>
                {(["dayplan", "devhub", "devpad", "gridly", "wayfind"] as const).map((app) => (
                  <FileRow key={app} depth={1} file={`${app}-dataset.json`} icon="{}" id={`devpad.explorer.dataset.${app}`} />
                ))}
                <FileRow depth={1} file="mockup-guide.md" icon="MD" />
              </>}
              <div ref={middleRef} className="sr-only">
                {hoverTargets.map(([id, label, file]) => (
                  <button key={id} data-igg-id={id} data-igg-type="hover_reveal" data-igg-prereq={`devpad.file.${file}`}>{label}</button>
                ))}
              </div>
            </>}
          </div>
        </aside>

        <div
          data-igg-id="devpad.sidebar.left-resize"
          onMouseDown={leftPanel.onMouseDown}
          className="cursor-col-resize bg-[#1f1f1f] hover:bg-[#007acc]"
        />

        <section className="flex min-h-0 min-w-0 flex-col bg-[#1e1e1e]">
          <div className="border-b border-[#2b2b2b] bg-[#1e1e1e]">
            <div className="flex h-9 items-center bg-[#252526]">
              {["apps/devpad/app/page.tsx", "apps/devpad/app/devpad-states.ts", "scripts/review/build-review-dataset.mjs"].map((tab, index) => (
                <button key={tab} data-igg-id={`devpad.tab.${index}`} className={cx("flex h-full items-center gap-2 border-r border-[#2b2b2b] px-4 text-xs", index === 0 ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d30] text-[#aaaaaa] hover:text-white")}>
                  <span className={index === 2 ? "text-[#b5cea8]" : "text-[#d7ba7d]"}>{index === 2 ? "{}" : index === 0 ? "TSX" : "TS"}</span>
                  {tab.split("/").pop()}
                  {index === 2 && <span className="text-[#e2c08d]">M</span>}
                  <span className="text-[#858585]">×</span>
                </button>
              ))}
              <div className="ml-auto flex h-full items-center border-l border-[#3a3a3a] px-3">
                <TargetButton id="devpad.toolbar.run-tests" type="popup_occlusion" className="h-7 border-[#315f35] bg-[#1f3a24] text-[#d7f2d0] hover:border-[#4f8f54] hover:bg-[#284d2e]"><Icon name="play" />Run Preview</TargetButton>
                <button data-igg-id="devpad.toolbar.split-editor" type="button" className="sr-only">Split editor</button>
              </div>
            </div>
            <div className="flex h-7 items-center gap-2 border-t border-[#2b2b2b] px-4 text-xs text-[#9d9d9d]">
              <span>apps</span><span>›</span><span>devpad</span><span>›</span><span>app</span><span>›</span><span className="text-[#d4d4d4]">page.tsx</span>
            </div>
          </div>

          <div className="devpad-scrollbar min-h-0 flex-1 overflow-auto">
            <div className="code-lines min-h-[1120px] px-8 py-6 font-mono text-[13px] leading-7">
              {Array.from({ length: 54 }).map((_, index) => (
                <div key={index} className="grid grid-cols-[48px_1fr]">
                  <span className="select-none text-right text-[#6e7681]">{index + 1}</span>
                  <span className="pl-5">
                    {index % 5 === 0 && <><span className="text-[#569cd6]">export function</span> <span className="text-[#dcdcaa]">hydrateBenchmark</span><span className="text-[#cccccc]">() {"{"}</span></>}
                    {index % 5 === 1 && <><span className="text-[#9cdcfe]">const</span> <span className="text-[#4fc1ff]">trace</span> <span className="text-[#d4d4d4]">= await runner.capture(selector);</span></>}
                    {index % 5 === 2 && <><span className="text-[#c586c0]">if</span> <span className="text-[#d4d4d4]">(trace.ok) return trace.actions;</span></>}
                    {index % 5 === 3 && <span className="text-[#6a9955]">{"// Keep DOM annotations stable for evaluation."}</span>}
                    {index % 5 === 4 && <span className="text-[#d4d4d4]">{"}"}</span>}
                  </span>
                </div>
              ))}
            </div>

            <div ref={panelRef} className="sr-only">
              {[
                ["devpad.editor.quickfix.extract", "Extract function"],
                ["devpad.editor.quickfix.import", "Add missing import"],
                ["devpad.editor.quickfix.rename", "Rename symbol"],
                ["devpad.editor.quickfix.format", "Format document"],
                ["devpad.editor.quickfix.optimize", "Optimize imports"],
              ].map(([id, label]) => (
                <TargetButton key={id} id={id} type="drag_occlusion" className="h-12 justify-center text-sm">{label}</TargetButton>
              ))}
            </div>
          </div>

          <section className="shrink-0 overflow-hidden border-t border-[#333333] bg-[#181818]" style={{ height: terminalPanel.height }}>
            <div
              data-igg-id="devpad.bottom-panel.resize"
              onMouseDown={terminalPanel.onMouseDown}
              className="h-1.5 cursor-row-resize bg-[#242424] hover:bg-[#007acc]"
            />
            <div className="flex h-10 items-center gap-4 border-b border-[#333333] px-4 text-xs uppercase text-[#aaaaaa]">
              <span>Problems</span><span>Output</span><span className="text-white">Terminal</span>
              <TargetButton id="devpad.status.sync-extensions" type="async_wait" disabled={!asyncReady} className="ml-auto h-7">{asyncReady ? "Sync Extensions" : "Syncing..."}</TargetButton>
            </div>
            <div className="p-4">
              <pre className="overflow-hidden text-xs leading-6 text-[#c8c8c8]">{`$ pnpm test:ui\n PASS apps/devpad/app/page.test.tsx\n WARN review-runner: waiting for command palette target\n READY 35 annotated targets available`}</pre>
              <div className="mt-3 flex items-center justify-between rounded border border-[#5a3d1f] bg-[#2a2118] px-3 py-2 text-xs text-[#e7c18a]">
                <span className="truncate">FAILED scripts/review/validate-targets.mjs</span>
                <button data-igg-id="devpad.terminal.rerun-failed" className="ml-3 shrink-0 rounded bg-[#3a2a17] px-2 py-1 text-[#f1d29d] hover:bg-[#4a351d]">Rerun</button>
              </div>
              <div data-igg-id={tips[tipIndex].target} data-igg-type="auto_transition" className="mt-2 text-xs leading-5 text-[#858585]">
                {tips[tipIndex].title}
              </div>
            </div>
          </section>
        </section>

        <div
          data-igg-id="devpad.sidebar.right-resize"
          onMouseDown={rightPanel.onMouseDown}
          className="cursor-col-resize bg-[#1f1f1f] hover:bg-[#007acc]"
        />

        <aside className="flex min-h-0 flex-col border-l border-[#252525] bg-[#1f1f1f] text-[13px]">
          <div className="border-b border-[#2b2b2b]">
            <div data-igg-id="devpad.assistant.header" className="group/rah flex h-10 items-center justify-between px-4 text-[11px] font-semibold uppercase tracking-wide text-[#cccccc]">
              <span>Review Assistant</span>
              <div className="flex items-center gap-1 text-[#858585]">
                <div className="group relative">
                  <button data-igg-id="devpad.assistant.clear" data-igg-type="hover_reveal" data-igg-prereq="devpad.assistant.clear" onClick={() => setChatMessages([])} className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#2a2d2e] hover:text-white">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                  </button>
                  <div className="pointer-events-none absolute right-0 top-7 z-50 whitespace-nowrap rounded bg-[#1f1f1f] px-2 py-1 text-[11px] text-[#cccccc] shadow-lg ring-1 ring-[#454545] opacity-0 group-hover:opacity-100">Clear chat</div>
                </div>
                <div className="group relative">
                  <button data-igg-id="devpad.assistant.open-editor" data-igg-type="hover_reveal" data-igg-prereq="devpad.assistant.open-editor" className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#2a2d2e] hover:text-white">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                  </button>
                  <div className="pointer-events-none absolute right-0 top-7 z-50 whitespace-nowrap rounded bg-[#1f1f1f] px-2 py-1 text-[11px] text-[#cccccc] shadow-lg ring-1 ring-[#454545] opacity-0 group-hover:opacity-100">Open in editor</div>
                </div>
              </div>
            </div>
            <div className="flex h-9 items-end gap-1 px-3">
              {[
                ["chat", "Chat"],
                ["history", "History"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setAssistantTab(key as "chat" | "history")}
                  className={cx(
                    "h-8 rounded-t border border-b-0 px-3 text-xs",
                    assistantTab === key ? "border-[#3c3c3c] bg-[#252526] text-white" : "border-transparent text-[#858585] hover:text-white"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {assistantTab === "chat" ? (
            <>
              <div ref={chatScrollRef} data-igg-id="devpad.assistant.chat-scroll" className="devpad-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
                <div className="mb-4 rounded border border-[#333333] bg-[#252526] p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#cccccc]">
                    <span>Current context</span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#094771] px-2 py-0.5 text-[10px] text-white">page.tsx</span>
                      <button data-igg-id="devpad.assistant.context.copy" className="rounded border border-[#3c3c3c] px-2 py-0.5 text-[10px] text-[#cccccc] hover:border-[#555555] hover:bg-[#303033] hover:text-white">Copy</button>
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-[#bdbdbd]">Explorer, editor, terminal, and chat panes are active. Left and right sidebars are resizable.</p>
                </div>
                <div className="space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="rounded border border-dashed border-[#3c3c3c] p-4 text-xs leading-5 text-[#858585]">No messages in this thread.</div>
                  )}
                  {chatMessages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={cx("group relative rounded border p-3", message.role === "User" ? "border-[#333333] bg-[#181818]" : "border-[#3b3b3b] bg-[#262626]")}>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-[#858585]">
                        <span>{message.role}</span>
                        <div className="flex items-center gap-1.5">
                          <span>{message.time}</span>
                          <div className="relative">
                            <button
                              data-igg-id={`devpad.message.${index}.menu`}
                              data-igg-type="menu_reveal"
                              onClick={() => setMessageMenu(messageMenu === index ? null : index)}
                              className="rounded px-1 leading-none opacity-0 hover:bg-[#3a3a3a] group-hover:opacity-100"
                            >···</button>
                            {messageMenu === index && (
                              <div className="absolute right-0 top-5 z-50 w-36 overflow-hidden rounded border border-[#454545] bg-[#252526] shadow-xl">
                                <button data-igg-id={`devpad.message.${index}.edit`} data-igg-type="menu_reveal" data-igg-prereq={`devpad.message.${index}.menu`} onClick={() => setMessageMenu(null)} className="flex w-full px-3 py-1.5 text-left text-xs text-[#d4d4d4] hover:bg-[#094771]">Edit</button>
                                <button data-igg-id={`devpad.message.${index}.copy`} data-igg-type="menu_reveal" data-igg-prereq={`devpad.message.${index}.menu`} onClick={() => setMessageMenu(null)} className="flex w-full px-3 py-1.5 text-left text-xs text-[#d4d4d4] hover:bg-[#094771]">Copy</button>
                                <button data-igg-id={`devpad.message.${index}.delete`} data-igg-type="menu_reveal" data-igg-prereq={`devpad.message.${index}.menu`} onClick={() => { setChatMessages((prev) => prev.filter((_, i) => i !== index)); setMessageMenu(null); }} className="flex w-full px-3 py-1.5 text-left text-xs text-[#cc3333] hover:bg-[#094771] hover:text-white">Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs leading-5 text-[#d4d4d4]">{message.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#333333] p-3">
                <div className="rounded border border-[#3c3c3c] bg-[#181818]">
                  {uiState.asyncDelayMs !== null && (
                    <div className="border-b border-[#2b2b2b] px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[#d4d4d4]">mockup-guide.md</div>
                          <div className="text-[11px] text-[#858585]">{asyncReady ? "Upload complete · 18 KB" : "Uploading attachment · 18 KB"}</div>
                        </div>
                        <span data-igg-id="devpad.assistant.upload.status" data-igg-type="async_wait" className={cx("ml-3 rounded px-2 py-1 text-[11px]", asyncReady ? "bg-[#1f3a24] text-[#d7f2d0]" : "bg-[#3c3c3c] text-[#cccccc]")}>
                          {asyncReady ? "Ready" : "Uploading"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded bg-[#333333]">
                        <div className={cx("h-full rounded transition-all duration-500", asyncReady ? "w-full bg-[#4ec36b]" : uploadMidpoint ? "w-3/4 bg-[#0e639c]" : "w-1/2 bg-[#0e639c]")} />
                      </div>
                      <div className={cx("mt-2 flex min-h-[26px] flex-wrap gap-2 transition-opacity duration-150", asyncReady ? "opacity-100" : "pointer-events-none opacity-0")}>
                          <button data-igg-id="devpad.assistant.upload.review" data-igg-type="async_wait" disabled={!asyncReady} className="rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 text-[11px] font-semibold text-[#cccccc] hover:border-[#555555] hover:bg-[#303033] hover:text-white disabled:pointer-events-none">
                            Review uploaded file
                          </button>
                          <button data-igg-id="devpad.assistant.upload.summarize" data-igg-type="async_wait" disabled={!asyncReady} className="rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 text-[11px] font-semibold text-[#cccccc] hover:border-[#555555] hover:bg-[#303033] hover:text-white disabled:pointer-events-none">
                            Summarize attachment
                          </button>
                      </div>
                    </div>
                  )}
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) sendChatMessage();
                    }}
                    rows={3}
                    placeholder="Ask for follow-up changes"
                    className="block w-full resize-none bg-transparent px-3 py-2 text-xs leading-5 text-[#d4d4d4] outline-none placeholder:text-[#858585]"
                  />
                  <div className="flex items-center justify-between border-t border-[#2b2b2b] px-2 py-2">
                    <button className="rounded px-2 py-1 text-xs text-[#858585] hover:bg-[#2a2d2e] hover:text-white">Attach</button>
                    <button
                      data-igg-id="devpad.assistant.send"
                      data-igg-type={uiState.asyncDelayMs !== null ? "async_wait" : undefined}
                      aria-disabled={uiState.asyncDelayMs !== null && !asyncReady ? "true" : undefined}
                      onClick={uiState.asyncDelayMs !== null && !asyncReady ? undefined : sendChatMessage}
                      className={cx("rounded px-3 py-1.5 text-xs font-semibold text-white", uiState.asyncDelayMs !== null && !asyncReady ? "cursor-wait bg-[#3c3c3c] text-[#858585]" : "bg-[#0e639c] hover:bg-[#1177bb]")}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="devpad-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase text-[#858585]">Recent threads</div>
              {["Mockup guide cleanup", "DevPad sidebar pass", "Wayfind map review", "Gridly state fixes"].map((thread, index) => (
                <button key={thread} className="mb-2 block w-full rounded border border-[#333333] bg-[#252526] p-3 text-left hover:border-[#4a4a4a]">
                  <div className="text-xs font-semibold text-[#d4d4d4]">{thread}</div>
                  <div className="mt-1 text-[11px] text-[#858585]">{index + 2} messages · apps/devpad</div>
                </button>
              ))}
              <div className="mt-5">
                <div className="mb-2 text-[11px] font-semibold uppercase text-[#858585]">Changed files</div>
                {["apps/devpad/app/page.tsx", "apps/devpad/app/devpad-states.ts", "scripts/poc/run-devpad-poc.mjs"].map((file, index) => (
                  <div key={file} className="flex h-8 items-center gap-2 border-t border-[#2b2b2b] text-xs text-[#cccccc]">
                    <span className={index === 0 ? "text-[#e2c08d]" : "text-[#858585]"}>{index === 0 ? "M" : " "}</span>
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      <footer className="flex shrink-0 h-6 items-center justify-between bg-[#007acc] px-3 text-[11px] text-white">
        <div className="flex items-center gap-4">
          <span>main*</span>
          <span>0 errors</span>
          <span>0 warnings</span>
          <span>Dev Container: node</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 42, Col 18</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>TypeScript React</span>
        </div>
      </footer>

      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/35">
          <div className="mx-auto mt-24 w-[640px] overflow-hidden border border-[#454545] bg-[#252526] shadow-2xl">
            <div className="flex h-12 items-center border-b border-[#333333] px-4">
              <input autoFocus value=">" readOnly className="w-full bg-transparent text-lg text-[#d4d4d4] outline-none" />
              <button data-igg-id="devpad.command.close" onClick={() => setCommandOpen(false)} className="p-2 text-[#cccccc] hover:text-white"><Icon name="x" /></button>
            </div>
            <div className="py-2">
              <MenuItem id="devpad.command.git.checkout" type="menu_reveal" prereq="devpad.command.open">Git: Checkout to branch...</MenuItem>
              <MenuItem id="devpad.command.reload-window" type="menu_reveal" prereq="devpad.command.open">Developer: Reload Window</MenuItem>
            </div>
          </div>
        </div>
      )}

      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[520px] border border-[#454545] bg-[#252526] p-5 shadow-2xl">
            <div className="mb-2 text-lg font-semibold text-white">Workspace Trust</div>
            <p className="mb-5 text-sm text-[#c8c8c8]">Devpad has paused extensions until you confirm this folder is trusted.</p>
            <div className="flex justify-end gap-2">
              <TargetButton id="devpad.popup.dismiss" onClick={() => setPopupOpen(false)}>Continue in restricted mode</TargetButton>
              <TargetButton id="devpad.popup.trust" type="popup_occlusion">Trust Workspace</TargetButton>
            </div>
          </div>
        </div>
      )}

      {uiState.blockerOpen && (
        <div
          data-igg-id="devpad.blocker.terminal"
          style={{ left: blocker.pos.x, top: blocker.pos.y }}
          className="fixed z-40 w-[410px] border border-[#555] bg-[#111111] shadow-2xl"
        >
          <div data-igg-id="devpad.blocker.terminal.handle" onMouseDown={blocker.onMouseDown} className="flex h-10 cursor-move items-center justify-between bg-[#303030] px-3 text-xs text-[#eeeeee]">
            <span className="flex items-center gap-2"><Icon name="drag" />Floating Terminal</span>
            <span>node scripts/poc</span>
          </div>
          <pre className="p-4 text-xs leading-6 text-[#a6e22e]">{`watching app/devpad\ncompiled in 412ms\nmove this panel to reach quick fixes`}</pre>
        </div>
      )}
    </main>
  );
}

export default function DevpadPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#1e1e1e]" />}>
      <DevpadContent />
    </Suspense>
  );
}
