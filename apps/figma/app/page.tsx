"use client";

import { createPortal } from "react-dom";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { createReviewRuntime } from "../../../lib/review-runtime";

function resolveReviewElement(selector?: string | null) {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
}

function buildReviewSelector(element: HTMLElement | null) {
  if (!element) return null;
  const tagged = element.closest("[data-igg-id]") as HTMLElement | null;
  if (tagged?.getAttribute("data-igg-id")) return `[data-igg-id='${tagged.getAttribute("data-igg-id")}']`;
  return null;
}

const { installReviewCapture, executeReviewAction } = createReviewRuntime({
  runtimeStateKey: "__FIGMA_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "button,[role='button'],canvas,[data-igg-id]",
  captureHoverTargetSelector: "button,[role='button'],canvas,[data-igg-id]",
  captureHoverType: "move",
  clickUsesNativeFocus: false,
});

// ══════════════════════════════════════════════════════════════════════════════
// SVG icon primitives
// ══════════════════════════════════════════════════════════════════════════════

function IcoSelect()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 2l16 9.3-7.3 1.9L10.8 21 4 2z"/></svg>; }
function IcoHand()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11V5.5a1.5 1.5 0 1 1 3 0V10"/><path d="M10 10V4.5a1.5 1.5 0 1 1 3 0V10"/><path d="M13 10V6a1.5 1.5 0 1 1 3 0v5"/><path d="M16 11V8.5a1.5 1.5 0 1 1 3 0V14"/><path d="M7 12.5 5.6 11A1.7 1.7 0 0 0 3 12.2v.2c0 .4.1.8.4 1.1l3.8 5A4 4 0 0 0 10.4 20H16a4 4 0 0 0 4-4v-2"/></svg>; }
function IcoSticky() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8l6-6V4a2 2 0 0 0-2-2z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function IcoShape()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>; }
function IcoText()   { return <span className="text-[13px] font-bold leading-none">T</span>; }
function IcoConnect(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>; }
function IcoDraw()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>; }
function IcoMarker() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17l2 2 9-9-2-2-9 9z"/><path d="M17 3l2 2-2 2-2-2 2-2z"/><path d="M14 6l4 4"/></svg>; }

// Sidebar shape mini-icons — consistent strokeLinecap/Join round
const _S = { fill:"none" as const, stroke:"currentColor" as const, strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
const _S28 = { ..._S, viewBox:"0 0 28 18" };

// ── Basic shapes ──
function SBRect()   { return <svg width="15" height="11" viewBox="0 0 28 18" {..._S}><rect x="1" y="1" width="26" height="16" rx="2"/></svg>; }
function SBCirc()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="12" cy="12" r="10"/></svg>; }
function SBDiam()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="12,2 22,12 12,22 2,12"/></svg>; }
function SBTri()    { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="12,3 22,21 2,21"/></svg>; }
function SBStar()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>; }
function SBPent()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="12,2 21.5,8.9 18,20 6,20 2.5,8.9"/></svg>; }
function SBHex()    { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="12,2 20.66,7 20.66,17 12,22 3.34,17 3.34,7"/></svg>; }
function SBChat()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function SBCloud()  { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M20 17H7a5 5 0 1 1 .77-9.95A6 6 0 1 1 20 17z"/></svg>; }
function SBNote()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>; }
function SBFolder() { return <svg width="15" height="12" viewBox="0 0 26 20" {..._S}><path d="M1 4h7l3 3h14v11H1z"/></svg>; }

// ── Flowchart / wide shapes ──
function SBPara()   { return <svg width="15" height="11" {..._S28}><polygon points="5,1 27,1 23,17 1,17"/></svg>; }
function SBDelay()  { return <svg width="15" height="11" {..._S28}><path d="M1 1H18a8 8 0 0 1 0 16H1Z"/></svg>; }
function SBManual() { return <svg width="15" height="11" {..._S28}><polygon points="1,6 27,1 27,17 1,17"/></svg>; }
function SBCyli()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>; }
function SBMulti()  { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M8 4h9l3 3v11H8z"/><path d="M5 7H4v11h9v-1"/><polyline points="17,4 17,8 21,8"/></svg>; }
function SBMerge()  { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="2,3 22,3 12,21"/></svg>; }

// ── Flowchart shapes (continued) ──
function SBPrep()    { return <svg width="15" height="11" {..._S28}><polygon points="1,9 5,1 23,1 27,9 23,17 5,17"/></svg>; }
function SBPredef()  { return <svg width="15" height="11" {..._S28}><rect x="1" y="1" width="26" height="16" rx="1"/><line x1="6" y1="1" x2="6" y2="17"/><line x1="22" y1="1" x2="22" y2="17"/></svg>; }
function SBParaR()   { return <svg width="15" height="11" {..._S28}><polygon points="1,1 23,1 27,17 5,17"/></svg>; }
function SBCyliH()   { return <svg width="15" height="11" {..._S28}><ellipse cx="5" cy="9" rx="4" ry="8"/><line x1="5" y1="1" x2="23" y2="1"/><line x1="5" y1="17" x2="23" y2="17"/><ellipse cx="23" cy="9" rx="4" ry="8"/></svg>; }
function SBCallout() { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="2" width="20" height="13" rx="2"/><path d="M8 15l-4 6 6-6"/></svg>; }
function SBOffPage() { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="12,2 22,8 22,21 2,21 2,8"/></svg>; }
function SBCircQuad(){ return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>; }
function SBCircX()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="12" cy="12" r="9"/><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>; }

// ── Basic shapes (new) ──
function SBTriDown() { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="2,4 22,4 12,21"/></svg>; }
function SBOct()     { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="9,2 15,2 22,9 22,15 15,22 9,22 2,15 2,9"/></svg>; }
function SBPlus()    { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="9,2 15,2 15,9 22,9 22,15 15,15 15,22 9,22 9,15 2,15 2,9 9,9"/></svg>; }
function SBArrLeft() { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="22,9 10,9 10,4 2,12 10,20 10,15 22,15"/></svg>; }
function SBArrRight(){ return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="2,9 14,9 14,4 22,12 14,20 14,15 2,15"/></svg>; }
function SBChevron() { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="2,4 16,4 22,12 16,20 2,20 8,12"/></svg>; }

// ── Advanced / icon shapes ──
function IcoActivity()  { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polyline points="22,12 18,12 15,20 9,4 6,12 2,12"/></svg>; }
function IcoArchive()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>; }
function IcoKey()       { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="7" cy="15" r="5"/><path d="M12 10l8-8"/><path d="M20 2l2 2-3 3-2-2"/><path d="M17 5l2 2"/></svg>; }
function IcoBubble()    { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M21 12.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.5-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>; }
function IcoChip()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="6" y="6" width="12" height="12" rx="1"/><line x1="9" y1="6" x2="9" y2="2"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="15" y1="6" x2="15" y2="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="12" y1="22" x2="12" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="6" y1="9" x2="2" y2="9"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="6" y1="15" x2="2" y2="15"/><line x1="22" y1="9" x2="18" y2="9"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="22" y1="15" x2="18" y2="15"/></svg>; }
function IcoDbStack()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><ellipse cx="12" cy="5" rx="9" ry="3"/><ellipse cx="12" cy="12" rx="9" ry="3"/><ellipse cx="12" cy="19" rx="9" ry="3"/></svg>; }
function IcoMonitor()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="3" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="16" x2="12" y2="21"/></svg>; }
function IcoMail()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>; }
function IcoFileCode()  { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><polyline points="9,13 7,15 9,17"/><polyline points="15,13 17,15 15,17"/></svg>; }
function IcoCode()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="8,9 5,12 8,15"/><polyline points="16,9 19,12 16,15"/></svg>; }
function IcoBolt()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>; }
function IcoPin()       { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>; }
function IcoPhone()     { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3}/></svg>; }
function IcoBox()       { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><polyline points="21,8 21,21 3,21 3,8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>; }
function IcoCoin()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="12" cy="12" r="9"/><path d="M12 7v1m0 8v1"/><path d="M9.5 9.5h3a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4.5"/></svg>; }
function IcoShield()    { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IcoSend()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>; }
function IcoServer()    { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="2" width="20" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/><circle cx="7" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
function IcoCube()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }
function IcoGear()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>; }
function IcoDrive()     { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="8" width="20" height="8" rx="3"/><circle cx="7" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>; }
function IcoTerminal()  { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="6,9 10,12 6,15"/><line x1="12" y1="15" x2="18" y2="15"/></svg>; }
function IcoUser()      { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>; }
function IcoWallet()    { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 10h20"/><rect x="15" y="13" width="5" height="4" rx="1"/></svg>; }
function IcoGlobe()     { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="12" cy="12" r="9"/><path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9"/><path d="M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>; }

// ── Arrows / Connections ──
function SBArr1()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>; }
function SBArr2()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9,5 19,5 19,15"/></svg>; }
function SBArr3()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M4 18 Q12 4 20 12"/><polyline points="15,9 20,12 17,17"/></svg>; }
function SBArr4()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M5 19V9a2 2 0 0 1 2-2h12"/><polyline points="15,3 19,7 15,11"/></svg>; }
function SBArr5()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><line x1="5" y1="8" x2="19" y2="8"/><line x1="5" y1="16" x2="19" y2="16"/><polyline points="15,5 19,8 15,11"/><polyline points="9,13 5,16 9,19"/></svg>; }
function SBArr6()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><line x1="4" y1="12" x2="16" y2="12" strokeDasharray="2 2"/><polyline points="13,7 19,12 13,17"/></svg>; }
function SBArr7()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><circle cx="5" cy="7" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 7h5a4 4 0 0 1 4 4v4"/></svg>; }
function SBArr8()   { return <svg width="14" height="14" viewBox="0 0 24 24" {..._S}><path d="M3 17V8h8"/><polyline points="8,4 11,8 8,12"/><path d="M21 7v9h-8"/><polyline points="16,20 13,16 16,12"/></svg>; }

// ══════════════════════════════════════════════════════════════════════════════
// Types & static data
// ══════════════════════════════════════════════════════════════════════════════

type ToolId = "select" | "hand" | "sticky" | "shape" | "text" | "connect" | "draw" | "marker" | "more";
type ThumbContent = "naver" | "figma" | "chart" | "list";
type TipSide = "top" | "bottom" | "left" | "right";
type SidebarShapeItem = [string, React.ComponentType];

interface Note {
  id: number; x: number; y: number; w: number; h: number;
  color: string; rotate: number; type: "sticky" | "card";
  lines?: string[]; title?: string; thumbColor?: string; thumbContent?: ThumbContent;
}

interface CTransform { x: number; y: number; scale: number; }
type FigmaStateId = "default" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11";

const FRAME_INIT = { x: 148, y: 56 };
const FRAME_H = 236, COL_W = 132;
const COLS = ["Research", "Core Features", "Wireframe", "Visual", "Handoff"];

const NOTE_COLORS = {
  info: "#dbeafe",
  action: "#fef3c7",
  alert: "#fee2e2",
} as const;

const INITIAL_NOTES: Note[] = [

  // ══ Section 1: Kanban board — task cards per column ══
  // Research column (x center ≈ 214)
  { id:1,  x:156, y:92,  w:118, h:76, color:NOTE_COLORS.info, rotate:-0.3, type:"sticky", lines:["5 interviews recruited","→ shared navigation pain points"] },
  { id:2,  x:156, y:174, w:118, h:76, color:NOTE_COLORS.info, rotate:0.2,  type:"sticky", lines:["Competitor analysis","Baemin · Coupang Eats · Naver"] },

  // Core Features column (x center ≈ 346)
  { id:3,  x:288, y:92,  w:118, h:76, color:NOTE_COLORS.action, rotate:0.3,  type:"sticky", lines:["Wishlist redesign","Accessible in 1 tap"] },
  { id:4,  x:288, y:174, w:118, h:76, color:NOTE_COLORS.action, rotate:-0.2, type:"sticky", lines:["Quick reorder button","Order history at top"] },

  // Wireframe column (x center ≈ 478)
  { id:5,  x:420, y:92,  w:118, h:76, color:NOTE_COLORS.action, rotate:-0.3, type:"sticky", lines:["Home card 3-col → 2-col","CTA button fixed at bottom"] },
  { id:6,  x:420, y:174, w:118, h:76, color:NOTE_COLORS.action, rotate:0.4,  type:"sticky", lines:["Onboarding 3-step → 2-step","Remove unnecessary permissions"] },

  // Visual column (x center ≈ 610)
  { id:7,  x:552, y:92,  w:118, h:76, color:NOTE_COLORS.action, rotate:0.2,  type:"sticky", lines:["Keep green accent","White base confirmed"] },
  { id:8,  x:552, y:174, w:118, h:76, color:NOTE_COLORS.action, rotate:-0.4, type:"sticky", lines:["Product image ratio 1:1","Badge & tag guide finalized"] },

  // Handoff column (x center ≈ 742)
  { id:9,  x:684, y:92,  w:118, h:76, color:NOTE_COLORS.action, rotate:-0.2, type:"sticky", lines:["Component specs done ✅","Handed off to Figma Dev Mode"] },
  { id:10, x:684, y:174, w:118, h:76, color:NOTE_COLORS.action, rotate:0.3,  type:"sticky", lines:["Button states per status","Add skeleton UI"] },

  // ══ Section 2: Right of frame — goals & risks ══
  { id:11, x:826, y:56,  w:158, h:122, color:NOTE_COLORS.action, rotate:0.4,  type:"sticky", lines:["🎯 Sprint Goal","• First-order conversion +15%","• Reduce browse time 30%","• Onboarding completion 60%↑"] },
  { id:12, x:826, y:178, w:158, h:112, color:NOTE_COLORS.alert, rotate:-0.5, type:"sticky", lines:["⚠️ Risks","• Image supply delay","• API response >3.2s","• Brand tone needs review"] },

  // ══ Section 3: Research insights row ══
  { id:13, x:148, y:312, w:162, h:118, color:NOTE_COLORS.info, rotate:-0.4, type:"sticky", lines:["👥 User Research","• Navigation issues #1 complaint","• Return rate 62%","• Avg session 8.4 min"] },
  { id:14, x:322, y:308, w:162, h:118, color:NOTE_COLORS.info, rotate:0.5,  type:"sticky", lines:["💡 Key Insight","70% of onboarding drop-off","occurs at step 3","→ Simplify as top priority"] },
  { id:15, x:496, y:312, w:162, h:118, color:NOTE_COLORS.action, rotate:-0.3, type:"sticky", lines:["🎨 Design Decision","Primary #22C55E","BG #FAFAFA","radius 16 / space 8"] },
  { id:16, x:670, y:308, w:162, h:118, color:NOTE_COLORS.info, rotate:0.6,  type:"sticky", lines:["🗣 User Quotes","'Navigation is too complex'","'Promo banners are overwhelming'","'Reorder flow is too deep'"] },
  { id:17, x:844, y:312, w:152, h:118, color:NOTE_COLORS.action, rotate:-0.5, type:"sticky", lines:["✅ Confirmed","4 bottom tabs","Search always at top","Keep card-style home"] },

  // ══ Section 4: Reference cards ══
  { id:18, x:148, y:436, w:165, h:148, color:"#fff", rotate:0, type:"card", title:"Home Screen Redesign",   thumbColor:"#e8f5e9", thumbContent:"naver" },
  { id:19, x:323, y:436, w:162, h:148, color:"#fff", rotate:0, type:"card", title:"Order Flow Wireframe",  thumbColor:"#eef4ff", thumbContent:"figma" },
  { id:20, x:495, y:436, w:165, h:132, color:NOTE_COLORS.info, rotate:-0.2, type:"sticky", lines:["📈 User Engagement","• Save conversion 18%","• Return rate 62%","• First order completion 41%"] },
  { id:21, x:670, y:436, w:160, h:132, color:NOTE_COLORS.action, rotate:0.3, type:"sticky", lines:["🧪 QA Checklist","• iOS/Android check","• Empty state copy review","• Button disabled state check"] },

  // ══ Section 5: Action plan ══
  { id:22, x:148, y:604, w:162, h:108, color:NOTE_COLORS.action, rotate:-0.3, type:"sticky", lines:["🗓 This Week","Create 2 home concepts","Recruit user testers","Draft copywriting"] },
  { id:23, x:322, y:600, w:162, h:108, color:NOTE_COLORS.action, rotate:0.4,  type:"sticky", lines:["✅ Next Sprint","Improve search UX","Accessibility audit","Prototype review"] },
  { id:24, x:496, y:604, w:162, h:118, color:NOTE_COLORS.alert, rotate:-0.4, type:"sticky", lines:["❓ Needs Discussion","Number of banners","Default filter value","Recommendation section order"] },

];

interface FigmaBannerItem {
  title: string;
  target: string;
  lastEditor: string;
  timeAgo: string;
  thumbColor: string;
  badge: string;
}

const FIGMA_BANNER_ITEMS: FigmaBannerItem[] = [
  { title: "Q3 Design System",       target: "figma.home.banner.design-system.open",   lastEditor: "Ella",    timeAgo: "2 min ago",   thumbColor: "#e8f0fe", badge: "Recently edited" },
  { title: "Mobile Onboarding Flow", target: "figma.home.banner.onboarding-flow.open", lastEditor: "Jiyeon",  timeAgo: "1 hour ago",  thumbColor: "#e6f4ea", badge: "You edited this" },
  { title: "Icon Library v2",        target: "figma.home.banner.icon-library.open",    lastEditor: "Ella",    timeAgo: "3 hours ago", thumbColor: "#fce8e6", badge: "Shared with you" },
  { title: "Brand Guidelines",       target: "figma.home.banner.brand-guidelines.open",lastEditor: "Minjoon", timeAgo: "Yesterday",   thumbColor: "#fef7e0", badge: "Updated" },
  { title: "Sprint Review Deck",     target: "figma.home.banner.sprint-review.open",   lastEditor: "Jiyeon",  timeAgo: "2 days ago",  thumbColor: "#f3e8fd", badge: "Shared with you" },
  { title: "User Testing Scripts",   target: "figma.home.banner.testing-scripts.open", lastEditor: "Minjoon", timeAgo: "3 days ago",  thumbColor: "#e0f7fa", badge: "Pinned" },
];

function getFigmaBenchmarkState(stateId?: string | null): FigmaStateId {
  switch (stateId) {
    case "1":
      return "1";
    case "2":
      return "2";
    case "3":
      return "3";
    case "4":
      return "4";
    case "5":
      return "5";
    case "6":
      return "6";
    case "7":
      return "7";
    case "8":
      return "8";
    case "9":
      return "9";
    case "10":
      return "10";
    case "11":
      return "11";
    default:
      return "default";
  }
}

function getDefaultToolForState(stateId: FigmaStateId): ToolId {
  return stateId === "default" || stateId === "1" || stateId === "6" || stateId === "7" || stateId === "8" || stateId === "9" || stateId === "10" || stateId === "11" ? "select" : "hand";
}

function getInitialNotesForState(stateId: FigmaStateId): Note[] {
  if (stateId !== "7" && stateId !== "8" && stateId !== "9") {
    return INITIAL_NOTES;
  }
  // states 12-16 also return INITIAL_NOTES (handled by the condition above)

  const notes = INITIAL_NOTES.map((note) => {
    if (stateId === "9") {
      if (note.id === 13) return { ...note, x: 618, y: 334, rotate: -3.5 };
      if (note.id === 14) return { ...note, x: 646, y: 346, rotate: 2.6 };
      if (note.id === 15) return { ...note, x: 672, y: 324, rotate: -1.8 };
      if (note.id === 16) return { ...note, x: 636, y: 372, rotate: 4.8 };
      if (note.id === 17) return { ...note, x: 690, y: 366, rotate: -4.2 };
      if (note.id === 20) return { ...note, x: 600, y: 424, rotate: 1.9 };
      if (note.id === 21) return { ...note, x: 726, y: 432, rotate: -2.7 };
    }

    if (stateId === "8") {
      if (note.id === 17) return { ...note, x: 708, y: 442 };
      if (note.id === 21) return { ...note, x: 704, y: 438 };
      if (note.id === 20) return { ...note, x: 492, y: 600 };
    }

    if (note.id === 12) {
      return {
        ...note,
        y: 198,
      };
    }

    if (note.id === 17) {
      return {
        ...note,
        x: 860,
        y: 188,
      };
    }

    if (note.id === 21) {
      return {
        ...note,
        x: 460,
        y: 454,
      };
    }

    return note;
  });

  if (stateId === "8") {
    const note17 = notes.find((note) => note.id === 17);
    if (!note17) return notes;
    return [...notes.filter((note) => note.id !== 17), note17];
  }

  if (stateId === "9") {
    const dumpIds = [13, 14, 15, 16, 17, 20, 21];
    const dumpedNotes = notes.filter((note) => dumpIds.includes(note.id));
    const otherNotes = notes.filter((note) => !dumpIds.includes(note.id));
    return [...otherNotes, ...dumpedNotes];
  }

  return notes;
}

const TOOL_DEFS: { id:ToolId; label:string; shortcut:string; description:string; Icon:React.ComponentType }[] = [
  { id:"select",  label:"Select",    shortcut:"V", description:"Select and drag elements to move them",      Icon:IcoSelect  },
  { id:"hand",    label:"Hand",      shortcut:"H", description:"Drag to pan the canvas freely",      Icon:IcoHand    },
  { id:"sticky",  label:"Sticky",    shortcut:"S", description:"Click the canvas to add a sticky note",      Icon:IcoSticky  },
  { id:"shape",   label:"Shape",     shortcut:"R", description:"Click and drag to draw a shape",           Icon:IcoShape   },
  { id:"text",    label:"Text",      shortcut:"T", description:"Click to insert a text box",         Icon:IcoText    },
  { id:"connect", label:"Connector", shortcut:"C", description:"Draw connector lines between elements",                Icon:IcoConnect },
  { id:"draw",    label:"Draw",      shortcut:"P", description:"Draw freehand lines",                   Icon:IcoDraw    },
  { id:"marker",  label:"Marker",    shortcut:"M", description:"Highlight areas with a marker",              Icon:IcoMarker  },
];


const CONNECTION_SHAPES: SidebarShapeItem[] = [
  ["Straight arrow", SBArr1],
  ["Diagonal arrow", SBArr2],
  ["Curved arrow", SBArr3],
  ["Elbow arrow", SBArr4],
  ["Bidirectional", SBArr5],
  ["Dashed flow", SBArr6],
  ["Node connector", SBArr7],
  ["Round trip", SBArr8],
];

const BASIC_SHAPES: SidebarShapeItem[] = [
  ["Rectangle", SBRect],    ["Circle", SBCirc],
  ["Diamond", SBDiam],  ["Triangle", SBTri],
  ["Inverted triangle", SBTriDown], ["Pentagon", SBPent],
  ["Hexagon", SBHex],       ["Octagon", SBOct],
  ["Cross", SBPlus],        ["Left arrow", SBArrLeft],
  ["Right arrow", SBArrRight], ["Chevron", SBChevron],
  ["Star", SBStar],          ["Chat bubble", SBChat],
];

const FLOWCHART_SHAPES: SidebarShapeItem[] = [
  ["Parallelogram", SBPara],      ["Reverse parallelogram", SBParaR],
  ["Horizontal cylinder", SBCyliH],    ["Database", SBCyli],
  ["Document", SBNote],            ["Folder", SBFolder],
  ["Callout", SBCallout],         ["Multi-document", SBMulti],
  ["Predefined", SBPredef],      ["Merge", SBMerge],
  ["Manual input", SBManual],     ["Delay", SBDelay],
  ["Preparation", SBPrep],            ["Off-page", SBOffPage],
  ["On-page", SBCircQuad],    ["Extract", SBCircX],
];

const ADVANCED_SHAPES: SidebarShapeItem[] = [
  ["Activity monitor", IcoActivity], ["Archive", IcoArchive],
  ["Key", IcoKey],               ["Speech bubble", IcoBubble],
  ["Cloud", SBCloud],        ["CPU chip", IcoChip],
  ["Database stack", IcoDbStack], ["Monitor", IcoMonitor],
  ["Mail", IcoMail],            ["File code", IcoFileCode],
  ["Code editor", IcoCode],     ["Lightning", IcoBolt],
  ["Location pin", IcoPin],          ["Smartphone", IcoPhone],
  ["Box", IcoBox],             ["Coin", IcoCoin],
  ["Security shield", IcoShield],     ["Send", IcoSend],
  ["Server", IcoServer],          ["3D cube", IcoCube],
  ["Settings", IcoGear],            ["Drive", IcoDrive],
  ["Terminal", IcoTerminal],      ["User", IcoUser],
  ["Wallet", IcoWallet],          ["Globe", IcoGlobe],
];

interface Collaborator { name:string; abbr:string; color:string; status:string; }
const COLLABORATORS: Collaborator[] = [
  { name:"Jiyeon", abbr:"JY", color:"#ff7043", status:"Editing" },
  { name:"Ella",   abbr:"EL", color:"#42a5f5", status:"Viewing" },
];

function getCanvasTransformForState(
  stateId: FigmaStateId,
  notes: Note[],
  width: number,
  height: number
): CTransform {
  if (stateId === "10") {
    return { x: 260, y: 30, scale: 1 };
  }

  if (stateId === "default" || stateId === "7" || stateId === "8" || stateId === "9" || stateId === "11") {
    return { x:60, y:30, scale:1 };
  }

  if (stateId === "1" || stateId === "6") {
    const scale = stateId === "1" ? 0.08 : 1;
    const frameMinX = FRAME_INIT.x;
    const frameMinY = FRAME_INIT.y - 32;
    const frameMaxX = FRAME_INIT.x + COL_W * COLS.length;
    const frameMaxY = FRAME_INIT.y + FRAME_H;

    const notesMinX = Math.min(...notes.map((note) => note.x));
    const notesMinY = Math.min(...notes.map((note) => note.y));
    const notesMaxX = Math.max(...notes.map((note) => note.x + note.w));
    const notesMaxY = Math.max(...notes.map((note) => note.y + note.h));

    const minX = Math.min(frameMinX, notesMinX);
    const minY = Math.min(frameMinY, notesMinY);
    const maxX = Math.max(frameMaxX, notesMaxX);
    const maxY = Math.max(frameMaxY, notesMaxY);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      x: width / 2 - centerX * scale,
      y: height / 2 - centerY * scale,
      scale,
    };
  }

  if (stateId === "2") {
    const scale = 2;
    const riskNote = notes.find((note) => note.id === 12);
    const confirmedNote = notes.find((note) => note.id === 17);
    if (!riskNote || !confirmedNote) {
      return { x:60, y:30, scale:1 };
    }

    const minX = Math.min(riskNote.x, confirmedNote.x);
    const minY = Math.min(riskNote.y, confirmedNote.y);
    const maxX = Math.max(riskNote.x + riskNote.w, confirmedNote.x + confirmedNote.w);
    const maxY = Math.max(riskNote.y + riskNote.h, confirmedNote.y + confirmedNote.h);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      x: width / 2 - centerX * scale,
      y: height / 2 - centerY * scale,
      scale,
    };
  }

  if (stateId === "3") {
    const scale = 2;
    const targetNote = notes.find((note) => note.id === 1);
    if (!targetNote) {
      return { x:60, y:30, scale:1 };
    }

    const centerX = targetNote.x + targetNote.w / 2;
    const centerY = targetNote.y + targetNote.h / 2;

    return {
      x: width / 2 - centerX * scale,
      y: height / 2 - centerY * scale,
      scale,
    };
  }

  if (stateId === "4") {
    const scale = 2;
    const qaNote = notes.find((note) => note.id === 21);
    const discussionNote = notes.find((note) => note.id === 24);
    if (!qaNote || !discussionNote) {
      return { x:60, y:30, scale:1 };
    }

    const minX = Math.min(qaNote.x, discussionNote.x);
    const minY = Math.min(qaNote.y, discussionNote.y);
    const maxX = Math.max(qaNote.x + qaNote.w, discussionNote.x + discussionNote.w);
    const maxY = Math.max(qaNote.y + qaNote.h, discussionNote.y + discussionNote.h);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      x: width / 2 - centerX * scale,
      y: height / 2 - centerY * scale,
      scale,
    };
  }

  const scale = 2;
  const researchNote = notes.find((note) => note.id === 13);
  const insightNote = notes.find((note) => note.id === 14);
  if (!researchNote || !insightNote) {
    return { x:60, y:30, scale:1 };
  }

  const minX = Math.min(researchNote.x, insightNote.x);
  const minY = Math.min(researchNote.y, insightNote.y);
  const maxX = Math.max(researchNote.x + researchNote.w, insightNote.x + insightNote.w);
  const maxY = Math.max(researchNote.y + researchNote.h, insightNote.y + insightNote.h);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2 - 230;

  return {
    x: width / 2 - centerX * scale,
    y: height / 2 - centerY * scale,
    scale,
  };
}

const RIGHT_PANELS = [
  { id:"comment",  label:"Comments", icon:"💬", content:"View team comments and leave new ones." },
  { id:"plugin",   label:"Plugins",  icon:"🔌", content:"Install and manage plugins." },
  { id:"activity", label:"Activity log", icon:"🕐", content:"View recent edits and changes." },
  { id:"template", label:"Templates", icon:"📋", content:"Start quickly with pre-built templates." },
];

// ══════════════════════════════════════════════════════════════════════════════
// Portal-based Tooltip — escapes any stacking / transform context
// ══════════════════════════════════════════════════════════════════════════════

function Tip({ label, children, side = "top" }: { label:string; children:React.ReactNode; side?:TipSide }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tipStyle, setTipStyle] = useState<React.CSSProperties | null>(null);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const G = 8;
    const base: React.CSSProperties = { position:"fixed", zIndex:9999, pointerEvents:"none" };
    if (side === "top")    setTipStyle({ ...base, left: r.left + r.width/2, top: r.top - G, transform:"translate(-50%,-100%)" });
    if (side === "bottom") setTipStyle({ ...base, left: r.left + r.width/2, top: r.bottom + G, transform:"translateX(-50%)" });
    if (side === "right")  setTipStyle({ ...base, left: r.right + G, top: r.top + r.height/2, transform:"translateY(-50%)" });
    if (side === "left")   setTipStyle({ ...base, left: r.left - G, top: r.top + r.height/2, transform:"translate(-100%,-50%)" });
  }, [side]);

  const hide = useCallback(() => setTipStyle(null), []);
  const hideTrusted = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isTrusted) hide();
  }, [hide]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("igg-review-synthetic-hover", show);
    return () => el.removeEventListener("igg-review-synthetic-hover", show);
  }, [show]);

  return (
    <div
      ref={ref}
      onPointerOver={show}
      onPointerEnter={show}
      onPointerLeave={hide}
      onMouseOver={show}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onMouseDown={hideTrusted}
      onClick={hideTrusted}
      className="inline-flex h-fit w-fit"
    >
      {children}
      {tipStyle && typeof document !== "undefined" && createPortal(
        <div style={tipStyle} className="whitespace-nowrap rounded-lg bg-gray-900/95 px-2.5 py-1.5 text-[11px] text-white shadow-xl">
          {label}
        </div>,
        document.body
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Premium Popup
// ══════════════════════════════════════════════════════════════════════════════

function PremiumPopup({ feature, onClose }: { feature:string; onClose:()=>void }) {
  const [pct, setPct] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const r = Math.max(0, (1 - (Date.now() - start) / 3000) * 100);
      setPct(r);
      if (r === 0) { clearInterval(id); onClose(); }
    }, 40);
    return () => clearInterval(id);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="pop-in relative w-[340px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-pink-500" style={{ width:`${pct}%`, transition:"none" }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">Premium Feature</span>
              </div>
              <h3 className="mt-2 text-[17px] font-bold text-gray-900">{feature} Unlock</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
                This shape is only available on the <strong>Pro plan</strong>.
Upgrade to a Team plan to access the full library.
              </p>
            </div>
            <button onClick={onClose} className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3">
            <div className="mb-1.5 text-[11px] font-semibold text-violet-600">Included premium libraries</div>
            <div className="flex flex-wrap gap-1.5">
              {["Nimbus (103)","Azura (217)","Netco (1,273)","Advanced Shapes"].map(l => (
                <span key={l} className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-medium text-violet-700">{l}</span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-gray-400">Closes automatically in {Math.ceil(pct / 100 * 3)}s</p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90">Upgrade →</button>
            <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] text-gray-500 transition hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Thumbnail previews
// ══════════════════════════════════════════════════════════════════════════════

function ThumbNaver() {
  // Now Playing screen
  return <div className="flex h-full flex-col items-center justify-between bg-[#0f0f1a] px-2 py-2">
    {/* Top bar */}
    <div className="flex w-full items-center justify-between">
      <div className="h-1 w-3 rounded bg-white/20"/>
      <div className="h-1 w-8 rounded bg-white/40"/>
      <div className="h-1 w-3 rounded bg-white/20"/>
    </div>
    {/* Album art */}
    <div className="h-11 w-11 rounded-lg shadow-lg" style={{background:"linear-gradient(135deg,#8B5CF6,#EC4899)"}}/>
    {/* Track info */}
    <div className="flex w-full flex-col items-center gap-0.5">
      <div className="h-1.5 w-16 rounded bg-white/70"/>
      <div className="h-1 w-10 rounded bg-white/30"/>
    </div>
    {/* Progress bar */}
    <div className="w-full rounded-full bg-white/20" style={{height:2}}>
      <div className="h-full w-2/5 rounded-full" style={{backgroundColor:"#8B5CF6"}}/>
    </div>
    {/* Controls */}
    <div className="flex w-full items-center justify-between px-1">
      <div className="h-2 w-2 rounded-sm bg-white/25"/>
      <div className="h-2 w-2 rounded-sm bg-white/25"/>
      <div className="h-4 w-4 rounded-full bg-white/80"/>
      <div className="h-2 w-2 rounded-sm bg-white/25"/>
      <div className="h-2 w-2 rounded-sm bg-white/25"/>
    </div>
  </div>;
}
function ThumbFigma() {
  // Browse / recommended grid
  const colors = ["#8B5CF6","#EC4899","#06B6D4","#10B981","#F59E0B","#EF4444"];
  return <div className="flex h-full flex-col bg-[#111] gap-1 p-1.5">
    <div className="flex items-center gap-1">
      <div className="h-1.5 w-10 rounded bg-white/50"/>
      <div className="flex-1"/>
      <div className="h-1.5 w-4 rounded bg-white/20"/>
    </div>
    <div className="grid grid-cols-3 gap-0.5 flex-1">
      {colors.map((c,i)=>(
        <div key={i} className="flex flex-col overflow-hidden rounded-sm">
          <div className="flex-1" style={{background:`linear-gradient(135deg,${c}cc,${c}44)`}}/>
          <div className="h-1 w-full rounded-b-sm" style={{backgroundColor:c+"33"}}/>
        </div>
      ))}
    </div>
  </div>;
}
function ThumbChart() {
  // Donut chart (SVG) + bar chart
  const r = 18, cx = 28, cy = 26, stroke = 10;
  const circumference = 2 * Math.PI * r;
  const segments = [
    { pct: 0.42, color: "#8B5CF6" },
    { pct: 0.31, color: "#EC4899" },
    { pct: 0.17, color: "#06B6D4" },
    { pct: 0.10, color: "#F59E0B" },
  ];
  let offset = 0;
  return <div className="flex h-full flex-col gap-1 p-1.5">
    <div className="h-1.5 w-2/3 rounded bg-purple-300"/>
    <div className="flex flex-1 items-center gap-2">
      <svg width="56" height="52" viewBox="0 0 56 52">
        {segments.map((seg, i) => {
          const dash = seg.pct * circumference;
          const gap = circumference - dash;
          const rotate = offset * 360 - 90;
          offset += seg.pct;
          return <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotate} ${cx} ${cy})`}/>;
        })}
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#8B5CF6" fontWeight="bold">DAU</text>
      </svg>
      <div className="flex flex-1 flex-col gap-1">
        {[["Discovery","42%","#8B5CF6"],["Player","31%","#EC4899"],["Search","17%","#06B6D4"],["Other","10%","#F59E0B"]].map(([label,val,color])=>(
          <div key={label} className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{backgroundColor:color}}/>
            <div className="text-[6px] text-gray-500 w-8">{label}</div>
            <div className="text-[6px] font-bold text-gray-700">{val}</div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}
function ThumbList() {
  const rows = [
    { label:"Now Playing UI", val:"✅", color:"#8B5CF6" },
    { label:"Offline playback", val:"✅", color:"#8B5CF6" },
    { label:"Social playlist", val:"✅", color:"#8B5CF6" },
    { label:"Lyrics sync", val:"🔄", color:"#F59E0B" },
    { label:"Crossfade", val:"⏳", color:"#06B6D4" },
  ];
  return <div className="flex h-full flex-col justify-center gap-1 px-2 py-1.5">
    {rows.map(({label,val,color})=>(
      <div key={label} className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{backgroundColor:color}}/>
          <div className="truncate text-[6.5px] text-gray-500">{label}</div>
        </div>
        <div className="shrink-0 text-[7px] font-bold text-gray-700">{val}</div>
      </div>
    ))}
  </div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// Left Sidebar
// ══════════════════════════════════════════════════════════════════════════════

function SBSection({ title, children, defaultOpen = true }: { title:string; children:React.ReactNode; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="mb-2">
    <button
      type="button"
      onClick={()=>setOpen(o=>!o)}
      data-igg-id={
        title === "Flowchart"   ? "figma.shapes.flowchart-section"         :
        title === "Recents"     ? "figma.shapes-panel.section.recents"     :
        title === "Connections" ? "figma.shapes-panel.section.connections" :
        title === "Basic"       ? "figma.shapes-panel.section.basic"       :
        title === "Advanced"    ? "figma.shapes-panel.section.advanced"    : undefined
      }
      className="flex w-full items-center justify-between py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 transition hover:text-gray-600"
    >
      <span>{title}</span>
      <svg className={`transition-transform duration-150 ${open?"":"-rotate-90"}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
    </button>
    {open && <div className="pb-1">{children}</div>}
  </div>;
}

function ShapePaletteButton({
  label,
  children,
  iggId,
}: {
  label: string;
  children: React.ReactNode;
  iggId?: string;
}) {
  return (
    <Tip label={label} side="top">
      <button
        type="button"
        aria-label={label}
        title={label}
        data-igg-id={iggId}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
      >
        {children}
      </button>
    </Tip>
  );
}

function LeftSidebar({ onPremium, stateId }: { onPremium:(l:string)=>void; stateId:FigmaStateId }) {
  const [visible, setVisible] = useState(() => stateId !== "7");
  const expandAllShapes = stateId === "6";

  const isBannerState = stateId === "11";
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [bannerTimerReset, setBannerTimerReset] = useState(0);
  useEffect(() => {
    if (!isBannerState) return;
    setActiveBannerIndex(0);
    setBannerTimerReset(0);
  }, [isBannerState]);
  useEffect(() => {
    if (!isBannerState) return;
    const id = setTimeout(() => {
      setActiveBannerIndex((index) => Math.min(FIGMA_BANNER_ITEMS.length - 1, index + 1));
    }, 3500);
    return () => clearTimeout(id);
  }, [activeBannerIndex, bannerTimerReset, isBannerState]);

  function selectBannerIndex(index: number) {
    setActiveBannerIndex(index);
    setBannerTimerReset((value) => value + 1);
  }

  if (!visible) return (
    <div className="relative shrink-0 w-0">
      <Tip label="Open Shapes panel" side="right">
        <button type="button" onClick={()=>setVisible(true)} data-igg-id="figma.shapes-panel.open" className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-md transition hover:bg-gray-50">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </Tip>
    </div>
  );

  return (
    <aside className="w-52 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
        <span className="text-[13px] font-semibold text-gray-700">Shapes</span>
        <Tip label="Close panel" side="left">
          <button type="button" onClick={()=>setVisible(false)} data-igg-id="figma.shapes-panel.close" className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </Tip>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
          <svg className="shrink-0 text-gray-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search shapes" className="w-full bg-transparent text-[12px] outline-none placeholder-gray-400"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-igg-id="figma.shapes-panel.scroll">
        <SBSection title="Recents">
          <div className="flex gap-1.5">
            <ShapePaletteButton label="Heart" iggId="figma.shapes-panel.recents.heart">♡</ShapePaletteButton>
          </div>
        </SBSection>
        <SBSection key={`connections-${expandAllShapes ? "open" : "closed"}`} title="Connections" defaultOpen={expandAllShapes}>
          <div className="grid grid-cols-4 gap-1.5">
            {CONNECTION_SHAPES.map(([label,C],i)=>(
              <ShapePaletteButton key={i} label={label} iggId={label === "Straight arrow" ? "figma.shapes.arrow" : undefined}>
                <C/>
              </ShapePaletteButton>
            ))}
          </div>
        </SBSection>
        <SBSection key={`basic-${expandAllShapes ? "open" : "closed"}`} title="Basic" defaultOpen={expandAllShapes}>
          <div className="grid grid-cols-4 gap-1.5">
            {BASIC_SHAPES.map(([label,C],i)=>(
              <ShapePaletteButton key={i} label={label} iggId={label === "Rectangle" ? "figma.shapes.rectangle" : label === "Circle" ? "figma.shapes.circle" : undefined}>
                <C/>
              </ShapePaletteButton>
            ))}
          </div>
        </SBSection>
        <SBSection key={`flowchart-${expandAllShapes ? "open" : "closed"}`} title="Flowchart" defaultOpen={expandAllShapes}>
          <div className="grid grid-cols-4 gap-1.5">
            {FLOWCHART_SHAPES.map(([label,C],i)=>(
              <ShapePaletteButton
                key={i}
                label={label}
                iggId={label === "Multi-document" ? "figma.shapes.multi-document" : label === "Reverse parallelogram" ? "figma.shapes.parallelogram-reverse" : undefined}
              >
                <C/>
              </ShapePaletteButton>
            ))}
          </div>
        </SBSection>
        {/* Advanced */}
        <SBSection key={`advanced-${expandAllShapes ? "open" : "closed"}`} title="Advanced" defaultOpen={expandAllShapes}>
          <div className="grid grid-cols-4 gap-1.5">
            {ADVANCED_SHAPES.map(([label,C],i)=>(
              <ShapePaletteButton key={i} label={label} iggId={
                label === "Wallet" ? "figma.shapes.wallet" :
                label === "Server" ? "figma.shapes.server" :
                label === "Security shield" ? "figma.shapes.shield" :
                label === "Terminal" ? "figma.shapes.terminal" :
                label === "Globe" ? "figma.shapes.globe" :
                undefined
              }>
                <C/>
              </ShapePaletteButton>
            ))}
          </div>
        </SBSection>
        <div className="mt-1">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Other libraries</div>
          {[
            {name:"Nimbus", count:"103 shapes",   color:"#FF9900", abbr:"N"},
            {name:"Azura",  count:"217 shapes",   color:"#0078D4", abbr:"Az"},
            {name:"Netco",  count:"1,273 shapes", color:"#1BA0D7", abbr:"Nc"},
          ].map(lib=>(
            <button
              key={lib.name}
              type="button"
              onClick={()=>onPremium(lib.name)}
              data-igg-id={lib.name === "Netco" ? "figma.shapes.cisco-library" : lib.name === "Nimbus" ? "figma.shapes-panel.library.aws" : lib.name === "Azura" ? "figma.shapes-panel.library.azure" : undefined}
              className="flex w-full items-center gap-2.5 rounded-lg px-1 py-2 text-left transition hover:bg-gray-50"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white" style={{backgroundColor:lib.color}}>{lib.abbr}</div>
              <div><div className="text-[12px] font-medium text-gray-700">{lib.name}</div><div className="text-[10px] text-gray-400">{lib.count}</div></div>
            </button>
          ))}
        </div>
      </div>
      {isBannerState && (
        <FigmaBanner
          items={FIGMA_BANNER_ITEMS}
          activeIndex={activeBannerIndex}
          setActiveIndex={selectBannerIndex}
        />
      )}
    </aside>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Top Bar
// ══════════════════════════════════════════════════════════════════════════════

type SubEntry = { label: string; shortcut?: string } | { sep: true };
type MenuEntry =
  | { type: "item"; label: string; arrow?: boolean; sub?: SubEntry[] }
  | { type: "sep" }
  | { type: "search" };

const LOGO_MENU: MenuEntry[] = [
  { type:"item", label:"Back to files" },
  { type:"sep" },
  { type:"search" },
  { type:"sep" },
  { type:"item", label:"File", arrow:true, sub:[
    { label:"New file",           shortcut:"⌘N" },
    { label:"Duplicate file" },
    { sep:true },
    { label:"View version history" },
    { label:"Save offline" },
    { sep:true },
    { label:"Export...",         shortcut:"⌘⇧E" },
  ]},
  { type:"item", label:"Edit", arrow:true, sub:[
    { label:"Undo",               shortcut:"⌘Z" },
    { label:"Redo",               shortcut:"⌘⇧Z" },
    { sep:true },
    { label:"Copy",               shortcut:"⌘C" },
    { label:"Paste",              shortcut:"⌘V" },
    { label:"Select all",         shortcut:"⌘A" },
    { sep:true },
    { label:"Find and replace",   shortcut:"⌘H" },
  ]},
  { type:"item", label:"View", arrow:true, sub:[
    { label:"Show rulers",        shortcut:"⌘⇧R" },
    { label:"Show guides",        shortcut:"⌘⇧;" },
    { label:"Show grid",          shortcut:"⌘'" },
    { sep:true },
    { label:"Layout grid" },
    { label:"Pixel preview" },
    { sep:true },
    { label:"Full screen",        shortcut:"Ctrl+⌘F" },
  ]},
  { type:"item", label:"Object", arrow:true, sub:[
    { label:"Group",              shortcut:"⌘G" },
    { label:"Frame selection",    shortcut:"⌘⌥G" },
    { sep:true },
    { label:"Lock",               shortcut:"⌘⇧L" },
    { label:"Hide" },
    { sep:true },
    { label:"Bring forward",      shortcut:"⌘]" },
    { label:"Send backward",      shortcut:"⌘[" },
  ]},
  { type:"item", label:"Text", arrow:true, sub:[
    { label:"Bold",               shortcut:"⌘B" },
    { label:"Italic",             shortcut:"⌘I" },
    { label:"Underline",          shortcut:"⌘U" },
    { sep:true },
    { label:"Copy text style" },
    { label:"Paste text style" },
  ]},
  { type:"item", label:"Align", arrow:true, sub:[
    { label:"Align left" },
    { label:"Align center (horizontal)" },
    { label:"Align right" },
    { sep:true },
    { label:"Align top" },
    { label:"Align center (vertical)" },
    { label:"Align bottom" },
  ]},
  { type:"sep" },
  { type:"item", label:"Plugins", arrow:true, sub:[
    { label:"Find plugins..." },
    { sep:true },
    { label:"No recently used plugins" },
  ]},
  { type:"item", label:"Widgets", arrow:true, sub:[
    { label:"Find widgets..." },
    { label:"Figma widget gallery" },
  ]},
  { type:"item", label:"Preferences", arrow:true, sub:[
    { label:"Theme: Light mode" },
    { label:"Language: English" },
    { sep:true },
    { label:"View shortcuts",     shortcut:"⌘⇧?" },
  ]},
  { type:"sep" },
  { type:"item", label:"Open in desktop app" },
  { type:"item", label:"AI Balance", arrow:true, sub:[
    { label:"AI autocomplete" },
    { label:"Layout suggestions" },
    { label:"Accessibility check" },
  ]},
  { type:"item", label:"Help and account", arrow:true, sub:[
    { label:"Help center" },
    { label:"Release notes" },
    { sep:true },
    { label:"Account settings" },
    { label:"Log out" },
  ]},
];

function TopBar({ followingUser, onFollow }: {
  followingUser: Collaborator | null;
  onFollow: (c: Collaborator) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setHoveredLabel(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!mediaOpen) return;
    const handler = (e: MouseEvent) => {
      if (mediaRef.current && !mediaRef.current.contains(e.target as Node)) {
        setMediaOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mediaOpen]);

  return (
    <header className="z-20 flex h-11 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3">
      <div className="flex items-center gap-1.5">
        {/* Logo button + dropdown */}
        <div className="relative" ref={menuRef}>
          <Tip label="Main menu" side="bottom">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              data-igg-id="figma.topbar.main-menu"
              className={`flex h-7 w-7 items-center justify-center rounded text-[10px] font-black text-white transition hover:opacity-90 active:scale-95 ${menuOpen ? "ring-2 ring-violet-400 ring-offset-1" : ""}`}
              style={{background:"linear-gradient(135deg,#9b59b6,#e91e8c)"}}
            >F</button>
          </Tip>

          {menuOpen && (
            <div className="absolute left-0 top-9 z-50 w-64 rounded-xl border border-white/10 bg-[#1e1e1e] py-1 shadow-2xl">
              {/* Filename header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
                <div className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-black text-white shrink-0" style={{background:"linear-gradient(135deg,#9b59b6,#e91e8c)"}}>F</div>
                <span className="truncate text-[13px] font-medium text-white">Mobile App Redesign Sprint</span>
                <svg className="ml-auto shrink-0 text-white/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>

              {LOGO_MENU.map((item, i) => {
                if (item.type === "sep") return <div key={i} className="my-1 border-t border-white/10"/>;
                if (item.type === "search") return (
                  <div key={i} className="flex items-center justify-between px-3 py-[7px] hover:bg-white/[0.08] cursor-pointer"
                    onMouseEnter={() => setHoveredLabel(null)}>
                    <div className="flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <span className="text-[13px] text-white/80">Actions...</span>
                    </div>
                    <span className="text-[11px] text-white/30">⌘K</span>
                  </div>
                );
                const isHovered = "label" in item && hoveredLabel === item.label;
                const hasSub = item.type === "item" && "sub" in item && !!item.sub;
                return (
                  <div key={i} className="relative"
                    onMouseEnter={() => setHoveredLabel(item.type === "item" ? item.label : null)}
                    onMouseLeave={() => setHoveredLabel(null)}>
                    <button type="button"
                      onClick={() => { if (!hasSub) setMenuOpen(false); }}
                      className={`flex w-full items-center justify-between px-3 py-[7px] transition-colors ${isHovered ? "bg-white/[0.08]" : "hover:bg-white/[0.08]"}`}>
                      <span className="text-[13px] text-white/85">{item.type === "item" ? item.label : ""}</span>
                      {hasSub && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/35"><polyline points="9 18 15 12 9 6"/></svg>
                      )}
                    </button>

                    {/* Submenu */}
                    {isHovered && hasSub && item.type === "item" && item.sub && (
                      <div className="absolute left-full top-0 z-50 w-56 rounded-xl border border-white/10 bg-[#2a2a2a] py-1 shadow-2xl"
                        style={{marginLeft: 4}}>
                        {item.sub.map((s, j) =>
                          "sep" in s
                            ? <div key={j} className="my-1 border-t border-white/10"/>
                            : <button key={j} type="button"
                                onClick={() => setMenuOpen(false)}
                                className="flex w-full items-center justify-between px-3 py-[7px] text-[13px] text-white/80 hover:bg-white/[0.08] transition-colors">
                                <span>{s.label}</span>
                                {s.shortcut && <span className="text-[11px] text-white/30">{s.shortcut}</span>}
                              </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <span className="select-none text-[13px] font-light text-gray-400">—</span>
        <span className="select-none text-[13px] font-medium text-gray-700">Mobile App Redesign Sprint</span>
        <Tip label="File details" side="bottom">
          <button type="button" data-igg-id="figma.topbar.file-details" className="rounded p-1 text-gray-400 transition hover:bg-gray-100">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </button>
        </Tip>
        <Tip label="Add to favorites" side="bottom">
          <button type="button" data-igg-id="figma.topbar.favorites" className="rounded p-1 text-gray-300 transition hover:text-yellow-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </Tip>
      </div>

      {/* Right controls — flat */}
      <div className="flex items-center gap-2">
        {/* Collaborator avatars */}
        <div className="flex -space-x-1.5">
          {COLLABORATORS.map(c => {
            const isFollowing = followingUser?.name === c.name;
            return (
              <Tip key={c.name} label={isFollowing ? `Following ${c.name}` : `Click to follow ${c.name}`} side="bottom">
                <button
                  type="button"
                  onClick={() => onFollow(c)}
                  data-igg-id={c.name === "Ella" ? "figma.topbar.collaborator-ella" : c.name === "Jiyeon" ? "figma.topbar.collaborator-jiyeon" : undefined}
                  className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white transition hover:-translate-y-0.5"
                  style={{ backgroundColor: c.color, boxShadow: isFollowing ? `0 0 0 2px ${c.color}` : undefined }}
                >
                  {c.abbr}
                </button>
              </Tip>
            );
          })}
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Templates */}
        <Tip label="Templates" side="bottom">
          <button type="button" data-igg-id="figma.topbar.template" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M12 4v16"/></svg>
          </button>
        </Tip>

        {/* Timer·music·voting toggle + dropdown */}
        <div className="relative" ref={mediaRef}>
          <Tip label="Timer, music, and voting" side="bottom">
            <button
              type="button"
              onClick={() => setMediaOpen(o => !o)}
              data-igg-id="figma.topbar.timer-poll-toggle"
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition ${mediaOpen ? "border-violet-300 bg-violet-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-white">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V8.67l6-1.5v5.38A4 4 0 1 0 22 16V4.62L12 7.12V3z"/></svg>
              </span>
              <span className="text-amber-400">★</span>
              <span className="font-semibold tracking-wide text-violet-500">03:00</span>
            </button>
          </Tip>

          {/* Vertical dropdown popover */}
          {mediaOpen && (
            <div className="absolute right-0 top-10 z-50 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              {/* Popover tail */}
              <div className="absolute -top-[7px] right-4 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />

              {/* Volume */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>
                  Volume
                </div>
                <div className="h-1.5 w-28 rounded-full bg-gray-200">
                  <div className="h-full w-[48%] rounded-full bg-violet-400" />
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <span className="text-[12px] font-medium text-gray-600">Timer</span>
                <div className="flex items-center gap-2">
                  <button type="button" data-igg-id="figma.topbar.timer.add-minute" className="rounded-md border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50">+1 min</button>
                  <span className="w-12 text-center font-mono text-[18px] font-bold tracking-tight text-gray-900">03:00</span>
                  <button type="button" data-igg-id="figma.topbar.timer.play" className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-white shadow-sm hover:bg-violet-600">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg>
                  </button>
                </div>
              </div>

              {/* Music */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <span className="text-[12px] font-medium text-gray-600">Music</span>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-black" />
                  <select className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-600 outline-none">
                    <option>Acoustic ambient</option>
                    <option>Lo-fi beats</option>
                    <option>Focus flow</option>
                  </select>
                  <button type="button" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white shadow-sm hover:bg-violet-600">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg>
                  </button>
                </div>
              </div>

              {/* Voting */}
              <div className="flex items-center justify-between px-4 py-3">
                <span data-igg-id="figma.topbar.poll-section" className="text-[12px] font-medium text-gray-600">Voting</span>
                <div className="flex items-center gap-2">
                  <div className="relative h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-yellow-200 to-amber-400">
                    <span className="absolute -right-1.5 -top-1.5 text-[12px]">❤️</span>
                  </div>
                  <button
                    type="button"
                    data-igg-id="figma.topbar.new-poll"
                    className="rounded-lg bg-violet-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-violet-600"
                  >
                    New poll
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-gray-200" />

        <button type="button" data-igg-id="figma.topbar.share" className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90" style={{background:"linear-gradient(135deg,#9b5cff,#7c3aed)"}}>
          Share
        </button>
      </div>
    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Note Formatting Toolbar
// ══════════════════════════════════════════════════════════════════════════════

function NoteFormattingToolbar({ note, scale, onDelete }: { note: Note; scale: number; onDelete: (id: number) => void }) {
  const toolbarH = 30;
  const noteX = note.x + note.w / 2;
  const noteY = note.y - 10 / scale;

  return (
    <div
      style={{
        position: "absolute",
        left: noteX,
        top: noteY,
        transform: `translate(-50%, -100%)`,
        height: toolbarH / scale,
        transformOrigin: "bottom center",
        zIndex: 2000,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{ transform: `scale(${1 / scale})`, transformOrigin: "bottom center", height: toolbarH }}
        className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 shadow-xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <button type="button" className="flex h-5 items-center justify-center rounded px-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100">Aa</button>
        <button type="button" className="flex h-5 items-center gap-1 rounded px-1.5 text-[10px] text-gray-600 hover:bg-gray-100">
          <span>Aa</span>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200 shrink-0"/>
        <button type="button" data-igg-id={note.id === 11 ? "figma.canvas.note-sprint-goal.bold" : note.id === 24 ? "figma.canvas.note-discussion.bold" : note.id === 17 ? "figma.canvas.note-confirmed.bold" : undefined} className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-gray-700 hover:bg-gray-100">B</button>
        <button type="button" className="flex h-5 w-5 items-center justify-center rounded text-[11px] text-gray-600 hover:bg-gray-100" style={{textDecoration:"line-through"}}>S</button>
        <button type="button" className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button type="button" className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-100">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200 shrink-0"/>
        <button
          type="button"
          data-igg-id={note.id === 14 ? "figma.canvas.note-insight.delete" : note.id === 20 ? "figma.canvas.note-engagement.delete" : note.id === 2 ? "figma.canvas.note-competitor-analysis.delete" : note.id === 12 ? "figma.canvas.note-risk.delete" : note.id === 13 ? "figma.canvas.note-user-research.delete" : note.id === 21 ? "figma.canvas.note-qa-checklist.delete" : undefined}
          className="flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-red-50 hover:text-red-500"
          onClick={() => onDelete(note.id)}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
            <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Draggable Note Card
// ══════════════════════════════════════════════════════════════════════════════

function NoteCard({ note, isDragging, selectable, isSelected, onDragStart }: {
  note:Note; isDragging:boolean; selectable:boolean; isSelected:boolean;
  onDragStart:(e:React.MouseEvent,id:number)=>void;
}) {
  const noteIggId = note.id === 24 ? "figma.canvas.note-discussion"
    : note.id === 14 ? "figma.canvas.note-insight"
    : note.id === 11 ? "figma.canvas.note-sprint-goal"
    : note.id === 20 ? "figma.canvas.note-engagement"
    : note.id === 17 ? "figma.canvas.note-confirmed"
    : note.id === 13 ? "figma.canvas.note-user-research"
    : note.id === 12 ? "figma.canvas.note-risk"
    : note.id === 2  ? "figma.canvas.note-competitor-analysis"
    : note.id === 21 ? "figma.canvas.note-qa-checklist"
    : undefined;

  const base: React.CSSProperties = {
    position:"absolute", left:note.x, top:note.y, width:note.w, height:note.h,
    transform:`rotate(${note.rotate}deg)`,
    zIndex: isDragging ? 1000 : isSelected ? 500 : 1,
    cursor: selectable ? (isDragging ? "grabbing" : "grab") : "default",
    userSelect:"none",
    transition: isDragging ? "none" : "box-shadow 0.15s ease",
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectable) onDragStart(e, note.id);
  };

  const selectionBorder = isSelected ? "outline outline-2 outline-blue-500 outline-offset-1" : "";
  const handleStyle: React.CSSProperties = {position:"absolute",width:6,height:6,background:"white",border:"1.5px solid #3b82f6",borderRadius:1,zIndex:10};

  if (note.type === "card") {
    return (
      <div style={base} className={`overflow-visible rounded-xl border border-gray-200 bg-white ${isDragging||isSelected?"shadow-2xl":"shadow-md"} ${selectionBorder}`}
        onMouseDown={handleMouseDown}>
        {isSelected && <>
          <div style={{...handleStyle,top:-4,left:-4}}/>
          <div style={{...handleStyle,top:-4,right:-4}}/>
          <div style={{...handleStyle,bottom:-4,left:-4}}/>
          <div style={{...handleStyle,bottom:-4,right:-4}}/>
        </>}
        <div className="flex items-center justify-between border-b border-gray-100 px-2.5 py-1.5">
          <span className="text-[9.5px] font-semibold text-gray-600">{note.title}</span>
          {selectable && (
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none" className="text-gray-300 shrink-0">
              <circle cx="4" cy="4" r="1.5" fill="currentColor"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/>
              <circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          )}
        </div>
        <div className="overflow-hidden rounded-b-xl" style={{backgroundColor:note.thumbColor,height:note.h-30}}>
          {note.thumbContent==="naver"&&<ThumbNaver/>}
          {note.thumbContent==="figma"&&<ThumbFigma/>}
          {note.thumbContent==="chart"&&<ThumbChart/>}
          {note.thumbContent==="list" &&<ThumbList/>}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{...base,backgroundColor:note.color}}
      data-igg-id={noteIggId}
      className={`rounded-sm px-2.5 py-2.5 ${isDragging||isSelected?"shadow-2xl":"shadow-md"} ${selectionBorder}`}
      onMouseDown={handleMouseDown}
    >
      {isSelected && <>
        <div style={{position:"absolute",top:-4,left:-4,width:6,height:6,background:"white",border:"1.5px solid #3b82f6",borderRadius:1,zIndex:10}}/>
        <div style={{position:"absolute",top:-4,right:-4,width:6,height:6,background:"white",border:"1.5px solid #3b82f6",borderRadius:1,zIndex:10}}/>
        <div style={{position:"absolute",bottom:-4,left:-4,width:6,height:6,background:"white",border:"1.5px solid #3b82f6",borderRadius:1,zIndex:10}}/>
        <div style={{position:"absolute",bottom:-4,right:-4,width:6,height:6,background:"white",border:"1.5px solid #3b82f6",borderRadius:1,zIndex:10}}/>
      </>}
      <div className="text-[9.5px] leading-relaxed text-gray-700">
        {note.lines?.map((l,i)=><div key={i} className={i === 0 ? "font-semibold" : undefined}>{l}</div>)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Canvas — infinite pan + zoom
// ══════════════════════════════════════════════════════════════════════════════

function Canvas({ activeTool, notes, setNotes, followingUser, onUnfollow, stateId }: {
  activeTool:ToolId; notes:Note[]; setNotes:React.Dispatch<React.SetStateAction<Note[]>>;
  followingUser: Collaborator | null; onUnfollow: () => void; stateId:FigmaStateId;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [xform, setXform] = useState<CTransform>({ x:60, y:30, scale:1 });
  const xformRef = useRef(xform);

  // Pan state
  const panRef = useRef<{ startX:number; startY:number; originTX:number; originTY:number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const spaceRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Note drag state
  const noteDragRef = useRef<{ id:number; startMX:number; startMY:number; origX:number; origY:number; committed:boolean }|null>(null);
  const notesRef = useRef(notes);
  const [draggingId, setDraggingId] = useState<number|null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number|null>(null);

  // Frame drag state
  const [framePos, setFramePos] = useState(FRAME_INIT);
  const framePosRef = useRef(framePos);
  const frameDragRef = useRef<{ startMX:number; startMY:number; origX:number; origY:number }|null>(null);
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);

  useEffect(() => {
    xformRef.current = xform;
  }, [xform]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    framePosRef.current = framePos;
  }, [framePos]);

  useEffect(() => {
    if (activeTool !== "select") {
      setSelectedNoteId(null);
    }
  }, [activeTool]);

  // Space key
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        spaceRef.current = true;
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") { spaceRef.current = false; setSpaceHeld(false); }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const { width, height } = cont.getBoundingClientRect();
    const nextXform = getCanvasTransformForState(stateId, notesRef.current, width, height);
    const frameId = window.requestAnimationFrame(() => {
      setXform(nextXform);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [stateId]);

  // Global mouse move + up
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Pan
      if (panRef.current) {
        const { startX, startY, originTX, originTY } = panRef.current;
        setXform(p => ({ ...p, x: originTX + e.clientX - startX, y: originTY + e.clientY - startY }));
      }
      // Note drag
      if (noteDragRef.current) {
        const { id, startMX, startMY, origX, origY } = noteDragRef.current;
        const dx = e.clientX - startMX;
        const dy = e.clientY - startMY;
        if (!noteDragRef.current.committed && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          noteDragRef.current.committed = true;
          setDraggingId(id);
        }
        if (noteDragRef.current.committed) {
          const s = xformRef.current.scale;
          setNotes(prev => prev.map(n => n.id===id ? {...n, x:origX+dx/s, y:origY+dy/s} : n));
        }
      }
      // Frame drag
      if (frameDragRef.current) {
        const { startMX, startMY, origX, origY } = frameDragRef.current;
        const s = xformRef.current.scale;
        setFramePos({ x: origX + (e.clientX - startMX) / s, y: origY + (e.clientY - startMY) / s });
      }
    };
    const onUp = () => {
      if (panRef.current) { panRef.current = null; setIsPanning(false); }
      if (noteDragRef.current) {
        if (!noteDragRef.current.committed) {
          setSelectedNoteId(noteDragRef.current.id);
        }
        noteDragRef.current = null;
        setDraggingId(null);
      }
      if (frameDragRef.current) { frameDragRef.current = null; setIsDraggingFrame(false); }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [setNotes]);

  // Mouse wheel: scroll = pan, Ctrl+scroll = zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const cont = containerRef.current;
      if (!cont) return;
      const { width, height } = cont.getBoundingClientRect();
      const cx = width / 2;
      const cy = height / 2;
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      setXform(p => {
        const ns = Math.max(0.08, Math.min(5, p.scale * factor));
        const ratio = ns / p.scale;
        return { x: cx - ratio*(cx - p.x), y: cy - ratio*(cy - p.y), scale: ns };
      });
    } else {
      setXform(p => ({ ...p, x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  // Container mouse down → start pan or deselect note
  const onContainerDown = useCallback((e: React.MouseEvent) => {
    const isPanTrigger = activeTool==="hand" || e.button===1 || (e.button===0 && spaceRef.current);
    if (isPanTrigger) {
      e.preventDefault();
      panRef.current = { startX:e.clientX, startY:e.clientY, originTX:xformRef.current.x, originTY:xformRef.current.y };
      setIsPanning(true);
    } else {
      setSelectedNoteId(null);
    }
  }, [activeTool]);

  // Note drag start — committed=false until mouse moves >4px
  const startNoteDrag = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedNoteId(id);
    const note = notesRef.current.find(n=>n.id===id)!;
    noteDragRef.current = { id, startMX:e.clientX, startMY:e.clientY, origX:note.x, origY:note.y, committed:false };
  }, []);

  const removeNote = useCallback((id:number) => {
    setSelectedNoteId((current) => (current === id ? null : current));
  }, []);

  // Zoom buttons (zoom around viewport center)
  const zoomBy = useCallback((factor: number) => {
    const cont = containerRef.current;
    if (!cont) return;
    const { width, height } = cont.getBoundingClientRect();
    const cx = width/2, cy = height/2;
    setXform(p => {
      const ns = Math.max(0.08, Math.min(5, p.scale * factor));
      const r = ns / p.scale;
      return { x: cx - r*(cx-p.x), y: cy - r*(cy-p.y), scale: ns };
    });
  }, []);

  const cursor = isPanning ? "grabbing" : (activeTool==="hand"||spaceHeld) ? "grab" : activeTool==="select" ? "default" : "crosshair";

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden canvas-bg select-none"
      style={{ cursor }}
      onMouseDown={onContainerDown}
      onWheel={onWheel}
    >
      {/* Infinite canvas rendered with explicit scale origin for stable centered zoom */}
      <div style={{
        position:"absolute",
        left:xform.x,
        top:xform.y,
        width:4000,
        height:3000,
        transformOrigin:"0 0",
        scale:`${xform.scale}`,
      }}>
        {/* ── Kanban frame (draggable) ── */}
        <div className="absolute" style={{left:framePos.x, top:framePos.y, width:COL_W*COLS.length, height:FRAME_H, zIndex: isDraggingFrame ? 500 : 0}}>
          <div className="absolute -top-8 left-0">
            <div
              className={`select-none whitespace-nowrap rounded-full border border-violet-200 bg-white font-medium text-violet-500 shadow-sm ${activeTool==="select" ? "cursor-grab active:cursor-grabbing hover:bg-violet-50" : ""}`}
              style={{padding:"2px 12px", fontSize:11}}
              onMouseDown={e => {
                if (activeTool !== "select") return;
                e.preventDefault(); e.stopPropagation();
                frameDragRef.current = { startMX: e.clientX, startMY: e.clientY, origX: framePosRef.current.x, origY: framePosRef.current.y };
                setIsDraggingFrame(true);
              }}
            >
              App Redesign Workshop · Design Sprint
            </div>
          </div>
          <div className={`h-full w-full overflow-hidden rounded-xl border bg-white transition-shadow ${isDraggingFrame ? "border-violet-300 shadow-2xl" : "border-gray-300 shadow-sm"}`}>
            <div className="flex border-b border-gray-200 bg-gray-50">
              {COLS.map((col,i)=>(
                <div key={col} className="flex-1 select-none py-2 text-center text-[11px] font-semibold text-gray-500" style={{borderLeft:i>0?"1px solid #e0e0e0":undefined,width:COL_W}}>{col}</div>
              ))}
            </div>
            <div className="flex h-[calc(100%-33px)]">
              {COLS.map((_,i)=><div key={i} className="relative flex-1" style={{borderLeft:i>0?"1px solid #f0f0f0":undefined}}/>)}
            </div>
          </div>
        </div>

        {/* ── All draggable notes ── */}
        {notes.map(note=>(
          <NoteCard key={note.id} note={note} isDragging={draggingId===note.id}
            selectable={activeTool==="select"} isSelected={selectedNoteId===note.id}
            onDragStart={startNoteDrag}/>
        ))}

        {/* ── Formatting toolbar for selected note ── */}
        {selectedNoteId !== null && (() => {
          const n = notes.find(n=>n.id===selectedNoteId);
          return n ? <NoteFormattingToolbar note={n} scale={xform.scale} onDelete={removeNote}/> : null;
        })()}
      </div>

      {/* ── HUD: zoom controls (fixed over canvas) ── */}
      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 rounded-lg border border-gray-200 bg-white/90 px-1.5 py-1 shadow-md backdrop-blur-sm">
        <Tip label="Zoom out (Ctrl −)" side="top">
          <button type="button" onClick={()=>zoomBy(0.8)} data-igg-id="figma.topbar.zoom-out" className="flex h-6 w-6 items-center justify-center rounded text-gray-500 text-base font-semibold transition hover:bg-gray-100">−</button>
        </Tip>
        <div data-igg-id="figma.topbar.zoom-reset" className="w-12 select-none rounded px-1 text-center text-[11px] font-medium text-gray-500 cursor-default">
          {Math.round(xform.scale*100)}%
        </div>
        <Tip label="Zoom in (Ctrl +)" side="top">
          <button
            type="button"
            onClick={()=>zoomBy(1.25)}
            data-igg-id="figma.canvas.zoom-in"
            className="flex h-6 w-6 items-center justify-center rounded text-gray-500 text-base font-semibold transition hover:bg-gray-100"
          >
            +
          </button>
        </Tip>
      </div>

      {/* ── Follow mode: colored border ring + badge ── */}
      {followingUser && (
        <>
          {/* Inset border around entire canvas viewport */}
          <div
            className="pointer-events-none absolute inset-0 z-30"
            style={{ boxShadow: `inset 0 0 0 3px ${followingUser.color}` }}
          />
          {/* "Following" badge pinned to top-center */}
          <div className="absolute left-1/2 top-3 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg"
            style={{ backgroundColor: followingUser.color }}>
            {/* mini avatar */}
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[9px] font-bold">
              {followingUser.abbr}
            </div>
            Following {followingUser.name}
            <button
              type="button"
              onClick={onUnfollow}
              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white/80 transition hover:bg-white/40"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </>
      )}

      {/* Pan hint */}
      {spaceHeld && !isPanning && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-gray-900/80 px-3 py-1.5 text-[11px] text-white">
          Drag to move
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Right Panel
// ══════════════════════════════════════════════════════════════════════════════

const PANEL_COMMENTS = [
  { id:1,  author:"Jiyeon",  abbr:"JY", color:"#ff7043", time:"2m ago",   resolved:false, text:"The hero banner spacing needs 16px top margin — current 8px looks cramped." },
  { id:2,  author:"Ella",    abbr:"EL", color:"#42a5f5", time:"5m ago",   resolved:false, text:"Subtitle font weight should be 400, not 500. Feels too heavy on mobile." },
  { id:3,  author:"Minjoon", abbr:"MJ", color:"#66bb6a", time:"12m ago",  resolved:false, text:"Home card grid breaks at 375px. Should we switch to 2-col at that breakpoint?" },
  { id:4,  author:"Jiyeon",  abbr:"JY", color:"#ff7043", time:"20m ago",  resolved:true,  text:"Primary CTA uses #22C55E but the spec says #16A34A. Which is confirmed?" },
  { id:5,  author:"Ella",    abbr:"EL", color:"#42a5f5", time:"28m ago",  resolved:false, text:"The wishlist icon on product cards is misaligned — should be top-right corner." },
  { id:6,  author:"Minjoon", abbr:"MJ", color:"#66bb6a", time:"35m ago",  resolved:false, text:"Bottom sheet handle height is 4px but iOS HIG recommends 5px. Small but matters." },
  { id:7,  author:"Jiyeon",  abbr:"JY", color:"#ff7043", time:"42m ago",  resolved:true,  text:"Order summary card shadow should be elevation-2 not elevation-4." },
  { id:8,  author:"Ella",    abbr:"EL", color:"#42a5f5", time:"51m ago",  resolved:false, text:"Empty state illustration color doesn't match the new brand palette. Needs update." },
  { id:9,  author:"Minjoon", abbr:"MJ", color:"#66bb6a", time:"1h ago",   resolved:false, text:"Swipe-to-delete gesture on cart items conflicts with horizontal scroll. Revisit." },
  { id:10, author:"Jiyeon",  abbr:"JY", color:"#ff7043", time:"1h ago",   resolved:false, text:"Review star component uses half-stars but the data only has integer ratings." },
  { id:11, author:"Ella",    abbr:"EL", color:"#42a5f5", time:"1h ago",   resolved:false, text:"Coupon input field placeholder text is cut off on small screens. Needs ellipsis." },
  { id:12, author:"Minjoon", abbr:"MJ", color:"#66bb6a", time:"2h ago",   resolved:true,  text:"Address autofill dropdown overlaps the footer CTA. Z-index issue." },
  { id:13, author:"Jiyeon",  abbr:"JY", color:"#ff7043", time:"2h ago",   resolved:false, text:"Map pin color on the store locator doesn't match the primary brand green." },
  { id:14, author:"Ella",    abbr:"EL", color:"#42a5f5", time:"2h ago",   resolved:false, text:"Card border radius is 12px in the design but the component uses 8px. Needs sync." },
  { id:15, author:"Ella",    abbr:"EL", color:"#42a5f5", time:"3h ago",   resolved:false, text:"Font size on mobile body text should be 14px, not 13px per accessibility audit." },
  { id:16, author:"Minjoon", abbr:"MJ", color:"#66bb6a", time:"3h ago",   resolved:false, text:"CTA button in dark mode is hardcoded white — should inherit from theme token." },
  { id:17, author:"Jiyeon",  abbr:"JY", color:"#ff7043", time:"4h ago",   resolved:false, text:"Loading indicator: skeleton screen instead of spinner for the product list." },
  { id:18, author:"Ella",    abbr:"EL", color:"#42a5f5", time:"4h ago",   resolved:false, text:"Search bar: move to 48dp from top instead of 56dp to align with iOS HIG." },
  { id:19, author:"Minjoon", abbr:"MJ", color:"#66bb6a", time:"5h ago",   resolved:false, text:"Notification badge max should display '99+' not '100'. Standard UX pattern." },
  { id:20, author:"Jiyeon",  abbr:"JY", color:"#ff7043", time:"5h ago",   resolved:false, text:"Bottom tab: 'Explore' and 'Browse' mean the same thing — pick one label." },
];

function RightPanel({ stateId }: { stateId: FigmaStateId }) {
  const [openId, setOpenId] = useState<string | null>(() => (stateId === "10" ? "comment" : null));
  const panel = RIGHT_PANELS.find(p=>p.id===openId);

  useEffect(() => {
    setOpenId(stateId === "10" ? "comment" : null);
  }, [stateId]);

  return (
    <div className="flex shrink-0">
      {panel && (
        <div className="w-56 border-l border-gray-200 bg-white flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{panel.icon}</span>
              <span className="text-[13px] font-semibold text-gray-700">{panel.label}</span>
            </div>
            <Tip label="Close panel" side="left">
              <button type="button" onClick={()=>setOpenId(null)} data-igg-id={openId === "comment" ? "figma.panel.comment.close" : undefined} className="rounded p-1 text-gray-400 transition hover:bg-gray-100">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </Tip>
          </div>
          {openId === "comment" ? (
            <div className="flex-1 overflow-y-auto" data-igg-id="figma.comments.scroll">
              {PANEL_COMMENTS.map(c => (
                <div key={c.id} className="border-b border-gray-100 px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: c.color }}>{c.abbr}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-gray-700">{c.author}</span>
                        <span className="shrink-0 text-[10px] text-gray-400">{c.time}</span>
                      </div>
                      <p className={`mt-0.5 text-[11px] leading-relaxed ${c.resolved ? "text-gray-400 line-through" : "text-gray-600"}`}>{c.text}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          data-igg-id={`figma.comment.${c.id}.reply`}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-violet-600 hover:bg-violet-50"
                        >Reply</button>
                        {!c.resolved && (
                          <button
                            type="button"
                            data-igg-id={`figma.comment.${c.id}.resolve`}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-100"
                          >Resolve</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 p-3">
              <p className="text-[12px] leading-relaxed text-gray-500">{panel.content}</p>
            </div>
          )}
        </div>
      )}
      {/* Icon strip */}
      <div className="flex w-10 shrink-0 flex-col items-center gap-1 border-l border-gray-200 bg-white py-2">
        {RIGHT_PANELS.map(p=>(
          <Tip key={p.id} label={p.label} side="left">
            <button type="button" onClick={()=>setOpenId(id=>id===p.id?null:p.id)}
              data-igg-id={p.id === "activity" ? "figma.panel.activity-log" : p.id === "comment" ? "figma.panel.comments" : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition hover:bg-gray-100 ${openId===p.id?"bg-violet-100":""}`}>
              {p.icon}
            </button>
          </Tip>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Bottom Toolbar
// ══════════════════════════════════════════════════════════════════════════════

function BottomToolbar({ activeTool, onSelect }: { activeTool:ToolId; onSelect:(t:ToolId)=>void }) {
  return (
    <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
      <div className="flex items-center gap-0.5 rounded-2xl border border-gray-200 bg-white px-2 py-1.5 shadow-lg">
        {TOOL_DEFS.map((tool)=>(
          <Tip key={tool.id} label={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""} · ${tool.description}`} side="top">
            <button type="button" onClick={()=>onSelect(tool.id)}
              data-igg-id={tool.id === "sticky" ? "figma.toolbar.sticky" : tool.id === "select" ? "figma.toolbar.select" : tool.id === "shape" ? "figma.toolbar.frame" : tool.id === "draw" ? "figma.toolbar.pen" : tool.id === "text" ? "figma.toolbar.text" : tool.id === "hand" ? "figma.toolbar.hand" : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${activeTool===tool.id?"bg-violet-500 text-white shadow-md":"text-gray-500 hover:bg-gray-100"}`}>
              <tool.Icon/>
            </button>
          </Tip>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Figma Banner — "Recent from your team" carousel (state 12)
// Rendered inline at the bottom of LeftSidebar
// ══════════════════════════════════════════════════════════════════════════════

function FigmaBanner({ items, activeIndex, setActiveIndex }: {
  items: FigmaBannerItem[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}) {
  const item = items[activeIndex];
  return (
    <div className="shrink-0 border-t border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Recent from team</span>
        <div className="flex items-center gap-0.5 text-[11px] text-gray-400">
          <button type="button" data-igg-id="figma.home.banner.prev" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} className="flex h-4 w-4 items-center justify-center rounded hover:bg-gray-100">‹</button>
          <span className="text-[10px]">{activeIndex + 1}/{items.length}</span>
          <button type="button" data-igg-id="figma.home.banner.next" onClick={() => setActiveIndex(Math.min(items.length - 1, activeIndex + 1))} className="flex h-4 w-4 items-center justify-center rounded hover:bg-gray-100">›</button>
        </div>
      </div>
      {/* Slide */}
      <div className="px-3 pb-2">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          <div className="h-16 w-full" style={{ backgroundColor: item.thumbColor }} />
          <div className="px-2.5 py-2">
            <div className="truncate text-[11px] font-semibold text-gray-800">{item.title}</div>
            <div className="mt-0.5 truncate text-[10px] text-gray-400">by {item.lastEditor} · {item.timeAgo}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] text-gray-500">{item.badge}</span>
              <button
                type="button"
                data-igg-id={item.target}
                className="rounded-md bg-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-violet-600"
              >Open</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════════════════════

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ stateId?: string; stateid?: string }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const initialStateId = getFigmaBenchmarkState(resolvedSearchParams.stateId ?? resolvedSearchParams.stateid ?? null);

  const [stateId] = useState<FigmaStateId>(initialStateId);
  const [activeTool, setActiveTool] = useState<ToolId>(() => getDefaultToolForState(initialStateId));
  const [notes, setNotes] = useState<Note[]>(() => getInitialNotesForState(initialStateId));
  const [premiumFeature, setPremiumFeature] = useState<string|null>(null);
  const [followingUser, setFollowingUser]   = useState<Collaborator|null>(null);


  const showPremium  = useCallback((l:string) => setPremiumFeature(l), []);
  const hidePremium  = useCallback(() => setPremiumFeature(null), []);
  const handleFollow = useCallback((c: Collaborator) =>
    setFollowingUser(prev => prev?.name === c.name ? null : c), []);
  const handleUnfollow = useCallback(() => setFollowingUser(null), []);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState =
          (window as Window & { __FIGMA_BENCHMARK_STATE__?: Record<string, unknown> }).__FIGMA_BENCHMARK_STATE__ ?? null;
        const source = event.source as Window | null;
        source?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        const source = event.source as Window | null;
        source?.postMessage(
          { type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) },
          "*",
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    (window as Window & { __FIGMA_BENCHMARK_STATE__?: Record<string, unknown> }).__FIGMA_BENCHMARK_STATE__ = {
      page: "figma",
      stateId,
      activeTool,
      noteCount: notes.length,
      premiumFeature,
      followingUser: followingUser?.name ?? null,
    };
  }, [activeTool, followingUser, notes.length, premiumFeature, stateId]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar followingUser={followingUser} onFollow={handleFollow}/>
      <div className="relative flex flex-1 overflow-hidden">
        <LeftSidebar onPremium={showPremium} stateId={stateId}/>
        <Canvas
          activeTool={activeTool} notes={notes} setNotes={setNotes}
          followingUser={followingUser} onUnfollow={handleUnfollow} stateId={stateId}
        />
        <RightPanel stateId={stateId}/>
        <BottomToolbar activeTool={activeTool} onSelect={setActiveTool}/>
      </div>
      {premiumFeature && <PremiumPopup feature={premiumFeature} onClose={hidePremium}/>}
    </div>
  );
}
