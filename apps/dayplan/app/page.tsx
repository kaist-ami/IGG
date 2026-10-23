"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getDayplanBenchmarkState, type DayplanBenchmarkState } from "./dayplan-states";

declare global {
  interface Window {
    __DAYPLAN_BENCHMARK_STATE__?: DayplanBenchmarkState;
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
  runtimeStateKey: "__DAYPLAN_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

function Icon({ name }: { name: "calendar" | "search" | "plus" | "chev" | "clock" | "video" | "bell" | "gear" | "x" | "users" | "pin" | "check" | "drag" }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chev: <path d="m8 10 4 4 4-4" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 3-7 6-7s6 3 6 7" /><path d="M16 11a3 3 0 1 0 0-6" /><path d="M18 20c0-2-.8-4-2.4-5.2" /></>,
    pin: <><path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    drag: <><path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

type Menu = "view" | "create" | "calendar" | "share" | null;

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
        "inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50",
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
  return <div className={cx("absolute z-40 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl", className)}>{children}</div>;
}

function MenuItem({ id, type, prereq, children }: { id: string; type?: string; prereq?: string; children: React.ReactNode }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      data-igg-label={typeof children === "string" ? children : undefined}
      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-blue-600 hover:text-white"
    >
      {children}
    </button>
  );
}

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

// May 2026: May 1 = Friday → grid starts Apr 26 (Sun)
const GRID_CELLS = Array.from({ length: 42 }, (_, i): { month: number; day: number; isCurrentMonth: boolean } => {
  if (i < 5) return { month: 4, day: 26 + i, isCurrentMonth: false };
  if (i < 36) return { month: 5, day: i - 4, isCurrentMonth: true };
  return { month: 6, day: i - 35, isCurrentMonth: false };
});

type MultiDayEvent = { id: string; title: string; startIdx: number; endIdx: number; color: string; date: string; location?: string; attendees?: number; note?: string };
type MonthEvent = { id: string; title: string; idx: number; color: string; time?: string; date?: string; zoomUrl?: string; location?: string; attendees?: number };

const multiDayEvents: MultiDayEvent[] = [
  { id: "iclr", title: "[ICLR] Main Conference", startIdx: 0, endIdx: 6, color: "bg-emerald-600", date: "Apr 26 - May 2", location: "Singapore Expo", attendees: 18, note: "Main conference week with poster sessions and partner meetings." },
  { id: "offsite", title: "Engineering Offsite", startIdx: 15, endIdx: 19, color: "bg-indigo-600", date: "May 11 - May 15", location: "Jeju Lab Retreat Center", attendees: 42, note: "Planning sessions, roadmap reviews, and team demos." },
  { id: "oncall", title: "Platform On-Call Rotation", startIdx: 22, endIdx: 26, color: "bg-rose-500", date: "May 18 - May 22", attendees: 5, note: "Primary incident rotation for inference platform releases." },
  { id: "prodcon", title: "ProdCon 2026", startIdx: 33, endIdx: 34, color: "bg-teal-600", date: "May 29 - May 30", location: "COEX Grand Ballroom", attendees: 12, note: "Product conference track and customer roundtables." },
];

const monthEvents: MonthEvent[] = [
  // Apr 27 Mon — idx 1
  { id: "apr27-vision", title: "Group-Vision Weekly", idx: 1, color: "bg-emerald-500", time: "10:00 AM", date: "Apr 27", zoomUrl: "zoom.us/j/101010101", attendees: 14 },
  { id: "apr27-roadmap", title: "Q2 Roadmap Sync", idx: 1, color: "bg-emerald-600", time: "2:00 PM", date: "Apr 27", zoomUrl: "zoom.us/j/202020202", attendees: 8 },
  { id: "apr27-1on1", title: "Jordan Kim 1:1", idx: 1, color: "bg-blue-500", time: "4:00 PM", date: "Apr 27", zoomUrl: "zoom.us/j/303030303", attendees: 2 },
  // Apr 28 Tue — idx 2
  { id: "apr28-neurips", title: "NeurIPS Submission Deadline", idx: 2, color: "bg-violet-600", time: "12:00 AM", date: "Apr 28", attendees: 0 },
  { id: "apr28-lang", title: "Group-Language Weekly", idx: 2, color: "bg-emerald-400", time: "9:00 AM", date: "Apr 28", zoomUrl: "zoom.us/j/404040404", attendees: 11 },
  { id: "apr28-grant", title: "Grant Sprint Kickoff", idx: 2, color: "bg-blue-500", time: "12:00 PM", date: "Apr 28", location: "Seminar Room B", attendees: 7 },
  // Apr 29 Wed — idx 3
  { id: "apr29-apex", title: "APEX Partner Sync", idx: 3, color: "bg-amber-500", time: "9:00 AM", date: "Apr 29", zoomUrl: "zoom.us/j/505050505", attendees: 5 },
  { id: "apr29-fund", title: "Funding Strategy Mtg", idx: 3, color: "bg-blue-500", time: "1:00 PM", date: "Apr 29", zoomUrl: "zoom.us/j/606060606", attendees: 6 },
  { id: "apr29-lumina", title: "Lumina AI Collab", idx: 3, color: "bg-slate-500", time: "3:00 PM", date: "Apr 29", zoomUrl: "zoom.us/j/707070707", attendees: 9 },
  // Apr 30 Thu — idx 4
  { id: "apr30-sprint", title: "Grant Sprint 106", idx: 4, color: "bg-blue-500", time: "10:30 AM", date: "Apr 30", location: "Room 201, E3", attendees: 7 },
  { id: "apr30-seminar", title: "Efficient Inference Seminar", idx: 4, color: "bg-emerald-500", time: "4:00 PM", date: "Apr 30", zoomUrl: "zoom.us/j/808080808", attendees: 30 },
  { id: "apr30-audio", title: "Group-Audiovisual Weekly", idx: 4, color: "bg-emerald-400", time: "7:30 PM", date: "Apr 30", zoomUrl: "zoom.us/j/909090909", attendees: 10 },
  // May 1 Fri — idx 5
  { id: "kickoff", title: "Team Launch Kickoff", idx: 5, color: "bg-blue-500", time: "2:00 PM", date: "May 1", location: "Auditorium B", attendees: 80 },
  // May 4 Mon — idx 8
  { id: "may4-splat", title: "SplatReasoner Rebuttal", idx: 8, color: "bg-indigo-500", time: "8:00 PM", date: "May 4", zoomUrl: "zoom.us/j/112233445", attendees: 5 },
  { id: "may4-failure", title: "Failure Analysis Review", idx: 8, color: "bg-rose-500", time: "10:00 PM", date: "May 4", zoomUrl: "zoom.us/j/223344556", attendees: 4 },
  // May 5 Tue — idx 9
  { id: "may5-neurips", title: "NeurIPS Submission", idx: 9, color: "bg-violet-600", time: "12:00 AM", date: "May 5", attendees: 0 },
  { id: "may5-lang", title: "Group-Language Weekly", idx: 9, color: "bg-emerald-400", time: "9:00 AM", date: "May 5", zoomUrl: "zoom.us/j/334455667", attendees: 11 },
  { id: "may5-plotopt", title: "PlotOpt Rebuttal", idx: 9, color: "bg-indigo-400", time: "2:30 PM", date: "May 5", zoomUrl: "zoom.us/j/445566778", attendees: 5 },
  // May 6 Wed — idx 10
  { id: "may6-grant", title: "Research Grant Review", idx: 10, color: "bg-green-500", time: "11:00 AM", date: "May 6", zoomUrl: "zoom.us/j/556677889", attendees: 8 },
  { id: "may6-render", title: "Rendering Pipeline Sync", idx: 10, color: "bg-emerald-500", time: "1:00 PM", date: "May 6", zoomUrl: "zoom.us/j/667788990", attendees: 6 },
  { id: "may6-partner", title: "Industry Partner Lecture", idx: 10, color: "bg-amber-500", time: "3:00 PM", date: "May 6", location: "Lecture Hall D", attendees: 45 },
  // May 7 Thu — idx 11
  { id: "may7-nexus", title: "Nexus Corp Site Visit", idx: 11, color: "bg-slate-500", time: "10:00 AM", date: "May 7", location: "Nexus HQ, Gangnam", attendees: 12 },
  { id: "hiring", title: "Hiring Panel", idx: 11, color: "bg-rose-600", time: "10:15 AM", date: "May 7", location: "Boardroom A", attendees: 6 },
  { id: "may7-render", title: "Rendering Pipeline Sync", idx: 11, color: "bg-emerald-500", time: "1:00 PM", date: "May 7", zoomUrl: "zoom.us/j/778899001", attendees: 6 },
  { id: "may7-temporal", title: "Temporal Memory Project", idx: 11, color: "bg-violet-400", time: "3:00 PM", date: "May 7", zoomUrl: "zoom.us/j/889900112", attendees: 7 },
  // May 8 Fri — idx 12
  { id: "may8-sprint", title: "Grant Sprint 106", idx: 12, color: "bg-blue-500", time: "10:30 AM", date: "May 8", location: "Room 201, E3", attendees: 7 },
  { id: "board-review", title: "Board Review", idx: 12, color: "bg-violet-600", time: "3:00 PM", date: "May 8", location: "Executive Suite", attendees: 8 },
  { id: "may8-openlab", title: "Open Lab Day", idx: 12, color: "bg-green-500", time: "4:00 PM", date: "May 8", location: "E3 Building Lobby", attendees: 60 },
  { id: "may8-seminar", title: "Efficient Inference Seminar", idx: 12, color: "bg-emerald-500", time: "4:00 PM", date: "May 8", zoomUrl: "zoom.us/j/990011223", attendees: 30 },
  { id: "may8-demo", title: "Demo Room Setup", idx: 12, color: "bg-slate-500", time: "5:30 PM", date: "May 8", location: "Executive Suite", attendees: 5 },
  // May 10 Sun — idx 14
  { id: "may10-vision", title: "Group-Vision Weekly", idx: 14, color: "bg-emerald-500", time: "10:00 AM", date: "May 10", zoomUrl: "zoom.us/j/101010201", attendees: 14 },
  { id: "may10-signal", title: "Signal Processing Collab", idx: 14, color: "bg-blue-400", time: "2:30 PM", date: "May 10", zoomUrl: "zoom.us/j/202020301", attendees: 5 },
  // May 11 Mon — idx 15
  { id: "may11-1on1", title: "Sophie Park 1:1", idx: 15, color: "bg-blue-400", time: "9:00 AM", date: "May 11", zoomUrl: "zoom.us/j/303030401", attendees: 2 },
  { id: "may11-lang", title: "Group-Language Weekly", idx: 15, color: "bg-emerald-400", time: "9:00 AM", date: "May 11", zoomUrl: "zoom.us/j/404040501", attendees: 11 },
  { id: "leadership", title: "Leadership Sync", idx: 15, color: "bg-blue-600", time: "9:30 AM", date: "May 11", zoomUrl: "zoom.us/j/823456789", attendees: 12 },
  { id: "may11-signal", title: "Signal Processing Collab", idx: 15, color: "bg-blue-400", time: "2:30 PM", date: "May 11", zoomUrl: "zoom.us/j/505050601", attendees: 5 },
  // May 12 Tue — idx 16
  { id: "may12-eccv", title: "ECCV Rebuttal Deadline", idx: 16, color: "bg-red-500", time: "6:00 AM", date: "May 12", attendees: 0 },
  { id: "may12-lang", title: "Group-Language Weekly", idx: 16, color: "bg-emerald-400", time: "9:00 AM", date: "May 12", zoomUrl: "zoom.us/j/606060701", attendees: 11 },
  { id: "may12-render", title: "Rendering Pipeline Sync", idx: 16, color: "bg-emerald-500", time: "1:00 PM", date: "May 12", zoomUrl: "zoom.us/j/707070801", attendees: 6 },
  // May 13 Wed — idx 17 (TODAY)
  { id: "design-review", title: "Design Review", idx: 17, color: "bg-emerald-600", time: "11:00 AM", date: "May 13", zoomUrl: "zoom.us/j/987654321", attendees: 8 },
  { id: "budget", title: "Budget Review", idx: 17, color: "bg-amber-500", time: "1:30 PM", date: "May 13", location: "Focus Room Cedar", attendees: 4 },
  { id: "may13-temporal", title: "Temporal Memory Project", idx: 17, color: "bg-violet-400", time: "3:00 PM", date: "May 13", zoomUrl: "zoom.us/j/808080901", attendees: 7 },
  { id: "may13-lumina", title: "Lumina AI Collab", idx: 17, color: "bg-slate-500", time: "3:00 PM", date: "May 13", zoomUrl: "zoom.us/j/909091001", attendees: 9 },
  { id: "may13-exec", title: "Executive Brief Prep", idx: 17, color: "bg-blue-500", time: "4:30 PM", date: "May 13", location: "Focus Room Pine", attendees: 3 },
  { id: "may13-retro", title: "Design Retro Notes", idx: 17, color: "bg-rose-400", time: "5:15 PM", date: "May 13", zoomUrl: "zoom.us/j/191919191", attendees: 6 },
  // May 14 Thu — idx 18
  { id: "may14-sprint", title: "Grant Sprint 106", idx: 18, color: "bg-blue-500", time: "10:30 AM", date: "May 14", location: "Room 201, E3", attendees: 7 },
  { id: "launch", title: "Launch Readiness", idx: 18, color: "bg-violet-600", time: "3:00 PM", date: "May 14", zoomUrl: "zoom.us/j/555444333", attendees: 15 },
  { id: "may14-seminar", title: "Efficient Inference Seminar", idx: 18, color: "bg-emerald-500", time: "4:00 PM", date: "May 14", zoomUrl: "zoom.us/j/010101101", attendees: 30 },
  // May 15 Fri — idx 19
  { id: "may15-scene", title: "Group-Scene Weekly", idx: 19, color: "bg-emerald-500", time: "9:00 AM", date: "May 15", zoomUrl: "zoom.us/j/111211301", attendees: 9 },
  { id: "pi-talk", title: "Director Singapore Talk", idx: 19, color: "bg-red-600", time: "10:00 AM", date: "May 15", location: "Auditorium Hall 3", attendees: 250 },
  { id: "neurips-bidding", title: "NeurIPS Review Bidding", idx: 19, color: "bg-emerald-700", time: "7:00 PM", date: "May 15", zoomUrl: "zoom.us/j/212312401", attendees: 3 },
  // May 16 Sat — idx 20
  { id: "g-monthly", title: "Monthly Roundtable", idx: 20, color: "bg-green-600", time: "9:00 AM", date: "May 16", zoomUrl: "zoom.us/j/313413501", attendees: 22 },
  // May 18 Mon — idx 22
  { id: "may18-lang", title: "Group-Language Weekly", idx: 22, color: "bg-emerald-400", time: "9:00 AM", date: "May 18", zoomUrl: "zoom.us/j/414514601", attendees: 11 },
  { id: "may18-grant", title: "Research Grant Review", idx: 22, color: "bg-green-500", time: "11:00 AM", date: "May 18", zoomUrl: "zoom.us/j/515615701", attendees: 8 },
  // May 19 Tue — idx 23
  { id: "may19-lang", title: "Group-Language Weekly", idx: 23, color: "bg-emerald-400", time: "9:00 AM", date: "May 19", zoomUrl: "zoom.us/j/616716801", attendees: 11 },
  { id: "all-hands", title: "All-Hands Meeting", idx: 23, color: "bg-blue-500", time: "10:00 AM", date: "May 19", zoomUrl: "zoom.us/j/111222333", attendees: 120 },
  { id: "may19-grant", title: "Research Grant Review", idx: 23, color: "bg-green-500", time: "11:00 AM", date: "May 19", zoomUrl: "zoom.us/j/717817901", attendees: 8 },
  // May 20 Wed — idx 24
  { id: "may20-render", title: "Rendering Pipeline Sync", idx: 24, color: "bg-emerald-500", time: "1:00 PM", date: "May 20", zoomUrl: "zoom.us/j/818918001", attendees: 6 },
  { id: "client-sync", title: "Client Sync", idx: 24, color: "bg-amber-500", time: "2:00 PM", date: "May 20", zoomUrl: "zoom.us/j/444555666", attendees: 5 },
  { id: "may20-temporal", title: "Temporal Memory Project", idx: 24, color: "bg-violet-400", time: "3:00 PM", date: "May 20", zoomUrl: "zoom.us/j/919019101", attendees: 7 },
  // May 21 Thu — idx 25
  { id: "may21-lumina", title: "Lumina AI Collab", idx: 25, color: "bg-slate-500", time: "3:00 PM", date: "May 21", zoomUrl: "zoom.us/j/020120201", attendees: 9 },
  { id: "may21-summit", title: "AI Frontiers Summit", idx: 25, color: "bg-indigo-500", time: "3:45 PM", date: "May 21", location: "COEX Hall A", attendees: 500 },
  { id: "may21-audio", title: "Group-Audiovisual Weekly", idx: 25, color: "bg-emerald-400", time: "7:30 PM", date: "May 21", zoomUrl: "zoom.us/j/121221301", attendees: 10 },
  { id: "may21-bench", title: "Benchmark Working Group", idx: 25, color: "bg-blue-400", time: "8:00 PM", date: "May 21", zoomUrl: "zoom.us/j/222322401", attendees: 5 },
  // May 22 Fri — idx 26
  { id: "may22-scene", title: "Group-Scene Weekly", idx: 26, color: "bg-emerald-500", time: "10:30 AM", date: "May 22", zoomUrl: "zoom.us/j/323423501", attendees: 9 },
  { id: "may22-robotics", title: "Robotics Collab", idx: 26, color: "bg-violet-500", time: "12:00 PM", date: "May 22", zoomUrl: "zoom.us/j/424524601", attendees: 7 },
  { id: "may22-lab", title: "Lab Meeting", idx: 26, color: "bg-blue-500", time: "1:00 PM", date: "May 22", location: "Seminar Room A", attendees: 18 },
  // May 23 Sat — idx 27
  { id: "may23-bmvc", title: "BMVC Abstract Deadline", idx: 27, color: "bg-teal-700", time: "9:00 PM", date: "May 23", attendees: 0 },
  // May 25 Mon — idx 29
  { id: "may25-vision", title: "Group-Vision Weekly", idx: 29, color: "bg-emerald-500", time: "10:00 AM", date: "May 25", zoomUrl: "zoom.us/j/525625701", attendees: 14 },
  { id: "may25-signal", title: "Signal Processing Collab", idx: 29, color: "bg-blue-400", time: "2:30 PM", date: "May 25", zoomUrl: "zoom.us/j/626726801", attendees: 5 },
  { id: "may25-1on1", title: "Alex & Maya 1:1", idx: 29, color: "bg-rose-400", time: "3:00 PM", date: "May 25", zoomUrl: "zoom.us/j/727827901", attendees: 3 },
  { id: "may25-bench", title: "Benchmark Sync", idx: 29, color: "bg-indigo-400", time: "5:30 PM", date: "May 25", zoomUrl: "zoom.us/j/828928001", attendees: 2 },
  // May 26 Tue — idx 30
  { id: "may26-lang", title: "Group-Language Weekly", idx: 30, color: "bg-emerald-400", time: "9:00 AM", date: "May 26", zoomUrl: "zoom.us/j/929029101", attendees: 11 },
  { id: "may26-grant", title: "Research Grant Review", idx: 30, color: "bg-green-500", time: "11:00 AM", date: "May 26", zoomUrl: "zoom.us/j/030130201", attendees: 8 },
  { id: "corl-abstract", title: "CoRL Abstract Deadline", idx: 30, color: "bg-teal-500", time: "9:00 PM", date: "May 26", attendees: 0 },
  // May 27 Wed — idx 31
  { id: "may27-poster", title: "Poster Forum Talk", idx: 31, color: "bg-blue-500", time: "11:30 AM", date: "May 27", location: "Atrium, E3", attendees: 35 },
  { id: "may27-render", title: "Rendering Pipeline Sync", idx: 31, color: "bg-emerald-500", time: "1:00 PM", date: "May 27", zoomUrl: "zoom.us/j/131231301", attendees: 6 },
  { id: "may27-temporal", title: "Temporal Memory Project", idx: 31, color: "bg-violet-400", time: "3:00 PM", date: "May 27", zoomUrl: "zoom.us/j/232332401", attendees: 7 },
  // May 28 Thu — idx 32
  { id: "ms-defense", title: "PhD Defense Panel", idx: 32, color: "bg-blue-600", time: "1:00 PM", date: "May 28", location: "Room 301, Bldg E3", attendees: 20 },
  { id: "may28-seminar", title: "Efficient Inference Seminar", idx: 32, color: "bg-emerald-500", time: "4:00 PM", date: "May 28", zoomUrl: "zoom.us/j/333433501", attendees: 30 },
  { id: "may28-audio", title: "Group-Audiovisual Weekly", idx: 32, color: "bg-emerald-400", time: "7:30 PM", date: "May 28", zoomUrl: "zoom.us/j/434534601", attendees: 10 },
  { id: "may28-bench", title: "Benchmark Working Group", idx: 32, color: "bg-blue-400", time: "8:00 PM", date: "May 28", zoomUrl: "zoom.us/j/535635701", attendees: 5 },
  // May 29 Fri — idx 33
  { id: "group-scene", title: "Group-Scene Weekly", idx: 33, color: "bg-emerald-500", time: "10:30 AM", date: "May 29", zoomUrl: "zoom.us/j/636736801", attendees: 9 },
  { id: "lab-meeting", title: "Lab Meeting", idx: 33, color: "bg-blue-500", time: "1:00 PM", date: "May 29", location: "Seminar Room A", attendees: 18 },
  { id: "corl-main", title: "CoRL Main Deadline", idx: 33, color: "bg-teal-600", time: "9:00 PM", date: "May 29", attendees: 0 },
  // May 30 Sat — idx 34
  { id: "bmvc-main", title: "BMVC Main & Supple Deadline", idx: 34, color: "bg-teal-700", time: "9:00 PM", date: "May 30", attendees: 0 },
  // Jun 1 Mon — idx 36
  { id: "jun1-cvpr", title: "CVPR Session Review", idx: 36, color: "bg-green-600", time: "9:00 AM", date: "Jun 1", zoomUrl: "zoom.us/j/737837901", attendees: 6 },
  { id: "jun1-lang", title: "Group-Language Weekly", idx: 36, color: "bg-emerald-400", time: "9:00 AM", date: "Jun 1", zoomUrl: "zoom.us/j/838938001", attendees: 11 },
  { id: "jun1-grant", title: "Research Grant Review", idx: 36, color: "bg-green-500", time: "11:00 AM", date: "Jun 1", zoomUrl: "zoom.us/j/939039101", attendees: 8 },
  // Jun 4 Thu — idx 39
  { id: "jun4-sprint", title: "Sprint Q2 Review", idx: 39, color: "bg-blue-500", time: "9:00 AM", date: "Jun 4", location: "Room 201, E3", attendees: 7 },
  { id: "igg-bench", title: "Benchmark Demo Day", idx: 39, color: "bg-indigo-600", time: "5:30 PM", date: "Jun 4", location: "Demo Lab A", attendees: 10 },
  // Jun 5 Fri — idx 40
  { id: "jun5-icjv", title: "Board Meeting @ CVF", idx: 40, color: "bg-violet-500", time: "2:45 AM", date: "Jun 5", zoomUrl: "zoom.us/j/040140201", attendees: 15 },
  { id: "jun5-corl", title: "CoRL Supp Deadline", idx: 40, color: "bg-teal-500", time: "9:00 PM", date: "Jun 5", attendees: 0 },
];


function getSegments(event: MultiDayEvent) {
  const startRow = Math.floor(event.startIdx / 7);
  const endRow = Math.floor(event.endIdx / 7);
  return Array.from({ length: endRow - startRow + 1 }, (_, i) => {
    const r = startRow + i;
    return { row: r, startCol: r === startRow ? event.startIdx % 7 : 0, endCol: r === endRow ? event.endIdx % 7 : 6, id: event.id, title: event.title, color: event.color };
  });
}

const allSegments = multiDayEvents.flatMap(getSegments);
const segmentsByRow = Array.from({ length: 6 }, (_, r) => allSegments.filter((s) => s.row === r));

const agendaRows = [
  ["Priya Shah", "Partner renewal call", "9:00 AM", "dayplan.agenda.priya.join"],
  ["Noah Kim", "Mobile launch retro", "10:30 AM", "dayplan.agenda.noah.join"],
  ["Iris Chen", "Q3 roadmap planning", "11:45 AM", "dayplan.agenda.iris.join"],
  ["Mateo Ruiz", "API incident review", "1:15 PM", "dayplan.agenda.mateo.join"],
  ["Sofia Lee", "Brand campaign handoff", "2:30 PM", "dayplan.agenda.sofia.join"],
  ["Evan Brooks", "Recruiting calibration", "4:00 PM", "dayplan.agenda.evan.join"],
  ["Leah Martin", "Support escalation review", "5:15 PM", "dayplan.agenda.leah.join"],
  ["Tara Singh", "Enterprise demo prep", "6:30 PM", "dayplan.agenda.tara.join"],
] as const;

const resources = [
  ["Boardroom A", "12 seats, Owl camera, whiteboard", "dayplan.resources.boardroom-a.reserve"],
  ["Focus Room Cedar", "2 seats, quiet booth", "dayplan.resources.cedar.reserve"],
  ["Studio North", "Lighting kit, podcast microphones", "dayplan.resources.studio-north.reserve"],
  ["Training Lab", "24 seats, projector wall", "dayplan.resources.training-lab.reserve"],
  ["Terrace Lounge", "Informal event setup", "dayplan.resources.terrace.reserve"],
  ["Client Suite", "Reception ready, catering station", "dayplan.resources.client-suite.reserve"],
  ["War Room Delta", "Incident bridge displays", "dayplan.resources.delta.reserve"],
  ["Wellness Room", "Private appointment room", "dayplan.resources.wellness.reserve"],
] as const;

const focusSlides = [
  { eyebrow: "Focus block", title: "Draft renewal strategy", target: "dayplan.focus.renewal.open" },
  { eyebrow: "Travel buffer", title: "Airport transfer window", target: "dayplan.focus.airport.open" },
  { eyebrow: "Prep reminder", title: "Board packet final review", target: "dayplan.focus.board-packet.open" },
];

export default function DayplanPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <DayplanApp />
    </Suspense>
  );
}

function DayplanApp() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getDayplanBenchmarkState(stateId), [stateId]);
  const [uiState, setUiState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState<Menu>(
    initialState.viewMenuOpen ? "view" :
    initialState.createMenuOpen ? "create" :
    initialState.calendarMenuOpen ? "calendar" :
    initialState.shareMenuOpen ? "share" : null,
  );
  const [popupOpen, setPopupOpen] = useState(initialState.popupOpen);
  const [searchOpen, setSearchOpen] = useState(initialState.searchOpen);
  const [eventPopup, setEventPopup] = useState<{ id: string; x: number; y: number } | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set());
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [joinReady, setJoinReady] = useState(initialState.joinAsyncTarget === null);
  const [slideIndex, setSlideIndex] = useState(initialState.bannerSlide);
  const [slideTimerReset, setSlideTimerReset] = useState(0);
  const agendaRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);
  const panel = useDraggablePanel({ x: 742, y: 210 });

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(
      initialState.viewMenuOpen ? "view" :
      initialState.createMenuOpen ? "create" :
      initialState.calendarMenuOpen ? "calendar" :
      initialState.shareMenuOpen ? "share" : null,
    );
    setPopupOpen(initialState.popupOpen);
    setSearchOpen(initialState.searchOpen);
    setEventPopup(null);
    setExpandedDays(new Set());
    setAsyncReady(initialState.asyncDelayMs === null);
    setJoinReady(initialState.joinAsyncTarget === null);
    setSlideIndex(initialState.bannerSlide);
    setSlideTimerReset(0);
  }, [initialState]);

  useEffect(() => {
    window.__DAYPLAN_BENCHMARK_STATE__ = uiState;
  }, [uiState]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __DAYPLAN_BENCHMARK_STATE__?: Record<string, unknown> }).__DAYPLAN_BENCHMARK_STATE__ ?? null;
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (uiState.scrollTarget === "middle") agendaRef.current?.scrollIntoView({ block: "center" });
    if (uiState.scrollTarget === "bottom") resourcesRef.current?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "join") joinRef.current?.scrollIntoView({ block: "center" });
  }, [uiState.scrollTarget]);

  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const timer = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.asyncDelayMs]);

  useEffect(() => {
    if (uiState.joinAsyncDelayMs === null) return;
    const timer = window.setTimeout(() => setJoinReady(true), uiState.joinAsyncDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.joinAsyncDelayMs]);

  useEffect(() => {
    if (!uiState.popupEventId) return;
    const el = document.querySelector(`[data-igg-id='dayplan.event.${uiState.popupEventId}.details']`) as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setEventPopup({ id: uiState.popupEventId, x: rect.right + 8, y: rect.top });
  }, [uiState.popupEventId]);

  useEffect(() => {
    if (uiState.autoBannerDelayMs === null) return;
    const timer = window.setTimeout(() => setSlideIndex((value) => (value + 1) % focusSlides.length), uiState.autoBannerDelayMs);
    return () => window.clearTimeout(timer);
  }, [uiState.autoBannerDelayMs, slideIndex, slideTimerReset]);

  function selectFocusSlide(index: number) {
    setSlideIndex(index);
    setSlideTimerReset((value) => value + 1);
  }

  const activeSlide = focusSlides[slideIndex];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Icon name="calendar" /></div>
          <div className="text-xl font-semibold">Dayplan</div>
          <Button id="dayplan.today.button" type="popup_occlusion" label="Today button">Today</Button>
          <div className="relative">
            <Button id="dayplan.view.button" type="menu_reveal" label="View menu" onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}>Month <Icon name="chev" /></Button>
            <Dropdown open={activeMenu === "view"}>
              <MenuItem id="dayplan.view.day" type="menu_reveal" prereq="dayplan.view.button">Day</MenuItem>
              <MenuItem id="dayplan.view.week" type="menu_reveal" prereq="dayplan.view.button">Week</MenuItem>
              <MenuItem id="dayplan.view.month" type="menu_reveal" prereq="dayplan.view.button">Month</MenuItem>
            </Dropdown>
          </div>
          <div className="relative">
            <Button id="dayplan.create.button" type="menu_reveal" label="Create menu" onClick={() => setActiveMenu(activeMenu === "create" ? null : "create")}><Icon name="plus" /> Create</Button>
            <Dropdown open={activeMenu === "create"}>
              <MenuItem id="dayplan.create.focus-block" type="menu_reveal" prereq="dayplan.create.button">Focus block</MenuItem>
              <MenuItem id="dayplan.create.appointment" type="menu_reveal" prereq="dayplan.create.button">Appointment schedule</MenuItem>
              <MenuItem id="dayplan.create.out-of-office" type="menu_reveal" prereq="dayplan.create.button">Out of office</MenuItem>
            </Dropdown>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button id="dayplan.sync.button" type="async_wait" label="Sync availability" disabled={!asyncReady}>
              {asyncReady ? <><Icon name="check" /> Sync availability</> : <><svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Syncing…</>}
            </Button>
            <Button id="dayplan.notifications.button" type="popup_occlusion" label="Notifications"><Icon name="bell" /></Button>
            <Button id="dayplan.settings.button" type="popup_occlusion" label="Settings"><Icon name="gear" /></Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-5">
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="text-sm font-semibold text-blue-700">May 2026</div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
              {GRID_CELLS.map((cell, index) => {
                const isMay15 = cell.month === 5 && cell.day === 15;
                const isToday = cell.month === 5 && cell.day === 13;
                return (
                  <button
                    key={`${cell.month}-${cell.day}-${index}`}
                    data-igg-id={isMay15 ? "dayplan.mini-calendar.may-15" : undefined}
                    className={cx(
                      "h-8 rounded-md text-sm hover:bg-white",
                      !cell.isCurrentMonth && "text-slate-300",
                      isToday && "bg-blue-600 font-medium text-white hover:bg-blue-700",
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>
          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Calendars</h2>
              <div className="relative">
                <button data-igg-id="dayplan.calendar.button" data-igg-type="menu_reveal" data-igg-label="Calendar menu" onClick={() => setActiveMenu(activeMenu === "calendar" ? null : "calendar")} className="rounded-md p-1 hover:bg-slate-100"><Icon name="chev" /></button>
                <Dropdown open={activeMenu === "calendar"} className="left-0">
                  <MenuItem id="dayplan.calendar.personal" type="menu_reveal" prereq="dayplan.calendar.button">Personal</MenuItem>
                  <MenuItem id="dayplan.calendar.product" type="menu_reveal" prereq="dayplan.calendar.button">Product Team</MenuItem>
                  <MenuItem id="dayplan.calendar.executive" type="menu_reveal" prereq="dayplan.calendar.button">Executive Briefings</MenuItem>
                </Dropdown>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {[
                ["Research meetings", "Group weekly, rendering, temporal", "bg-emerald-600", true],
                ["Lab operations", "Grant sprint, rooms, seminars", "bg-blue-600", true],
                ["Partners", "Nexus, Lumina, client sync", "bg-amber-500", true],
                ["Hiring and reviews", "Hiring panel, board, budget", "bg-rose-600", true],
                ["Deadlines", "NeurIPS, ECCV, CoRL, BMVC", "bg-teal-600", true],
              ].map(([name, meta, color, checked]) => (
                <button key={String(name)} data-igg-id={`dayplan.sidebar.${String(name).toLowerCase().replaceAll(" ", "-")}`} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50">
                  <span className={cx("flex h-4 w-4 items-center justify-center rounded border text-[10px] leading-none", checked === true ? `${String(color)} border-transparent text-white` : "border-slate-300 bg-white text-transparent")}>
                    ✓
                  </span>
                  <span className={cx("h-2.5 w-2.5 rounded-full", String(color))} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-700">{name}</span>
                    <span className="block truncate text-xs text-slate-400">{meta}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 border-t border-slate-100 pt-4">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-400">This week</div>
            {[
              ["Leadership Sync", "Mon 9:30 AM", "bg-blue-600"],
              ["Design Review", "Wed 11:00 AM", "bg-emerald-600"],
              ["Launch Readiness", "Thu 3:00 PM", "bg-violet-600"],
              ["Director Singapore Talk", "Fri 10:00 AM", "bg-red-600"],
            ].map(([name, meta, color]) => (
              <button key={name} data-igg-id={`dayplan.sidebar.${String(name).toLowerCase().replaceAll(" ", "-")}`} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50">
                <span className={cx("h-2.5 w-2.5 rounded-full", color as string)} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-700">{name}</span>
                  <span className="block truncate text-xs text-slate-400">{meta}</span>
                </span>
              </button>
            ))}
          </section>

          <section className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Rooms today</span>
              <span className="font-medium text-slate-700">May 13</span>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <button data-igg-id="dayplan.sidebar.room-cedar" className="flex w-full items-center justify-between rounded-md bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100">
                <span className="font-medium text-slate-700">Focus Room Cedar</span>
                <span className="text-slate-400">Budget Review</span>
              </button>
              <button data-igg-id="dayplan.sidebar.room-pine" className="flex w-full items-center justify-between rounded-md bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100">
                <span className="font-medium text-slate-700">Focus Room Pine</span>
                <span className="text-slate-400">Exec prep</span>
              </button>
            </div>
          </section>
        </aside>

        <div className="min-w-0">
          <section className="bg-white px-6 pb-2 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">May 2026</h1>
                <div className="flex gap-0.5">
                  <button data-igg-id="dayplan.nav.prev" className="rounded-md p-1.5 hover:bg-slate-100">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button data-igg-id="dayplan.nav.next" className="rounded-md p-1.5 hover:bg-slate-100">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
              <div className="relative">
                <Button id="dayplan.share.button" type="menu_reveal" label="Share menu" onClick={() => setActiveMenu(activeMenu === "share" ? null : "share")}><Icon name="users" /> Share</Button>
                <Dropdown open={activeMenu === "share"} className="right-0">
                  <MenuItem id="dayplan.share-public-link" type="menu_reveal" prereq="dayplan.share.button">Public booking link</MenuItem>
                  <MenuItem id="dayplan.share-team-availability" type="menu_reveal" prereq="dayplan.share.button">Team availability</MenuItem>
                </Dropdown>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">{d}</div>
                ))}
              </div>
              {Array.from({ length: 6 }, (_, rowIdx) => {
                const rowSegs = segmentsByRow[rowIdx];
                return (
                  <div key={rowIdx} className="relative grid grid-cols-7 border-b border-slate-200 last:border-b-0">
                    {rowSegs.map((seg, slotIdx) => (
                      <button
                        key={`${seg.id}-${rowIdx}`}
                        data-igg-id={`dayplan.multiday.${seg.id}`}
                        className={cx("absolute z-10 truncate rounded-sm px-2 py-0.5 text-left text-xs font-medium text-white shadow-sm hover:ring-2 hover:ring-slate-900/20", seg.color)}
                        style={{ left: `calc(${seg.startCol / 7 * 100}% + 3px)`, width: `calc(${(seg.endCol - seg.startCol + 1) / 7 * 100}% - 6px)`, top: 30 + slotIdx * 22 }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEventPopup(eventPopup?.id === seg.id ? null : { id: seg.id, x: rect.right + 8, y: rect.top });
                        }}
                      >
                        {seg.title}
                      </button>
                    ))}
                    {Array.from({ length: 7 }, (_, colIdx) => {
                      const idx = rowIdx * 7 + colIdx;
                      const cell = GRID_CELLS[idx];
                      const cellEvents = monthEvents.filter((e) => e.idx === idx);
                      const dayKey = `${cell.month}-${cell.day}`;
                      const isExpanded = expandedDays.has(dayKey);
                      const visibleEvents = isExpanded ? cellEvents : cellEvents.slice(0, 3);
                      const isToday = cell.month === 5 && cell.day === 13;
                      return (
                        <div key={colIdx} className={cx("min-h-[110px] border-r border-slate-100 p-1.5 last:border-r-0", !cell.isCurrentMonth && "bg-slate-50/60", isExpanded && "bg-blue-50/40 ring-1 ring-inset ring-blue-100")}>
                          <div className={cx("mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm", isToday ? "bg-blue-600 font-semibold text-white" : cell.isCurrentMonth ? "font-medium text-slate-700" : "text-slate-400")}>
                            {cell.day}
                          </div>
                          {rowSegs.length > 0 && <div style={{ height: rowSegs.length * 22 }} />}
                          <div className="space-y-0.5">
                            {visibleEvents.map((event) => (
                              <div key={event.id} data-igg-id={`dayplan.event.${event.id}`} className="relative">
                                <button
                                  data-igg-id={`dayplan.event.${event.id}.details`}
                                  data-igg-label={`Open ${event.title}`}
                                  className={cx("w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white hover:ring-2 hover:ring-slate-900/20", event.color)}
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setEventPopup(eventPopup?.id === event.id ? null : { id: event.id, x: rect.right + 8, y: rect.top });
                                  }}
                                >
                                  {event.time && <span className="mr-0.5 opacity-75">{event.time}</span>}
                                  {event.title}
                                </button>
                              </div>
                            ))}
                            {cellEvents.length > 3 && !isExpanded && (
                              <button
                                data-igg-id={`dayplan.overflow.${dayKey}`}
                                data-igg-type="menu_reveal"
                                data-igg-label={`Show ${cellEvents.length - 3} more events on ${cell.month}/${cell.day}`}
                                onClick={() => setExpandedDays((current) => new Set(current).add(dayKey))}
                                className="w-full rounded px-1.5 py-0.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              >
                                +{cellEvents.length - 3} more
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="px-6 py-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-blue-700">{activeSlide.eyebrow}</div>
                  <h2 className="mt-1 text-xl font-semibold">{activeSlide.title}</h2>
                </div>
                <div className="flex gap-1">
                  {focusSlides.map((slide, index) => (
                    <button key={slide.target} data-igg-id={`dayplan.focus.dot-${index + 1}`} onClick={() => selectFocusSlide(index)} className={cx("h-3 w-3 rounded-full border", slideIndex === index ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white")} />
                  ))}
                </div>
              </div>
              <button data-igg-id={activeSlide.target} data-igg-type={activeSlide.target.includes("board") ? "auto_transition" : undefined} data-igg-wait-ms={activeSlide.target.includes("board") ? "3600" : undefined} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Open focus block</button>
            </div>
          </section>

          <section ref={agendaRef} className="px-6 py-5">
            <div ref={joinRef} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold">Today&apos;s agenda</h2>
                <span className="text-sm text-slate-500">8 meetings</span>
              </div>
              <div className="divide-y divide-slate-100">
                {agendaRows.map(([person, title, time, id]) => (
                  <div key={id} data-igg-id={`${id}.row`} className="group grid grid-cols-[120px_1fr_120px_110px] items-center gap-4 px-5 py-4 hover:bg-slate-50">
                    <div className="text-sm font-medium text-slate-500">{time}</div>
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="text-sm text-slate-500">Hosted by {person}</div>
                    </div>
                    <button data-igg-id={`${id}.notes`} data-igg-type="hover_reveal" data-igg-prereq={`${id}.row`} data-igg-label={`Notes for ${person}'s meeting`} className="opacity-0 group-hover:opacity-100 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100">Notes</button>
                    {uiState.joinAsyncTarget === id ? (
                      <button data-igg-id={id} data-igg-type="async_wait" data-igg-label={`Join ${person}'s meeting`} disabled={!joinReady} className={`rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors ${joinReady ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"}`}>
                        {joinReady ? <><Icon name="video" /> Join</> : <><svg className="animate-spin inline-block mr-1" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Generating…</>}
                      </button>
                    ) : (
                      <button data-igg-id={id} data-igg-type={id.includes("mateo") || id.includes("sofia") || id.includes("evan") || id.includes("leah") || id.includes("tara") ? "drag_occlusion" : "hover_reveal"} data-igg-prereq={`${id}.row`} data-igg-label={`Join ${person}'s meeting`} className="opacity-0 group-hover:opacity-100 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"><Icon name="video" /> Join</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section ref={resourcesRef} className="px-6 py-5 pb-24">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Rooms and resources</h2>
                <Button id="dayplan.resources.filter">Filter</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {resources.map(([name, desc, id]) => (
                  <div key={id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 font-semibold"><Icon name="pin" /> {name}</div>
                    <p className="mt-1 text-sm text-slate-500">{desc}</p>
                    <button data-igg-id={id} data-igg-type="off_screen" data-igg-label={`Reserve ${name}`} className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Reserve</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 p-24">
          <div className="mx-auto w-[640px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-200 p-3">
              <Icon name="search" />
              <input data-igg-id="dayplan.search.input" className="h-10 flex-1 outline-none" defaultValue="renewal" />
              <button data-igg-id="dayplan.search.close" onClick={() => setSearchOpen(false)} className="rounded-md p-2 hover:bg-slate-100"><Icon name="x" /></button>
            </div>
            <button data-igg-id="dayplan.search.result-renewal" data-igg-type="menu_reveal" data-igg-prereq="dayplan.search.button" className="w-full px-4 py-3 text-left hover:bg-blue-600 hover:text-white">Partner renewal call</button>
            <button data-igg-id="dayplan.search.result-roadmap" data-igg-type="menu_reveal" data-igg-prereq="dayplan.search.button" className="w-full px-4 py-3 text-left hover:bg-blue-600 hover:text-white">Q3 roadmap planning</button>
          </div>
        </div>
      )}

      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[460px] rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">You have 6 upcoming reminders</h2>
                <p className="mt-2 text-sm text-slate-500">Includes prep blocks for Leadership sync and Board packet review.</p>
              </div>
              <button data-igg-id="dayplan.popup.close" onClick={() => setPopupOpen(false)} className="rounded-md p-2 hover:bg-slate-100"><Icon name="x" /></button>
            </div>
            <button data-igg-id="dayplan.popup.review" className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">View all reminders</button>
          </div>
        </div>
      )}

      {eventPopup && (() => {
        const event = monthEvents.find((e) => e.id === eventPopup.id) ?? multiDayEvents.find((e) => e.id === eventPopup.id);
        if (!event) return null;
        const clampedX = Math.min(eventPopup.x, window.innerWidth - 296);
        const clampedY = Math.min(eventPopup.y, window.innerHeight - 200);
        const isMultiDay = "startIdx" in event;
        return (
          <div
            data-igg-id={`dayplan.event.${eventPopup.id}.popup`}
            className="fixed z-50 w-72 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200"
            style={{ left: clampedX, top: clampedY }}
          >
            <div className={cx("px-4 py-3 text-white", event.color)}>
              <div className="text-base font-semibold">{event.title}</div>
              <div className="mt-0.5 text-xs opacity-85">{event.date}{!isMultiDay && event.time ? ` · ${event.time}` : ""}</div>
            </div>
            <div className="space-y-2 px-4 py-3">
              {isMultiDay && event.note && (
                <div className="rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                  {event.note}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon name="pin" /><span>{event.location}</span>
                </div>
              )}
              {!isMultiDay && event.zoomUrl && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon name="video" />
                  <span className="truncate">Online meeting</span>
                </div>
              )}
              {(event.attendees ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon name="users" /><span>{event.attendees} attendees</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {!isMultiDay && event.zoomUrl && (
                  <button data-igg-id={`dayplan.event.${eventPopup.id}.join`} className="flex-1 rounded-md bg-emerald-600 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                    Join Zoom meeting
                  </button>
                )}
                <button data-igg-id={`dayplan.event.${eventPopup.id}.close`} onClick={() => setEventPopup(null)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {uiState.dragPanelOpen && (
        <div
          data-igg-id="dayplan.drag.blocker"
          onMouseDown={panel.onMouseDown}
          className="fixed z-40 w-[430px] cursor-grab rounded-xl border border-slate-200 bg-white shadow-2xl active:cursor-grabbing"
          style={{ left: panel.pos.x, top: panel.pos.y }}
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 font-semibold"><Icon name="drag" /> Timezone compare</div>
            <span className="text-xs text-slate-500">PDT / KST / CET</span>
          </div>
          <div className="p-4 text-sm">
            <p className="text-slate-500">Drag this panel while comparing late-day meeting slots.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["PDT 2:30 PM", "KST 6:30 AM", "CET 11:30 PM"].map((time) => <div key={time} className="rounded-md bg-slate-100 p-2 text-center">{time}</div>)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
