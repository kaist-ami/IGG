"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  activityItems,
  commentThreads,
  createDraftDocument,
  type DocumentRecord,
  type EditorMode,
  getDocumentById,
  homeRecentDocuments,
  homeTemplateGallery,
  type HomeRecentDocumentRecord,
  type HomeTemplateRecord,
  initialDocs,
  type LibraryTab,
  type RightPanel,
  toolbarFonts,
} from "./docs-data";
import { getDocsBenchmarkState } from "./docs-states";
import { createReviewRuntime } from "../../../lib/review-runtime";

function icon(label: string) {
  return <span aria-hidden="true">{label}</span>;
}

function reviewClass(id: string | undefined, target: string) {
  return id && id === target ? "outline outline-[3px] outline-[#ff7a00] outline-offset-4 ring-4 ring-[#ffb36b]/50" : "";
}

function buildQueryString(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const review = searchParams.get("review");
  const target = searchParams.get("target");

  if (review) params.set("review", review);
  if (target) params.set("target", target);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function resolveReviewElement(selector?: string | null) {
  if (!selector) return null;
  const direct = document.querySelector(selector);
  if (direct) return direct as HTMLElement;
  const testIdMatch = selector.match(/\[data-igg-id=['"]([^'"]+)['"]\]/);
  if (testIdMatch) {
    return document.querySelector(`[data-igg-id="${testIdMatch[1]}"]`) as HTMLElement | null;
  }
  return null;
}

const REVIEW_INTERACTIVE_SELECTOR = "button, a[href], input, textarea, select, summary, [role='button'], [role='tab']";

function resolveInteractiveReviewElement(element: HTMLElement | null) {
  if (!element) return null;
  if (element.matches(REVIEW_INTERACTIVE_SELECTOR)) return element;
  const descendant = element.querySelector(REVIEW_INTERACTIVE_SELECTOR);
  if (descendant) return descendant as HTMLElement;
  const ancestor = element.closest(REVIEW_INTERACTIVE_SELECTOR);
  return (ancestor as HTMLElement | null) ?? element;
}

function buildReviewSelector(element: HTMLElement | null) {
  if (!element) return null;
  const tagged = element.closest("[data-igg-id]") as HTMLElement | null;
  const iggId = tagged?.getAttribute("data-igg-id");
  if (iggId) return `[data-igg-id='${iggId}']`;
  return null;
}

const { installReviewCapture, executeReviewAction } = createReviewRuntime({
  runtimeStateKey: "__DOCS_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  resolveActionElement: resolveInteractiveReviewElement,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

function ViewToggleButton({
  icon,
  label,
  active,
  onClick,
  iggId,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  iggId?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setHovered(false);
        onClick();
      }}
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onBlur={() => setHovered(false)}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-full text-[18px] transition ${
        active || hovered ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]"
      }`}
      aria-label={label}
      data-igg-id={iggId}
    >
      <span aria-hidden="true">{icon}</span>
      <span
        className={`pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#202124] px-3 py-1.5 text-xs text-white shadow-lg transition ${
          hovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function ToolbarIconButton({
  icon,
  label,
  active = false,
  onClick,
  targetId,
  reviewTarget,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  targetId?: string;
  reviewTarget?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setHovered(false);
        onClick?.();
      }}
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onBlur={() => setHovered(false)}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
        active || hovered ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#3c4043] hover:bg-white"
      } ${reviewClass(targetId, reviewTarget ?? "")}`}
      data-igg-id={targetId}
    >
      <span aria-hidden="true" className="text-[16px] leading-none">
        {icon}
      </span>
      <span
        className={`pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#202124] px-2.5 py-1 text-[11px] text-white shadow-lg transition ${
          hovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function EditorMenuButton({
  label,
  open,
  onClick,
  items,
  itemIds,
  labelId,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  items: string[];
  itemIds?: Record<string, string>;
  labelId?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        data-igg-id={labelId}
        className={`rounded-md px-2.5 py-1 ${open ? "bg-white text-[#1a73e8]" : "hover:bg-white"}`}
      >
        {label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[90] mt-1 min-w-[180px] rounded-xl border border-[#dadce0] bg-white p-1.5 shadow-[0_12px_24px_rgba(60,64,67,0.2)]">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              data-igg-id={itemIds?.[item]}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-[#202124] hover:bg-[#f1f3f4]"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="6" height="12" rx="0.75" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="2" width="6" height="12" rx="0.75" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="1" y="6.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="1" y="10" width="14" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="1" y="13.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="3.5" y="6.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="1" y="10" width="14" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="3.5" y="13.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="6" y="6.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="1" y="10" width="14" height="1.5" rx="0.75" fill="currentColor"/>
      <rect x="6" y="13.5" width="9" height="1.5" rx="0.75" fill="currentColor"/>
    </svg>
  );
}

function TextColorToolIcon() {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <span className="text-[15px] font-semibold leading-none">A</span>
      <span className="absolute bottom-[1px] left-1/2 h-[2.5px] w-3 -translate-x-1/2 rounded-full bg-[#1a73e8]" />
    </span>
  );
}

function StrikethroughToolIcon() {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <span className="text-[15px] font-semibold leading-none">S</span>
      <span className="absolute left-1/2 top-1/2 h-[1.5px] w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
    </span>
  );
}

function getHomeDocumentOpenTargetId(doc: HomeLibraryItem) {
  if (doc.id === "doc-benchmark") return "docs.doc.benchmark.open";
  if (doc.id === "mock-annotation-guide") return "docs.doc.annotation.open";
  if (doc.id === "mock-kaist") return "docs.home.doc.monthly-checkin.open";
  if (doc.id === "mock-qlib") return "docs.home.doc.research-backlog.open";
  if (doc.id === "mock-orbit") return "docs.home.doc.operations-snapshot.open";
  if (doc.id === "mock-april") return "docs.doc.april-client-feedback.open";
  if (doc.id === "mock-canvas") return "docs.doc.campus-renewal.open";
  if (doc.id === "mock-arch-1") return "docs.home.doc.team-hub.open";
  if (doc.id === "mock-mintlab") return "docs.home.doc.mintlab.open";
  if (doc.id === "mock-river") return "docs.home.doc.river-test-log.open";
  return undefined;
}

function getHomeDocumentStarTargetId(doc: HomeLibraryItem) {
  if (doc.id === "mock-canvas") return "docs.doc.campus-renewal.star";
  return doc.id === "mock-profit" ? "docs.doc.quarterly-retro.star" : undefined;
}

function HomeDocumentPreview({
  doc,
  onToggleStar,
  onOpenMenu,
  reviewTarget,
  menuOpen,
  onStartRename,
  onDelete,
}: {
  doc: HomeLibraryItem;
  onToggleStar: () => void;
  onOpenMenu: () => void;
  reviewTarget: string;
  menuOpen: boolean;
  onStartRename: () => void;
  onDelete: () => void;
}) {
  const openTargetId = getHomeDocumentOpenTargetId(doc);
  const starTargetId = getHomeDocumentStarTargetId(doc);
  const isReal = doc.kind === "real";
  const toneMap = {
    lavender: {
      page: "bg-[#ffffff]",
      accent: "bg-[#f5d0fe]",
      line: "bg-[#e9d5ff]",
    },
    blue: {
      page: "bg-[#ffffff]",
      accent: "bg-[#dbeafe]",
      line: "bg-[#d9e7fb]",
    },
    amber: {
      page: "bg-[#fffdf7]",
      accent: "bg-[#fde68a]",
      line: "bg-[#f6ead0]",
    },
    mint: {
      page: "bg-[#fbfffd]",
      accent: "bg-[#bbf7d0]",
      line: "bg-[#ddf5e6]",
    },
    rose: {
      page: "bg-[#fffdfd]",
      accent: "bg-[#fecdd3]",
      line: "bg-[#f7d6db]",
    },
    slate: {
      page: "bg-[#ffffff]",
      accent: "bg-[#cbd5e1]",
      line: "bg-[#e5e7eb]",
    },
  } as const;
  const tone = !isReal ? toneMap[doc.previewTone] : null;

  return (
    <div data-docs-home-menu-root="true" className={`relative rounded-[8px] border border-[#dadce0] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(60,64,67,0.16)] ${menuOpen ? "z-[100]" : ""}`}>
      <div className={`block w-full text-left ${reviewClass(openTargetId, reviewTarget)}`} data-igg-id={openTargetId}>
        {isReal ? (
          <div className="flex h-[172px] items-center justify-center border-b border-[#dadce0] bg-[#fafbfc] p-4">
            <div className="h-full w-[118px] overflow-hidden rounded-[2px] border border-[#edf0f2] bg-white">
              <div className="h-4 border-b border-[#edf0f2] bg-[#f8fbff]" />
              <div className="space-y-2.5 px-3 py-3">
                <div className="h-1.5 w-10 rounded bg-[#d2e3fc]" />
                <div className="space-y-2">
                  <div className="h-1.5 w-full rounded bg-[#eef2f7]" />
                  <div className="h-1.5 w-[88%] rounded bg-[#eef2f7]" />
                  <div className="h-1.5 w-[82%] rounded bg-[#eef2f7]" />
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-[70%] rounded bg-[#e6f4ea]" />
                  <div className="h-1.5 w-full rounded bg-[#eef2f7]" />
                  <div className="h-1.5 w-[78%] rounded bg-[#eef2f7]" />
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-[64%] rounded bg-[#fce8e6]" />
                  <div className="h-1.5 w-[92%] rounded bg-[#eef2f7]" />
                  <div className="h-1.5 w-[75%] rounded bg-[#eef2f7]" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[172px] items-center justify-center border-b border-[#dadce0] bg-[#fafbfc] p-4">
            <div className={`h-full w-[118px] rounded-[2px] border border-[#ebedf0] ${tone?.page} px-3 py-3`}>
              <div className={`mb-2 h-1.5 w-[52%] rounded ${tone?.accent}`} />
              <div className="space-y-1.5">
                <div className={`h-1.5 w-full rounded ${tone?.line}`} />
                <div className={`h-1.5 w-[92%] rounded ${tone?.line}`} />
                <div className={`h-1.5 w-[84%] rounded ${tone?.line}`} />
                <div className={`h-1.5 w-[88%] rounded ${tone?.line}`} />
                <div className={`h-1.5 w-[73%] rounded ${tone?.line}`} />
                <div className={`h-1.5 w-full rounded ${tone?.line}`} />
                <div className={`h-1.5 w-[82%] rounded ${tone?.line}`} />
                <div className={`h-1.5 w-[94%] rounded ${tone?.line}`} />
                <div className={`h-1.5 w-[68%] rounded ${tone?.line}`} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-[#edf0f3] px-3 py-3">
        <div className="line-clamp-1 text-[14px] font-medium text-[#202124]" data-igg-id={openTargetId}>{doc.title}</div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-[#5f6368]">
          <div className="flex items-center gap-1.5" data-igg-id={openTargetId}>
            <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#4285f4] text-[10px] text-white">
              D
            </span>
            <span>{doc.displayDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleStar}
              data-igg-id={starTargetId}
              className={`text-[15px] leading-none ${doc.starred ? "text-[#b06000]" : "text-[#9aa0a6]"}`}
            >
              {doc.starred ? "★" : "☆"}
            </button>
            <div className="relative">
              <button type="button" onClick={onOpenMenu} className="text-[16px] leading-none text-[#80868b]" data-igg-id={doc.id === "doc-benchmark" ? "docs.home.doc.product-research.menu" : doc.id === "mock-arch-1" ? "docs.home.doc.mock-arch-1.menu" : doc.id === "mock-corner" ? "docs.home.doc.mock-corner.menu" : undefined}>
                ⋮
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-[90] mt-2 w-[150px] rounded-xl border border-[#dadce0] bg-white p-1.5 shadow-[0_12px_24px_rgba(60,64,67,0.2)]">
                  <button type="button" onClick={onStartRename} className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-[#202124] hover:bg-[#f1f3f4]" data-igg-id={doc.id === "doc-benchmark" ? "docs.home.doc.product-research.rename" : doc.id === "mock-corner" ? "docs.home.doc.mock-corner.rename" : undefined}>
                    Rename
                  </button>
                  <button type="button" onClick={onDelete} className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-[#b3261e] hover:bg-[#fce8e6]" data-igg-id={doc.id === "mock-arch-1" ? "docs.home.doc.mock-arch-1.delete" : undefined}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewArt({ template }: { template: HomeTemplateRecord }) {
  if (template.preview === "blank") {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="relative h-14 w-14">
          <div className="absolute left-1/2 top-0 h-14 w-2 -translate-x-1/2 rounded-full bg-[#bdc1c6]" />
          <div className="absolute left-0 top-1/2 h-2 w-14 -translate-y-1/2 rounded-full bg-[#bdc1c6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white px-4 py-4">
      <div className="mb-3 h-1.5 rounded-full" style={{ backgroundColor: template.accent }} />
      <div className="space-y-2">
        <div className="h-2 w-[55%] rounded bg-[#d7dce3]" />
        <div className="h-2 w-[82%] rounded bg-[#eceff3]" />
        <div className="h-2 w-[72%] rounded bg-[#eceff3]" />
      </div>
      {template.preview === "resume" && (
        <div className="mt-4 grid grid-cols-[1fr_72px] gap-3">
          <div className="space-y-2">
            <div className="h-2 w-[70%] rounded bg-[#eceff3]" />
            <div className="h-2 w-[88%] rounded bg-[#eceff3]" />
            <div className="h-2 w-[60%] rounded bg-[#eceff3]" />
          </div>
          <div className="rounded-md bg-[#f7f3ef]" />
        </div>
      )}
      {template.preview === "report" && (
        <div className="mt-4 space-y-2">
          <div className="h-2 w-[92%] rounded bg-[#fde1db]" />
          <div className="h-2 w-[76%] rounded bg-[#eceff3]" />
          <div className="h-2 w-[68%] rounded bg-[#eceff3]" />
        </div>
      )}
      {template.preview === "letter" && (
        <div className="mt-5 space-y-3">
          <div className="h-2 w-[50%] rounded bg-[#d4efe2]" />
          <div className="h-2 w-full rounded bg-[#eceff3]" />
          <div className="h-2 w-[86%] rounded bg-[#eceff3]" />
        </div>
      )}
      {template.preview === "proposal" && (
        <div className="mt-4 overflow-hidden rounded-lg bg-[#f6efe3]">
          <div className="flex h-16">
            <div className="w-[36%] bg-[#d7b98a]" />
            <div className="w-[28%] bg-[#6ab7ba]" />
            <div className="w-[36%] bg-[#edd9b0]" />
          </div>
        </div>
      )}
      {template.preview === "brochure" && (
        <div className="mt-4">
          <div className="h-16 rounded-xl bg-[linear-gradient(135deg,#f7d7e8_0%,#ffffff_42%,#c7d2fe_42%,#ffffff_100%)]" />
          <div className="mt-3 space-y-2">
            <div className="h-2 w-[82%] rounded bg-[#eceff3]" />
            <div className="h-2 w-[58%] rounded bg-[#eceff3]" />
          </div>
        </div>
      )}
      {template.preview === "memo" && (
        <div className="mt-4 space-y-3">
          <div className="h-20 rounded-lg bg-[#f7f4ef]" />
          <div className="h-2 w-[75%] rounded bg-[#eceff3]" />
        </div>
      )}
    </div>
  );
}

function MockTemplateCard({
  template,
  reviewTarget,
}: {
  template: HomeTemplateRecord;
  reviewTarget: string;
}) {
  const templateTargetId =
    template.id === "blank"
      ? "docs.home.new-document"
      : template.id === "research-brief"
        ? "docs.template.research-brief"
          : template.id === "research-log"
            ? "docs.template.research-log"
            : template.id === "resume-modern"
              ? "docs.template.resume-modern"
              : template.id === "meeting-notes"
                ? "docs.template.meeting-notes"
                : template.id === "project-proposal"
                  ? "docs.template.project-proposal"
                  : template.id === "weekly-plan"
                    ? "docs.template.weekly-plan"
                    : undefined;
  return (
    <button
      type="button"
      className={`group w-[138px] min-w-[138px] cursor-pointer rounded-lg p-1.5 text-left transition active:scale-[0.97] active:bg-[#e8eaed] hover:bg-[#f1f3f4] ${reviewClass(templateTargetId, reviewTarget)}`}
      data-igg-id={templateTargetId}
    >
      <div className="overflow-hidden rounded-[4px] border border-[#d6dae2] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.16)] group-hover:shadow-[0_2px_6px_rgba(60,64,67,0.22)] transition-shadow">
        <div className="h-[118px]">
          <TemplatePreviewArt template={template} />
        </div>
      </div>
      <div className="mt-2 text-[14px] font-medium text-[#202124]">{template.name}</div>
      <div className="text-[12px] text-[#80868b]">{template.subtitle || "\u00A0"}</div>
    </button>
  );
}

function HomeDocumentRow({
  doc,
  onToggleStar,
  onOpenMenu,
  menuOpen,
  onStartRename,
  onDelete,
}: {
  doc: HomeLibraryItem;
  onToggleStar: () => void;
  onOpenMenu: () => void;
  menuOpen: boolean;
  onStartRename: () => void;
  onDelete: () => void;
}) {
  const isReal = doc.kind === "real";
  const toneClass = isReal
    ? "bg-[#e8f0fe]"
    : doc.previewTone === "lavender"
      ? "bg-[#f3e8ff]"
      : doc.previewTone === "blue"
        ? "bg-[#dbeafe]"
        : doc.previewTone === "amber"
          ? "bg-[#fef3c7]"
          : doc.previewTone === "mint"
            ? "bg-[#dcfce7]"
            : doc.previewTone === "rose"
              ? "bg-[#ffe4e6]"
              : "bg-[#e5e7eb]";

  return (
    <div data-docs-home-menu-root="true" className={`relative ${menuOpen ? "z-[100]" : ""}`}>
      <div className="grid grid-cols-[minmax(0,1.8fr)_120px_120px_72px] items-center gap-4 rounded-2xl border border-[#dadce0] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(60,64,67,0.08)] transition hover:bg-[#fbfcff]">
        {isReal ? (
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[#e5e7eb] ${toneClass}`}>
              <div className="h-7 w-5 rounded-[2px] border border-white/70 bg-white/90" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-[#202124]">{doc.title}</div>
              <div className="mt-1 truncate text-[12px] text-[#5f6368]">{doc.summary}</div>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[#e5e7eb] ${toneClass}`}>
              <div className="h-7 w-5 rounded-[2px] border border-white/70 bg-white/90" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-[#202124]">{doc.title}</div>
              <div className="mt-1 truncate text-[12px] text-[#5f6368]">{doc.summary}</div>
            </div>
          </div>
        )}
        <div className="hidden text-[13px] text-[#5f6368] md:block">{doc.owner}</div>
        <div className="hidden text-[13px] text-[#5f6368] lg:block">{doc.displayDate}</div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onToggleStar}
            className={`text-[15px] leading-none ${doc.starred ? "text-[#b06000]" : "text-[#9aa0a6]"}`}
          >
            {doc.starred ? "★" : "☆"}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={onOpenMenu}
              className="text-[16px] leading-none text-[#80868b]"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-[90] mt-2 w-[150px] rounded-xl border border-[#dadce0] bg-white p-1.5 shadow-[0_12px_24px_rgba(60,64,67,0.2)]">
                <button type="button" onClick={onStartRename} className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-[#202124] hover:bg-[#f1f3f4]">
                  Rename
                </button>
                <button type="button" onClick={onDelete} className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-[#b3261e] hover:bg-[#fce8e6]">
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type HomeLibraryItem =
  | {
      kind: "real";
      id: string;
      title: string;
      displayDate: string;
      summary: string;
      owner: string;
      starred: boolean;
      shared: boolean;
    }
  | ({
      kind: "mock";
      starred: boolean;
      shared: boolean;
    } & HomeRecentDocumentRecord);

function createHomeLibraryItems(): HomeLibraryItem[] {
  const primaryDoc = initialDocs[0];

  return [
    {
      kind: "real",
      id: primaryDoc.id,
      title: "Product Research Weekly Brief",
      displayDate: primaryDoc.displayDate,
      summary: "Research brief linked from the main screen",
      owner: primaryDoc.owner,
      starred: primaryDoc.starred,
      shared: primaryDoc.shared,
    },
    ...homeRecentDocuments.map((doc, index) => ({
      ...doc,
      kind: "mock" as const,
      starred: index % 6 === 0,
      shared: index % 4 !== 1,
    })),
  ];
}

const DEFAULT_RECENT_SEARCHES = [
  "Meeting notes",
  "Brief",
  "Project",
  "Operations",
  "Campaign",
];

const homeBannerItems = [
  {
    title: "Review shared annotations",
    body: "3 comments need your attention in Shared Annotation Guide.",
    target: "docs.home.banner.annotations.open",
    lastEditor: "Daisy",
    lastEdited: "5 min ago",
    accent: "#e8f0fe",
    iconColor: "#1a73e8",
    badge: "3 new comments",
  },
  {
    title: "Resume onboarding draft",
    body: "New Onboarding Draft v2 was edited this morning and has open tasks.",
    target: "docs.home.banner.onboarding.open",
    lastEditor: "Minjoon",
    lastEdited: "2 hours ago",
    accent: "#e6f4ea",
    iconColor: "#137333",
    badge: "Last opened by you",
  },
  {
    title: "Open QA notes",
    body: "Studio Alpha QA Notes has 4 unresolved checklist items.",
    target: "docs.home.banner.qa-notes.open",
    lastEditor: "Ella",
    lastEdited: "Yesterday",
    accent: "#fce8e6",
    iconColor: "#c5221f",
    badge: "4 items pending",
  },
  {
    title: "Check operations retrospective",
    body: "Quarterly Operations Retrospective is ready for your review.",
    target: "docs.home.banner.operations.open",
    lastEditor: "Marcus",
    lastEdited: "Apr 28",
    accent: "#fef7e0",
    iconColor: "#b06000",
    badge: "Awaiting review",
  },
  {
    title: "View interview log",
    body: "MintLab Interview Log was shared with you by Daisy.",
    target: "docs.home.banner.interview-log.open",
    lastEditor: "Daisy",
    lastEdited: "Apr 27",
    accent: "#f3e8fd",
    iconColor: "#7c4dff",
    badge: "Shared with you",
  },
  {
    title: "Open roadmap sketch",
    body: "Forge Roadmap Sketch has recent collaborator changes from 2 people.",
    target: "docs.home.banner.roadmap.open",
    lastEditor: "Sarah",
    lastEdited: "Apr 25",
    accent: "#e8f5e9",
    iconColor: "#0d652d",
    badge: "2 collaborators active",
  },
];

type SortMode = "recent" | "name";

export function DocsHomePage({ initialStateId }: { initialStateId?: string }) {
  const searchParams = useSearchParams();
  const benchmarkState = useMemo(() => getDocsBenchmarkState(initialStateId), [initialStateId]);
  const initialTab = benchmarkState.tab;
  const initialQuery = benchmarkState.query;
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortHovered, setSortHovered] = useState(false);
  const reviewMode = searchParams.get("review") === "1";
  const reviewTarget = searchParams.get("target") ?? "";
  const [homeDocs, setHomeDocs] = useState<HomeLibraryItem[]>(() => createHomeLibraryItems());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT_SEARCHES);
  const [showRecentSearches, setShowRecentSearches] = useState(initialStateId === "2");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [bannerTimerReset, setBannerTimerReset] = useState(0);
  const searchLayerRef = useRef<HTMLDivElement>(null);
  const sortLayerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialStateId === "2") {
      searchInputRef.current?.focus();
    }
    if (typeof benchmarkState.initialScrollY === "number") {
      const timer = window.setTimeout(() => {
        window.scrollTo({ top: benchmarkState.initialScrollY ?? 0, behavior: "instant" });
      }, 80);
      return () => window.clearTimeout(timer);
    }
  }, [benchmarkState.initialScrollY, initialStateId]);

  useEffect(() => {
    setActiveBannerIndex(0);
    setBannerTimerReset(0);
  }, [benchmarkState.autoBannerDelayMs, benchmarkState.autoBannerTargetIndex]);

  useEffect(() => {
    if (benchmarkState.autoBannerDelayMs === null || benchmarkState.autoBannerTargetIndex === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveBannerIndex(benchmarkState.autoBannerTargetIndex ?? 0);
    }, benchmarkState.autoBannerDelayMs);

    return () => window.clearTimeout(timer);
  }, [benchmarkState.autoBannerDelayMs, benchmarkState.autoBannerTargetIndex, bannerTimerReset]);

  function selectHomeBanner(index: number) {
    setActiveBannerIndex(index);
    setBannerTimerReset((value) => value + 1);
  }

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __DOCS_BENCHMARK_STATE__?: Record<string, unknown> }).__DOCS_BENCHMARK_STATE__ ?? null;
        const source = event.source as Window | null;
        source?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        const source = event.source as Window | null;
        source?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchLayerRef.current?.contains(event.target as Node)) {
        setShowRecentSearches(false);
      }
      if (!sortLayerRef.current?.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
      if (!(event.target instanceof Element) || !event.target.closest("[data-docs-home-menu-root='true']")) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const filteredLibraryDocs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const filtered = homeDocs.filter((entry) => {
      if (tab === "owned" && entry.owner !== "Ella") return false;
      if (tab === "shared" && !entry.shared) return false;
      if (tab === "starred" && !entry.starred) return false;
      if (!normalized) return true;

      return [entry.title, entry.summary, entry.owner].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "name") {
        return a.title.localeCompare(b.title, "ko");
      }

      return b.displayDate.localeCompare(a.displayDate, "ko");
    });
  }, [homeDocs, query, sortMode, tab]);

  useEffect(() => {
    (window as Window & { __DOCS_BENCHMARK_STATE__?: Record<string, unknown> }).__DOCS_BENCHMARK_STATE__ = {
      route: "home",
      page: "docs.home",
      query,
      tab,
      viewMode,
      sortMode,
      visibleDocumentIds: filteredLibraryDocs.map((entry) => entry.id),
    };
  }, [filteredLibraryDocs, query, sortMode, tab, viewMode]);

  function toggleStar(docId: string) {
    setHomeDocs((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, starred: !doc.starred } : doc)),
    );
  }

  function openRenameDialog() {
    setOpenMenuId(null);
  }

  function deleteHomeDoc() {
    setOpenMenuId(null);
  }

  function commitRecentSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => [
      trimmed,
      ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 8));
  }

  const primaryTemplates = homeTemplateGallery.slice(0, 7);
  const secondaryTemplates = homeTemplateGallery.slice(7);
  const activeBanner = homeBannerItems[activeBannerIndex] ?? homeBannerItems[0];

  return (
    <main className="min-h-screen bg-transparent text-[#202124]">
      {reviewMode && (
        <div className="fixed right-5 top-5 z-[100] rounded-2xl bg-[#111827] px-4 py-3 text-xs font-semibold tracking-[0.08em] text-white shadow-2xl">
          IGG target: {reviewTarget || "none"}
        </div>
      )}
      <section className="docs-fade-up mx-auto flex min-h-screen w-full max-w-[1280px] flex-col pb-14 pt-3">
        <div className="mb-5 flex items-center gap-3 px-4">
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-[#5f6368] hover:bg-white/70">
            ☰
          </button>
          <div className="flex items-center gap-3 pr-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0fe] text-xl text-[#1a73e8]">
              {icon("📄")}
            </div>
            <div className="text-[22px] font-medium tracking-[-0.02em] text-[#202124]">Docs</div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div ref={searchLayerRef} className="relative w-full max-w-[520px]">
              <label className="flex w-full items-center gap-3 rounded-full bg-[#f1f3f4] px-5 py-3" onMouseDown={(e) => { e.stopPropagation(); setShowRecentSearches((prev) => !prev); }}>
                <span className="text-[#5f6368]">{icon("🔎")}</span>
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      commitRecentSearch(query);
                      setShowRecentSearches(false);
                    }
                  }}
                  placeholder="Search documents"
                  className={`w-full border-none bg-transparent text-[15px] outline-none placeholder:text-[#5f6368] ${reviewClass("docs.home.search_input", reviewTarget)}`}
                  data-igg-id="docs.home.search_input"
                />
              </label>
              {showRecentSearches && (
                <div data-igg-id="docs.home.recent_searches" className="absolute left-0 right-0 top-[56px] z-30 overflow-hidden rounded-[20px] border border-[#dadce0] bg-white py-2 shadow-[0_16px_40px_rgba(60,64,67,0.2)]">
                  <div className="px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">
                    Recent searches
                  </div>
                  <div className="space-y-0.5 px-2 pb-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        data-igg-id={item === "Operations" ? "docs.home.recent_search.operations" : undefined}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-[#202124] hover:bg-[#f1f3f4]"
                      >
                        <span className="text-[#5f6368]">🕘</span>
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-white/70">⌗</button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-white/70">⚙</button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f97316] text-sm font-semibold text-white">EL</div>
          </div>
        </div>

        <div className="rounded-[20px] bg-[#eef2fa] px-8 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[15px] font-medium text-[#3c4043]">Start a new document</div>
            <div className="text-[13px] text-[#5f6368]" data-igg-id="docs.home.tab.templates">Template gallery</div>
          </div>
          <div className="pb-1">
            <div className="flex w-full items-start justify-between gap-6">
              {primaryTemplates.map((template) => (
                <MockTemplateCard key={template.id} template={template} reviewTarget={reviewTarget} />
              ))}
            </div>
            {showAllTemplates && secondaryTemplates.length > 0 && (
              <div className="mt-6 flex w-full items-start justify-center gap-6">
                {secondaryTemplates.map((template) => (
                  <MockTemplateCard key={template.id} template={template} reviewTarget={reviewTarget} />
                ))}
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllTemplates((prev) => !prev)}
              className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#5f6368] shadow-[0_1px_2px_rgba(60,64,67,0.1)] transition hover:bg-[#f8f9fa]"
              data-igg-id="docs.home.templates_show_more"
            >
              {showAllTemplates ? "Collapse" : "More"}
            </button>
          </div>
        </div>

        {benchmarkState.autoBannerTargetIndex !== null && (
          <div className="mt-5 overflow-hidden rounded-[20px] border border-[#e8eaed] bg-white shadow-[0_2px_10px_rgba(60,64,67,0.15)]">
            <div className="flex items-center border-b border-[#f1f3f4] px-5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5f6368]">
                <span>★</span>
                <span>Suggested for you</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: activeBanner.accent }}
              >
                <span style={{ color: activeBanner.iconColor }}>📄</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[15px] font-semibold text-[#202124]">{activeBanner.title}</div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: activeBanner.accent, color: activeBanner.iconColor }}
                  >
                    {activeBanner.badge}
                  </span>
                </div>
                <div className="mt-0.5 line-clamp-1 text-[13px] text-[#5f6368]">{activeBanner.body}</div>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-[#9aa0a6]">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e8f0fe] text-[9px] font-bold text-[#1a73e8]">
                    {activeBanner.lastEditor.slice(0, 1)}
                  </div>
                  <span>Edited by {activeBanner.lastEditor}</span>
                  <span>·</span>
                  <span>{activeBanner.lastEdited}</span>
                </div>
              </div>
              <button
                type="button"
                data-igg-id={activeBanner.target}
                data-igg-type="auto_transition"
                className="shrink-0 rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1557b0]"
              >
                Open
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 pb-3">
              {homeBannerItems.map((item, index) => (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => selectHomeBanner(index)}
                  data-igg-id={`docs.home.banner.dot.${index}`}
                  className={`rounded-full transition-all duration-200 ${index === activeBannerIndex ? "w-6 h-1.5 bg-[#1a73e8]" : "w-1.5 h-1.5 bg-[#dadce0] hover:bg-[#bdc1c6]"}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="px-6 pt-4">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-[18px] font-medium text-[#202124]">Recent documents</div>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {([
                ["recent", "Recent"],
                ["owned", "Owned by me"],
                ["shared", "Shared with me"],
                ["starred", "Starred"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    tab === value ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
                  } ${reviewClass(
                    value === "owned"
                      ? "docs.home.tab.owned"
                      : value === "shared"
                        ? "docs.home.tab.shared"
                        : value === "starred"
                          ? "docs.home.tab.starred"
                          : value === "recent"
                            ? "docs.home.tab.recent"
                            : undefined,
                    reviewTarget,
                  )}`}
                  data-igg-id={
                    value === "owned"
                      ? "docs.home.tab.owned"
                      : value === "shared"
                        ? "docs.home.tab.shared"
                        : value === "starred"
                          ? "docs.home.tab.starred"
                          : value === "recent"
                            ? "docs.home.tab.recent"
                            : undefined
                  }
                >
                  {label}
                </button>
              ))}
              <div className="mx-1 h-8 w-px bg-[#dadce0]" />
              <ViewToggleButton icon="▦" label="Grid view" active={viewMode === "grid"} onClick={() => setViewMode("grid")} iggId="docs.home.view_grid" />
              <ViewToggleButton icon="☷" label="List view" active={viewMode === "list"} onClick={() => setViewMode("list")} iggId="docs.home.view_list" />
              <div ref={sortLayerRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSortHovered(false);
                    setShowSortMenu((prev) => !prev);
                  }}
                  onMouseOver={() => setSortHovered(true)}
                  onMouseLeave={() => setSortHovered(false)}
                  onBlur={() => setSortHovered(false)}
                  className="group relative flex h-12 w-12 items-center justify-center rounded-full text-[24px] text-[#5f6368] transition hover:bg-[#f1f3f4] hover:text-[#202124]"
                  aria-label="Sort options"
                  data-igg-id="docs.home.sort_button"
                >
                  <span aria-hidden="true">AŽ</span>
                  <span className={`pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#202124] px-3 py-1.5 text-xs text-white shadow-lg transition ${
                    sortHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}>
                    Sort options
                  </span>
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-[170px] rounded-xl border border-[#dadce0] bg-white p-1.5 shadow-[0_12px_24px_rgba(60,64,67,0.2)]">
                    <button
                      type="button"
                      onClick={() => {
                        setSortMode("recent");
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${sortMode === "recent" ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#202124] hover:bg-[#f1f3f4]"}`}
                      data-igg-id="docs.home.sort_date"
                    >
                      Recent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortMode("name");
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${sortMode === "name" ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#202124] hover:bg-[#f1f3f4]"}`}
                      data-igg-id="docs.home.sort_name"
                    >
                      Name
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={viewMode === "grid" ? "grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" : "space-y-3"}>
            {viewMode === "grid" &&
              filteredLibraryDocs.map((entry) => (
                <HomeDocumentPreview
                  key={entry.id}
                  doc={entry}
                  onToggleStar={() => toggleStar(entry.id)}
                  onOpenMenu={() => setOpenMenuId((prev) => (prev === entry.id ? null : entry.id))}
                  reviewTarget={reviewTarget}
                  menuOpen={openMenuId === entry.id}
                  onStartRename={() => openRenameDialog()}
                  onDelete={() => deleteHomeDoc()}
                />
              ))}
            {viewMode === "list" && (
              <>
                <div className="grid grid-cols-[minmax(0,1.8fr)_120px_120px_72px] items-center gap-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">
                  <div>Name</div>
                  <div className="hidden md:block">Owner</div>
                  <div className="hidden lg:block">Last modified</div>
                  <div className="text-right">Options</div>
                </div>
                {filteredLibraryDocs.map((entry) => (
                  <HomeDocumentRow
                    key={entry.id}
                    doc={entry}
                    onToggleStar={() => toggleStar(entry.id)}
                    onOpenMenu={() => setOpenMenuId((prev) => (prev === entry.id ? null : entry.id))}
                    menuOpen={openMenuId === entry.id}
                    onStartRename={() => openRenameDialog()}
                    onDelete={() => deleteHomeDoc()}
                  />
                ))}
              </>
            )}
            {filteredLibraryDocs.length === 0 && (
              <div className="col-span-full rounded-[14px] border border-[#dadce0] px-5 py-12 text-center text-sm text-[#5f6368]">
                No documents matched &quot;{query}&quot;.
              </div>
            )}
          </div>

        </div>

      </section>
    </main>
  );
}

export function DocsEditorPage({
  initialDocId,
  initialTemplateId,
  initialStateId,
}: {
  initialDocId: string;
  initialTemplateId?: string;
  initialStateId?: string;
}) {
  const benchmarkState = useMemo(() => getDocsBenchmarkState(initialStateId), [initialStateId]);
  const editorMenuItems = {
    File: ["New", "Make a copy", "Download", "Rename", "Share"],
    Edit: ["Cut", "Copy", "Paste"],
    View: ["Print layout", "Show ruler", "Document outline", "Full screen"],
    Insert: ["Image", "Table", "Divider"],
    Tools: ["Word count", "Translate", "Preferences"],
    Extensions: ["Add-ons", "Macros", "Connected apps"],
  } as const;
  const searchParams = useSearchParams();
  const homeHref = `/${buildQueryString(searchParams)}`;
  const reviewTarget = searchParams.get("target") ?? "";
  const initialDoc = useMemo(() => {
    if (initialDocId === "new") {
      return createDraftDocument(initialTemplateId ?? "blank");
    }

    return getDocumentById(initialDocId) ?? createDraftDocument("blank");
  }, [initialDocId, initialTemplateId]);

  const [currentDoc, setCurrentDoc] = useState<DocumentRecord>(initialDoc);
  const [editorMode, setEditorMode] = useState<EditorMode>(benchmarkState.editorMode);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const zoomDropdownRef = useRef<HTMLDivElement>(null);
  const [font, setFont] = useState("Arial");
  const [fontSize, setFontSize] = useState(11);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("left");
  const [zoom, setZoom] = useState(100);
  const [rightPanel, setRightPanel] = useState<RightPanel>(benchmarkState.rightPanel);
  const [showShare, setShowShare] = useState(benchmarkState.showShare);
  const [showFind, setShowFind] = useState(benchmarkState.showFind);
  const [searchTerm, setSearchTerm] = useState(benchmarkState.searchTerm);
  const [replaceTerm, setReplaceTerm] = useState(benchmarkState.replaceTerm);
  const [rightPanelWidth, setRightPanelWidth] = useState(initialStateId === "4" ? 160 : 320);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "processing" | "paused" | "ready">(
    initialStateId === "5" ? "processing" : "idle"
  );
  const [pdfProgress, setPdfProgress] = useState(0);
  const [showAutosaveToast, setShowAutosaveToast] = useState(false);
  const [asyncReviewReady, setAsyncReviewReady] = useState(benchmarkState.asyncReviewDelayMs === null);
  const [openEditorMenu, setOpenEditorMenu] = useState<keyof typeof editorMenuItems | null>(null);
  const editorMenuRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentDoc(initialDoc);
  }, [initialDoc]);

  useEffect(() => {
    setEditorMode(benchmarkState.editorMode);
    setRightPanel(benchmarkState.rightPanel);
    setShowShare(benchmarkState.showShare);
    setShowFind(benchmarkState.showFind);
    setSearchTerm(benchmarkState.searchTerm);
    setReplaceTerm(benchmarkState.replaceTerm);
    const frame = window.requestAnimationFrame(() => {
      if (typeof benchmarkState.initialScrollY === "number") {
        editorScrollRef.current?.scrollTo({ top: benchmarkState.initialScrollY, behavior: "instant" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [benchmarkState.editorMode, benchmarkState.initialScrollY, benchmarkState.replaceTerm, benchmarkState.rightPanel, benchmarkState.searchTerm, benchmarkState.showFind, benchmarkState.showShare, currentDoc.id, initialStateId]);

  useEffect(() => {
    if (initialStateId !== "6") {
      setShowAutosaveToast(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowAutosaveToast(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [initialStateId]);

  useEffect(() => {
    if (benchmarkState.asyncReviewDelayMs === null) {
      setAsyncReviewReady(true);
      return;
    }

    setAsyncReviewReady(false);
    const timer = window.setTimeout(() => {
      setAsyncReviewReady(true);
    }, benchmarkState.asyncReviewDelayMs);

    return () => window.clearTimeout(timer);
  }, [benchmarkState.asyncReviewDelayMs]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __DOCS_BENCHMARK_STATE__?: Record<string, unknown> }).__DOCS_BENCHMARK_STATE__ ?? null;
        const source = event.source as Window | null;
        source?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        const source = event.source as Window | null;
        source?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (pdfStatus !== "processing") return;
    const interval = setInterval(() => {
      setPdfProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setPdfStatus("ready");
          return 100;
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [pdfStatus]);

useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!editorMenuRef.current?.contains(event.target as Node)) {
        setOpenEditorMenu(null);
      }
      if (!modeDropdownRef.current?.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
      if (!zoomDropdownRef.current?.contains(event.target as Node)) {
        setShowZoomDropdown(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    (window as Window & { __DOCS_BENCHMARK_STATE__?: Record<string, unknown> }).__DOCS_BENCHMARK_STATE__ = {
      route: "editor",
      page: `docs.editor.${currentDoc.id}`,
      docId: currentDoc.id,
      editorMode,
      font,
      fontSize,
      alignment,
      zoom,
      rightPanel,
      showShare,
      showFind,
      searchTerm,
      replaceTerm,
    };
  }, [alignment, currentDoc.id, editorMode, font, fontSize, replaceTerm, rightPanel, searchTerm, showFind, showShare, zoom]);

  function renameCurrentDoc(title: string) {
    setCurrentDoc((prev) => ({ ...prev, title }));
  }

  function toggleStar() {
    setCurrentDoc((prev) => ({ ...prev, starred: !prev.starred }));
  }

  function toggleChecklist(sectionId: string, itemId: string) {
    setCurrentDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id !== sectionId || section.type !== "checklist"
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
            },
      ),
    }));
  }

  function jumpToOutlineItem(label: string) {
    const targetSection = currentDoc.sections.find(
      (section) => section.type === "heading" && section.text === label,
    );

    if (!targetSection) return;

    const targetElement = document.getElementById(`docs-section-${targetSection.id}`);
    targetElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-transparent text-[#202124]">
      <section className="flex min-h-screen flex-col">
        {showAutosaveToast && (
          <div className="fixed right-6 top-20 z-40 flex items-center gap-3 rounded-2xl border border-[#dadce0] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(60,64,67,0.2)]">
            <div>
              <div className="text-sm font-semibold text-[#202124]">Saved to Drive</div>
              <div className="text-xs text-[#5f6368]">Your recent changes have been saved.</div>
            </div>
            <button
              type="button"
              onClick={() => setShowAutosaveToast(false)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold text-[#1a73e8] hover:bg-[#e8f0fe] ${reviewClass("docs.toast.dismiss", reviewTarget)}`}
              data-igg-id="docs.toast.dismiss"
            >
              Dismiss
            </button>
          </div>
        )}
        <header className="sticky top-0 z-30 border-b border-[#dadce0] bg-[#f8f9fa]/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-3">
              <Link href={homeHref} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                {icon("📄")}
              </Link>
              <div>
                <input
                  value={currentDoc.title}
                  onChange={(event) => renameCurrentDoc(event.target.value)}
                  className="w-[360px] rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-medium outline-none transition focus:border-[#d2e3fc] focus:bg-white"
                />
                <div className="mt-1 flex items-center gap-2 text-xs text-[#5f6368]">
                  <span className="rounded-full bg-[#e8f0fe] px-2 py-1 font-semibold text-[#1a73e8]">{currentDoc.badge}</span>
                  <span>{currentDoc.folder}</span>
                  <span>•</span>
                  <span>{currentDoc.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleStar}
                className={`rounded-full px-4 py-2 text-sm font-medium ${currentDoc.starred ? "bg-[#fff7d1] text-[#b06000]" : "bg-white text-[#5f6368]"} ${reviewClass("docs.editor.button.star", reviewTarget)}`}
                data-igg-id="docs.editor.button.star"
              >
                {currentDoc.starred ? "★ Starred" : "☆ Star"}
              </button>
              <button
                type="button"
                onClick={() => setShowFind(true)}
                className={`rounded-full bg-white px-4 py-2 text-sm font-medium text-[#3c4043] ${reviewClass("docs.editor.button.find", reviewTarget)}`}
                data-igg-id="docs.editor.button.find"
              >
                Find
              </button>
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className={`rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-semibold text-white shadow-sm ${reviewClass("docs.editor.share", reviewTarget)}`}
                data-igg-id="docs.editor.share"
              >
                Share
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b57d0] text-sm font-semibold text-white">EL</div>
            </div>
          </div>

          <div ref={editorMenuRef} className="flex items-center gap-0.5 border-t border-[#e8eaed] px-5 py-0.5 text-[12px]">
            {(Object.entries(editorMenuItems) as Array<[keyof typeof editorMenuItems, readonly string[]]>).map(([label, items]) => (
              <EditorMenuButton
                key={label}
                label={label}
                open={openEditorMenu === label}
                onClick={() => setOpenEditorMenu((prev) => (prev === label ? null : label))}
                items={[...items]}
                labelId={label === "File" ? "docs.editor.file_menu" : undefined}
                itemIds={label === "File" ? { "New": "docs.editor.file_menu.new", "Make a copy": "docs.editor.file_menu.make_copy", "Download": "docs.editor.file_menu.download", "Rename": "docs.editor.file_menu.rename", "Share": "docs.editor.file_menu.share" } : undefined}
              />
            ))}
            <button type="button" className="rounded-md px-2.5 py-1 hover:bg-white">Help</button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#e8eaed] bg-[#f8f9fb] px-5 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <ToolbarIconButton icon="↶" label="Undo" />
            <ToolbarIconButton icon="↷" label="Redo" />
            <ToolbarIconButton icon="🖨" label="Print" />
            <ToolbarIconButton icon="🎨" label="Paint format" />
            <ToolbarIconButton icon="🔤" label="Spelling and grammar" targetId="docs.editor.toolbar.spelling_grammar" reviewTarget={reviewTarget} />
            <div className="mx-2 h-6 w-px bg-[#dadce0]" />
            <select value={font} onChange={(event) => setFont(event.target.value)} className="rounded-lg border border-[#dadce0] bg-white px-3 py-1.5">
              {toolbarFonts.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="rounded-lg border border-[#dadce0] bg-white px-3 py-1.5">
              {[10, 11, 12, 14, 18, 24].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <ToolbarIconButton
              icon={<span className="font-semibold">B</span>}
              label="Bold"
              active={isBold}
              onClick={() => setIsBold((prev) => !prev)}
              targetId="docs.editor.toolbar.bold"
              reviewTarget={reviewTarget}
            />
            <ToolbarIconButton icon={<span className="italic">I</span>} label="Italic" active={isItalic} onClick={() => setIsItalic((prev) => !prev)} targetId="docs.editor.toolbar.italic" reviewTarget={reviewTarget} />
            <ToolbarIconButton icon={<span className="underline">U</span>} label="Underline" active={isUnderline} onClick={() => setIsUnderline((prev) => !prev)} />
            <ToolbarIconButton icon={<StrikethroughToolIcon />} label="Strikethrough" />
            <ToolbarIconButton icon={<TextColorToolIcon />} label="Text color" />
            <div className="mx-2 h-6 w-px bg-[#dadce0]" />
            <ToolbarIconButton icon="🔗" label="Insert link" targetId="docs.editor.toolbar.insert" reviewTarget={reviewTarget} />
            <ToolbarIconButton icon="💬" label="Add comment" onClick={() => setRightPanel("comments")} />
            <ToolbarIconButton icon="🖼" label="Insert image" />
            <ToolbarIconButton icon="☑" label="Checklist" />
            <ToolbarIconButton icon="•" label="Bulleted list" targetId="docs.editor.toolbar.bulleted_list" reviewTarget={reviewTarget} />
            <ToolbarIconButton icon="1." label="Numbered list" />
            <div className="mx-2 h-6 w-px bg-[#dadce0]" />
            {(["left", "center", "right"] as const).map((value) => (
              <ToolbarIconButton
                key={value}
                onClick={() => setAlignment(value)}
                active={alignment === value}
                label={`Align ${value}`}
                targetId={value === "center" ? "docs.editor.align.center" : value === "left" ? "docs.editor.toolbar.align" : undefined}
                reviewTarget={reviewTarget}
                icon={value === "left" ? <AlignLeftIcon /> : value === "center" ? <AlignCenterIcon /> : <AlignRightIcon />}
              />
            ))}
            <ToolbarIconButton icon="↕" label="Line spacing" targetId="docs.editor.toolbar.line_spacing" reviewTarget={reviewTarget} />
            <ToolbarIconButton icon={<ColumnsIcon />} label="Columns" targetId="docs.editor.toolbar.columns" reviewTarget={reviewTarget} />
            <div className="ml-auto flex items-center gap-2">
              <div className="relative" ref={modeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowModeDropdown((prev) => !prev)}
                  className={`flex items-center gap-1 rounded-lg border border-[#dadce0] bg-white px-3 py-1 text-xs font-semibold text-[#3c4043] ${reviewClass("docs.editor.mode.suggesting", reviewTarget)}`}
                  data-igg-id="docs.editor.mode.suggesting"
                >
                  {editorMode === "editing" ? "Editing" : editorMode === "suggesting" ? "Suggesting" : "Viewing"}
                  <span className="text-[10px]">▾</span>
                </button>
                {showModeDropdown && (
                  <div className="absolute right-0 top-full z-[90] mt-1 min-w-[100px] rounded-xl border border-[#dadce0] bg-white p-1.5 shadow-[0_12px_24px_rgba(60,64,67,0.2)]">
                    {(["editing", "suggesting", "viewing"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => { setEditorMode(mode); setShowModeDropdown(false); }}
                        data-igg-id={mode === "suggesting" ? "docs.editor.mode.option.suggesting" : undefined}
                        className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${editorMode === mode ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold" : "text-[#202124] hover:bg-[#f1f3f4]"}`}
                      >
                        {mode === "editing" ? "Editing" : mode === "suggesting" ? "Suggesting" : "Viewing"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={zoomDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowZoomDropdown((prev) => !prev)}
                  className="flex items-center gap-1 rounded-lg border border-[#dadce0] bg-white px-3 py-1.5 text-xs font-semibold text-[#3c4043]"
                  data-igg-id="docs.editor.zoom_select"
                >
                  {zoom}%
                  <span className="text-[10px]">▾</span>
                </button>
                {showZoomDropdown && (
                  <div className="absolute right-0 top-full z-[90] mt-1 min-w-[80px] rounded-xl border border-[#dadce0] bg-white p-1.5 shadow-[0_12px_24px_rgba(60,64,67,0.2)]">
                    {[80, 90, 100, 110, 125].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setZoom(value); setShowZoomDropdown(false); }}
                        data-igg-id={value === 125 ? "docs.editor.zoom_125" : undefined}
                        className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${zoom === value ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold" : "text-[#202124] hover:bg-[#f1f3f4]"}`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-0" style={{ gridTemplateColumns: `240px minmax(0,1fr) ${rightPanelWidth}px` }}>
          <aside
            className="sticky top-[132px] h-[calc(100vh-132px)] self-start overflow-auto border-r border-[#dadce0] bg-[#fbfcff] px-4 py-5"
            data-igg-id="docs.editor.outline-region"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5f6368]">Outline</div>
            <div className="mt-3 space-y-2">
              {currentDoc.outline.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => jumpToOutlineItem(item)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm text-[#3c4043] transition hover:bg-[#e8f0fe] ${
                    item === "Evaluation Notes"
                      ? reviewClass("docs.outline.evaluation-notes", reviewTarget)
                      : item === "Context Notes"
                        ? reviewClass("docs.outline.context-notes", reviewTarget)
                        : ""
                  }`}
                  data-igg-id={
                    item === "Evaluation Notes"
                      ? "docs.outline.evaluation-notes"
                      : item === "Context Notes"
                        ? "docs.outline.context-notes"
                        : undefined
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <div
            ref={editorScrollRef}
            className="overflow-auto bg-[#eef2f7] px-8 py-8"
            data-igg-id="docs.editor.scroll-region"
          >
            <div className="mx-auto flex max-w-[860px] justify-center">
              <div
                className="relative"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <article
                  className="docs-page-shadow min-h-[1120px] w-[820px] cursor-text bg-white px-[88px] py-[76px] outline-none"
                  style={{
                    fontFamily: font,
                    fontSize,
                    fontWeight: isBold ? 700 : 400,
                    fontStyle: isItalic ? "italic" : "normal",
                    textDecoration: isUnderline ? "underline" : "none",
                    textAlign: alignment,
                  }}
                >
                  {currentDoc.sections.map((section) => {
                    if (section.type === "heading") {
                      const size = section.level === 1 ? "text-[30px]" : section.level === 2 ? "text-[21px]" : "text-[17px]";
                      const headingTargetId =
                        section.text === "Weekly Research Snapshot"
                          ? "docs.section.weekly-research-snapshot"
                          : section.text === "Patterns We Heard Repeatedly"
                            ? "docs.section.patterns-repeatedly"
                            : undefined;
                      return (
                        <div
                          key={section.id}
                          id={`docs-section-${section.id}`}
                          className={`${size} mb-4 scroll-mt-[180px] font-semibold tracking-[-0.02em] text-[#202124] ${reviewClass(headingTargetId, reviewTarget)}`}
                          data-igg-id={headingTargetId}
                          contentEditable
                          suppressContentEditableWarning
                          spellCheck={false}
                        >
                          {section.text}
                        </div>
                      );
                    }

                    if (section.type === "paragraph") {
                      return (
                        <p
                          key={section.id}
                          className="mb-4 leading-8 text-[#202124]"
                          contentEditable
                          suppressContentEditableWarning
                          spellCheck={false}
                        >
                          {section.text}
                          {section.id === "p8" ? (
                            <span
                              className={reviewClass("docs.page.end", reviewTarget)}
                              data-igg-id="docs.page.end"
                              contentEditable={false}
                              aria-hidden="true"
                            />
                          ) : null}
                        </p>
                      );
                    }

                    if (section.type === "bullet") {
                      return (
                        <ul key={section.id} className="mb-5 list-disc space-y-2 pl-6 leading-8 text-[#202124]">
                          {section.items.map((item) => (
                            <li
                              key={item}
                              contentEditable
                              suppressContentEditableWarning
                              spellCheck={false}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (section.type === "callout") {
                      const calloutTargetId = section.title === "Research scope" ? "docs.callout.research-scope" : undefined;
                      return (
                        <div
                          key={section.id}
                          className={`mb-5 rounded-2xl border border-[#d2e3fc] bg-[#f8fbff] px-5 py-4 ${reviewClass(calloutTargetId, reviewTarget)}`}
                          data-igg-id={calloutTargetId}
                        >
                          <div className="text-sm font-semibold text-[#1a73e8]" contentEditable suppressContentEditableWarning spellCheck={false}>
                            {section.title}
                          </div>
                          <div className="mt-2 leading-7 text-[#202124]" contentEditable suppressContentEditableWarning spellCheck={false}>
                            {section.text}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={section.id} className="mb-6 rounded-2xl border border-[#e8eaed] bg-[#fcfdff] px-5 py-4">
                        <div className="mb-3 text-sm font-semibold text-[#5f6368]">Checklist</div>
                        <div className="space-y-3">
                          {section.items.map((item) => (
                            <label key={item.id} className="flex items-center gap-3 text-[15px] leading-7">
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => toggleChecklist(section.id, item.id)}
                                className={`h-4 w-4 rounded border-[#9aa0a6] ${
                                  item.label === "Switch to Suggesting mode"
                                    ? reviewClass("docs.checklist.suggesting-mode", reviewTarget)
                                    : item.label === "Prepare top bar A/B design options"
                                      ? reviewClass("docs.checklist.topbar-ab", reviewTarget)
                                      : ""
                                }`}
                                data-igg-id={
                                  item.label === "Switch to Suggesting mode"
                                    ? "docs.checklist.suggesting-mode"
                                    : item.label === "Prepare top bar A/B design options"
                                      ? "docs.checklist.topbar-ab"
                                      : undefined
                                }
                              />
                              <span className={item.done ? "text-[#5f6368] line-through" : "text-[#202124]"}>{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </article>
              </div>
            </div>
          </div>

          <aside className="sticky top-[132px] h-[calc(100vh-132px)] self-start overflow-auto border-l border-[#dadce0] bg-white px-4 py-5 relative">
            <div
              className="absolute -left-1 top-0 z-20 h-full w-3 cursor-col-resize hover:bg-[#1a73e8]/30 active:bg-[#1a73e8]/50 transition-colors"
              data-igg-id="docs.right_panel.resize_handle"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = rightPanelWidth;
                function onMouseMove(ev: MouseEvent) {
                  const delta = startX - ev.clientX;
                  setRightPanelWidth(Math.max(180, Math.min(600, startWidth + delta)));
                }
                function onMouseUp() {
                  document.removeEventListener("mousemove", onMouseMove);
                  document.removeEventListener("mouseup", onMouseUp);
                  document.body.style.cursor = "";
                  document.body.style.userSelect = "";
                }
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {([
                ["comments", "Comments"],
                ["activity", "Activity"],
                ["outline", "Collaborators"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRightPanel(value)}
                  className={`min-w-0 rounded-xl px-2 py-2 text-center text-[11px] font-semibold tracking-[0.04em] ${
                    rightPanel === value ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#f1f3f4] text-[#5f6368]"
                  } ${reviewClass(
                    value === "comments"
                      ? "docs.editor.panel.comments_tab"
                      : value === "activity"
                        ? "docs.panel.activity"
                        : value === "outline"
                          ? "docs.panel.collaborators"
                          : undefined,
                    reviewTarget,
                  )}`}
                  data-igg-id={
                    value === "comments"
                      ? "docs.editor.panel.comments_tab"
                      : value === "activity"
                        ? "docs.panel.activity"
                        : value === "outline"
                          ? "docs.panel.collaborators"
                          : undefined
                  }
                >
                  <span className="block truncate">{label}</span>
                </button>
              ))}
            </div>

            {rightPanel === "comments" && (
              <div className="mt-5 space-y-4 docs-fade-up">
                {commentThreads.map(([author, body, time]) => (
                  <div key={author + time} className="rounded-2xl border border-[#dadce0] bg-[#fafbff] p-4">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="font-semibold truncate">{author}</div>
                      <div className="text-xs text-[#5f6368] shrink-0">{time}</div>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[#3c4043]">{body}</div>
                    {rightPanelWidth >= 240 && (
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" data-igg-id={author === "Jiyoon" ? "docs.editor.comment.jiyoon.reply" : undefined} className="rounded-lg bg-[#f1f3f4] px-3 py-1 text-xs font-medium text-[#3c4043] hover:bg-[#e8eaed]">
                          Reply
                        </button>
                        <button type="button" data-igg-id={author === "Daisy" ? "docs.editor.comment.daisy.resolve" : author === "Ella" ? "docs.editor.comment.ella.resolve" : undefined} className="rounded-lg px-3 py-1 text-xs font-medium text-[#137333] hover:bg-[#e6f4ea]">
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {rightPanel === "activity" && (
              <div className="mt-5 space-y-3 docs-fade-up">
                {activityItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-[#dadce0] px-4 py-3 text-sm leading-6 text-[#3c4043]">
                    {item}
                  </div>
                ))}
              </div>
            )}

            {rightPanel === "outline" && (
              <div className="mt-5 space-y-3 docs-fade-up">
                {currentDoc.collaborators.map((person) => (
                  <div
                    key={person}
                    className={`rounded-2xl border border-[#dadce0] px-3 py-3 ${rightPanelWidth < 240 ? "flex flex-col items-center gap-2 text-center" : "flex items-center justify-between"} ${person === "Research TA" ? reviewClass("docs.collaborator.research-ta", reviewTarget) : ""}`}
                    data-igg-id={person === "Research TA" ? "docs.collaborator.research-ta" : undefined}
                  >
                    <div className={`flex items-center gap-3 min-w-0 ${rightPanelWidth < 240 ? "flex-col gap-1" : ""}`}>
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe] font-semibold text-[#1a73e8]">
                          {person.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#34a853]" />
                      </div>
                      {rightPanelWidth >= 240 && (
                        <div className="min-w-0">
                          <div className="font-medium truncate">{person}</div>
                          <div className="text-xs text-[#5f6368]">Active in this doc</div>
                        </div>
                      )}
                    </div>
                    {rightPanelWidth >= 240 && (
                      <div className="shrink-0 rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-semibold text-[#137333]">Online</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        {pdfStatus !== "idle" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
            <div className="docs-pop w-full max-w-[400px] rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-[#202124]">Export to PDF</div>
                <button type="button" onClick={() => setPdfStatus("idle")} className="rounded-full bg-[#f1f3f4] px-3 py-2 text-sm text-[#3c4043]">
                  ✕
                </button>
              </div>
              <div className="mt-1 text-sm text-[#5f6368]">{currentDoc.title}</div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#3c4043]">
                    {pdfStatus === "ready" ? "Conversion complete" : pdfStatus === "paused" ? "Paused" : "Converting…"}
                  </span>
                  <span className="text-[#5f6368]">{pdfProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#f1f3f4] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-none ${pdfStatus === "ready" ? "bg-[#34a853]" : "bg-[#1a73e8]"}`}
                    style={{ width: `${pdfProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setPdfStatus("idle")} className="rounded-full bg-[#f1f3f4] px-5 py-2.5 text-sm font-medium text-[#3c4043]">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pdfStatus === "processing") setPdfStatus("paused");
                    else if (pdfStatus === "paused") setPdfStatus("processing");
                    else setPdfStatus("idle");
                  }}
                  data-igg-id={pdfStatus === "ready" ? "docs.editor.pdf_save" : undefined}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    pdfStatus === "ready"
                      ? "bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                      : "bg-[#f1f3f4] text-[#3c4043] hover:bg-[#e8eaed]"
                  }`}
                >
                  {pdfStatus === "processing" ? "Pause" : pdfStatus === "paused" ? "Resume" : "Save as PDF"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
            <div className="docs-pop w-full max-w-[520px] rounded-[28px] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">Share &quot;{currentDoc.title}&quot;</div>
                  <div className="mt-1 text-sm text-[#5f6368]">Mocked permissions flow for benchmark interaction tasks.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShare(false)}
                  className={`rounded-full bg-[#f1f3f4] px-3 py-2 text-sm ${reviewClass("docs.share.close", reviewTarget)}`}
                  data-igg-id="docs.share.close"
                >
                  Close
                </button>
              </div>
              <div className="mt-5 rounded-2xl border border-[#dadce0] p-4">
                <div className="text-sm font-semibold">Add people and groups</div>
                <input className="mt-3 w-full rounded-xl border border-[#dadce0] px-4 py-3 outline-none focus:border-[#1a73e8]" placeholder="people@example.com" />
                <div className="mt-4 grid gap-3">
                  {[
                    ["Jiyoon", "Editor"],
                    ["Daisy", "Commenter"],
                    ["Research TA", "Viewer"],
                  ].map(([name, role]) => (
                    <div
                      key={name}
                      className={`flex items-center justify-between rounded-2xl bg-[#f8f9fa] px-4 py-3 ${name === "Research TA" ? reviewClass("docs.collaborator.research-ta", reviewTarget) : ""}`}
                      data-igg-id={name === "Research TA" ? "docs.collaborator.research-ta" : undefined}
                    >
                      <div>{name}</div>
                      <select
                        defaultValue={role}
                        className={`rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm ${name === "Daisy" ? reviewClass("docs.editor.share.role.daisy", reviewTarget) : ""}`}
                        data-igg-id={name === "Daisy" ? "docs.editor.share.role.daisy" : undefined}
                      >
                        <option>Viewer</option>
                        <option>Commenter</option>
                        <option>Editor</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowShare(false)} className="rounded-full bg-[#f1f3f4] px-4 py-2.5 text-sm font-medium">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowShare(false)}
                  className={`rounded-full bg-[#1a73e8] px-5 py-2.5 text-sm font-semibold text-white ${reviewClass("docs.share.send", reviewTarget)}`}
                  data-igg-id="docs.share.send"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {showFind && (
          <div className="fixed right-8 top-[124px] z-40 w-[360px] rounded-[24px] border border-[#dadce0] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Find and replace</div>
              <button
                type="button"
                onClick={() => setShowFind(false)}
                className={`rounded-full bg-[#f1f3f4] px-3 py-1.5 text-sm ${reviewClass("docs.find.close", reviewTarget)}`}
                data-igg-id="docs.find.close"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-[#dadce0] px-4 py-3 outline-none focus:border-[#1a73e8]"
                placeholder="Find"
              />
              <input
                value={replaceTerm}
                onChange={(event) => setReplaceTerm(event.target.value)}
                className={`w-full rounded-xl border border-[#dadce0] px-4 py-3 outline-none focus:border-[#1a73e8] ${reviewClass("docs.editor.find.replace_input", reviewTarget)}`}
                placeholder="Replace with"
                data-igg-id="docs.editor.find.replace_input"
              />
              <div className="rounded-2xl bg-[#f8f9fa] px-4 py-3 text-sm text-[#5f6368]">
                Matches found in this mock document: {currentDoc.sections.filter((section) => JSON.stringify(section).toLowerCase().includes(searchTerm.toLowerCase())).length}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-full bg-[#f1f3f4] px-4 py-2 text-sm font-medium">Previous</button>
                <button type="button" className="rounded-full bg-[#f1f3f4] px-4 py-2 text-sm font-medium">Next</button>
                <button
                  type="button"
                  className={`rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white ${reviewClass("docs.find.replace-all", reviewTarget)}`}
                  data-igg-id="docs.find.replace-all"
                >
                  Replace all
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Apply suggested edits — top-right notification */}
      {benchmarkState.asyncReviewMode === "apply" && asyncReviewReady && (
        <div className="fixed right-5 top-20 z-50 w-80 rounded-xl border border-[#dadce0] bg-white shadow-xl">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#202124]">Suggested edits are ready</p>
              <p className="mt-0.5 text-xs text-[#5f6368]">3 suggestions from collaborators are ready to apply.</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  data-igg-id="docs.editor.review.apply-suggestions"
                  data-igg-type="async_wait"
                  className="rounded-full bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1765cc]"
                >
                  Apply suggested edits
                </button>
                <button type="button" className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4]">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {benchmarkState.asyncReviewMode === "apply" && !asyncReviewReady && (
        <div className="fixed right-5 top-20 z-50 flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 py-2 shadow-md">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#dadce0] border-t-[#1a73e8]" />
          <span className="text-xs text-[#5f6368]">Preparing suggestions…</span>
        </div>
      )}

      {/* Publish version — modal popup */}
      {benchmarkState.asyncReviewMode === "publish" && asyncReviewReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[420px] rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#e8eaed] px-6 py-5">
              <p className="text-base font-semibold text-[#202124]">Publish version</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#3c4043]">
                Your document has been reviewed and a new version is ready. Publishing will make this version available to all collaborators with access.
              </p>
              <div className="mt-4 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-4 py-3">
                <p className="text-xs font-medium text-[#202124]">Version 3.2 — Q3 Benchmark Spec</p>
                <p className="mt-0.5 text-xs text-[#5f6368]">Last edited just now · 12 changes since v3.1</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e8eaed] px-6 py-4">
              <button type="button" className="rounded-full px-4 py-2 text-sm font-medium text-[#3c4043] hover:bg-[#f1f3f4]">
                Cancel
              </button>
              <button
                type="button"
                data-igg-id="docs.editor.review.publish-version"
                data-igg-type="async_wait"
                className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1765cc]"
              >
                Publish version
              </button>
            </div>
          </div>
        </div>
      )}
      {benchmarkState.asyncReviewMode === "publish" && !asyncReviewReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="flex items-center gap-3 rounded-xl border border-[#dadce0] bg-white px-6 py-4 shadow-lg">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#dadce0] border-t-[#1a73e8]" />
            <span className="text-sm text-[#5f6368]">Preparing version for publish…</span>
          </div>
        </div>
      )}
    </main>
  );
}
