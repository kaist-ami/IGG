"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getWavrBenchmarkState, type WavrBenchmarkState } from "./wavr-states";

declare global {
  interface Window { __WAVR_BENCHMARK_STATE__?: WavrBenchmarkState; }
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
  runtimeStateKey: "__WAVR_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button']",
});

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type MenuName = "track-more" | "library-filter" | "player-more" | null;

function Img({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cx("object-cover", className)}
      onError={(e) => {
        if (fallback) e.currentTarget.src = fallback;
        else e.currentTarget.style.opacity = "0";
      }}
    />
  );
}

function Icon({ name }: { name: "home" | "search" | "heart" | "heart-fill" | "more" | "shuffle" | "skip-back" | "play" | "pause" | "skip-forward" | "repeat" | "volume" | "device" | "queue" | "filter" | "plus" | "x" | "drag" | "chevron-left" | "chevron-right" | "radio" | "playlist" | "artist" | "album" | "check" | "loader" | "trending" | "mic" | "crossfade" | "normalize" }) {
  const c = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    "heart-fill": <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#1db954" stroke="#1db954" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    shuffle: <><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="4" y1="4" x2="9" y2="9" /></>,
    "skip-back": <><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></>,
    play: <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />,
    pause: <><line x1="6" y1="4" x2="6" y2="20" /><line x1="18" y1="4" x2="18" y2="20" /></>,
    "skip-forward": <><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></>,
    repeat: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
    volume: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>,
    device: <><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>,
    queue: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    filter: <><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    drag: <><path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
    "chevron-left": <polyline points="15 18 9 12 15 6" />,
    "chevron-right": <polyline points="9 18 15 12 9 6" />,
    radio: <><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></>,
    playlist: <><path d="M21 15V19" /><path d="M15 21H3" /><path d="M9 3H3v6h6V3z" /><path d="M9 15H3v6h6v-6z" /><path d="M21 3h-6v6h6V3z" /></>,
    artist: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>,
    album: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    loader: <><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></>,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>,
    crossfade: <><path d="M3 8 Q7 4 12 8 Q17 12 21 8" strokeWidth={1.8} /><path d="M3 16 Q7 12 12 16 Q17 20 21 16" strokeWidth={1.8} /><polyline points="17 5 21 8 17 11" /><polyline points="7 13 3 16 7 19" /></>,
    normalize: <><line x1="4" y1="20" x2="4" y2="13" /><line x1="8" y1="20" x2="8" y2="6" /><line x1="12" y1="20" x2="12" y2="10" /><line x1="16" y1="20" x2="16" y2="4" /><line x1="20" y1="20" x2="20" y2="8" /></>,
  };
  return <svg {...c}>{paths[name]}</svg>;
}

function Dropdown({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return <div className={cx("absolute z-40 overflow-hidden rounded-md bg-[#282828] shadow-2xl", className)}>{children}</div>;
}
function MenuItem({ id, type, prereq, children }: { id: string; type?: string; prereq?: string; children: React.ReactNode }) {
  return (
    <button data-igg-id={id} data-igg-type={type} data-igg-prereq={prereq}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#ffffffcc] hover:bg-white/10 hover:text-white whitespace-nowrap">
      {children}
    </button>
  );
}

function TooltipLabel({ children, align = "center" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <span
      className={cx(
        "pointer-events-none absolute bottom-[calc(100%+8px)] z-50 whitespace-nowrap rounded bg-[#181818] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-xl transition-opacity group-hover/player-tip:opacity-100",
        align === "left" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "right" && "right-0",
      )}
    >
      {children}
    </span>
  );
}

function useDraggablePanel(initial: { x: number; y: number }, resetKey?: string) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ startX: number; startY: number; panelX: number; panelY: number } | null>(null);
  useEffect(() => {
    if (resetKey === undefined) return;
    drag.current = null;
    setPos(initial);
  }, [resetKey]);
  useEffect(() => {
    const move = (e: MouseEvent) => { if (drag.current) setPos({ x: drag.current.panelX + e.clientX - drag.current.startX, y: drag.current.panelY + e.clientY - drag.current.startY }); };
    const up = () => { drag.current = null; };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, []);
  return { pos, onMouseDown: (e: React.MouseEvent) => { drag.current = { startX: e.clientX, startY: e.clientY, panelX: pos.x, panelY: pos.y }; } };
}

// picsum.photos — Unsplash license (free for commercial & personal use, no attribution required)
// pravatar.cc — free placeholder avatars
const P = (seed: number | string, w = 300, h = 300) => `https://picsum.photos/seed/wvr${seed}/${w}/${h}`;
const AV = (n: number) => `https://i.pravatar.cc/200?img=${n}`;

const featuredSlides = [
  { label: "New from your library", title: "Neon Drift",  sub: "Flux is out now",                         cta: "Listen",  target: "wavr.featured.neon-drift.listen", img: P("bnr1",1200,400), artistImg: P(11,200,200), accent: "#1db954" },
  { label: "Made for tonight",      title: "Weekend Mix", sub: "A short set of late-night electronic cuts", cta: "Play",    target: "wavr.featured.weekend-mix.play",  img: P("bnr2",1200,400), artistImg: P(44,200,200), accent: "#e91e63" },
  { label: "Near you",              title: "Lena Shore",  sub: "Brixton Academy · May 25",                 cta: "Details", target: "wavr.featured.brixton.tickets",   img: P("bnr3",1200,400), artistImg: AV(12),        accent: "#ff6b35" },
] as const;

const tracks = [
  { slug: "midnight-pulse", title: "Midnight Pulse",  artist: "Neon Drift",      album: "Flux",          duration: "3:42", date: "May 1",  img: P(11,80,80) },
  { slug: "glass-rooms",    title: "Glass Rooms",     artist: "Lena Shore",       album: "Shallow Waves", duration: "4:11", date: "Apr 28", img: P(12,80,80) },
  { slug: "half-awake",     title: "Half Awake",      artist: "The Pale Route",   album: "Overpass",      duration: "3:58", date: "Apr 25", img: P(13,80,80) },
  { slug: "solar-flare",    title: "Solar Flare",     artist: "Orbit",            album: "Perihelion",    duration: "2:59", date: "Apr 22", img: P(14,80,80) },
  { slug: "static-rain",    title: "Static Rain",     artist: "Violet Haze",      album: "Signal Drift",  duration: "4:33", date: "Apr 19", img: P(15,80,80) },
  { slug: "undertow",       title: "Undertow",        artist: "Kai Rivers",       album: "Margins",       duration: "3:17", date: "Apr 15", img: P(16,80,80) },
  { slug: "open-sky",       title: "Open Sky",        artist: "Mara Flynn",       album: "Latitude",      duration: "5:02", date: "Apr 10", img: P(17,80,80) },
  { slug: "paper-birds",    title: "Paper Birds",     artist: "The Fold",         album: "Tessellate",    duration: "3:44", date: "Apr 7",  img: P(18,80,80) },
  { slug: "neon-city",      title: "Neon City",       artist: "Synth Collective", album: "Gridwork",      duration: "4:20", date: "Apr 3",  img: P(19,80,80) },
  { slug: "cold-front",     title: "Cold Front",      artist: "Echo Coast",       album: "Shoreline",     duration: "3:55", date: "Mar 30", img: P(20,80,80) },
  { slug: "slow-burn",      title: "Slow Burn",       artist: "Drift Radio",      album: "Frequency",     duration: "4:08", date: "Mar 27", img: P(21,80,80) },
  { slug: "river-run",      title: "River Run",       artist: "Aurora Drift",     album: "Northern",      duration: "3:29", date: "Mar 24", img: P(22,80,80) },
] as const;

const relatedArtists = [
  { slug: "aurora-drift",     name: "Aurora Drift",     genre: "Electronic · Ambient",         img: AV(30) },
  { slug: "the-pale-route",   name: "The Pale Route",   genre: "Indie Folk · Dream Pop",        img: AV(31) },
  { slug: "violet-haze",      name: "Violet Haze",      genre: "Shoegaze · Alternative",        img: AV(32) },
  { slug: "kai-rivers",       name: "Kai Rivers",       genre: "R&B · Soul",                    img: AV(33) },
  { slug: "mara-flynn",       name: "Mara Flynn",       genre: "Indie Pop · Singer-Songwriter", img: AV(34) },
  { slug: "synth-collective", name: "Synth Collective", genre: "Electronic · Synthwave",        img: AV(35) },
  { slug: "echo-coast",       name: "Echo Coast",       genre: "Post-Rock · Ambient",           img: AV(36) },
  { slug: "drift-radio",      name: "Drift Radio",      genre: "Lo-fi · Chillwave",             img: AV(37) },
] as const;

const sidebarPlaylists = [
  { slug: "liked-songs",       title: "Liked Songs",       sub: "Playlist · 214 songs", img: null },
  { slug: "midnight-drives",   title: "Midnight Drives",   sub: "Playlist · 38 songs",  img: P("pl2",40,40) },
  { slug: "focus-flow",        title: "Focus Flow",        sub: "Playlist · 52 songs",  img: P("pl3",40,40) },
  { slug: "late-night-coding", title: "Late Night Coding", sub: "Playlist · 61 songs",  img: P("pl4",40,40) },
  { slug: "neon-drift",        title: "Neon Drift",        sub: "Artist",               img: AV(11) },
  { slug: "chill-indie-2026",  title: "Chill Indie 2026",  sub: "Playlist · 29 songs",  img: P("pl6",40,40) },
] as const;

const queueItems = [
  { slug: "glass-rooms",  title: "Glass Rooms",  artist: "Lena Shore",     img: P(12,72,72) },
  { slug: "half-awake",   title: "Half Awake",   artist: "The Pale Route", img: P(13,72,72) },
  { slug: "solar-flare",  title: "Solar Flare",  artist: "Orbit",          img: P(14,72,72) },
  { slug: "static-rain",  title: "Static Rain",  artist: "Violet Haze",    img: P(15,72,72) },
  { slug: "undertow",     title: "Undertow",     artist: "Kai Rivers",     img: P(16,72,72) },
  { slug: "open-sky",     title: "Open Sky",     artist: "Mara Flynn",     img: P(17,72,72) },
] as const;

const floatingNowPlaying = { title: "Copper Line", artist: "The Still Works", album: "Iron Season", img: P(51,112,112), duration: "3:52", elapsed: "1:10" };
const floatingQueueItems = [
  { slug: "frostbite",      title: "Frostbite",      artist: "Grey Harbour",    img: P(52,72,72) },
  { slug: "velvet-skies",   title: "Velvet Skies",   artist: "Ashen Bloom",     img: P(53,72,72) },
  { slug: "hollow-grounds", title: "Hollow Grounds", artist: "Riven Coast",     img: P(54,72,72) },
  { slug: "salt-and-steel", title: "Salt & Steel",   artist: "The Low Margins", img: P(55,72,72) },
  { slug: "morning-ghost",  title: "Morning Ghost",  artist: "Pale Ember",      img: P(56,72,72) },
] as const;

// ── Home view data ───────────────────────────────────────────────────────────

const recentlyPlayed = [
  { slug: "liked-songs",     title: "Liked Songs",       type: "Playlist", img: null },
  { slug: "midnight-drives", title: "Midnight Drives",   type: "Playlist", img: P("pl2",48,48) },
  { slug: "focus-flow",      title: "Focus Flow",        type: "Playlist", img: P("pl3",48,48) },
  { slug: "neon-drift-rp",   title: "Neon Drift",        type: "Artist",   img: P(11,48,48) },
  { slug: "late-night-rp",   title: "Late Night Coding", type: "Playlist", img: P("pl4",48,48) },
  { slug: "chill-indie-rp",  title: "Chill Indie 2026",  type: "Playlist", img: P("pl6",48,48) },
] as const;

const trendingSongs = [
  { slug: "heavy-serenade", title: "Heavy Serenade", artist: "Neon Drift",       img: P(40,300,300) },
  { slug: "glass-rooms-tr", title: "Glass Rooms",    artist: "Lena Shore",       img: P(41,300,300) },
  { slug: "neon-city-tr",   title: "Neon City",      artist: "Synth Collective", img: P(42,300,300) },
  { slug: "solar-flare-tr", title: "Solar Flare",    artist: "Orbit",            img: P(43,300,300) },
  { slug: "open-sky-tr",    title: "Open Sky",       artist: "Mara Flynn",       img: P(44,300,300) },
  { slug: "cold-front-tr",  title: "Cold Front",     artist: "Echo Coast",       img: P(45,300,300) },
] as const;

const homeArtists = [
  { slug: "neon-drift-ha",     name: "Neon Drift",       img: AV(11) },
  { slug: "lena-shore-ha",     name: "Lena Shore",       img: AV(12) },
  { slug: "aurora-drift-ha",   name: "Aurora Drift",     img: AV(13) },
  { slug: "the-pale-route-ha", name: "The Pale Route",   img: AV(14) },
  { slug: "violet-haze-ha",    name: "Violet Haze",      img: AV(15) },
  { slug: "synth-coll-ha",     name: "Synth Collective", img: AV(16) },
  { slug: "kai-rivers-ha",     name: "Kai Rivers",       img: AV(17) },
  { slug: "echo-coast-ha",     name: "Echo Coast",       img: AV(18) },
] as const;

const weeklyCharts = [
  { id: "global-weekly", title: "Global",      sub: "Weekly Music Charts", img: P("ch1",400,160), accent: "#9333ea" },
  { id: "korea-weekly",  title: "Korea",       sub: "Weekly Music Charts", img: P("ch2",400,160), accent: "#ea580c" },
  { id: "global-daily",  title: "Global",      sub: "Daily Music Charts",  img: P("ch3",400,160), accent: "#1d4ed8" },
  { id: "korea-daily",   title: "South Korea", sub: "Daily Music Charts",  img: P("ch4",400,160), accent: "#dc2626" },
] as const;

const asyncNotices = {
  release: {
    eyebrow: "New release",
    title: "Neon Drift just dropped Flux Deluxe",
    body: "Three unreleased tracks are ready in your library.",
    cta: "Play release",
    target: "wavr.async.release.play",
    icon: "album" as const,
    art: P("notice-release", 96, 96),
  },
  concert: {
    eyebrow: "Near you",
    title: "Lena Shore tickets are live",
    body: "Brixton Academy seats opened for listeners in your area.",
    cta: "View tickets",
    target: "wavr.async.concert.view-tickets",
    icon: "mic" as const,
    art: AV(12),
  },
  playlist: {
    eyebrow: "Made for you",
    title: "Your Night Drive Mix refreshed",
    body: "A new set based on your recent plays is ready.",
    cta: "Open mix",
    target: "wavr.async.playlist.open",
    icon: "playlist" as const,
    art: P("notice-playlist", 96, 96),
  },
  friend: {
    eyebrow: "Friend activity",
    title: "Mina started listening to Glass Rooms",
    body: "Jump into the track while it is still playing.",
    cta: "Listen now",
    target: "wavr.async.friend.listen",
    icon: "artist" as const,
    art: AV(24),
  },
  download: {
    eyebrow: "Downloads ready",
    title: "Focus Flow is available offline",
    body: "Your playlist finished syncing on this device.",
    cta: "View downloads",
    target: "wavr.async.download.view",
    icon: "check" as const,
    art: P("notice-download", 96, 96),
  },
} as const;

function AsyncNotice({ notice }: { notice: (typeof asyncNotices)[keyof typeof asyncNotices] }) {
  return (
    <div className="fixed bottom-[96px] right-6 z-[45] w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#181818]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="h-1 bg-[#1db954]" />
      <div className="flex gap-4 p-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#282828]">
          <Img src={notice.art} alt="" className="h-full w-full" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#181818] bg-[#1db954] text-black">
            <Icon name={notice.icon} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1db954]">{notice.eyebrow}</span>
            <span className="h-2 w-2 rounded-full bg-[#1db954] shadow-[0_0_12px_rgba(29,185,84,0.9)]" />
          </div>
          <div className="truncate text-sm font-extrabold text-white">{notice.title}</div>
          <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#b3b3b3]">{notice.body}</div>
          <button
            data-igg-id={notice.target}
            data-igg-type="async_wait"
            className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-black transition-transform hover:scale-[1.03]"
          >
            {notice.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

function WavrApp() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getWavrBenchmarkState(stateId), [stateId]);

  const [uiState, setUiState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState<MenuName>(
    initialState.trackMoreOpen ? "track-more" :
    initialState.libraryFilterOpen ? "library-filter" :
    initialState.playerMoreOpen ? "player-more" : null,
  );
  const [searchOpen, setSearchOpen] = useState(initialState.searchOpen);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(initialState.deviceDialogOpen);
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [slideIndex, setSlideIndex] = useState(initialState.bannerSlide);
  const [slideTimerReset, setSlideTimerReset] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cookieDismissed, setCookieDismissed] = useState(false);
  const [activeTrackMenuSlug, setActiveTrackMenuSlug] = useState<string | null>(initialState.trackMoreOpen ? "midnight-pulse" : null);
  const [activeSidebarMenuSlug, setActiveSidebarMenuSlug] = useState<string | null>(null);
  const [activeQueueMenuSlug, setActiveQueueMenuSlug] = useState<string | null>(null);

  const artistsRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const panel = useDraggablePanel({ x: 750, y: 85 });
  const floatingPanelInitial = initialState.floatingPlayerDock === "left" ? { x: 410, y: 450 } : { x: 880, y: 450 };
  const floatingPanel = useDraggablePanel(floatingPanelInitial, `${initialState.id}:${initialState.floatingPlayerDock}`);

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(
      initialState.trackMoreOpen ? "track-more" :
      initialState.libraryFilterOpen ? "library-filter" :
      initialState.playerMoreOpen ? "player-more" : null,
    );
    setSearchOpen(initialState.searchOpen);
    setDeviceDialogOpen(initialState.deviceDialogOpen);
    setAsyncReady(initialState.asyncDelayMs === null);
    setSlideIndex(initialState.bannerSlide);
    setSlideTimerReset(0);
    setCookieDismissed(false);
    setActiveTrackMenuSlug(initialState.trackMoreOpen ? "midnight-pulse" : null);
  }, [initialState]);

  useEffect(() => { window.__WAVR_BENCHMARK_STATE__ = uiState; }, [uiState]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __WAVR_BENCHMARK_STATE__?: Record<string, unknown> }).__WAVR_BENCHMARK_STATE__ ?? null;
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (uiState.scrollTarget === "artists") artistsRef.current?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "banner")  bannerRef.current?.scrollIntoView({ block: "start" });
    if (uiState.scrollTarget === "trending") trendingRef.current?.scrollIntoView({ block: "start" });
  }, [uiState.scrollTarget]);

  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const t = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => window.clearTimeout(t);
  }, [uiState.asyncDelayMs]);

  useEffect(() => {
    const delay = uiState.autoBannerDelayMs ?? 2600;
    const t = window.setInterval(() => setSlideIndex(v => (v + 1) % featuredSlides.length), delay);
    return () => window.clearInterval(t);
  }, [slideTimerReset, uiState.autoBannerDelayMs]);

  function selectFeaturedSlide(index: number) {
    setSlideIndex(index);
    setSlideTimerReset((value) => value + 1);
  }

  const slide = featuredSlides[slideIndex];

  return (
    <div onClick={() => { setActiveMenu(null); setActiveSidebarMenuSlug(null); setActiveQueueMenuSlug(null); setActiveTrackMenuSlug(null); }}>
      <main className="flex min-h-screen bg-[#121212] pb-[90px]">

        {/* ── Left sidebar ── */}
        <aside className="sticky top-0 h-screen w-[260px] flex-shrink-0 bg-black flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-4 space-y-1">
            <div className="mb-5 flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#1db954"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.48c-.2.32-.62.42-.95.22-2.6-1.59-5.88-1.95-9.73-1.07-.37.09-.74-.14-.83-.51-.09-.37.14-.74.51-.83 4.21-.96 7.83-.55 10.75 1.24.33.2.43.62.25.95zm1.24-2.76c-.25.4-.78.52-1.18.27-2.98-1.83-7.52-2.36-11.04-1.29-.44.13-.91-.12-1.04-.56-.13-.44.12-.91.56-1.04 4.02-1.22 9.02-.63 12.44 1.44.4.25.52.78.26 1.18zm.11-2.88C14.73 9 8.97 8.75 5.47 9.82c-.53.16-1.08-.14-1.24-.67-.16-.53.14-1.08.67-1.24 4.07-1.24 10.83-.99 15.09 1.51.48.28.63.88.35 1.36-.28.47-.89.62-1.34.34z" /></svg>
              <span className="text-lg font-bold text-white tracking-tight">Wavr</span>
            </div>
            <button data-igg-id="wavr.sidebar.home" className="flex w-full items-center gap-4 rounded-md px-2 py-2 text-sm font-bold text-white">
              <Icon name="home" /> Home
            </button>
            <button data-igg-id="wavr.sidebar.search" onClick={() => setSearchOpen(true)} className="flex w-full items-center gap-4 rounded-md px-2 py-2 text-sm font-bold text-[#b3b3b3] hover:text-white">
              <Icon name="search" /> Search
            </button>
          </div>

          <div className="flex-1 mx-2 rounded-lg bg-[#121212] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3" onClick={e => e.stopPropagation()}>
              <button className="flex items-center gap-2 text-sm font-bold text-[#b3b3b3] hover:text-white">
                <Icon name="queue" /> Your Library
              </button>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    data-igg-id="wavr.library.filter.button"
                    data-igg-type="menu_reveal"
                    onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === "library-filter" ? null : "library-filter"); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white"
                  >
                    <Icon name="filter" />
                  </button>
                  <Dropdown open={activeMenu === "library-filter"} className="right-0 top-9 w-40">
                    <MenuItem id="wavr.library.filter.playlists" type="menu_reveal" prereq="wavr.library.filter.button"><Icon name="playlist" /> Playlists</MenuItem>
                    <MenuItem id="wavr.library.filter.albums"    type="menu_reveal" prereq="wavr.library.filter.button"><Icon name="album" />    Albums</MenuItem>
                    <MenuItem id="wavr.library.filter.artists"   type="menu_reveal" prereq="wavr.library.filter.button"><Icon name="artist" />   Artists</MenuItem>
                  </Dropdown>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white"><Icon name="plus" /></button>
              </div>
            </div>
            <div className="space-y-0.5 px-2 pb-4">
              {sidebarPlaylists.map((p, i) => (
                <div
                  key={p.title}
                  data-igg-id={`wavr.sidebar.playlist.${p.slug}`}
                  className={cx("group relative flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-white/10 transition-colors cursor-pointer", i === 0 && "bg-white/10")}
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center">
                    {p.img ? (
                      <Img src={p.img} alt={p.title} className="w-full h-full" />
                    ) : (
                      <Icon name="heart-fill" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cx("text-sm font-medium truncate", i === 0 ? "text-white" : "text-[#b3b3b3]")}>{p.title}</div>
                    <div className="text-xs text-[#6a6a6a] truncate">{p.sub}</div>
                  </div>
                  <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      data-igg-id={`wavr.sidebar.playlist.${p.slug}.more`}
                      data-igg-type="menu_reveal"
                      data-igg-prereq={`wavr.sidebar.playlist.${p.slug}`}
                      onClick={e => { e.stopPropagation(); setActiveSidebarMenuSlug(activeSidebarMenuSlug === p.slug ? null : p.slug); }}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[#b3b3b3] opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                    >
                      <Icon name="more" />
                    </button>
                    {activeSidebarMenuSlug === p.slug && (
                      <Dropdown open className="right-0 top-6 w-48">
                        <MenuItem id="wavr.sidebar.playlist.more.add-queue" type="menu_reveal" prereq={`wavr.sidebar.playlist.${p.slug}.more`}><Icon name="queue" /> Add to queue</MenuItem>
                        <MenuItem id="wavr.sidebar.playlist.more.remove"    type="menu_reveal" prereq={`wavr.sidebar.playlist.${p.slug}.more`}><Icon name="x" />     Remove from library</MenuItem>
                        <MenuItem id="wavr.sidebar.playlist.more.share"     type="menu_reveal" prereq={`wavr.sidebar.playlist.${p.slug}.more`}><Icon name="more" />  Share</MenuItem>
                      </Dropdown>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 px-4 pt-4 pb-2 mt-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {["Legal", "Safety & Privacy Center", "Privacy Policy", "About Ads", "Accessibility"].map(l => (
                  <span key={l} className="text-[10px] text-[#6a6a6a] hover:underline cursor-pointer">{l}</span>
                ))}
              </div>
              <button className="mt-3 flex items-center gap-1.5 rounded-full border border-[#727272] px-3 py-1 text-[11px] font-bold text-white hover:border-white">
                🌐 English
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {/* Top nav */}
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#121212]/95 backdrop-blur-sm px-6">
            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"><Icon name="chevron-left" /></button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"><Icon name="chevron-right" /></button>
              {uiState.view === "home" && (
                <div className="ml-2 flex h-9 flex-1 items-center gap-2 rounded-full bg-[#242424] px-3 text-sm text-[#6a6a6a] min-w-[260px] max-w-xs cursor-pointer hover:bg-[#2a2a2a]" onClick={() => setSearchOpen(true)}>
                  <Icon name="search" />
                  <span>What do you want to play?</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-5">
              {uiState.view === "home" && (
                <div className="flex items-center gap-4 text-sm">
                  <button className="font-bold text-white hover:underline">Premium</button>
                  <button className="text-[#b3b3b3] hover:underline hover:text-white">Support</button>
                  <button className="text-[#b3b3b3] hover:underline hover:text-white">Download</button>
                  <div className="h-4 w-px bg-white/20" />
                  <button className="text-[#b3b3b3] hover:underline hover:text-white">Install App</button>
                </div>
              )}
              <button className="flex items-center gap-2 rounded-full bg-[#282828] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#3e3e3e]">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-[10px] font-bold">YO</div>
                Profile
              </button>
            </div>
          </div>

          {/* ── HOME VIEW ── */}
          {uiState.view === "home" ? (
            <div className="px-6 pb-8">
              <h1 className="mt-4 mb-5 text-2xl font-extrabold text-white">Good afternoon</h1>

              {/* Recently played */}
              <div className="mb-8 grid grid-cols-3 gap-2">
                {recentlyPlayed.map(r => (
                  <button key={r.slug} className="flex items-center gap-3 rounded bg-white/10 text-left hover:bg-white/20 transition-colors overflow-hidden">
                    <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-700 overflow-hidden">
                      {r.img ? (
                        <Img src={r.img} alt={r.title} className="w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="heart-fill" />
                        </div>
                      )}
                    </div>
                    <span className="pr-4 text-sm font-bold text-white truncate">{r.title}</span>
                  </button>
                ))}
              </div>

              {/* Trending songs */}
              <div ref={trendingRef} className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-white">Trending songs</h2>
                  <button className="text-sm font-bold text-[#b3b3b3] hover:text-white hover:underline">Show all</button>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  {trendingSongs.map(t => (
                    <div
                      key={t.slug}
                      data-igg-id={`wavr.trending.${t.slug}.card`}
                      className="group relative rounded-md bg-[#181818] p-3 hover:bg-[#282828] transition-colors cursor-pointer"
                    >
                      <div className="mb-3 w-full aspect-square rounded overflow-hidden bg-[#282828]">
                        <Img src={t.img} alt={t.title} className="w-full h-full" />
                      </div>
                      <div className="text-sm font-bold text-white truncate">{t.title}</div>
                      <div className="mt-0.5 text-xs text-[#b3b3b3] truncate">{t.artist}</div>
                      <button
                        data-igg-id={`wavr.trending.${t.slug}.like`}
                        data-igg-type="hover_reveal"
                        data-igg-prereq={`wavr.trending.${t.slug}.card`}
                        className="absolute bottom-[52px] right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-[#b3b3b3] opacity-0 group-hover:opacity-100 hover:text-white transition-colors"
                      >
                        <Icon name="heart" />
                      </button>
                      <div className="absolute bottom-[52px] right-12 flex h-8 w-8 items-center justify-center rounded-full bg-[#1db954] opacity-0 group-hover:opacity-100 transition-all shadow-lg translate-y-1 group-hover:translate-y-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="black"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular artists */}
              <div ref={artistsRef} className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-white">Popular artists</h2>
                  <button className="text-sm font-bold text-[#b3b3b3] hover:text-white hover:underline">Show all</button>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {homeArtists.slice(0, 5).map(a => (
                    <div key={a.slug} className="group rounded-md bg-[#181818] p-4 hover:bg-[#282828] transition-colors cursor-pointer">
                      <div className="mx-auto mb-3 h-[120px] w-[120px] rounded-full overflow-hidden bg-[#333]">
                        <Img src={a.img} alt={a.name} className="w-full h-full" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white truncate">{a.name}</div>
                        <div className="mt-0.5 text-xs text-[#b3b3b3]">Artist</div>
                      </div>
                      <div className="mt-3 flex justify-center">
                        <button
                          data-igg-id={`wavr.home.artist.${a.slug}.follow`}
                          data-igg-type="off_screen"
                          data-igg-label={`Follow ${a.name}`}
                          className="rounded-full border border-[#727272] px-4 py-1 text-xs font-bold text-white hover:border-white hover:scale-105 transition-all"
                        >Follow</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-5 gap-4">
                  {homeArtists.slice(5).map(a => (
                    <div key={a.slug} className="group rounded-md bg-[#181818] p-4 hover:bg-[#282828] transition-colors cursor-pointer">
                      <div className="mx-auto mb-3 h-[120px] w-[120px] rounded-full overflow-hidden bg-[#333]">
                        <Img src={a.img} alt={a.name} className="w-full h-full" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white truncate">{a.name}</div>
                        <div className="mt-0.5 text-xs text-[#b3b3b3]">Artist</div>
                      </div>
                      <div className="mt-3 flex justify-center">
                        <button
                          data-igg-id={`wavr.home.artist.${a.slug}.follow`}
                          data-igg-type="off_screen"
                          data-igg-label={`Follow ${a.name}`}
                          className="rounded-full border border-[#727272] px-4 py-1 text-xs font-bold text-white hover:border-white hover:scale-105 transition-all"
                        >Follow</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-white">Charts</h2>
                  <button className="text-sm font-bold text-[#b3b3b3] hover:text-white hover:underline">Show all</button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {weeklyCharts.map(ch => (
                    <div key={ch.id} className="rounded-md overflow-hidden bg-[#181818] hover:bg-[#282828] transition-colors cursor-pointer">
                      <div className="relative h-32 overflow-hidden">
                        <Img src={ch.img} alt={ch.title} className="w-full h-full brightness-50" />
                        <div className="absolute inset-0 flex items-end p-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: ch.accent }}>
                              {ch.sub.split(" ")[0]} Charts
                            </div>
                            <div className="text-xl font-black text-white">{ch.title}</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="text-xs text-[#b3b3b3]">{ch.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 pt-8">
                <div className="grid grid-cols-4 gap-8">
                  {[
                    { heading: "Company",      items: ["About", "Jobs", "For the Record"] },
                    { heading: "Communities",  items: ["For Artists", "Developers", "Advertising", "Investors", "Vendors"] },
                    { heading: "Useful links", items: ["Support", "Free Mobile App", "Popular by Country", "Import your music"] },
                    { heading: "Wavr Plans",   items: ["Premium Individual", "Premium Duo", "Premium Student"] },
                  ].map(col => (
                    <div key={col.heading}>
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-white">{col.heading}</div>
                      {col.items.map(item => (
                        <div key={item} className="mb-2 text-sm text-[#b3b3b3] hover:text-white cursor-pointer">{item}</div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-xs text-[#6a6a6a]">© 2026 Wavr AB</div>
              </div>
            </div>

          ) : (

            /* ── ALBUM VIEW ── */
            <div className="px-6 pb-8">
              {/* Featured banner */}
              <div ref={bannerRef} className="mb-5 overflow-hidden rounded-lg relative h-[152px] bg-[#181818] border border-white/5">
                {/* Slides — stacked, fade between them */}
                {featuredSlides.map((s, i) => (
                  <div
                    key={s.target}
                    className={cx(
                      "absolute inset-0 transition-opacity duration-700",
                      i === slideIndex ? "opacity-100" : "opacity-0 pointer-events-none",
                    )}
                  >
                    <Img src={s.img} alt={s.title} className="absolute inset-0 w-full h-full brightness-[0.42]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
                    <div className="absolute inset-0 flex items-center px-5 py-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-20 w-20 flex-shrink-0 rounded-md overflow-hidden shadow-xl bg-[#282828]">
                          <Img src={s.artistImg} alt={s.title} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1.5"
                            style={{ backgroundColor: s.accent, color: s.accent === "#1db954" ? "black" : "white" }}>
                            {s.label}
                          </span>
                          <div className="text-2xl font-extrabold text-white leading-tight truncate">{s.title}</div>
                          <div className="text-sm text-[#b3b3b3] mt-0.5 truncate">{s.sub}</div>
                        </div>
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                          <button
                            data-igg-id={s.target}
                            data-igg-type={s.target.includes("brixton") ? "auto_transition" : undefined}
                            data-igg-wait-ms={s.target.includes("brixton") ? "3600" : undefined}
                            className="rounded-full px-4 py-2 text-xs font-bold hover:scale-105 transition-all shadow-lg"
                            style={{ backgroundColor: s.accent === "#1db954" ? "#1db954" : "white", color: s.accent === "#1db954" ? "black" : "black" }}
                          >{s.cta}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Dot nav — always on top */}
                <div className="absolute bottom-3 right-5 flex gap-1.5 z-10">
                  {featuredSlides.map((s, i) => (
                    <button key={s.target} data-igg-id={`wavr.featured.dot-${i + 1}`} onClick={e => { e.stopPropagation(); selectFeaturedSlide(i); }}
                      className={cx("h-1.5 rounded-full transition-all duration-300", slideIndex === i ? "w-5 bg-white" : "w-1.5 bg-white/40")} />
                  ))}
                </div>
              </div>

              {/* Playlist header */}
              <div className="mb-6 flex items-end gap-6 rounded-xl bg-gradient-to-b from-indigo-900/60 to-transparent px-6 pt-6 pb-5">
                <div className="h-36 w-36 flex-shrink-0 rounded-md overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-800">
                  <Img src={P("album-main",300,300)} alt="Liked Songs" className="w-full h-full" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-[#b3b3b3] tracking-wider mb-1">Playlist</div>
                  <h1 className="text-5xl font-extrabold text-white mb-2">Liked Songs</h1>
                  <div className="flex items-center gap-1.5 text-sm text-[#b3b3b3]">
                    <div className="h-5 w-5 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-700">
                      <Img src={AV(50)} alt="You" className="w-full h-full" />
                    </div>
                    <span className="font-bold text-white">You</span>
                    <span>·</span>
                    <span>214 songs</span>
                    <span>·</span>
                    <span>13 hr 42 min</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mb-6 flex items-center gap-5">
                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1db954] text-black hover:scale-105 transition-transform shadow-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </button>
                <button className="text-[#b3b3b3] hover:text-white"><Icon name="shuffle" /></button>
                <button className="text-[#b3b3b3] hover:text-white"><Icon name="plus" /></button>
                <button className="text-[#b3b3b3] hover:text-white"><Icon name="more" /></button>
              </div>

              {/* Track table */}
              <div className="mx-auto w-full max-w-[920px]">
                <div className="grid grid-cols-[32px_1fr_160px_120px_72px_64px] items-center gap-4 border-b border-white/10 px-4 pb-2 text-xs font-medium uppercase tracking-wider text-[#6a6a6a]">
                  <div className="text-center">#</div>
                  <div>Title</div>
                  <div>Album</div>
                  <div>Date added</div>
                  <div className="text-right">⏱</div>
                  <div aria-hidden="true" />
                </div>

                {tracks.map((track, idx) => {
                  const isTrackMenuOpen = activeTrackMenuSlug === track.slug;
                  return (
                    <div
                      key={track.slug}
                      data-igg-id={`wavr.track.${track.slug}.row`}
                      className={cx(
                        "group grid grid-cols-[32px_1fr_160px_120px_72px_64px] items-center gap-4 rounded-md px-4 py-3 hover:bg-white/10 transition-colors",
                        idx === 1 && !uiState.floatingPlayerOpen && "bg-white/5",
                      )}
                    >
                      <div className="text-center">
                        <span className={cx("text-sm text-[#6a6a6a]", idx === 1 && !uiState.floatingPlayerOpen && "text-[#1db954]")}>{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-[#282828]">
                          <Img src={track.img} alt={track.title} className="w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <div data-igg-id={`wavr.track.${track.slug}.title`} className={cx("text-sm font-medium truncate", idx === 1 && !uiState.floatingPlayerOpen ? "text-[#1db954]" : "text-white")}>{track.title}</div>
                          <div data-igg-id={`wavr.track.${track.slug}.artist`} className="text-xs text-[#b3b3b3] truncate">{track.artist}</div>
                        </div>
                      </div>
                      <div data-igg-id={`wavr.track.${track.slug}.album`} className="text-sm text-[#b3b3b3] truncate hover:text-white hover:underline cursor-pointer">{track.album}</div>
                      <div className="text-sm text-[#b3b3b3]">{track.date}</div>
                      <div className="text-sm text-[#b3b3b3] text-right tabular-nums">{track.duration}</div>
                      <div className="flex items-center justify-end gap-1.5">
                        {idx < 10 && (
                          <button
                            data-igg-id={`wavr.track.${track.slug}.like`}
                            data-igg-type="hover_reveal"
                            data-igg-prereq={`wavr.track.${track.slug}.row`}
                            data-igg-label={`Save ${track.title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[#b3b3b3] opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                          >
                            <Icon name="heart" />
                          </button>
                        )}
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button
                            data-igg-id={`wavr.track.${track.slug}.more`}
                            data-igg-type="menu_reveal"
                            data-igg-label={`More options for ${track.title}`}
                            onClick={(e) => { e.stopPropagation(); setActiveTrackMenuSlug(isTrackMenuOpen ? null : track.slug); }}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[#b3b3b3] opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                          >
                            <Icon name="more" />
                          </button>
                          {isTrackMenuOpen && (
                            <Dropdown open className="right-0 top-7 w-52">
                              <MenuItem id="wavr.track.more.add-queue"    type="menu_reveal" prereq={`wavr.track.${track.slug}.more`}><Icon name="queue" />  Add to queue</MenuItem>
                              <MenuItem id="wavr.track.more.add-playlist" type="menu_reveal" prereq={`wavr.track.${track.slug}.more`}><Icon name="plus" />   Add to playlist</MenuItem>
                              <MenuItem id="wavr.track.more.go-artist"    type="menu_reveal" prereq={`wavr.track.${track.slug}.more`}><Icon name="artist" /> Go to artist</MenuItem>
                              <MenuItem id="wavr.track.more.share"        type="menu_reveal" prereq={`wavr.track.${track.slug}.more`}><Icon name="more" />   Share</MenuItem>
                            </Dropdown>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fans also like */}
              <div ref={artistsRef} className="mx-auto mt-10 w-full max-w-[920px]">
                <h2 className="mb-4 text-2xl font-extrabold text-white">Fans also like</h2>
                <div className="grid grid-cols-4 gap-4">
                  {relatedArtists.map(a => (
                    <div key={a.slug} className="rounded-lg bg-[#181818] p-4 hover:bg-[#282828] transition-colors">
                      <div className="mx-auto mb-3 h-16 w-16 rounded-full overflow-hidden bg-[#333]">
                        <Img src={a.img} alt={a.name} className="w-full h-full" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white truncate">{a.name}</div>
                        <div className="mt-0.5 text-xs text-[#b3b3b3] truncate">{a.genre}</div>
                      </div>
                      <div className="mt-3 flex justify-center">
                        <button
                          data-igg-id={`wavr.artist.${a.slug}.follow`}
                          data-igg-type="off_screen"
                          data-igg-label={`Follow ${a.name}`}
                          className="rounded-full border border-[#727272] px-4 py-1 text-xs font-bold text-white hover:border-white hover:scale-105 transition-all"
                        >Follow</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Fixed player bar (hidden when floating player is active) ── */}
      <div className={cx("fixed bottom-0 left-0 right-0 z-50 h-[72px] border-t border-white/10 bg-[#0a0a0a] flex justify-center px-4", uiState.floatingPlayerOpen && "hidden")}>
        <div className="grid w-full max-w-[980px] items-center gap-3" style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(320px,1fr) minmax(180px,auto)" }}>
        {/* Left — track info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-11 w-11 flex-shrink-0 rounded overflow-hidden bg-[#282828]">
            <Img src={P(12,88,88)} alt="Glass Rooms" className="w-full h-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">Glass Rooms</div>
            <div className="text-xs text-[#b3b3b3] truncate hover:underline hover:text-white cursor-pointer">Lena Shore</div>
          </div>
          <span className="text-[10px] text-[#6a6a6a] flex-shrink-0 tabular-nums">3:42</span>
        </div>

        {/* Center — playback controls */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              data-igg-id="wavr.player.shuffle"
              data-igg-type="hover_reveal"
              data-igg-label="Enable shuffle"
              className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="shuffle" />
              <TooltipLabel>Enable shuffle</TooltipLabel>
            </button>
            <button
              data-igg-id="wavr.player.previous"
              data-igg-type="hover_reveal"
              data-igg-label="Previous"
              className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="skip-back" />
              <TooltipLabel>Previous</TooltipLabel>
            </button>
            <button
              data-igg-id="wavr.player.play-pause"
              data-igg-type="async_wait"
              data-igg-label="Play / Pause"
              onClick={() => asyncReady && setPlaying(p => !p)}
              aria-disabled={!asyncReady ? "true" : undefined}
              className={cx(
                "flex h-8 w-8 items-center justify-center rounded-full text-black transition-all",
                asyncReady ? "bg-white hover:scale-105 hover:bg-white" : "cursor-wait bg-white/40",
              )}
            >
              {!asyncReady ? <Icon name="loader" /> : playing ? <Icon name="pause" /> : <Icon name="play" />}
            </button>
            <button
              data-igg-id="wavr.player.next"
              data-igg-type="hover_reveal"
              data-igg-label="Next"
              className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="skip-forward" />
              <TooltipLabel>Next</TooltipLabel>
            </button>
            <button
              data-igg-id="wavr.player.repeat"
              data-igg-type="hover_reveal"
              data-igg-label="Enable repeat"
              className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="repeat" />
              <TooltipLabel>Enable repeat</TooltipLabel>
            </button>
          </div>
          <div className="flex w-full max-w-[320px] items-center gap-2">
            <span className="text-[10px] text-[#6a6a6a] w-8 text-right tabular-nums">1:24</span>
            <div
              data-igg-id="wavr.player.progress"
              data-igg-type="hover_reveal"
              data-igg-label="Seek"
              className="group/player-tip relative flex-1 h-1 rounded-full bg-white/20 cursor-pointer group/prog"
            >
              <div className="h-full w-[35%] rounded-full bg-white group-hover/prog:bg-[#1db954] transition-colors" />
              <div className="absolute top-1/2 left-[35%] -translate-y-1/2 h-3 w-3 rounded-full bg-white scale-0 group-hover/prog:scale-100 transition-transform -ml-1.5" />
              <TooltipLabel>Seek</TooltipLabel>
            </div>
          </div>
        </div>

        {/* Right — volume & extras */}
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button data-igg-id="wavr.player.crossfade" data-igg-type="hover_reveal" data-igg-label="Crossfade"
            className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white transition-colors">
            <Icon name="crossfade" />
            <TooltipLabel>Crossfade</TooltipLabel>
          </button>
          <button data-igg-id="wavr.player.normalize" data-igg-type="hover_reveal" data-igg-label="Normalize volume"
            className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white transition-colors">
            <Icon name="normalize" />
            <TooltipLabel>Normalize volume</TooltipLabel>
          </button>
          <button data-igg-id="wavr.player.queue" data-igg-type="hover_reveal" data-igg-label="Queue"
            className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white transition-colors">
            <Icon name="queue" />
            <TooltipLabel>Queue</TooltipLabel>
          </button>
          <button data-igg-id="wavr.player.device" data-igg-type="hover_reveal" data-igg-label="Connect to a device"
            onClick={() => setDeviceDialogOpen(true)}
            className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white transition-colors">
            <Icon name="device" />
            <TooltipLabel>Connect to a device</TooltipLabel>
          </button>
          <div data-igg-id="wavr.player.volume" data-igg-type="hover_reveal" data-igg-label="Volume"
            className="group/player-tip relative flex h-8 items-center gap-1.5 rounded-full px-1.5 text-[#b3b3b3] hover:text-white cursor-pointer group/vol">
            <Icon name="volume" />
            <div className="relative h-1 w-14 rounded-full bg-white/20 group-hover/vol:bg-white/30">
              <div className="h-full w-[70%] rounded-full bg-white group-hover/vol:bg-[#1db954] transition-colors" />
            </div>
            <TooltipLabel>Volume</TooltipLabel>
          </div>
          <button
            data-igg-id="wavr.player.save-current"
            data-igg-type="hover_reveal"
            data-igg-label="Saved to Liked Songs"
            className="group/player-tip relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#1db954] transition-transform hover:scale-110 hover:bg-white/10"
          >
            <Icon name="heart-fill" />
            <TooltipLabel align="center">Saved to Liked Songs</TooltipLabel>
          </button>
          <div className="relative">
            <button
              data-igg-id="wavr.player.more.button"
              data-igg-type="hover_reveal"
              data-igg-label="More"
              onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === "player-more" ? null : "player-more"); }}
              className="group/player-tip relative flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:bg-white/10 hover:text-white transition-colors"
            >
              <Icon name="more" />
              <TooltipLabel align="right">More</TooltipLabel>
            </button>
            <Dropdown open={activeMenu === "player-more"} className="bottom-8 right-0 w-48">
              <MenuItem id="wavr.player.more.go-radio" type="menu_reveal" prereq="wavr.player.more.button"><Icon name="radio" /> Go to song radio</MenuItem>
            </Dropdown>
          </div>
        </div>
        </div>
      </div>

      {/* ── Cookie banner ── */}
      {uiState.view === "home" && !cookieDismissed && (
        <div className="fixed bottom-[76px] left-0 right-0 z-40 border-t border-white/10 bg-[#282828] px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <p className="text-sm text-[#b3b3b3] leading-relaxed">
              We and <span className="underline cursor-pointer text-white">our partners</span> use cookies to personalize your experience, to show you ads based on your interests, and for measurement and analytics purposes. By using our website and services, you agree to our use of cookies as described in our{" "}
              <span className="underline cursor-pointer text-white">Cookie Policy.</span>
            </p>
            <button
              data-igg-id="wavr.cookie.dismiss"
              onClick={() => setCookieDismissed(true)}
              className="flex-shrink-0 rounded-full border border-[#727272] px-6 py-2 text-sm font-bold text-white hover:border-white hover:scale-105 transition-all"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      )}

      {uiState.asyncNoticeKind && asyncReady && (
        <AsyncNotice notice={asyncNotices[uiState.asyncNoticeKind]} />
      )}

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 pt-16 px-4">
          <div className="mx-auto w-[600px] overflow-hidden rounded-xl bg-[#282828] shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Icon name="search" />
              <input data-igg-id="wavr.search.input" className="flex-1 bg-transparent text-base text-white outline-none placeholder-[#6a6a6a]" placeholder="What do you want to listen to?" autoFocus />
              <button data-igg-id="wavr.search.close" onClick={() => setSearchOpen(false)} className="text-[#b3b3b3] hover:text-white"><Icon name="x" /></button>
            </div>
            <div className="p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#6a6a6a] mb-2">Recent searches</div>
              {["Neon Drift", "Lena Shore", "The Pale Route", "ambient focus"].map(q => (
                <button key={q} className="flex w-full items-center gap-3 py-2 text-sm text-[#b3b3b3] hover:text-white"><Icon name="search" />{q}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Device picker dialog (popup_occlusion) ── */}
      {deviceDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[440px] rounded-2xl bg-[#282828] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Connect a device</h2>
                <p className="mt-1 text-sm text-[#b3b3b3]">Play Wavr on your speakers, TV, or other devices.</p>
              </div>
              <button data-igg-id="wavr.popup.dismiss" onClick={() => setDeviceDialogOpen(false)} className="rounded-full p-1.5 hover:bg-white/10 text-[#b3b3b3]"><Icon name="x" /></button>
            </div>
            <div className="space-y-2">
              {[
                { name: "This browser",        sub: "Currently playing",              active: true },
                { name: "Living Room Speaker", sub: "Wavr Connect · Ready" },
                { name: "MacBook Pro",          sub: "Wavr desktop app" },
                { name: "iPhone",               sub: "Wavr mobile · Last active 2h ago" },
              ].map(d => (
                <div key={d.name} className={cx("flex items-center gap-4 rounded-xl px-4 py-3 cursor-pointer hover:bg-white/10", d.active && "bg-white/10")}>
                  <div className={cx("flex h-10 w-10 items-center justify-center rounded-full", d.active ? "bg-[#1db954]" : "bg-white/20")}>
                    <Icon name="device" />
                  </div>
                  <div>
                    <div className={cx("text-sm font-semibold", d.active ? "text-[#1db954]" : "text-white")}>{d.name}</div>
                    <div className="text-xs text-[#b3b3b3]">{d.sub}</div>
                  </div>
                  {d.active && <div className="ml-auto"><Icon name="check" /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating player (drag_occlusion, state 16) ── */}
      {uiState.floatingPlayerOpen && (
        <div
          data-igg-id="wavr.drag.player"
          onMouseDown={floatingPanel.onMouseDown}
          className="fixed z-40 w-[420px] cursor-grab rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden select-none active:cursor-grabbing"
          style={{ left: floatingPanel.pos.x, top: floatingPanel.pos.y }}
        >
          {/* Drag handle */}
          <div
            className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2.5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#b3b3b3]">
              <Icon name="drag" /> Mini Player
            </div>
            <span className="text-[10px] text-[#6a6a6a]">Drag to move</span>
          </div>

          {/* Now playing */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-[#282828] shadow-lg">
                <Img src={floatingNowPlaying.img} alt={floatingNowPlaying.title} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{floatingNowPlaying.title}</div>
                <div className="text-xs text-[#b3b3b3] truncate">{floatingNowPlaying.artist} · {floatingNowPlaying.album}</div>
              </div>
              <button className="text-[#1db954] hover:scale-110 transition-transform flex-shrink-0 p-1">
                <Icon name="heart-fill" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-[#6a6a6a] tabular-nums w-7 text-right">{floatingNowPlaying.elapsed}</span>
              <div className="flex-1 h-1 rounded-full bg-white/20 cursor-pointer group/prog">
                <div className="h-full w-[30%] rounded-full bg-[#1db954]" />
              </div>
              <span className="text-[10px] text-[#6a6a6a] tabular-nums w-7">{floatingNowPlaying.duration}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-1 mb-3">
              <button data-igg-id="wavr.player.shuffle"    className="text-[#b3b3b3] hover:text-white transition-colors p-1"><Icon name="shuffle" /></button>
              <button data-igg-id="wavr.player.previous"   className="text-[#b3b3b3] hover:text-white transition-colors p-1"><Icon name="skip-back" /></button>
              <button data-igg-id="wavr.player.play-pause" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg">
                <Icon name="play" />
              </button>
              <button data-igg-id="wavr.player.next"       className="text-[#b3b3b3] hover:text-white transition-colors p-1"><Icon name="skip-forward" /></button>
              <button data-igg-id="wavr.player.repeat"     className="text-[#b3b3b3] hover:text-white transition-colors p-1"><Icon name="repeat" /></button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className="text-[#6a6a6a]"><Icon name="volume" /></span>
              <div className="flex-1 h-1 rounded-full bg-white/20">
                <div className="h-full w-[70%] rounded-full bg-white/60" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mx-4" />

          {/* Up next queue */}
          <div className="px-4 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6a6a6a] mb-2">Up next</div>
            <div className="space-y-0.5 max-h-[210px] overflow-y-auto pr-1">
              {floatingQueueItems.map((q) => (
                <div key={q.title} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="h-8 w-8 flex-shrink-0 rounded overflow-hidden bg-[#282828]">
                    <Img src={q.img} alt={q.title} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate text-white">{q.title}</div>
                    <div className="text-[10px] text-[#6a6a6a] truncate">{q.artist}</div>
                  </div>
                  <button
                    data-igg-id={`wavr.queue.${q.slug}.more`}
                    data-igg-type="menu_reveal"
                    onClick={e => { e.stopPropagation(); setActiveQueueMenuSlug(activeQueueMenuSlug === q.slug ? null : q.slug); }}
                    className="text-[#6a6a6a] hover:text-white flex-shrink-0 p-0.5"
                  >
                    <Icon name="more" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Queue panel (drag_occlusion) ── */}
      {uiState.queuePanelOpen && (
        <div
          data-igg-id="wavr.drag.blocker"
          onMouseDown={panel.onMouseDown}
          className="fixed z-40 w-[430px] cursor-grab rounded-xl border border-white/10 bg-[#121212] shadow-2xl active:cursor-grabbing overflow-hidden"
          style={{ left: panel.pos.x, top: panel.pos.y }}
        >
          <div className="flex items-center justify-between bg-[#282828] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white"><Icon name="drag" /> Queue</div>
            <span className="text-xs text-[#6a6a6a]">Drag to move</span>
          </div>
          <div className="px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6a6a6a] mb-2">Now playing</div>
            <div className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5">
              <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-[#282828]">
                <Img src={P(12,80,80)} alt="Glass Rooms" className="w-full h-full" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#1db954]">Glass Rooms</div>
                <div className="text-xs text-[#b3b3b3]">Lena Shore</div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6a6a6a] mb-2">Next in queue</div>
            <div className="space-y-1">
              {queueItems.map(q => (
                <div key={q.title} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10 transition-colors">
                  <div className="h-9 w-9 flex-shrink-0 rounded overflow-hidden bg-[#282828]">
                    <Img src={q.img} alt={q.title} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{q.title}</div>
                    <div className="text-xs text-[#b3b3b3] truncate">{q.artist}</div>
                  </div>
                  <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      data-igg-id={`wavr.queue.${q.slug}.more`}
                      data-igg-type="menu_reveal"
                      onClick={e => { e.stopPropagation(); setActiveQueueMenuSlug(activeQueueMenuSlug === q.slug ? null : q.slug); }}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[#6a6a6a] hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Icon name="more" />
                    </button>
                    {activeQueueMenuSlug === q.slug && (
                      <Dropdown open className="right-0 bottom-6 w-44">
                        <MenuItem id="wavr.queue.more.go-artist" type="menu_reveal" prereq={`wavr.queue.${q.slug}.more`}><Icon name="artist" /> Go to artist</MenuItem>
                        <MenuItem id="wavr.queue.more.remove"    type="menu_reveal" prereq={`wavr.queue.${q.slug}.more`}><Icon name="x" />     Remove from queue</MenuItem>
                      </Dropdown>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WavrPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#121212]" />}>
      <WavrApp />
    </Suspense>
  );
}
