"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useEffect, useRef, useState, type CSSProperties } from "react";
import { FILTERS, RECENT_SEARCHES, SHORTS, SIDEBAR_CHANNELS, VIDEOS, type FilterType, type Short, type Video } from "./youtube-data";
import { getYouTubeBenchmarkState } from "./youtube-states";
import { createReviewRuntime } from "../../../lib/review-runtime";

function reviewClass(id: string | undefined, target: string) {
  return id && id === target
    ? "outline outline-[3px] outline-[#ff7a00] outline-offset-4 ring-4 ring-[#ffb36b]/50"
    : "";
}

function buildQueryString(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const review = searchParams.get("review");
  const target = searchParams.get("target");
  if (review) params.set("review", review);
  if (target) params.set("target", target);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
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
  if (element.hasAttribute("data-igg-id")) return element;
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
  runtimeStateKey: "__YOUTUBE_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  resolveActionElement: resolveInteractiveReviewElement,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getThumbnailStyle(video: Video, overlay: string): CSSProperties {
  return getImageBackgroundStyle(video.thumbnailUrl, video.thumbnailPosition, overlay);
}

function getShortStyle(short: Short, overlay: string): CSSProperties {
  return getImageBackgroundStyle(short.thumbnailUrl, short.thumbnailPosition, overlay);
}

function getImageBackgroundStyle(imageUrl: string, position: string | undefined, overlay?: string): CSSProperties {
  return {
    backgroundImage: overlay ? `${overlay}, url("${imageUrl}")` : `url("${imageUrl}")`,
    backgroundPosition: position ?? "center",
    backgroundSize: "cover",
  };
}

function getAvatarStyle(imageUrl: string, position?: string): CSSProperties {
  return getImageBackgroundStyle(imageUrl, position);
}

const AVATAR_IDS_BY_IDENTITY: Record<string, number> = {
  ellaresearchlab: 5,
  mockuistudio: 8,
  groundingarena: 11,
  agentrecoverylab: 14,
  homeloop: 17,
  jupli: 20,
  nightcraft: 23,
  loopstationkr: 26,
  daydreamworks: 29,
  benchflow: 32,
  soyeon: 1,
  hyemi: 2,
  minjoon: 3,
  hyejin: 4,
  dohyunedit: 6,
  pixelmomo: 7,
  chaevlog: 9,
  juniverse: 10,
  uinari: 12,
  minkee: 13,
  soraarchive: 15,
  taeholab: 16,
  rinaday: 18,
  cloudframe: 19,
  yeonarchive: 21,
  wooriui: 22,
  jae: 24,
  anna: 25,
  daisy: 27,
  researchbot: 28,
  ella: 30,
  jiwoo: 31,
  nara: 33,
  noah: 34,
  yuna: 35,
  alice: 36,
  mira: 37,
  hyun: 38,
  suji: 39,
  melo: 40,
  riku: 41,
};

function normalizeIdentity(identity: string) {
  return identity.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "");
}

function getStableAvatarUrl(identity: string, size = 160) {
  const key = normalizeIdentity(identity);
  const id = AVATAR_IDS_BY_IDENTITY[key] ?? (([...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 29) + 42);
  return `https://i.pravatar.cc/${size}?img=${id}`;
}

function AccountAvatar({ sizeClass = "h-8 w-8" }: { sizeClass?: string }) {
  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full bg-white/10 ring-1 ring-white/10`}
      style={getAvatarStyle(getStableAvatarUrl("ellaresearchlab"))}
      aria-label="Current account avatar"
    />
  );
}

function YouTubeLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-[#6d28d9] px-2 py-1 text-sm font-black text-white">▶</div>
      <div className="text-[28px] font-black tracking-tight text-white">Viewtube</div>
      <div className="text-[11px] text-zinc-500">KR</div>
    </div>
  );
}

const VIDEO_MENU_ITEMS = [
  "Add to current playlist",
  "Save to Watch Later",
  "Save to playlist",
  "Download",
  "Share",
  "Not interested",
  "Don't recommend this channel",
  "Report",
];

const PLAYBACK_SPEED_OPTIONS = ["0.25", "0.5", "0.75", "1", "1.25", "1.5", "2"] as const;
const QUALITY_OPTIONS = ["Auto (1080p)", "1080p", "720p", "480p", "360p"] as const;
type PlayerSettingsView = "root" | "speed" | "quality";

const HOME_PROMO_BANNERS = [
  {
    eyebrow: "Sponsored",
    title: "Summer Flight Deals Now Open",
    description: "Book popular vacation routes now and get an instant discount.",
    cta: "View Now",
    shellClass: "border-[#ffb347]/25 bg-[#18120d]",
    eyebrowClass: "text-[#ffb347]",
    buttonClass: "bg-[#ffb347] text-black hover:bg-[#ffc46a]",
    imageUrl: "https://images.unsplash.com/photo-1692029861107-991b13db6ad0?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    backgroundPosition: "center 44%",
  },
  {
    eyebrow: "Sponsored",
    title: "Weekend Hotel Coupon — Today Only",
    description: "Get discount coupons for popular city hotels and resorts before today ends.",
    cta: "Get Coupon",
    shellClass: "border-[#7dd3fc]/25 bg-[#071823]",
    eyebrowClass: "text-[#7dd3fc]",
    buttonClass: "bg-[#7dd3fc] text-black hover:bg-[#a5e5ff]",
    imageUrl: "https://images.unsplash.com/photo-1668260592478-a6513b0a690e?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    backgroundPosition: "center 58%",
  },
  {
    eyebrow: "Sponsored",
    title: "Weekend Rental Car Deal — Last Chance",
    description: "Limited to Jeju and Busan for 48 hours only.",
    cta: "Browse Cars",
    shellClass: "border-[#c4b5fd]/25 bg-[#170d25]",
    eyebrowClass: "text-[#c4b5fd]",
    buttonClass: "bg-[#c4b5fd] text-black hover:bg-[#ddd6fe]",
    imageUrl: "https://images.unsplash.com/photo-1676276549694-a2e34840037a?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    backgroundPosition: "center 48%",
  },
] as const;

const WATCH_PROMO_BANNERS = [
  {
    eyebrow: "Sponsored",
    title: "Focus Timer App — 1 Month Free Premium",
    description: "Track work sessions and focus reports free for one month.",
    cta: "Try Free",
    shellClass: "border-[#8ab4ff]/20 bg-[#111827]",
    eyebrowClass: "text-[#8ab4ff]",
    buttonClass: "bg-[#8ab4ff] text-black hover:bg-[#a9c8ff]",
    imageUrl: "https://images.unsplash.com/photo-1751200065697-4461cc2b43cb?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    backgroundPosition: "center 56%",
  },
  {
    eyebrow: "Sponsored",
    title: "Sleep Sound App — New User Discount",
    description: "Start with white noise and sleep timer at a discounted price.",
    cta: "Get Discount",
    shellClass: "border-[#86efac]/20 bg-[#0b1a12]",
    eyebrowClass: "text-[#86efac]",
    buttonClass: "bg-[#86efac] text-black hover:bg-[#a7f3c2]",
    imageUrl: "https://images.unsplash.com/photo-1668260592478-a6513b0a690e?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    backgroundPosition: "center 58%",
  },
  {
    eyebrow: "Sponsored",
    title: "Meditation App — 40% Off Annual Plan",
    description: "Manage everything from short breathing sessions to bedtime routines in one place.",
    cta: "View Plan",
    shellClass: "border-[#f9a8d4]/20 bg-[#22111c]",
    eyebrowClass: "text-[#f9a8d4]",
    buttonClass: "bg-[#f9a8d4] text-black hover:bg-[#fbcfe8]",
    imageUrl: "https://images.unsplash.com/photo-1758272422576-aed8fde4cc55?auto=format&fit=crop&fm=jpg&q=82&w=1400",
    backgroundPosition: "center 50%",
  },
] as const;

const HOME_FILTER_IDS: Partial<Record<FilterType, string>> = {
  Music: "youtube.filter.music",
  Live: "youtube.filter.live",
  "Recently uploaded": "youtube.filter.recent",
};

const HOME_VIDEO_IDS: Partial<Record<string, string>> = {
  v1: "youtube.home.night-shift-ui-notes",
  v2: "youtube.home.midroll-vlog",
  v3: "youtube.home.desk-setup",
  v4: "youtube.home.weekend-editing",
  v5: "youtube.home.kitchen-reset",
  v6: "youtube.home.rainy-playlist",
  v7: "youtube.home.cafe-sound-mix",
  v8: "youtube.home.tokyo-night-walk",
  v9: "youtube.home.plant-care",
  v10: "youtube.home.camera-bag",
  v11: "youtube.home.budget-meal-prep",
  v12: "youtube.home.calm-morning-yoga",
};

const WATCH_RELATED_VIDEO_IDS: Partial<Record<string, string>> = {
  v4: "youtube.upnext.weekend-editing",
};

const SIDEBAR_NAV_IDS: Partial<Record<string, string>> = {
  Home: "youtube.sidebar.home",
  Shorts: "youtube.sidebar.shorts",
  Subscriptions: "youtube.sidebar.subscriptions",
};

function VideoCard({ video, menuOpenId, onMenuToggle }: {
  video: Video;
  menuOpenId: string | null;
  onMenuToggle: (id: string) => void;
}) {
  const menuOpen = menuOpenId === video.id;
  const cardId = HOME_VIDEO_IDS[video.id];
  const menuButtonId = cardId ? `${cardId}.menu` : undefined;

  return (
    <div
      className="group relative w-full cursor-default rounded-2xl p-2 transition hover:bg-white/[0.05]"
      data-igg-id={cardId}
    >
      <div
        className={`relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br ${video.theme}`}
        style={getThumbnailStyle(video, "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.36))")}
      >
        <div className="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white">
          {video.durationLabel}
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        <div
          className="h-9 w-9 shrink-0 rounded-full bg-white/10 ring-1 ring-white/10"
          style={getAvatarStyle(getStableAvatarUrl(video.handle), video.avatarPosition)}
          aria-label={`${video.channel} avatar`}
        />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[16px] font-semibold text-white" data-igg-id={video.id === "v5" ? "youtube.home.kitchen-reset.title" : video.id === "v1" ? "youtube.home.night-shift-ui-notes.title" : undefined}>{video.title}</div>
          <div className="mt-1 text-sm text-zinc-400" data-igg-id={video.id === "v1" ? "youtube.home.night-shift-ui-notes.channel" : undefined}>{video.channel}</div>
          <div className="text-sm text-zinc-500">{video.views} · {video.published}</div>
        </div>
        {/* More menu */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <button
            onClick={() => onMenuToggle(video.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-zinc-500 opacity-70 transition group-hover:opacity-100 group-hover:text-zinc-300 hover:bg-white/10 hover:text-white"
            data-igg-id={menuButtonId}
          >
            <span className="-mt-0.5">⋮</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#212121] py-1.5 shadow-2xl">
              {VIDEO_MENU_ITEMS.map((label) => (
                <button
                  key={label}
                  data-igg-id={
                    cardId === "youtube.home.night-shift-ui-notes" && label === "Save to Watch Later"
                      ? "youtube.home.night-shift-ui-notes.menu.watch-later"
                      : undefined
                  }
                  className="flex w-full items-center justify-start px-4 py-3 text-left text-sm leading-snug text-zinc-200 hover:bg-white/8"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export function YouTubeHomePage({ initialStateId }: { initialStateId?: string }) {
  const searchParams = useSearchParams();
  const reviewMode = searchParams.get("review") === "1";
  const reviewTarget = searchParams.get("target") ?? "";
  const visibleShortsCount = 5;

  const benchmarkState = useMemo(() => getYouTubeBenchmarkState(initialStateId), [initialStateId]);
  const [query, setQuery] = useState(benchmarkState.query);
  const [activeFilter, setActiveFilter] = useState<FilterType>(benchmarkState.activeFilter);
  const [subscriptionsExpanded, setSubscriptionsExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(benchmarkState.searchFocused);
  const [recentSearchOpen, setRecentSearchOpen] = useState(benchmarkState.searchFocused);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suppressNextSearchClickRef = useRef(false);

  useEffect(() => {
    if (benchmarkState.searchFocused) {
      searchInputRef.current?.focus();
      setRecentSearchOpen(true);
    }
  }, [benchmarkState.searchFocused]);

  useEffect(() => {
    if (!recentSearchOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && searchContainerRef.current?.contains(target)) return;
      setRecentSearchOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [recentSearchOpen]);
  const [micHovered, setMicHovered] = useState(false);
  const [queueWidth, setQueueWidth] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openShortMenuId, setOpenShortMenuId] = useState<string | null>(null);
  const [shortMenuPos, setShortMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortsStartIndex, setShortsStartIndex] = useState(0);
  const [homePromoIndex, setHomePromoIndex] = useState(0);
  const [homePromoTimerReset, setHomePromoTimerReset] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  function handleMenuToggle(id: string) {
    setOpenMenuId((prev) => (prev === id ? null : id));
    setOpenShortMenuId(null);
    setShortMenuPos(null);
  }

  function handleShortMenuToggle(id: string, e: React.MouseEvent) {
    if (openShortMenuId === id) {
      setOpenShortMenuId(null);
      setShortMenuPos(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setOpenShortMenuId(id);
      setShortMenuPos({ x: rect.right, y: rect.bottom + 4 });
      setOpenMenuId(null);
    }
  }

  useEffect(() => {
    function handleClick() {
      setOpenMenuId(null);
      setOpenShortMenuId(null);
      setShortMenuPos(null);
    }
    if (openMenuId || openShortMenuId) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenuId, openShortMenuId]);

  useEffect(() => {
    if (benchmarkState.id === "7") setQueueWidth(80);
  }, [benchmarkState.id]);

  useEffect(() => {
    setQuery(benchmarkState.query);
    setActiveFilter(benchmarkState.activeFilter);
    setSearchFocused(benchmarkState.searchFocused);
    setRecentSearchOpen(benchmarkState.searchFocused);

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: typeof benchmarkState.initialScrollY === "number" ? benchmarkState.initialScrollY : 0,
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [benchmarkState.activeFilter, benchmarkState.initialScrollY, benchmarkState.query, benchmarkState.searchFocused]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __YOUTUBE_BENCHMARK_STATE__?: Record<string, unknown> }).__YOUTUBE_BENCHMARK_STATE__ ?? null;
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
    const timer = window.setInterval(() => {
      setHomePromoIndex((prev) => (prev + 1) % HOME_PROMO_BANNERS.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [homePromoTimerReset]);

  function selectHomePromoIndex(index: number) {
    setHomePromoIndex(index);
    setHomePromoTimerReset((value) => value + 1);
  }

  useEffect(() => {
    if (!benchmarkState.toastNotif) return;
    const timer = window.setTimeout(() => setToastVisible(true), 5000);
    return () => window.clearTimeout(timer);
  }, [benchmarkState.toastNotif]);

  useEffect(() => {
    (window as Window & { __YOUTUBE_BENCHMARK_STATE__?: Record<string, unknown> }).__YOUTUBE_BENCHMARK_STATE__ = {
      stateId: benchmarkState.id,
      viewMode: "home",
      query,
      activeFilter,
      searchFocused,
      recentSearchOpen,
      subscriptionsExpanded,
      shortsStartIndex,
      homePromoIndex,
      scrollY: window.scrollY,
    };
  }, [activeFilter, benchmarkState.id, homePromoIndex, query, recentSearchOpen, searchFocused, shortsStartIndex, subscriptionsExpanded]);

  void reviewTarget;

  const filteredVideos = useMemo(() => {
    return VIDEOS.filter((video) => {
      const matchQuery =
        !query ||
        `${video.title} ${video.channel} ${video.description} ${video.tags.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchFilter =
        activeFilter === "All" ||
        (activeFilter === "Music" && (video.tags.includes("music") || video.tags.includes("playlist"))) ||
        (activeFilter === "Mix" && (video.tags.includes("weekend") || video.tags.includes("workflow"))) ||
        (activeFilter === "Live" && video.tags.includes("studio")) ||
        (activeFilter === "Recently uploaded" && (video.published === "Today" || video.published === "2 days ago")) ||
        (activeFilter === "Watched" && (video.views.includes("K") || video.views.includes("M"))) ||
        (activeFilter === "New for you" && video.tags.includes("design"));
      return matchQuery && matchFilter;
    });
  }, [activeFilter, query]);

  const topVideos = filteredVideos.slice(0, 3);
  const bottomVideos = filteredVideos.slice(3);
  const canShiftShortsLeft = shortsStartIndex > 0;
  const maxShortsStartIndex = Math.max(0, SHORTS.length - visibleShortsCount);
  const canShiftShortsRight = shortsStartIndex < maxShortsStartIndex;
  const shortsTranslate = `translateX(calc(-${shortsStartIndex} * ((100% - 48px) / 5 + 12px)))`;
  const homePromo = HOME_PROMO_BANNERS[homePromoIndex];

  const TOAST_NOTIFS: Record<string, { iggId: string; icon: string; iconBg: string; message: React.ReactNode }> = {
    "subscriber-minjoon": {
      iggId: "youtube.toast.subscriber-minjoon",
      icon: "m",
      iconBg: "bg-violet-700",
      message: <><span className="font-semibold">minjoon_dev</span> subscribed to your channel.</>,
    },
    "comment-ella": {
      iggId: "youtube.toast.comment-ella",
      icon: "E",
      iconBg: "bg-indigo-600",
      message: <><span className="font-semibold">Ella Research Lab</span> commented on your video: &quot;This demo was incredibly clear!&quot;</>,
    },
    "reaction-groundingarena": {
      iggId: "youtube.toast.reaction-groundingarena",
      icon: "G",
      iconBg: "bg-emerald-700",
      message: <><span className="font-semibold">groundingarena</span> liked your comment: &quot;Great breakdown as always&quot;</>,
    },
    "reply-jupli": {
      iggId: "youtube.toast.reply-jupli",
      icon: "J",
      iconBg: "bg-rose-700",
      message: <><span className="font-semibold">jupli</span> replied to your comment: &quot;Totally agree with this!&quot;</>,
    },
    "upload-mockui": {
      iggId: "youtube.toast.upload-mockui",
      icon: "M",
      iconBg: "bg-amber-700",
      message: <><span className="font-semibold">Mock UI Studio</span> uploaded a new video: &quot;Late-night Studio Vlog with an Unexpected Mid-roll&quot;</>,
    },
  };
  const activeToast = benchmarkState.toastNotif ? TOAST_NOTIFS[benchmarkState.toastNotif] : null;

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      {reviewMode && (
        <div className="fixed right-5 top-5 z-[100] rounded-2xl bg-[#111827] px-4 py-3 text-xs font-semibold tracking-[0.08em] text-white shadow-2xl">
          IGG target: {reviewTarget || "none"}
        </div>
      )}

      {activeToast && toastVisible && (
        <button
          data-igg-id={activeToast.iggId}
          onClick={() => setToastVisible(false)}
          className="fixed right-5 top-20 z-[90] flex w-[320px] items-start gap-3 rounded-2xl border border-white/10 bg-[#212121] px-4 py-3 text-left shadow-2xl hover:bg-[#2a2a2a]"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${activeToast.iconBg}`}>{activeToast.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-5 text-zinc-200">{activeToast.message}</p>
            <p className="mt-1 text-xs text-[#3ea6ff]">Just now</p>
          </div>
          <span className="shrink-0 text-zinc-500 hover:text-white text-lg leading-none">×</span>
        </button>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0f0f0f]/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 hover:bg-white/10">
              <span className="block text-[18px] leading-none">☰</span>
            </button>
            <YouTubeLogo />
          </div>
          <div ref={searchContainerRef} className="relative mx-auto flex w-full max-w-[640px] items-center">
            <div className={`flex flex-1 items-center overflow-hidden rounded-l-full border bg-[#121212] px-4 transition ${searchFocused ? "border-[#1c62b9]" : "border-white/15"}`}>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onMouseDown={(e) => {
                  if (recentSearchOpen && !query) {
                    e.preventDefault();
                    suppressNextSearchClickRef.current = true;
                    setRecentSearchOpen(false);
                    setSearchFocused(false);
                    searchInputRef.current?.blur();
                  }
                }}
                onClick={() => {
                  if (suppressNextSearchClickRef.current) {
                    suppressNextSearchClickRef.current = false;
                    return;
                  }
                  if (!query) setRecentSearchOpen(true);
                }}
                onFocus={() => {
                  if (suppressNextSearchClickRef.current) {
                    setSearchFocused(false);
                    window.requestAnimationFrame(() => searchInputRef.current?.blur());
                    return;
                  }
                  setSearchFocused(true);
                  if (!query) setRecentSearchOpen(true);
                }}
                onBlur={() => {
                  setSearchFocused(false);
                }}
                placeholder="Search"
                data-igg-id="youtube.home.search.input"
                className={`h-10 w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 ${recentSearchOpen && !query ? "caret-transparent" : ""}`}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setRecentSearchOpen(true);
                    searchInputRef.current?.focus();
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button data-igg-id="youtube.home.search-trigger" className="flex h-10 items-center justify-center rounded-r-full border border-l-0 border-white/15 bg-[#222] px-5 text-zinc-300 hover:bg-[#2a2a2a]">
              <span className="text-[18px]">⌕</span>
            </button>

            {/* 최근 검색어 드롭다운 */}
            {recentSearchOpen && !query && (
              <div
                className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-2xl border border-white/10 bg-[#212121] py-2 shadow-2xl"
                data-igg-id="youtube.search.recent-panel"
              >
                <div className="mb-1 px-4 pt-1 text-xs font-semibold text-zinc-500">Recent searches</div>
                {RECENT_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(term);
                      setRecentSearchOpen(false);
                    }}
                    data-igg-id={term === "egg rice recipe" ? "youtube.search.recent.egg-rice" : undefined}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/8"
                  >
                    <span className="text-zinc-500">⏱</span>
                    {term}
                  </button>
                ))}
              </div>
            )}

            {/* 마이크 버튼 */}
            <div className="relative ml-3">
              <button
                onMouseEnter={() => setMicHovered(true)}
                onMouseLeave={() => setMicHovered(false)}
                data-igg-id="youtube.home.voice-search"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-zinc-300 transition hover:bg-[#3a3a3a]"
              >
                🎙
              </button>
              {micHovered && (
                <div className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#606060] px-2.5 py-1.5 text-xs text-white shadow-lg">
                  Search by voice
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button data-igg-id="youtube.home.upload" className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10">
              <span>＋</span> Create
            </button>
            {/* 알림 벨 */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                data-igg-id="youtube.home.notifications"
                className="relative rounded-full p-2 hover:bg-white/10"
              >
                <span className="text-[20px]">🔔</span>
                {(
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff0033] text-[10px] font-bold text-white">
                    1
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#212121] shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <button
                      data-igg-id="youtube.home.notifications.mark-all-read"
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="border-t border-white/8">
                    {/* 안 읽은 알림들 */}
                    <button data-igg-id="youtube.home.notif.subscriber-minjoon" className="flex w-full items-start gap-3 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.07]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">m</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-5 text-zinc-200">
                          <span className="font-semibold">minjoon_dev</span> subscribed to your channel.
                        </p>
                        <p className="mt-1 text-xs text-[#3ea6ff]">Just now</p>
                      </div>
                      <div className="h-2 w-2 shrink-0 rounded-full bg-[#3ea6ff] mt-2" />
                    </button>
                    <button data-igg-id="youtube.home.notif.comment-ella" className="flex w-full items-start gap-3 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.07]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">E</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-5 text-zinc-200">
                          <span className="font-semibold">Ella Research Lab</span> commented on your video: <span className="text-white">&quot;This demo was incredibly clear!&quot;</span>
                        </p>
                        <p className="mt-1 text-xs text-[#3ea6ff]">1 hour ago</p>
                      </div>
                      <div className="h-2 w-2 shrink-0 rounded-full bg-[#3ea6ff] mt-2" />
                    </button>
                    <button data-igg-id="youtube.home.notif.reaction-groundingarena" className="flex w-full items-start gap-3 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.07]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">G</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-5 text-zinc-200">
                          <span className="font-semibold">groundingarena</span> liked your comment: <span className="text-white">&quot;Great breakdown as always&quot;</span>
                        </p>
                        <p className="mt-1 text-xs text-[#3ea6ff]">2 hours ago</p>
                      </div>
                      <div className="h-2 w-2 shrink-0 rounded-full bg-[#3ea6ff] mt-2" />
                    </button>
                    <button data-igg-id="youtube.home.notif.ella-video" className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">E</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-5 text-zinc-400">
                          <span className="font-semibold text-zinc-300">Ella Research Lab</span> uploaded a new video: <span>&quot;Night Shift UI Notes and a Clean Editing Flow&quot;</span>
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">5 hours ago</p>
                      </div>
                    </button>
                    {/* 읽은 알림들 */}
                    {[
                      { ch: "Mock UI Studio", initial: "M", color: "bg-amber-700", msg: "Late-night Studio Vlog with an Unexpected Mid-roll", ago: "1 day ago" },
                      { ch: "Home Loop", initial: "H", color: "bg-orange-700", msg: "Kitchen Notes, Egg Rice, and a Tiny Weekend Reset", ago: "3 days ago" },
                    ].map((n) => (
                      <div key={n.ch} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${n.color}`}>{n.initial}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-5 text-zinc-400">
                            <span className="font-semibold text-zinc-300">{n.ch}</span> uploaded a new video: <span>&quot;{n.msg}&quot;</span>
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{n.ago}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <AccountAvatar />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-[220px] shrink-0 flex-col overflow-y-auto border-r border-white/6 py-3 md:flex">
          {/* Nav */}
          <div className="px-3">
            {[
              { icon: "⌂", label: "Home", active: true },
              { icon: "◔", label: "Shorts" },
              { icon: "▣", label: "Subscriptions" },
            ].map(({ icon, label, active }) => (
              <button
                key={label}
                data-igg-id={SIDEBAR_NAV_IDS[label]}
                className={`flex w-full items-center gap-5 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-white/10 font-semibold" : "hover:bg-white/8"}`}
              >
                <span className="text-[20px]">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="my-2 border-t border-white/8" />

          {/* 내 채널 */}
          <div className="px-3">
            <div className="mb-1 px-3 text-xs font-semibold text-zinc-400">My Channel</div>
            {[
              { icon: "⏱", label: "History" },
              { icon: "▶", label: "Playlists" },
              { icon: "🎬", label: "Your videos" },
              { icon: "🕐", label: "Watch Later" },
              { icon: "👍", label: "Liked videos" },
            ].map(({ icon, label }) => (
              <button key={label} data-igg-id={label === "History" ? "youtube.sidebar.history" : undefined} className="flex w-full items-center gap-5 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/8">
                <span className="text-[18px]">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="my-2 border-t border-white/8" />

          {/* 구독 */}
          <div className="px-3">
            <div className="mb-1 flex items-center justify-between px-3">
              <span className="text-xs font-semibold text-zinc-400">Subscriptions</span>
              <span className="text-xs text-zinc-500">›</span>
            </div>
            {(subscriptionsExpanded ? SIDEBAR_CHANNELS : SIDEBAR_CHANNELS.slice(0, 4)).map((ch) => (
              <button
                key={ch.name}
                data-igg-id={ch.name === "NightCraft" ? "youtube.sidebar.subscriptions.nightcraft" : ch.name === "Ella Research Lab" ? "youtube.sidebar.subscriptions.ella" : undefined}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/8"
              >
                <div
                  className={`h-6 w-6 shrink-0 rounded-full ring-1 ring-white/10 ${ch.imageUrl ? "" : `flex items-center justify-center text-[11px] font-bold text-white ${ch.color}`}`}
                  style={getAvatarStyle(getStableAvatarUrl(ch.name, 120))}
                >
                </div>
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
            <button
              onClick={() => setSubscriptionsExpanded((v) => !v)}
              data-igg-id="youtube.sidebar.subscriptions.more"
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/8"
            >
              <span className={`text-[16px] transition-transform duration-200 ${subscriptionsExpanded ? "rotate-180" : ""}`}>⌄</span>
              <span>{subscriptionsExpanded ? "Show less" : `Show ${SIDEBAR_CHANNELS.length - 4} more`}</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <section className="min-w-0 flex-1 px-6 py-4">
          {/* Filter chips */}
          <div className="mb-5 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                data-igg-id={HOME_FILTER_IDS[filter]}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  activeFilter === filter ? "bg-white text-black" : "bg-[#272727] text-white hover:bg-[#353535]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* First video row */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {topVideos.map((video) => (
              <VideoCard key={video.id} video={video} menuOpenId={openMenuId} onMenuToggle={handleMenuToggle} />
            ))}
          </div>

          <div
            className={`relative mt-8 mb-6 overflow-hidden rounded-2xl border ${homePromo.shellClass}`}
            style={getImageBackgroundStyle(homePromo.imageUrl, homePromo.backgroundPosition)}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88),rgba(0,0,0,0.58)_58%,rgba(0,0,0,0.2))]" />
            <div className="relative flex items-center gap-4 px-5 py-4 transition-all duration-500">
              <button
                type="button"
                onClick={() => selectHomePromoIndex((homePromoIndex - 1 + HOME_PROMO_BANNERS.length) % HOME_PROMO_BANNERS.length)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#272727]/90 text-xl text-white shadow-lg transition hover:bg-[#3a3a3a]"
                aria-label="Previous ad"
              >
                ‹
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-5">
                <div className="min-w-0 max-w-[640px]">
                  <div className={`text-[11px] font-black uppercase tracking-[0.18em] ${homePromo.eyebrowClass}`}>{homePromo.eyebrow}</div>
                  <div className="mt-1 text-[17px] font-semibold leading-6 text-white">{homePromo.title}</div>
                  <div className="mt-1 max-w-[58ch] text-sm leading-5 text-zinc-300">{homePromo.description}</div>
                </div>
                <button
                  data-igg-id={
                    homePromo.cta === "Browse Cars" ? "youtube.home.promo.rentalcar-view" :
                    homePromo.cta === "Get Coupon" ? "youtube.home.promo.hotel-coupon" :
                    undefined
                  }
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${homePromo.buttonClass}`}
                >
                  {homePromo.cta}
                </button>
              </div>
              <button
                type="button"
                onClick={() => selectHomePromoIndex((homePromoIndex + 1) % HOME_PROMO_BANNERS.length)}
                data-igg-id="youtube.home.promo.arrow-right"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#272727]/90 text-xl text-white shadow-lg transition hover:bg-[#3a3a3a]"
                aria-label="Next ad"
              >
                ›
              </button>
            </div>
          </div>

          {/* Shorts section */}
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff0033]">
                <span className="text-[13px] font-black text-white">◔</span>
              </div>
              <span className="text-lg font-bold">Shorts</span>
            </div>
            <div className="relative">
              <div className="overflow-hidden pb-2">
                <div
                  className="flex gap-3 transition-transform duration-300 ease-out"
                  style={{ transform: shortsTranslate }}
                >
                  {SHORTS.map((short) => (
                    <div
                      key={short.id}
                      data-igg-id={short.id === "s7" ? "youtube.shorts.cats-top5" : undefined}
                      className="group relative w-[calc((100%-48px)/5)] shrink-0 cursor-default rounded-xl p-1.5 transition hover:bg-white/[0.05]"
                    >
                      <div
                        className={`relative h-[280px] overflow-hidden rounded-xl bg-gradient-to-b ${short.theme}`}
                        style={getShortStyle(short, "linear-gradient(180deg, rgba(0,0,0,0.02) 35%, rgba(0,0,0,0.78) 100%)")}
                      >
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-white">{short.title}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShortMenuToggle(short.id, e); }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-[11px] text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/60"
                        >
                          ⋯
                        </button>
                      </div>
                      <div className="mt-2 px-0.5">
                        <p className="text-[12px] text-zinc-500">{short.views}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {canShiftShortsLeft && (
                <button
                  onClick={() => setShortsStartIndex((prev) => prev - 1)}
                  data-igg-id="youtube.shorts.arrow-left"
                  className="absolute left-3 top-[136px] z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-[#272727]/95 text-xl text-white shadow-xl transition hover:bg-[#3a3a3a]"
                >
                  ‹
                </button>
              )}
              {canShiftShortsRight && (
                <button
                  onClick={() => setShortsStartIndex((prev) => prev + 1)}
                  data-igg-id="youtube.shorts.arrow-right"
                  className="absolute right-3 top-[136px] z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-[#272727]/95 text-xl text-white shadow-xl transition hover:bg-[#3a3a3a]"
                >
                  ›
                </button>
              )}
            </div>
            {/* Shorts 드롭다운: overflow 밖에 fixed로 렌더링 */}
            {openShortMenuId && shortMenuPos && (
              <div
                className="fixed z-[200] w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-[#212121] py-1.5 shadow-2xl"
                style={{ left: shortMenuPos.x - 200, top: shortMenuPos.y }}
              >
                {VIDEO_MENU_ITEMS.map((label) => (
                  <button key={label} className="flex w-full items-center justify-start px-4 py-3 text-left text-sm leading-snug text-zinc-200 hover:bg-white/8">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* More videos */}
          {bottomVideos.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {bottomVideos.map((video) => (
                <VideoCard key={video.id} video={video} menuOpenId={openMenuId} onMenuToggle={handleMenuToggle} />
              ))}
            </div>
          )}

          {/* Extra padding at bottom */}
          <div className="h-16" />
        </section>
      </div>

      {/* Queue panel (drag_occlusion, state 7) */}
      {queueWidth > 0 && (
        <div
          style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: queueWidth, backgroundColor: "#181818", boxShadow: "-4px 0 20px rgba(109,40,217,0.15)", zIndex: 40, display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* drag handle */}
          <div
            style={{ position: "absolute", left: 0, top: 0, width: 6, height: "100%", cursor: "ew-resize", zIndex: 1 }}
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startW = queueWidth;
              const onMove = (mv: MouseEvent) => setQueueWidth(Math.max(60, startW + (startX - mv.clientX)));
              const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          />
          {/* header */}
          <div style={{ padding: "16px 12px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🎵</span>
            {queueWidth >= 200 && <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Queue</span>}
          </div>
          {/* queue items */}
          {queueWidth >= 200 && (
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {[
                { id: "youtube.queue.night-shift-ui-notes", title: "Night Shift UI Notes", channel: "Ella Research Lab", dur: "18:32" },
                { id: "youtube.queue.midroll-vlog", title: "Late-night Studio Vlog", channel: "Mock UI Studio", dur: "24:05" },
                { id: "youtube.queue.kitchen-reset", title: "Kitchen Notes, Egg Rice", channel: "Home Loop", dur: "11:48" },
                { id: "youtube.queue.rainy-playlist", title: "Rainy City Playlist", channel: "JUPLI", dur: "42:10" },
              ].map((item) => (
                <button
                  key={item.id}
                  data-igg-id={item.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  className="hover:bg-white/[0.06]"
                >
                  <div style={{ width: 44, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#6d28d9,#1e1b4b)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{item.dur}</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, lineHeight: "1.3", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{item.title}</div>
                    <div style={{ color: "#aaa", fontSize: 11, marginTop: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{item.channel}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// ─── Watch Page ───────────────────────────────────────────────────────────────

export function YouTubeWatchPage({
  videoId,
  initialStateId,
}: {
  videoId: string;
  initialStateId?: string;
}) {
  const searchParams = useSearchParams();
  const reviewMode = searchParams.get("review") === "1";
  const reviewTarget = searchParams.get("target") ?? "";
  const preservedQuery = buildQueryString(searchParams);

  const video = useMemo(() => VIDEOS.find((v) => v.id === videoId) ?? VIDEOS[0], [videoId]);
  const benchmarkState = useMemo(() => getYouTubeBenchmarkState(initialStateId), [initialStateId]);

  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState(Boolean(benchmarkState.liked[videoId]));
  const [saved, setSaved] = useState(Boolean(benchmarkState.saved[videoId]));
  const [subscribed, setSubscribed] = useState(Boolean(benchmarkState.subscribed[videoId]));
  const [expandedDescription, setExpandedDescription] = useState(benchmarkState.expandedDescription);
  const [sortBy, setSortBy] = useState<"Top comments" | "Newest first">(benchmarkState.sortBy);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(benchmarkState.playing);
  const [playhead, setPlayhead] = useState(benchmarkState.playhead);
  const [adActive, setAdActive] = useState(benchmarkState.adActive);
  const [skipCountdown, setSkipCountdown] = useState(benchmarkState.skipCountdown);
  const [midrollShown, setMidrollShown] = useState(Boolean(benchmarkState.midrollShown[videoId]));
  const [showMoreMenu, setShowMoreMenu] = useState(benchmarkState.showMoreMenu);
  const [showFloatingPromo, setShowFloatingPromo] = useState(benchmarkState.showFloatingPromo);
  const [hoveredInfoTarget, setHoveredInfoTarget] = useState(benchmarkState.hoveredInfoTarget);
  const [theaterHovered, setTheaterHovered] = useState(false);
  const [miniplayerHovered, setMiniplayerHovered] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(benchmarkState.showTranscriptPanel);
  const [showQaPanel, setShowQaPanel] = useState(benchmarkState.showQaPanel);
  const [openReplyThreads, setOpenReplyThreads] = useState<Record<string, boolean>>({});
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [playerSettingsOpen, setPlayerSettingsOpen] = useState(false);
  const [playerSettingsView, setPlayerSettingsView] = useState<PlayerSettingsView>("root");
  const [playbackSpeed, setPlaybackSpeed] = useState<(typeof PLAYBACK_SPEED_OPTIONS)[number]>("1");
  const [videoQuality, setVideoQuality] = useState<(typeof QUALITY_OPTIONS)[number]>("Auto (1080p)");
  const [watchPromoIndex, setWatchPromoIndex] = useState(0);
  const [watchPromoTimerReset, setWatchPromoTimerReset] = useState(0);

  useEffect(() => {
    if (!adActive || skipCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setSkipCountdown((v) => {
        if (v <= 1) { window.clearInterval(timer); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [adActive, skipCountdown]);

  useEffect(() => {
    if (!playing || adActive) return;
    const timer = window.setInterval(() => {
      setPlayhead((v) => {
        const next = v + 1;
        if (video.adMode === "midroll" && !midrollShown && video.midrollAt !== undefined && next >= video.midrollAt) {
          setAdActive(true);
          setSkipCountdown(5);
          setMidrollShown(true);
          return v;
        }
        return next > 140 ? 140 : next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [adActive, midrollShown, playing, video.adMode, video.midrollAt]);

  useEffect(() => {
    setLiked(Boolean(benchmarkState.liked[videoId]));
    setSaved(Boolean(benchmarkState.saved[videoId]));
    setSubscribed(Boolean(benchmarkState.subscribed[videoId]));
    setExpandedDescription(benchmarkState.expandedDescription);
    setSortBy(benchmarkState.sortBy);
    setPlaying(benchmarkState.playing);
    setPlayhead(benchmarkState.playhead);
    setAdActive(benchmarkState.adActive);
    setSkipCountdown(benchmarkState.skipCountdown);
    setMidrollShown(Boolean(benchmarkState.midrollShown[videoId]));
    setShowMoreMenu(benchmarkState.showMoreMenu);
    setShowFloatingPromo(benchmarkState.showFloatingPromo);
    setHoveredInfoTarget(benchmarkState.hoveredInfoTarget);
    setShowTranscriptPanel(benchmarkState.showTranscriptPanel);
    setShowQaPanel(benchmarkState.showQaPanel);

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: typeof benchmarkState.initialScrollY === "number" ? benchmarkState.initialScrollY : 0,
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [benchmarkState, videoId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWatchPromoIndex((prev) => (prev + 1) % WATCH_PROMO_BANNERS.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [watchPromoTimerReset]);

  function selectWatchPromoIndex(index: number) {
    setWatchPromoIndex(index);
    setWatchPromoTimerReset((value) => value + 1);
  }

  useEffect(() => {
    (window as Window & { __YOUTUBE_BENCHMARK_STATE__?: Record<string, unknown> }).__YOUTUBE_BENCHMARK_STATE__ = {
      stateId: benchmarkState.id,
      viewMode: "watch",
      videoId,
      liked,
      saved,
      subscribed,
      expandedDescription,
      sortBy,
      playing,
      playhead,
      adActive,
      skipCountdown,
      midrollShown,
      showMoreMenu,
      showFloatingPromo,
      hoveredInfoTarget,
      showTranscriptPanel,
      showQaPanel,
      autoplayEnabled,
      playbackSpeed,
      videoQuality,
      watchPromoIndex,
      scrollY: window.scrollY,
    };
  }, [
    adActive,
    autoplayEnabled,
    benchmarkState.id,
    expandedDescription,
    hoveredInfoTarget,
    liked,
    midrollShown,
    playbackSpeed,
    playing,
    playhead,
    saved,
    showFloatingPromo,
    showMoreMenu,
    showQaPanel,
    showTranscriptPanel,
    skipCountdown,
    sortBy,
    subscribed,
    videoId,
    videoQuality,
    watchPromoIndex,
  ]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __YOUTUBE_BENCHMARK_STATE__?: Record<string, unknown> }).__YOUTUBE_BENCHMARK_STATE__ ?? null;
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

  function skipAd() {
    if (skipCountdown > 0) return;
    setAdActive(false);
    setPlaying(true);
  }

  function closePlayerSettings() {
    setPlayerSettingsOpen(false);
    setPlayerSettingsView("root");
  }

  function toggleReplyThread(commentKey: string) {
    setOpenReplyThreads((prev) => ({
      ...prev,
      [commentKey]: !prev[commentKey],
    }));
  }

  const progressPct = Math.min(100, (playhead / 140) * 100);
  const watchPromo = WATCH_PROMO_BANNERS[watchPromoIndex];

  const sortedComments = useMemo(() => {
    const comments = [...video.comments];
    return sortBy === "Newest first" ? comments.reverse() : comments;
  }, [sortBy, video.comments]);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      {reviewMode && (
        <div className="fixed right-5 top-5 z-[100] rounded-2xl bg-[#111827] px-4 py-3 text-xs font-semibold tracking-[0.08em] text-white shadow-2xl">
          IGG target: {reviewTarget || "none"}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0f0f0f]/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Link href={`/${preservedQuery}`} className="flex items-center gap-2 shrink-0">
            <YouTubeLogo />
          </Link>
          <div className="relative mx-auto flex w-full max-w-[560px] items-center">
            <div className="flex flex-1 items-center overflow-hidden rounded-l-full border border-white/15 bg-[#121212] px-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={`h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 ${reviewClass("youtube.search.input", reviewTarget)}`}
                data-igg-id="youtube.search.input"
              />
            </div>
            <button className="flex h-10 items-center justify-center rounded-r-full border border-l-0 border-white/15 bg-[#222] px-5 text-zinc-300 hover:bg-[#2a2a2a]">
              <span className="text-[18px]">⌕</span>
            </button>
            <button
              data-igg-id="youtube.watch.voice-search"
              className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#222] text-zinc-300 hover:bg-[#3a3a3a]"
            >
              🎙
            </button>
          </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10">
                <span>＋</span> Create
              </button>
            <div className="relative">
              <button data-igg-id="youtube.watch.notifications" className="relative rounded-full p-2 hover:bg-white/10">
                <span className="text-[20px]">🔔</span>
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff0033] text-[10px] font-bold text-white">1</span>
              </button>
            </div>
            <AccountAvatar />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-4">
        <div className="flex gap-6">

          {/* ── Left: main content ── */}
          <div className="min-w-0 flex-1">

            {/* Player */}
            <div className="overflow-hidden rounded-xl">
              <div
                className={`relative aspect-video bg-gradient-to-br ${video.theme}`}
                style={getThumbnailStyle(video, "linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.55))")}
              >

                {adActive && (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.72),rgba(99,102,241,0.68))] backdrop-blur-[2px]">
                    <div className="absolute left-1/2 top-[44%] w-[min(78%,620px)] -translate-x-1/2 -translate-y-1/2">
                      <div className="rounded-[28px] border border-white/30 bg-white/[0.13] px-7 py-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-md">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-600">Ad playing</span>
                          <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">5s Ad</span>
                          <span className="rounded-full border border-sky-300/50 bg-sky-400/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-100">NEW</span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[30px] font-black leading-[1.05] tracking-tight text-white drop-shadow">{video.adTitle}</div>
                            <p className="mt-3 max-w-[44ch] text-sm leading-6 text-white/90">
                              {video.adCopy ?? "A short brand ad is playing."}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
                            {video.adBrand}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-24 right-5">
                      <button
                        onClick={skipAd}
                        className={`flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-xl transition ${
                          skipCountdown > 0
                            ? "cursor-not-allowed border-white/10 bg-black/55 text-white/45"
                            : "border-white/60 bg-white/95 text-black hover:bg-white"
                        } ${reviewClass("youtube.ad.skip", reviewTarget)}`}
                        data-igg-id="youtube.ad.skip"
                        aria-disabled={skipCountdown > 0}
                      >
                        {skipCountdown > 0 ? `Skip Ad ›› ${skipCountdown}` : "Skip Ad"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress + controls */}
                <div className="absolute bottom-0 left-0 right-0">
                  <div data-igg-id="youtube.watch.progress-bar" className="group/progress h-1 cursor-pointer bg-white/20 hover:h-1.5 transition-all">
                    <div className="h-full bg-[#ff0000]" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="flex min-h-[86px] items-center justify-between bg-gradient-to-t from-black/90 via-black/72 to-transparent px-5 py-4 text-zinc-300">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlaying((v) => !v)}
                        className={`flex h-14 w-14 items-center justify-center rounded-full text-[28px] hover:bg-white/10 hover:text-white ${reviewClass("youtube.watch.play-toggle", reviewTarget)}`}
                        data-igg-id="youtube.watch.play-toggle"
                      >
                        {playing && !adActive ? "⏸" : "▶"}
                      </button>
                      <button className="flex h-13 w-13 items-center justify-center rounded-full text-[24px] hover:bg-white/10 hover:text-white">⏭</button>
                      <button className="flex h-13 w-13 items-center justify-center rounded-full text-[23px] hover:bg-white/10 hover:text-white">🔊</button>
                      <span className="ml-1 text-[15px] font-medium text-zinc-300">{formatClock(playhead)} / {video.durationLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex h-13 min-w-13 items-center justify-center rounded-full px-3 text-[17px] font-semibold hover:bg-white/10 hover:text-white">CC</button>
                      <div className="relative">
                        <button
                          data-igg-id="youtube.watch.theater"
                          onMouseEnter={() => setTheaterHovered(true)}
                          onMouseLeave={() => setTheaterHovered(false)}
                          className="flex h-13 w-13 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="13" rx="2"/>
                          </svg>
                        </button>
                        {theaterHovered && (
                          <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#606060] px-2.5 py-1.5 text-xs text-white shadow-lg">Theater mode</div>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          data-igg-id="youtube.watch.miniplayer"
                          onMouseEnter={() => setMiniplayerHovered(true)}
                          onMouseLeave={() => setMiniplayerHovered(false)}
                          className="flex h-13 w-13 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"/>
                            <rect x="13" y="13" width="8" height="5" rx="1" fill="currentColor" stroke="none"/>
                          </svg>
                        </button>
                        {miniplayerHovered && (
                          <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#606060] px-2.5 py-1.5 text-xs text-white shadow-lg">Miniplayer</div>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => {
                            setPlayerSettingsOpen((v) => {
                              const next = !v;
                              setPlayerSettingsView("root");
                              return next;
                            });
                          }}
                          data-igg-id="youtube.watch.settings"
                          className="flex h-13 w-13 items-center justify-center rounded-full text-[22px] leading-none hover:bg-white/10 hover:text-white"
                        >
                          ⚙
                        </button>
                        {playerSettingsOpen && (
                          <div className="absolute bottom-14 right-0 z-30 w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f]/95 shadow-2xl backdrop-blur">
                            {playerSettingsView === "root" && (
                              <>
                                <div className="border-b border-white/8 px-4 py-3">
                                  <div className="text-sm font-semibold text-white">Settings</div>
                                </div>
                                <div className="px-2 py-2">
                                  <button
                                    onClick={() => setPlayerSettingsView("speed")}
                                    data-igg-id="youtube.watch.settings.speed"
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/8"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-base">▶</span>
                                      <span>Playback speed</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                      <span>{playbackSpeed === "1" ? "Normal" : `${playbackSpeed}x`}</span>
                                      <span>›</span>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => setPlayerSettingsView("quality")}
                                    data-igg-id="youtube.watch.settings.quality"
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/8"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-base">HD</span>
                                      <span>Quality</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                      <span>{videoQuality}</span>
                                      <span>›</span>
                                    </div>
                                  </button>
                                </div>
                              </>
                            )}
                            {playerSettingsView === "speed" && (
                              <>
                                <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
                                  <button onClick={() => setPlayerSettingsView("root")} className="text-lg text-zinc-300 hover:text-white">
                                    ←
                                  </button>
                                  <div>
                                    <div className="text-sm font-semibold text-white">Playback speed</div>
                                    <div className="text-[11px] text-zinc-400">Currently: {playbackSpeed === "1" ? "Normal" : `${playbackSpeed}x`}</div>
                                  </div>
                                </div>
                                <div className="px-2 py-2">
                                  {PLAYBACK_SPEED_OPTIONS.map((speed) => (
                                    <button
                                      key={speed}
                                      onClick={() => {
                                        setPlaybackSpeed(speed);
                                        closePlayerSettings();
                                      }}
                                      data-igg-id={speed === "2" ? "youtube.watch.settings.speed.2x" : undefined}
                                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                                        playbackSpeed === speed ? "bg-white text-black" : "text-zinc-200 hover:bg-white/8"
                                      }`}
                                    >
                                      <span>{speed === "1" ? "Normal" : `${speed}x`}</span>
                                      {playbackSpeed === speed && <span className="text-xs font-semibold">Selected</span>}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            {playerSettingsView === "quality" && (
                              <>
                                <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
                                  <button onClick={() => setPlayerSettingsView("root")} className="text-lg text-zinc-300 hover:text-white">
                                    ←
                                  </button>
                                  <div>
                                    <div className="text-sm font-semibold text-white">Quality</div>
                                    <div className="text-[11px] text-zinc-400">Currently: {videoQuality}</div>
                                  </div>
                                </div>
                                <div className="px-2 py-2">
                                  {QUALITY_OPTIONS.map((quality) => (
                                    <button
                                      key={quality}
                                      onClick={() => {
                                        setVideoQuality(quality);
                                        closePlayerSettings();
                                      }}
                                      data-igg-id={quality === "720p" ? "youtube.watch.settings.quality.720p" : undefined}
                                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                                        videoQuality === quality ? "bg-white text-black" : "text-zinc-200 hover:bg-white/8"
                                      }`}
                                    >
                                      <span>{quality}</span>
                                      {videoQuality === quality && <span className="text-xs font-semibold">Selected</span>}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <button className="flex h-13 w-13 items-center justify-center rounded-full text-[22px] leading-none hover:bg-white/10 hover:text-white">⛶</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="mt-3 text-xl font-bold leading-snug text-white">{video.title}</h1>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Like / Dislike pill */}
              <div className="flex items-center overflow-hidden rounded-full bg-[#272727]">
                <button
                  onClick={() => setLiked((v) => !v)}
                  data-igg-id="youtube.watch.like"
                  className={`flex items-center gap-1.5 border-r border-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/10 ${liked ? "text-white" : "text-zinc-200"}`}
                >
                  <span className="text-[15px]">👍</span>
                  <span>18K</span>
                </button>
                <button data-igg-id="youtube.watch.dislike" className="px-4 py-2 text-[15px] text-zinc-200 hover:bg-white/10">👎</button>
              </div>
              {/* Share */}
              <button
                className={`flex items-center gap-1.5 rounded-full bg-[#272727] px-4 py-2 text-sm text-zinc-200 hover:bg-[#3f3f3f] ${reviewClass("youtube.watch.share", reviewTarget)}`}
                data-igg-id="youtube.watch.share"
              >
                <span>↪</span> Share
              </button>
              {/* Clip */}
              <button data-igg-id="youtube.watch.clip" className="flex items-center gap-1.5 rounded-full bg-[#272727] px-4 py-2 text-sm text-zinc-200 hover:bg-[#3f3f3f]">
                ✂ Clip
              </button>
              {/* Save */}
              <button
                onClick={() => setSaved((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${saved ? "bg-[#2d65ff] text-white" : "bg-[#272727] text-zinc-200 hover:bg-[#3f3f3f]"} ${reviewClass("youtube.video.save", reviewTarget)}`}
                data-igg-id="youtube.video.save"
              >
                {saved ? "✓ Saved" : "+ Save"}
              </button>
              {/* More */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu((v) => !v)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#272727] text-lg text-zinc-200 hover:bg-[#3f3f3f] ${reviewClass("youtube.watch.more-menu", reviewTarget)}`}
                  data-igg-id="youtube.watch.more-menu"
                >
                    ⋯
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#282828] py-1.5 shadow-2xl">
                    <button
                      onClick={() => { setShowTranscriptPanel(true); setShowMoreMenu(false); }}
                      className={`block w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/8 ${reviewClass("youtube.menu.open-transcript", reviewTarget)}`}
                      data-igg-id="youtube.menu.open-transcript"
                    >
                      Open transcript
                    </button>
                    <button
                      onClick={() => { setShowQaPanel(true); setShowMoreMenu(false); }}
                      className={`block w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/8 ${reviewClass("youtube.menu.open-qa", reviewTarget)}`}
                      data-igg-id="youtube.menu.open-qa"
                    >
                      Show Q&amp;A section
                    </button>
                    <button onClick={() => setShowMoreMenu(false)} className="block w-full px-4 py-2.5 text-left text-sm text-zinc-400 hover:bg-white/8">
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`relative mt-4 overflow-hidden rounded-2xl border ${watchPromo.shellClass}`}
              style={getImageBackgroundStyle(watchPromo.imageUrl, watchPromo.backgroundPosition)}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.64)_62%,rgba(0,0,0,0.24))]" />
              <div className="relative flex items-center gap-4 px-4 py-3 transition-all duration-500">
                <button
                  type="button"
                  onClick={() => selectWatchPromoIndex((watchPromoIndex - 1 + WATCH_PROMO_BANNERS.length) % WATCH_PROMO_BANNERS.length)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#272727]/90 text-lg text-white shadow-lg transition hover:bg-[#3a3a3a]"
                  aria-label="Previous banner"
                >
                  ‹
                </button>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className={`text-[11px] font-black uppercase tracking-[0.18em] ${watchPromo.eyebrowClass}`}>{watchPromo.eyebrow}</div>
                    <div className="mt-1 text-sm font-semibold text-white">{watchPromo.title}</div>
                    <div className="mt-1 text-sm text-zinc-300">{watchPromo.description}</div>
                  </div>
                  <button
                    data-igg-id={
                      watchPromo.title === "Meditation App — 40% Off Annual Plan" ? "youtube.watch.promo.meditation-plan" :
                      watchPromo.title === "Sleep Sound App — New User Discount" ? "youtube.watch.promo.sleep-discount" :
                      undefined
                    }
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${watchPromo.buttonClass}`}
                  >
                    {watchPromo.cta}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => selectWatchPromoIndex((watchPromoIndex + 1) % WATCH_PROMO_BANNERS.length)}
                  data-igg-id="youtube.watch.promo.arrow-right"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#272727]/90 text-lg text-white shadow-lg transition hover:bg-[#3a3a3a]"
                  aria-label="Next banner"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Channel row */}
            <div className="mt-4 flex items-center justify-between border-b border-white/8 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                <button
                  onMouseEnter={() => setHoveredInfoTarget(true)}
                  onMouseLeave={() => setHoveredInfoTarget(false)}
                  className={`h-10 w-10 rounded-full bg-white/15 ring-1 ring-white/10 ${reviewClass("youtube.channel.info-trigger", reviewTarget)}`}
                  data-igg-id="youtube.channel.info-trigger"
                  style={getAvatarStyle(getStableAvatarUrl(video.handle), video.avatarPosition)}
                  aria-label={`${video.channel} channel info`}
                />
                  {hoveredInfoTarget && (
                    <div className="absolute left-12 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#202020] px-3 py-2 text-xs text-white shadow-2xl">
                      View channel info
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-white" data-igg-id="youtube.description.channel-link">{video.channel}</div>
                  <div className="text-xs text-zinc-400">124K subscribers</div>
                </div>
              </div>
              <button
                onClick={() => setSubscribed((v) => !v)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${subscribed ? "bg-[#272727] text-white" : "bg-white text-black hover:bg-zinc-200"} ${reviewClass("youtube.channel.subscribe", reviewTarget)}`}
                data-igg-id="youtube.channel.subscribe"
              >
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>

            {/* Description */}
            <div className="mt-3 rounded-xl bg-[#272727] px-4 py-3">
              <div className="text-sm font-medium text-zinc-200">
                {video.views} · {video.published}
              </div>
              <p className={`mt-1 text-sm leading-5 text-zinc-300 ${expandedDescription ? "" : "line-clamp-2"}`}>
                {video.description}
              </p>
              {expandedDescription && video.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {video.tags.map((tag) => (
                    <button
                      key={tag}
                      data-igg-id={tag === "design" ? "youtube.description.tag.design" : tag === "tutorial" ? "youtube.description.tag.tutorial" : undefined}
                      className="rounded-full px-2 py-1 text-sm text-[#3ea6ff] transition hover:bg-white/8 hover:text-[#7cc4ff]"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setExpandedDescription((v) => !v)}
                className={`mt-2 text-sm font-semibold text-white ${reviewClass("youtube.description.expand", reviewTarget)}`}
                data-igg-id="youtube.description.expand"
              >
                {expandedDescription ? "Show less" : "More"}
              </button>
            </div>

            {/* Transcript panel */}
            {showTranscriptPanel && (
              <div className="mt-4 rounded-xl bg-[#272727] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-base font-semibold">Transcript</span>
                  <button
                    onClick={() => setShowTranscriptPanel(false)}
                    className={`rounded-full bg-white/8 px-3 py-1 text-xs text-zinc-300 hover:bg-white/15 ${reviewClass("youtube.transcript.close", reviewTarget)}`}
                    data-igg-id="youtube.transcript.close"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-1">
                  {video.transcript.map((line, i) => (
                    <div key={i} className="flex gap-3 rounded-lg px-3 py-2 hover:bg-white/5 cursor-default">
                      <span className="w-10 shrink-0 text-xs text-zinc-500">{formatClock(i * 12)}</span>
                      <span className="text-sm text-zinc-300">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A panel */}
            {showQaPanel && (
              <div className="mt-4 rounded-xl bg-[#272727] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-base font-semibold">Q&amp;A</span>
                  <button onClick={() => setShowQaPanel(false)} className="rounded-full bg-white/8 px-3 py-1 text-xs text-zinc-300 hover:bg-white/15">Hide</button>
                </div>
                <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                  <div className="text-sm font-semibold">Most asked question</div>
                  <div className="mt-1 text-sm leading-5 text-zinc-300">Templates and organizing methods I use when editing are linked in the description.</div>
                </div>
                <button
                  className={`mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black ${reviewClass("youtube.qa.primary-button", reviewTarget)}`}
                  data-igg-id="youtube.qa.primary-button"
                >
                  Leave a Q&amp;A question
                </button>
              </div>
            )}

            {/* Comments */}
            <div className="mt-6">
              {/* Premium promo */}
              {showFloatingPromo && (
                <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#ffd977]/20 bg-[#20160a] px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-[#ffd977]">Try Viewtube Premium</div>
                    <div className="mt-1 text-sm leading-5 text-zinc-200">Watch without ads and try background play.</div>
                  </div>
                  <button
                    onClick={() => setShowFloatingPromo(false)}
                    className={`shrink-0 rounded-full bg-white/8 px-3 py-1 text-xs text-white hover:bg-white/15 ${reviewClass("youtube.comments.promo-close", reviewTarget)}`}
                    data-igg-id="youtube.comments.promo-close"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Comments header */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-lg font-bold">{video.comments.length} Comments</span>
                <div className="relative">
                  <button
                    onClick={() => setSortMenuOpen((v) => !v)}
                    data-igg-id="youtube.comments.sort_toggle"
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/8 ${reviewClass("youtube.comments.sort_toggle", reviewTarget)}`}
                  >
                    <span>Sort by</span>
                    <span className="text-xs text-zinc-500">▾</span>
                  </button>
                  {sortMenuOpen && (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-40 rounded-xl border border-white/10 bg-[#282828] p-1 shadow-2xl">
                      <button
                        onClick={() => {
                          setSortBy("Top comments");
                          setSortMenuOpen(false);
                        }}
                        data-igg-id="youtube.comments.sort_top"
                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          sortBy === "Top comments" ? "bg-white text-black" : "text-white hover:bg-white/8"
                        }`}
                      >
                        Top comments
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("Newest first");
                          setSortMenuOpen(false);
                        }}
                        data-igg-id="youtube.comments.sort_newest"
                        className={`mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          sortBy === "Newest first" ? "bg-white text-black" : "text-white hover:bg-white/8"
                        }`}
                      >
                        Newest first
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment input */}
              <div className="mt-4 flex items-start gap-3">
                <AccountAvatar sizeClass="h-9 w-9" />
                <div className="flex-1 border-b border-white/15 pb-1">
                  <input className="w-full bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-600" placeholder="Add a comment..." />
                </div>
              </div>

              {/* Comment list */}
              <div className="mt-5 space-y-5">
                {sortedComments.map((comment) => (
                  <div
                    key={`${comment.author}-${comment.ago}`}
                    className={`flex gap-3 ${comment.pinned ? reviewClass("youtube.comments.pinned_comment", reviewTarget) : ""}`}
                    data-igg-id={comment.pinned ? "youtube.comments.pinned_comment" : undefined}
                  >
                    {(() => {
                      const commentKey = `${comment.author}-${comment.ago}`;
                      const repliesOpen = !!openReplyThreads[commentKey];

                      return (
                        <>
                    <div
                      className="h-9 w-9 shrink-0 rounded-full bg-white/10 ring-1 ring-white/10"
                      style={getAvatarStyle(getStableAvatarUrl(comment.author))}
                      aria-label={`${comment.author} avatar`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-white">@{comment.author}</span>
                        <span className="text-xs text-zinc-500">{comment.ago}</span>
                        {comment.pinned && <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">Pinned</span>}
                      </div>
                      <p className="mt-1 text-sm leading-5 text-zinc-200">{comment.body}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                        <button data-igg-id={comment.author === "minjoon" ? "youtube.comments.minjoon.like" : comment.author === "ellaresearchlab" ? "youtube.comments.ella.like" : undefined} className="flex items-center gap-1 hover:text-white">👍 {comment.likes}</button>
                        <button className="hover:text-white">👎</button>
                        <button className="hover:text-white">Reply</button>
                      </div>
                      {comment.replies && comment.replies.length > 0 && (
                        <>
                          <button
                            onClick={() => toggleReplyThread(commentKey)}
                            data-igg-id={comment.author === "minjoon" ? "youtube.comments.minjoon.replies-toggle" : undefined}
                            className="mt-3 flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold text-[#3ea6ff] hover:bg-[#263850]"
                          >
                            <span className={`text-sm transition-transform ${repliesOpen ? "rotate-180" : ""}`}>⌄</span>
                            <span>{repliesOpen ? `Hide ${comment.replies.length} replies` : `View ${comment.replies.length} replies`}</span>
                          </button>
                          {repliesOpen && (
                            <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
                              {comment.replies.map((reply) => (
                                <div key={`${reply.author}-${reply.ago}`} className="flex gap-3">
                                  <div
                                    className="h-8 w-8 shrink-0 rounded-full bg-white/8 ring-1 ring-white/10"
                                    style={getAvatarStyle(getStableAvatarUrl(reply.author))}
                                    aria-label={`${reply.author} avatar`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs font-semibold text-white">@{reply.author}</span>
                                      <span className="text-[11px] text-zinc-500">{reply.ago}</span>
                                    </div>
                                    <p className="mt-1 text-sm leading-5 text-zinc-300">{reply.body}</p>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                                      <button
                                        data-igg-id={
                                          comment.author === "minjoon" && reply.author === "ellaresearchlab"
                                            ? "youtube.comments.minjoon.reply.ella.like"
                                            : undefined
                                        }
                                        className="flex items-center gap-1 hover:text-white"
                                      >
                                        👍 {reply.likes}
                                      </button>
                                      <button className="hover:text-white">Reply</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-16" />
          </div>

          {/* ── Right sidebar ── */}
          <aside className="hidden w-[400px] shrink-0 lg:block">
            {/* Autoplay toggle */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Autoplay</span>
              <button
                onClick={() => setAutoplayEnabled((v) => !v)}
                className={`flex h-6 w-11 items-center rounded-full px-0.5 transition ${
                  autoplayEnabled ? "bg-white" : "bg-[#3a3a3a]"
                } ${reviewClass("youtube.watch.autoplay", reviewTarget)}`}
                data-igg-id="youtube.watch.autoplay"
              >
                <div
                  className={`h-5 w-5 rounded-full shadow transition ${
                    autoplayEnabled ? "ml-auto bg-[#0f0f0f]" : "ml-0 bg-white"
                  }`}
                />
              </button>
            </div>

            {/* Video list */}
            <div className="space-y-2">
              {VIDEOS.filter((v) => v.id !== video.id).map((v) => (
                <div
                  key={v.id}
                  className="group flex cursor-default gap-2 rounded-xl p-2 transition hover:bg-white/[0.05]"
                  data-igg-id={WATCH_RELATED_VIDEO_IDS[v.id]}
                >
                  <div
                    className={`relative h-[94px] w-[168px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${v.theme}`}
                    style={getThumbnailStyle(v, "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.34))")}
                  >
                    <div className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1 py-0.5 text-[11px] font-semibold text-white">
                      {v.durationLabel}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="line-clamp-2 text-[13px] font-medium leading-[1.4] text-white">{v.title}</p>
                    <p className="mt-1 text-[12px] text-zinc-400">{v.channel}</p>
                    <p className="mt-0.5 text-[12px] text-zinc-500">{v.views} · {v.published}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
