"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getReelifyBenchmarkState, type ReelifyBenchmarkState } from "./reelify-states";

declare global {
  interface Window { __REELIFY_BENCHMARK_STATE__?: ReelifyBenchmarkState; }
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
  runtimeStateKey: "__REELIFY_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const P = (seed: string | number, w = 280, h = 158) =>
  `https://picsum.photos/seed/rfy${seed}/${w}/${h}`;
const AV = (n: number) => `https://i.pravatar.cc/80?img=${n}`;

function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cx("object-cover w-full h-full", className)}
      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
    />
  );
}

type MenuName = "continue-more" | "trending-more" | "profile" | "filter" | null;

function Icon({ name }: { name: "play" | "plus" | "x" | "info" | "chevron-left" | "chevron-right" | "search" | "user" | "filter" | "check" | "loader" | "more" | "bell" | "edit" | "thumb-up" | "thumb-down" | "double-thumb" }) {
  const c = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    play: <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
    "chevron-left": <polyline points="15 18 9 12 15 6" />,
    "chevron-right": <polyline points="9 18 15 12 9 6" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    filter: <><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    loader: <><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    "thumb-up": <><path d="M7 10v11" /><path d="M15 5.2 14 10h5.5a2 2 0 0 1 1.94 2.48l-1.5 6A2 2 0 0 1 18 20H9.5A2.5 2.5 0 0 1 7 17.5V11l4.2-6.4A2.1 2.1 0 0 1 15 5.2Z" /><path d="M3 10h4v11H3z" /></>,
    "thumb-down": <><path d="M7 14V3" /><path d="M15 18.8 14 14h5.5a2 2 0 0 0 1.94-2.48l-1.5-6A2 2 0 0 0 18 4H9.5A2.5 2.5 0 0 0 7 6.5V13l4.2 6.4A2.1 2.1 0 0 0 15 18.8Z" /><path d="M3 3h4v11H3z" /></>,
    "double-thumb": <><path d="M5 11v9" /><path d="M11.7 6.2 11 11h4.8a1.7 1.7 0 0 1 1.65 2.1l-1.15 4.7a1.8 1.8 0 0 1-1.75 1.35H7.2A2.2 2.2 0 0 1 5 16.95V12l3.75-5.8a1.75 1.75 0 0 1 2.95 0Z" /><path d="M2.5 11H5v9H2.5z" /><path d="M13.5 10.5 16.6 5.7a1.65 1.65 0 0 1 2.8 1.45L18.8 11h1.65a1.65 1.65 0 0 1 1.6 2.05l-1.05 4.2A1.65 1.65 0 0 1 19.4 18.5h-3.9" /><path d="M16.2 18.5h2.9" /></>,
  };
  return <svg {...c}>{paths[name]}</svg>;
}

function Dropdown({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return <div className={cx("absolute z-50 overflow-hidden rounded-md bg-[#1a1a1a] border border-white/10 shadow-2xl", className)}>{children}</div>;
}
function MenuItem({ id, type, prereq, children }: { id: string; type?: string; prereq?: string; children: React.ReactNode }) {
  return (
    <button data-igg-id={id} data-igg-type={type} data-igg-prereq={prereq}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#ffffffcc] hover:bg-white/10 hover:text-white whitespace-nowrap">
      {children}
    </button>
  );
}

function titleLines(title: string) {
  const words = title.split(" ");
  if (words.length <= 2) return words;
  return [words.slice(0, -1).join(" "), words.at(-1) ?? ""];
}

function TitleArt({ src, title }: { src: string; title: string }) {
  return (
    <>
      <Img src={src} alt={title} className="brightness-[0.72] saturate-[1.15] contrast-[1.08]" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/15 via-transparent to-[#e50914]/15" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      <div className="absolute bottom-8 left-3 right-3">
        <div className="max-w-[85%] font-black uppercase leading-[0.9] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {titleLines(title).map((line) => (
            <div key={line} className="text-[20px] tracking-wide">{line}</div>
          ))}
        </div>
      </div>
    </>
  );
}

function RatingPicker({ idPrefix }: { idPrefix: string }) {
  return (
    <div className="group/rate relative">
      <button
        data-igg-id={`${idPrefix}.rating`}
        data-igg-type="hover_reveal"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-[#2a2a2a] text-white transition hover:border-white hover:bg-[#3a3a3a]"
      >
        <Icon name="thumb-up" />
      </button>
      <div className="reelify-rating-menu pointer-events-none absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-full bg-[#181818] px-2 py-2 opacity-0 shadow-2xl ring-1 ring-white/15 transition group-hover/rate:pointer-events-auto group-hover/rate:opacity-100">
        {[
          ["thumb-down", "not-for-me", "Not for me"],
          ["thumb-up", "like", "Like"],
          ["double-thumb", "love-this", "Love this"],
        ].map(([icon, slug, label]) => (
          <button
            key={label}
            data-igg-id={`${idPrefix}.rating.${slug}`}
            data-igg-type="hover_reveal"
            data-igg-prereq={`${idPrefix}.rating`}
            className="group/choice relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-[#2a2a2a] text-white transition hover:scale-110 hover:border-white hover:bg-white hover:text-black"
          >
            <Icon name={icon as "thumb-down" | "thumb-up" | "double-thumb"} />
            <span className="reelify-rating-label pointer-events-none absolute -top-8 whitespace-nowrap rounded bg-white px-2 py-1 text-[10px] font-semibold text-black opacity-0 shadow group-hover/choice:opacity-100">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HoverPreview({ idPrefix, title, year, kind = "Series", match = "96% Match" }: { idPrefix: string; title: string; year: string; kind?: string; match?: string }) {
  return (
    <div className="absolute left-0 top-full z-40 hidden w-full overflow-visible rounded-b-md bg-[#181818] shadow-2xl ring-1 ring-white/10 group-hover:block">
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/40 text-white transition hover:bg-black/80"><Icon name="play" /></button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-[#2a2a2a] text-white transition hover:border-white"><Icon name="plus" /></button>
            <RatingPicker idPrefix={idPrefix} />
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-[#2a2a2a] text-white transition hover:border-white"><Icon name="chevron-right" /></button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="font-bold text-[#46d369]">{match}</span>
          <span className="text-[#b3b3b3]">{year}</span>
          <span className="border border-[#777] px-1 text-[10px] text-[#d2d2d2]">HD</span>
          <span className="text-[#b3b3b3]">{kind}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#d2d2d2]">
          {title} follows a tense, cinematic story with high-stakes choices, hidden motives, and a final act built for late-night watching.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[#b3b3b3]">
          <span>Suspenseful</span><span>·</span><span>Cinematic</span><span>·</span><span>Character-driven</span>
        </div>
      </div>
    </div>
  );
}

type ReelCard = {
  slug: string;
  title: string;
  year: string;
  img: string;
  progress?: number;
};

type MoreMenuConfig = {
  cardSlug: string;
  menuName: Exclude<MenuName, null>;
  buttonId: string;
  items: Array<{ id: string; label: string; icon?: "plus"; prereq: string }>;
};

function ReelCardTile({
  rowKey,
  card,
  itemIndex,
  plusId,
  kind = "Movie",
  match,
  moreMenu,
  activeMenu,
  setActiveMenu,
}: {
  rowKey: string;
  card: ReelCard;
  itemIndex: number;
  plusId?: string;
  kind?: string;
  match?: string;
  moreMenu?: MoreMenuConfig;
  activeMenu: MenuName;
  setActiveMenu: Dispatch<SetStateAction<MenuName>>;
}) {
  const cardId = `reelify.${rowKey}.${card.slug}.card`;
  const idPrefix = `reelify.${rowKey}.${card.slug}`;
  const isCarouselReveal = itemIndex >= 5;
  const menuForCard = moreMenu?.cardSlug === card.slug ? moreMenu : undefined;

  return (
    <div
      data-igg-id={cardId}
      data-igg-type={isCarouselReveal ? "carousel_reveal" : undefined}
      data-igg-prereq={isCarouselReveal ? `reelify.${rowKey}.next` : undefined}
      className="group relative min-w-0 origin-center cursor-pointer transition-transform duration-200 hover:z-40 hover:scale-[1.12]"
    >
      <div className="relative h-[144px] overflow-hidden rounded-md bg-[#333]">
        <TitleArt src={card.img} title={card.title} />
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center gap-1.5">
          <span className="rounded-sm bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#d8d8d8]">
            {card.year}
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/40 shadow-lg">
            <Icon name="play" />
          </div>
        </div>
        {typeof card.progress === "number" && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
            <div className="h-full bg-[#e50914]" style={{ width: `${card.progress}%` }} />
          </div>
        )}
      </div>
      {plusId && (
        <button
          data-igg-id={plusId}
          data-igg-type="hover_reveal"
          data-igg-prereq={cardId}
          className={cx(
            "absolute top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100",
            menuForCard ? "right-10" : "right-2",
          )}
        >
          <Icon name="plus" />
        </button>
      )}
      {menuForCard && (
        <div className="absolute right-1.5 top-1.5 z-10" onClick={e => e.stopPropagation()}>
          <button
            data-igg-id={menuForCard.buttonId}
            data-igg-type="menu_reveal"
            onClick={e => {
              e.stopPropagation();
              setActiveMenu(activeMenu === menuForCard.menuName ? null : menuForCard.menuName);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white hover:bg-black/90"
          >
            <Icon name="more" />
          </button>
          <Dropdown open={activeMenu === menuForCard.menuName} className="right-0 top-7 w-48">
            {menuForCard.items.map(item => (
              <MenuItem key={item.id} id={item.id} type="menu_reveal" prereq={item.prereq}>
                {item.icon ? <Icon name={item.icon} /> : null}
                {item.label}
              </MenuItem>
            ))}
          </Dropdown>
        </div>
      )}
      <HoverPreview idPrefix={idPrefix} title={card.title} year={card.year} kind={kind} match={match} />
    </div>
  );
}

function RecommendationNotice({ notice }: { notice: (typeof recommendationNotices)[keyof typeof recommendationNotices] }) {
  return (
    <div className="fixed right-8 top-[82px] z-[70] w-[390px] overflow-hidden rounded-xl border border-white/15 bg-[#141414] text-white shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
      <div className={cx("h-1.5 bg-gradient-to-r", notice.accent)} />
      <div className="flex gap-3 p-4">
        <div className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-md bg-[#333]">
          <Img src={notice.img} alt={notice.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
            <Icon name="play" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.18em] text-[#e50914]">REELIFY</span>
            <span className="h-1 w-1 rounded-full bg-white/35" />
            <span className="truncate text-[11px] font-medium text-white/55">{notice.eyebrow}</span>
          </div>
          <div className="text-base font-bold leading-tight text-white">{notice.title}</div>
          <p className="mt-1.5 text-xs leading-5 text-[#b3b3b3]">{notice.body}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              data-igg-id={notice.ctaId}
              data-igg-type="async_wait"
              data-igg-label={notice.ctaLabel}
              className="inline-flex h-9 items-center gap-2 rounded bg-white px-3.5 text-xs font-bold text-black transition hover:bg-[#e5e5e5]"
            >
              <Icon name="play" />
              {notice.ctaLabel}
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/45 hover:text-white">
              <Icon name="x" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentRow({
  title,
  rowKey,
  cards,
  offset,
  onPrev,
  onNext,
  sectionRef,
  className,
  kind = "Movie",
  match,
  plusIdFor,
  moreMenu,
  activeMenu,
  setActiveMenu,
}: {
  title: string;
  rowKey: string;
  cards: readonly ReelCard[];
  offset: number;
  onPrev: () => void;
  onNext: () => void;
  sectionRef?: RefObject<HTMLElement | null>;
  className?: string;
  kind?: string;
  match?: string;
  plusIdFor?: (card: ReelCard, index: number) => string | undefined;
  moreMenu?: MoreMenuConfig;
  activeMenu: MenuName;
  setActiveMenu: Dispatch<SetStateAction<MenuName>>;
}) {
  const pageSize = 5;
  const maxOffset = Math.max(0, cards.length - pageSize);
  const visibleCards = cards.slice(offset, offset + pageSize);

  return (
    <section ref={sectionRef} className={cx("pt-10", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {cards.length > pageSize && (
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button
              data-igg-id={`reelify.${rowKey}.prev`}
              onClick={onPrev}
              disabled={offset === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white transition hover:border-white hover:bg-white/10 disabled:opacity-30"
            >
              <Icon name="chevron-left" />
            </button>
            <button
              data-igg-id={`reelify.${rowKey}.next`}
              data-igg-type="carousel_reveal"
              onClick={onNext}
              disabled={offset >= maxOffset}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white transition hover:border-white hover:bg-white/10 disabled:opacity-30"
            >
              <Icon name="chevron-right" />
            </button>
          </div>
        )}
      </div>
      <div className="grid w-full grid-cols-5 gap-3 overflow-visible">
        {visibleCards.map((card, visibleIndex) => {
          const itemIndex = offset + visibleIndex;
          return (
            <ReelCardTile
              key={card.slug}
              rowKey={rowKey}
              card={card}
              itemIndex={itemIndex}
              kind={kind}
              match={match}
              plusId={plusIdFor?.(card, itemIndex)}
              moreMenu={moreMenu}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
          );
        })}
      </div>
    </section>
  );
}

function useDraggablePanel(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ startX: number; startY: number; panelX: number; panelY: number } | null>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => { if (drag.current) setPos({ x: drag.current.panelX + e.clientX - drag.current.startX, y: drag.current.panelY + e.clientY - drag.current.startY }); };
    const up = () => { drag.current = null; };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, []);
  return { pos, setPos, onMouseDown: (e: React.MouseEvent) => { drag.current = { startX: e.clientX, startY: e.clientY, panelX: pos.x, panelY: pos.y }; } };
}

const bannerSlides = [
  {
    id: "echoes",
    title: "Echoes of Tomorrow",
    desc: "A gripping sci-fi thriller about time, memory, and the choices we can't undo.",
    badge: "New",
    genre: "Sci-Fi · Thriller",
    rating: "TV-MA",
    year: "2025",
    img: P("bnr1", 1280, 520),
  },
  {
    id: "dark-horizon",
    title: "Dark Horizon",
    desc: "When the last satellite goes dark, the race to find out why begins.",
    badge: "Action",
    genre: "Action · Mystery",
    rating: "TV-14",
    year: "2024",
    img: P("bnr2", 1280, 520),
  },
  {
    id: "signal",
    title: "Signal",
    desc: "Five strangers connect via encrypted messages that predict the future.",
    badge: "Thriller",
    genre: "Drama · Thriller",
    rating: "TV-MA",
    year: "2025",
    img: P("bnr3", 1280, 520),
  },
] as const;

const continueCards = [
  { slug: "phantom-gate",  title: "Phantom Gate",  year: "2024", progress: 65, img: P("c1") },
  { slug: "iron-echo",     title: "Iron Echo",     year: "2023", progress: 30, img: P("c2") },
  { slug: "dark-frontier", title: "Dark Frontier", year: "2024", progress: 80, img: P("c3") },
  { slug: "neon-signal",   title: "Neon Signal",   year: "2025", progress: 45, img: P("c4") },
  { slug: "beyond-recall", title: "Beyond Recall", year: "2024", progress: 15, img: P("c5") },
  { slug: "cold-static",   title: "Cold Static",   year: "2025", progress: 55, img: P("c6") },
] as const;

const trendingCards = [
  { slug: "dark-waters",  title: "Dark Waters",  year: "2025", top10: true,  img: P("t1") },
  { slug: "iron-coast",   title: "Iron Coast",   year: "2024", top10: false, img: P("t2") },
  { slug: "broken-sky",   title: "Broken Sky",   year: "2025", top10: false, img: P("t3") },
  { slug: "silver-dawn",  title: "Silver Dawn",  year: "2024", top10: true,  img: P("t4") },
  { slug: "last-light",   title: "Last Light",   year: "2025", top10: false, img: P("t5") },
  { slug: "empty-road",   title: "Empty Road",   year: "2024", top10: false, img: P("t6") },
  { slug: "cold-city",    title: "Cold City",    year: "2025", top10: true,  img: P("t7") },
  { slug: "river-born",   title: "River Born",   year: "2024", top10: false, img: P("t8") },
  { slug: "outer-rim",    title: "Outer Rim",    year: "2025", top10: false, img: P("t9") },
  { slug: "still-harbor", title: "Still Harbor", year: "2024", top10: false, img: P("t10") },
] as const;

const actionCards = [
  { slug: "ghost-ship",      title: "Ghost Ship",      year: "2025", img: P("a1") },
  { slug: "night-raid",      title: "Night Raid",      year: "2024", img: P("a2") },
  { slug: "steel-wall",      title: "Steel Wall",      year: "2025", img: P("a3") },
  { slug: "black-hawk",      title: "Black Hawk",      year: "2024", img: P("a4") },
  { slug: "hunter-protocol", title: "Hunter Protocol", year: "2025", img: P("a5") },
  { slug: "war-drum",        title: "War Drum",        year: "2024", img: P("a6") },
  { slug: "kill-chain",      title: "Kill Chain",      year: "2025", img: P("a7") },
  { slug: "dark-signal",     title: "Dark Signal",     year: "2024", img: P("a8") },
  { slug: "iron-fist",       title: "Iron Fist",       year: "2025", img: P("a9") },
  { slug: "viper-code",      title: "Viper Code",      year: "2024", img: P("a10") },
] as const;

const newReleasesCards = [
  { slug: "apex-rising",   title: "Apex Rising",   year: "2025", img: P("nr1") },
  { slug: "crimson-coast", title: "Crimson Coast", year: "2025", img: P("nr2") },
  { slug: "last-frontier", title: "Last Frontier", year: "2024", img: P("nr3") },
  { slug: "fallen-stars",  title: "Fallen Stars",  year: "2025", img: P("nr4") },
  { slug: "echo-chamber",  title: "Echo Chamber",  year: "2024", img: P("nr5") },
  { slug: "neon-drive",    title: "Neon Drive",    year: "2025", img: P("nr6") },
] as const;

const acclaimedCards = [
  { slug: "the-divide",    title: "The Divide",    year: "2024", img: P("ac1") },
  { slug: "white-silence", title: "White Silence", year: "2023", img: P("ac2") },
  { slug: "open-road",     title: "Open Road",     year: "2024", img: P("ac3") },
  { slug: "night-shift",   title: "Night Shift",   year: "2025", img: P("ac4") },
  { slug: "harbor-lights", title: "Harbor Lights", year: "2024", img: P("ac5") },
  { slug: "cold-november", title: "Cold November", year: "2023", img: P("ac6") },
] as const;

const romcomCards = [
  { slug: "perfect-match",   title: "Perfect Match",   year: "2025", img: P("rc1") },
  { slug: "summer-fling",    title: "Summer Fling",    year: "2024", img: P("rc2") },
  { slug: "love-unscripted", title: "Love Unscripted", year: "2025", img: P("rc3") },
  { slug: "coffee-dates",    title: "Coffee Dates",    year: "2024", img: P("rc4") },
  { slug: "the-one",         title: "The One",         year: "2025", img: P("rc5") },
  { slug: "second-chances",  title: "Second Chances",  year: "2024", img: P("rc6") },
] as const;

const scifiCards = [
  { slug: "void-walker",   title: "Void Walker",   year: "2025", img: P("sf1") },
  { slug: "star-forge",    title: "Star Forge",    year: "2024", img: P("sf2") },
  { slug: "quantum-drift", title: "Quantum Drift", year: "2025", img: P("sf3") },
  { slug: "dark-matter",   title: "Dark Matter",   year: "2024", img: P("sf4") },
  { slug: "nebula-rise",   title: "Nebula Rise",   year: "2025", img: P("sf5") },
  { slug: "arc-genesis",   title: "Arc Genesis",   year: "2024", img: P("sf6") },
] as const;

const profiles = [
  { name: "Our Family", av: AV(1),  color: "#e50914" },
  { name: "Alex",       av: AV(11), color: "#0080ff" },
  { name: "Jamie",      av: AV(25), color: "#e5a714" },
  { name: "Kids",       av: AV(33), color: "#46d369" },
] as const;

const searchResults = [
  { slug: "phantom-gate", title: "Phantom Gate", meta: "2024 · Action · Sci-Fi", img: P("sr1", 160, 90) },
  { slug: "dark-waters", title: "Dark Waters", meta: "2025 · Mystery · Thriller", img: P("sr2", 160, 90) },
  { slug: "iron-echo", title: "Iron Echo", meta: "2023 · Action · Drama", img: P("sr3", 160, 90) },
  { slug: "signal", title: "Signal", meta: "2025 · Drama · Thriller", img: P("sr4", 160, 90) },
] as const;

const footerLinks: Array<Array<{ label: string; id?: string }>> = [
  [
    { label: "Audio Description",  id: "reelify.footer.audio-description" },
    { label: "Help Center",        id: "reelify.footer.help-center" },
    { label: "Gift Cards",         id: "reelify.footer.gift-cards" },
    { label: "Media Center",       id: "reelify.footer.media-center" },
  ],
  [
    { label: "Investor Relations", id: "reelify.footer.investor-relations" },
    { label: "Jobs" },
    { label: "Terms of Use",       id: "reelify.footer.terms" },
    { label: "Privacy",            id: "reelify.footer.privacy" },
  ],
  [
    { label: "Legal Notices" },
    { label: "Cookie Preferences", id: "reelify.footer.cookie-preferences" },
    { label: "Corporate Information" },
    { label: "Contact Us",         id: "reelify.footer.contact-us" },
  ],
];

const recommendationNotices = {
  "for-you": {
    eyebrow: "Because you watched Phantom Gate",
    title: "New picks for you",
    body: "Your sci-fi queue was refreshed with tense thrillers and high-match releases.",
    ctaLabel: "See recommendations",
    ctaId: "reelify.async.for-you.see-recommendations",
    accent: "from-[#e50914] to-[#8b0f18]",
    img: P("notice-for-you", 96, 128),
  },
  local: {
    eyebrow: "Popular near you",
    title: "Local favorites are trending",
    body: "View titles people in your area are watching tonight.",
    ctaLabel: "View local picks",
    ctaId: "reelify.async.local.view-picks",
    accent: "from-[#2563eb] to-[#0f766e]",
    img: P("notice-local", 96, 128),
  },
  weekend: {
    eyebrow: "Weekend watchlist",
    title: "Your Friday night lineup is ready",
    body: "Three new releases match your action and mystery history.",
    ctaLabel: "Browse weekend picks",
    ctaId: "reelify.async.weekend.browse-picks",
    accent: "from-[#7c3aed] to-[#db2777]",
    img: P("notice-weekend", 96, 128),
  },
} as const;

function ReelifyExperience() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getReelifyBenchmarkState(stateId), [stateId]);

  const [uiState, setUiState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState<MenuName>(
    initialState.profileMenuOpen ? "profile" :
    initialState.filterMenuOpen ? "filter" :
    initialState.cardMenuSlug === "phantom-gate" ? "continue-more" : null,
  );
  const [movieModalOpen, setMovieModalOpen] = useState(initialState.movieModalOpen);
  const [searchOpen, setSearchOpen] = useState(initialState.searchOpen);
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [slideIndex, setSlideIndex] = useState(initialState.bannerSlide);
  const [slideTimerReset, setSlideTimerReset] = useState(0);
  const [rowOffsets, setRowOffsets] = useState<Record<string, number>>({});

  const footerRef = useRef<HTMLElement>(null);
  const newReleasesRef = useRef<HTMLElement>(null);
  const scifiRef = useRef<HTMLElement>(null);
  const panel = useDraggablePanel({ x: 750, y: 85 });
  const miniPlayer = useDraggablePanel(initialState.miniPlayerPos);

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(
      initialState.profileMenuOpen ? "profile" :
      initialState.filterMenuOpen ? "filter" :
      initialState.cardMenuSlug === "phantom-gate" ? "continue-more" : null,
    );
    setMovieModalOpen(initialState.movieModalOpen);
    setSearchOpen(initialState.searchOpen);
    setAsyncReady(initialState.asyncDelayMs === null);
    setSlideIndex(initialState.bannerSlide);
    setSlideTimerReset(0);
    setRowOffsets({});
    miniPlayer.setPos(initialState.miniPlayerPos);
  }, [initialState]);

  useEffect(() => { window.__REELIFY_BENCHMARK_STATE__ = uiState; }, [uiState]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __REELIFY_BENCHMARK_STATE__?: Record<string, unknown> }).__REELIFY_BENCHMARK_STATE__ ?? null;
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (uiState.scrollTarget === "footer") footerRef.current?.scrollIntoView({ block: "end" });
    if (uiState.scrollTarget === "new-releases") newReleasesRef.current?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "sci-fi") scifiRef.current?.scrollIntoView({ block: "start" });
  }, [uiState.scrollTarget]);

  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const t = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => window.clearTimeout(t);
  }, [uiState.asyncDelayMs]);

  useEffect(() => {
    if (uiState.autoBannerDelayMs === null) return;
    const t = window.setInterval(() => setSlideIndex(v => (v + 1) % bannerSlides.length), uiState.autoBannerDelayMs);
    return () => window.clearInterval(t);
  }, [slideTimerReset, uiState.autoBannerDelayMs]);

  function selectHeroSlide(index: number) {
    setSlideIndex(index);
    setSlideTimerReset((value) => value + 1);
  }

  const slide = bannerSlides[slideIndex];
  const rowOffset = (rowKey: string) => rowOffsets[rowKey] ?? 0;
  const shiftRow = (rowKey: string, cards: readonly ReelCard[], direction: -1 | 1) => {
    const pageSize = 5;
    const maxOffset = Math.max(0, cards.length - pageSize);
    setRowOffsets(current => {
      const currentOffset = current[rowKey] ?? 0;
      const nextOffset = direction > 0
        ? Math.min(maxOffset, currentOffset + pageSize)
        : Math.max(0, currentOffset - pageSize);
      return { ...current, [rowKey]: nextOffset };
    });
  };

  return (
    <div onClick={() => setActiveMenu(null)}>
      {/* Fixed navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] bg-gradient-to-b from-black/95 to-black/60 backdrop-blur-sm flex items-center justify-between px-14">
        <div className="flex items-center gap-7">
          {/* Logo */}
          <div className="flex items-center gap-1.5 mr-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#e50914"><path d="M5 3h3l4 9 4-9h3L14 12l5 9h-3l-4-9-4 9H5l5-9L5 3z" /></svg>
            <span className="text-[15px] font-extrabold tracking-[0.2em] text-white">REELIFY</span>
          </div>
          <button data-igg-id="reelify.navbar.home" className="text-sm font-semibold text-white hover:text-[#e5e5e5]">Home</button>
          <button data-igg-id="reelify.navbar.movies" className="text-sm font-medium text-[#e5e5e5]/80 hover:text-white">Movies</button>
          <button className="text-sm font-medium text-[#e5e5e5]/80 hover:text-white">TV Shows</button>
          <button className="text-sm font-medium text-[#e5e5e5]/80 hover:text-white">My List</button>
          <button className="text-sm font-medium text-[#e5e5e5]/80 hover:text-white">Browse by Language</button>
        </div>
        <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
          <button
            data-igg-id="reelify.navbar.search"
            onClick={e => { e.stopPropagation(); setSearchOpen(true); }}
            className="text-[#e5e5e5]/80 hover:text-white transition-colors"
          >
            <Icon name="search" />
          </button>
          {/* Genre filter */}
          <div className="relative">
            <button
              data-igg-id="reelify.navbar.filter.button"
              data-igg-type="menu_reveal"
              onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === "filter" ? null : "filter"); }}
              className="text-[#e5e5e5]/80 hover:text-white transition-colors"
            ><Icon name="filter" /></button>
            <Dropdown open={activeMenu === "filter"} className="right-0 top-8 w-44">
              <MenuItem id="reelify.navbar.filter.action"   type="menu_reveal" prereq="reelify.navbar.filter.button">Action</MenuItem>
              <MenuItem id="reelify.navbar.filter.drama"    type="menu_reveal" prereq="reelify.navbar.filter.button">Drama</MenuItem>
              <MenuItem id="reelify.navbar.filter.comedy"   type="menu_reveal" prereq="reelify.navbar.filter.button">Comedy</MenuItem>
              <MenuItem id="reelify.navbar.filter.sci-fi"   type="menu_reveal" prereq="reelify.navbar.filter.button">Sci-Fi</MenuItem>
              <MenuItem id="reelify.navbar.filter.thriller" type="menu_reveal" prereq="reelify.navbar.filter.button">Thriller</MenuItem>
            </Dropdown>
          </div>
          {/* Bell */}
          <div className="relative">
            <button className="text-[#e5e5e5]/80 hover:text-white transition-colors">
              <Icon name="bell" />
            </button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#e50914] text-[9px] font-bold text-white flex items-center justify-center">3</span>
          </div>
          {/* Profile switcher */}
          <div className="relative">
            <button
              data-igg-id="reelify.navbar.profile.button"
              data-igg-type="menu_reveal"
              onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === "profile" ? null : "profile"); }}
              className="flex items-center gap-1.5 group"
            >
              <img src={AV(1)} alt="Profile" className="h-8 w-8 rounded object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={cx("text-white/70 transition-transform", activeMenu === "profile" && "rotate-180")}><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {/* Profile dropdown */}
            {activeMenu === "profile" && (
              <div className="absolute right-0 top-11 w-56 rounded-md bg-[#0f0f0f] border border-white/15 shadow-2xl z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Profile switcher */}
                <div className="px-3 pt-3 pb-2 border-b border-white/10">
                  <div className="grid grid-cols-4 gap-2">
                    {profiles.map(p => (
                      <button key={p.name} className="flex flex-col items-center gap-1 group/p">
                        <img src={p.av} alt={p.name} className="h-10 w-10 rounded object-cover ring-2 ring-transparent group-hover/p:ring-white transition-all" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        <span className="text-[10px] text-[#b3b3b3] group-hover/p:text-white truncate w-full text-center">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="py-1">
                  <MenuItem id="reelify.navbar.manage-profiles" type="menu_reveal" prereq="reelify.navbar.profile.button"><Icon name="edit" /> Manage Profiles</MenuItem>
                  <MenuItem id="reelify.navbar.account"         type="menu_reveal" prereq="reelify.navbar.profile.button"><Icon name="user" /> Account</MenuItem>
                  <div className="mx-3 my-1 border-t border-white/10" />
                  <MenuItem id="reelify.navbar.sign-out" type="menu_reveal" prereq="reelify.navbar.profile.button">Sign out of Reelify</MenuItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {uiState.asyncNoticeKind && asyncReady && (
        <RecommendationNotice notice={recommendationNotices[uiState.asyncNoticeKind]} />
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="mx-auto mt-24 w-[760px] rounded-md border border-white/10 bg-[#141414] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Icon name="search" />
              <input
                autoFocus
                defaultValue="phantom"
                className="h-10 flex-1 bg-transparent text-lg font-medium text-white outline-none placeholder:text-[#777]"
                placeholder="Search titles, people, genres"
              />
              <button
                data-igg-id="reelify.search.close"
                onClick={() => setSearchOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#b3b3b3] transition hover:bg-white/10 hover:text-white"
              >
                <Icon name="x" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              {searchResults.map(item => (
                <button
                  key={item.slug}
                  data-igg-id={`reelify.search.result.${item.slug}`}
                  className="flex items-center gap-3 rounded-md p-2 text-left transition hover:bg-white/10"
                >
                  <div className="h-[72px] w-32 flex-shrink-0 overflow-hidden rounded bg-[#333]">
                    <Img src={item.img} alt={item.title} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-[#b3b3b3]">{item.meta}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded border border-white/20 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                      <Icon name="play" /> Play
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-h-screen bg-[#141414] pt-[68px]">

        {/* Hero banner — stacked slides for smooth fade */}
        <div className="relative h-[500px] overflow-hidden bg-black">
          {bannerSlides.map((s, i) => (
            <div
              key={s.id}
              className={cx(
                "absolute inset-0 transition-opacity duration-700",
                i === slideIndex ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              <Img src={s.img} alt={s.title} className="absolute inset-0 brightness-50" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
              {/* Content */}
              <div className="relative flex h-full items-end pb-16 px-14 max-w-2xl">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#e50914] text-white">{s.badge}</span>
                    <span className="text-xs text-[#b3b3b3]">{s.genre}</span>
                    <span className="text-xs text-[#b3b3b3]">·</span>
                    <span className="text-xs text-[#b3b3b3]">{s.year}</span>
                    <span className="text-xs border border-[#b3b3b3]/40 px-1 text-[#b3b3b3]">{s.rating}</span>
                  </div>
                  <h1 className="text-5xl font-extrabold text-white leading-tight drop-shadow-lg">{s.title}</h1>
                  <p className="mt-3 text-sm text-[#e5e5e5]/80 leading-relaxed max-w-md">{s.desc}</p>
                  <div className="mt-5 flex items-center gap-3">
                    {s.id === "echoes" && (
                      <>
                        <button data-igg-id="reelify.hero.echoes.play"
                          className="flex items-center gap-2 rounded px-6 py-2.5 bg-white text-black text-sm font-bold hover:bg-[#e5e5e5] transition-colors shadow-lg">
                          <Icon name="play" /> Play
                        </button>
                        <button data-igg-id="reelify.hero.echoes.info" className="flex items-center gap-2 rounded px-6 py-2.5 bg-white/20 text-white text-sm font-bold hover:bg-white/30 border border-white/20">
                          <Icon name="info" /> More Info
                        </button>
                      </>
                    )}
                    {s.id === "dark-horizon" && (
                      <>
                        <button data-igg-id="reelify.hero.dark-horizon.play"
                          className="flex items-center gap-2 rounded px-6 py-2.5 bg-white text-black text-sm font-bold hover:bg-[#e5e5e5]">
                          <Icon name="play" /> Play
                        </button>
                        <button data-igg-id="reelify.hero.dark-horizon.info" className="flex items-center gap-2 rounded px-6 py-2.5 bg-white/20 text-white text-sm font-bold hover:bg-white/30 border border-white/20">
                          <Icon name="info" /> More Info
                        </button>
                      </>
                    )}
                    {s.id === "signal" && (
                      <>
                        <button data-igg-id="reelify.hero.signal.play" className="flex items-center gap-2 rounded px-6 py-2.5 bg-white text-black text-sm font-bold hover:bg-[#e5e5e5]">
                          <Icon name="play" /> Play
                        </button>
                        <button
                          data-igg-id="reelify.hero.signal.info"
                          data-igg-type="auto_transition"
                          data-igg-wait-ms="3600"
                          className="flex items-center gap-2 rounded px-6 py-2.5 bg-white/20 text-white text-sm font-bold hover:bg-white/30 border border-white/20"
                        >
                          <Icon name="info" /> More Info
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Slide dots — always on top */}
          <div className="absolute bottom-6 right-10 flex gap-2 z-10">
            {bannerSlides.map((_, i) => (
              <button key={i} data-igg-id={`reelify.hero.dot-${i}`}
                onClick={e => { e.stopPropagation(); selectHeroSlide(i); }}
                className={cx("h-1 rounded-full transition-all", slideIndex === i ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70")} />
            ))}
          </div>
        </div>

        {/* Content rows */}
        <div className="px-14">

          <ContentRow
            title="Continue Watching"
            rowKey="continue"
            cards={continueCards}
            offset={rowOffset("continue")}
            onPrev={() => shiftRow("continue", continueCards, -1)}
            onNext={() => shiftRow("continue", continueCards, 1)}
            className="pt-8"
            plusIdFor={(card) => `reelify.continue.${card.slug}.plus`}
            moreMenu={{
              cardSlug: "phantom-gate",
              menuName: "continue-more",
              buttonId: "reelify.continue.phantom-gate.more",
              items: [
                { id: "reelify.continue.phantom-gate.add-list", label: "Add to My List", icon: "plus", prereq: "reelify.continue.phantom-gate.more" },
                { id: "reelify.continue.phantom-gate.remove", label: "Remove from Row", prereq: "reelify.continue.phantom-gate.more" },
                { id: "reelify.continue.phantom-gate.rate", label: "Rate This", prereq: "reelify.continue.phantom-gate.more" },
              ],
            }}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          <ContentRow
            title="Trending Now"
            rowKey="trending"
            cards={trendingCards}
            offset={rowOffset("trending")}
            onPrev={() => shiftRow("trending", trendingCards, -1)}
            onNext={() => shiftRow("trending", trendingCards, 1)}
            plusIdFor={(card, index) => index < 4 ? `reelify.trending.${card.slug}.plus` : undefined}
            moreMenu={{
              cardSlug: "dark-waters",
              menuName: "trending-more",
              buttonId: "reelify.trending.dark-waters.more",
              items: [
                { id: "reelify.trending.dark-waters.save", label: "Save to My List", icon: "plus", prereq: "reelify.trending.dark-waters.more" },
                { id: "reelify.trending.dark-waters.not-interested", label: "Not Interested", prereq: "reelify.trending.dark-waters.more" },
              ],
            }}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          <ContentRow
            title="Action & Thrillers"
            rowKey="action"
            cards={actionCards}
            offset={rowOffset("action")}
            onPrev={() => shiftRow("action", actionCards, -1)}
            onNext={() => shiftRow("action", actionCards, 1)}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          <ContentRow
            title="New Releases"
            rowKey="new-releases"
            cards={newReleasesCards}
            offset={rowOffset("new-releases")}
            onPrev={() => shiftRow("new-releases", newReleasesCards, -1)}
            onNext={() => shiftRow("new-releases", newReleasesCards, 1)}
            sectionRef={newReleasesRef}
            plusIdFor={(card) => `reelify.new-releases.${card.slug}.add-list`}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          <ContentRow
            title="Critically Acclaimed"
            rowKey="acclaimed"
            cards={acclaimedCards}
            offset={rowOffset("acclaimed")}
            onPrev={() => shiftRow("acclaimed", acclaimedCards, -1)}
            onNext={() => shiftRow("acclaimed", acclaimedCards, 1)}
            match="97% Match"
            plusIdFor={(card) => `reelify.acclaimed.${card.slug}.add-list`}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          <ContentRow
            title="Romantic Comedies"
            rowKey="romcom"
            cards={romcomCards}
            offset={rowOffset("romcom")}
            onPrev={() => shiftRow("romcom", romcomCards, -1)}
            onNext={() => shiftRow("romcom", romcomCards, 1)}
            plusIdFor={(card) => `reelify.romcom.${card.slug}.add-list`}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          <ContentRow
            title="Sci-Fi & Fantasy"
            rowKey="scifi"
            cards={scifiCards}
            offset={rowOffset("scifi")}
            onPrev={() => shiftRow("scifi", scifiCards, -1)}
            onNext={() => shiftRow("scifi", scifiCards, 1)}
            sectionRef={scifiRef}
            className="pb-20"
            kind="Series"
            plusIdFor={(card) => `reelify.scifi.${card.slug}.add-list`}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

        </div>

        <footer ref={footerRef} className="mx-auto max-w-[1120px] px-14 pb-14 pt-4 text-[#808080]">
          <div className="mb-7 flex items-center gap-7 text-white">
            <button className="text-2xl font-bold leading-none hover:text-[#b3b3b3]" aria-label="Facebook">f</button>
            <button className="text-xl font-bold leading-none hover:text-[#b3b3b3]" aria-label="Instagram">◎</button>
            <button className="text-xl font-bold leading-none hover:text-[#b3b3b3]" aria-label="X">𝕏</button>
            <button className="text-xl font-bold leading-none hover:text-[#b3b3b3]" aria-label="YouTube">▶</button>
          </div>
          <div className="grid grid-cols-4 gap-x-16 gap-y-4 text-sm">
            {footerLinks.map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-4">
                {column.map(link => (
                  <button key={link.label} data-igg-id={link.id} className="block text-left hover:underline">{link.label}</button>
                ))}
              </div>
            ))}
            <div className="space-y-4">
              <button data-igg-id="reelify.footer.ad-choices" className="block text-left hover:underline">Ad Choices</button>
              <button className="block text-left hover:underline">Speed Test</button>
              <button className="block text-left hover:underline">Only on Reelify</button>
            </div>
          </div>
          <button data-igg-id="reelify.footer.service-code" className="mt-7 border border-[#808080] px-3 py-1 text-sm text-[#808080] hover:text-white">
            Service Code
          </button>
          <div className="mt-6 text-xs leading-relaxed text-[#666]">
            <p>© 2026 Reelify Entertainment Services. All rights reserved.</p>
          </div>
        </footer>
      </main>

      {/* Movie detail modal (popup_occlusion — state 8) */}
      {movieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-[560px] rounded-xl bg-[#181818] shadow-2xl overflow-hidden">
            <div className="relative h-[240px] overflow-hidden bg-[#333]">
              <Img src={P("modal1", 560, 240)} alt="Phantom Gate" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <button className="flex items-center gap-2 rounded px-4 py-2 bg-white text-black text-sm font-bold hover:bg-[#e5e5e5]"><Icon name="play" /> Play</button>
                <button className="h-8 w-8 rounded-full border-2 border-white/50 flex items-center justify-center text-white hover:border-white"><Icon name="plus" /></button>
              </div>
              <button
                data-igg-id="reelify.modal.close"
                onClick={() => setMovieModalOpen(false)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-[#181818]/80 flex items-center justify-center text-white hover:bg-[#282828]"
              ><Icon name="x" /></button>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-white">Phantom Gate</h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#b3b3b3]">
                <span className="text-[#46d369] font-semibold">97% Match</span>
                <span>2024</span>
                <span className="border border-[#b3b3b3]/40 px-1">TV-MA</span>
                <span>2h 14m</span>
              </div>
              <p className="mt-3 text-sm text-[#d2d2d2] leading-relaxed">An elite operative uncovers a network of quantum gates hidden beneath major world cities — and the truth about who built them.</p>
              <div className="mt-3 text-xs text-[#b3b3b3]">
                <span className="text-[#6a6a6a]">Cast: </span>Sam West, Priya Nair, Marco Bell
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini player (drag_occlusion) */}
      {uiState.miniPlayerOpen && (
        <div
          data-igg-id="reelify.mini-player"
          onMouseDown={miniPlayer.onMouseDown}
          className="fixed z-40 w-[460px] cursor-grab rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl active:cursor-grabbing overflow-hidden select-none"
          style={{ left: miniPlayer.pos.x, top: miniPlayer.pos.y }}
        >
          {/* Video thumbnail */}
          <div className="relative h-[259px] bg-black">
            <Img src={P("mini1", 460, 259)} alt="Phantom Gate" className="opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 border border-white/30">
                <Icon name="play" />
              </div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 px-2">
              <div className="h-1 rounded-full bg-white/20">
                <div className="h-full w-[38%] rounded-full bg-[#e50914]" />
              </div>
            </div>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#141414]">
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-white">Phantom Gate</div>
              <div className="text-[11px] text-[#b3b3b3]">S1:E4 · 38m left</div>
            </div>
            <button
              data-igg-id="reelify.mini-player.fullscreen"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
            </button>
            <button
              data-igg-id="reelify.mini-player.close"
              onClick={() => setUiState(s => ({ ...s, miniPlayerOpen: false }))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white transition"
            >
              <Icon name="x" />
            </button>
          </div>
        </div>
      )}

      {/* Info panel (drag_occlusion — state 11) */}
      {uiState.infoPanelOpen && (
        <div
          data-igg-id="reelify.info-panel"
          onMouseDown={panel.onMouseDown}
          className="fixed z-40 w-[420px] cursor-grab rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl active:cursor-grabbing overflow-hidden"
          style={{ left: panel.pos.x, top: panel.pos.y, height: "900px" }}
        >
          <div className="flex items-center justify-between bg-[#242424] px-4 py-3 border-b border-white/10">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              Movie Details
            </div>
            <span className="text-xs text-[#6a6a6a]">Drag to move</span>
          </div>
          <div className="px-4 py-4 overflow-y-auto h-full">
            <div className="relative h-44 rounded-lg overflow-hidden bg-[#333] mb-4">
              <Img src={P("panel1", 420, 176)} alt="Phantom Gate" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <h3 className="text-lg font-bold text-white">Phantom Gate</h3>
            <p className="mt-1 text-sm text-[#b3b3b3]">An elite operative uncovers a network of quantum gates hidden beneath major world cities.</p>
            <div className="mt-4 space-y-1.5 text-xs text-[#6a6a6a]">
              <div><span className="text-[#b3b3b3]">Director:</span> Aria Chen</div>
              <div><span className="text-[#b3b3b3]">Cast:</span> Sam West, Priya Nair, Marco Bell</div>
              <div><span className="text-[#b3b3b3]">Genre:</span> Action · Sci-Fi · Thriller</div>
              <div><span className="text-[#b3b3b3]">Rating:</span> TV-MA · 2h 14m · 2024</div>
            </div>
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-white mb-3">More Like This</div>
              {[
                { title: "Iron Echo",     img: P("ml1", 64, 40) },
                { title: "Dark Frontier", img: P("ml2", 64, 40) },
                { title: "Neon Signal",   img: P("ml3", 64, 40) },
                { title: "Beyond Recall", img: P("ml4", 64, 40) },
                { title: "Cold Static",   img: P("ml5", 64, 40) },
              ].map(m => (
                <div key={m.title} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 cursor-pointer">
                  <div className="h-10 w-16 flex-shrink-0 rounded overflow-hidden bg-[#333]">
                    <Img src={m.img} alt={m.title} />
                  </div>
                  <span className="text-sm text-white">{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReelifyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#141414]" />}>
      <ReelifyExperience />
    </Suspense>
  );
}
