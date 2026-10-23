"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getChirpBenchmarkState, type ChirpBenchmarkState } from "./chirp-states";

declare global {
  interface Window {
    __CHIRP_BENCHMARK_STATE__?: ChirpBenchmarkState;
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
  runtimeStateKey: "__CHIRP_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

const ASYNC_UPLOAD_DELAY_MS = 5500;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type MenuName = "tweet-more" | "compose-media" | "profile" | null;

function Icon({ name }: { name: "home" | "explore" | "bell" | "mail" | "bookmark" | "list" | "user" | "search" | "more" | "plus" | "x" | "drag" | "camera" | "gif" | "poll" | "settings" | "reply" | "retweet" | "heart" | "share" | "chevron" | "verify" | "chev-down" | "pin" | "embed" | "flag" | "grok" | "premium" | "creator" | "unfollow" | "mute" | "report" | "trash" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<typeof name, React.ReactNode> = {
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    explore: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="m10.5 8.5 3 1-1 3-3-1 1-3z" /></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
    bookmark: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    drag: <><path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
    gif: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M8 12h2v2H8v-4h4M16 10v4M14 12h2" /></>,
    poll: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
    reply: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
    retweet: <><path d="M17 1 21 5l-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    share: <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    verify: <><circle cx="12" cy="12" r="10" /><path d="m8 12 2.5 2.5L16 9" /></>,
    "chev-down": <path d="m6 9 6 6 6-6" />,
    pin: <><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" /></>,
    embed: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
    grok: <><path d="M12 3c-1.5 3-4 5-4 9s2.5 6 4 9" /><path d="M12 3c1.5 3 4 5 4 9s-2.5 6-4 9" /><path d="M3 12c3-1.5 5-4 9-4s6 2.5 9 4" /><path d="M3 12c3 1.5 5 4 9 4s6-2.5 9-4" /></>,
    premium: <><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></>,
    creator: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="m9 9 3-3 3 3" /><path d="M12 6v7" /></>,
    unfollow: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="22" y1="11" x2="16" y2="11" /></>,
    mute: <><path d="M11 5 6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>,
    report: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Dropdown({ open, children, className }: { open: boolean; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return (
    <div className={cx("absolute z-40 overflow-hidden rounded-2xl border border-[#2f3336] bg-[#16181c] shadow-[0_8px_28px_rgba(255,255,255,0.06)]", className)}>
      {children}
    </div>
  );
}

function MenuItem({ id, type, prereq, children, danger }: { id: string; type?: string; prereq?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      data-igg-id={id}
      data-igg-type={type}
      data-igg-prereq={prereq}
      className={cx(
        "flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition-colors hover:bg-white/5",
        danger ? "text-[#f4212e]" : "text-[#e7e9ea]",
      )}
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

const spotlightSlides = [
  { label: "Live",     title: "Tech Summit 2026 · Day 2 keynote streaming now",  cta: "Join discussion", target: "chirp.spotlight.tech-summit.open" },
  { label: "Trending", title: "#PythonConf · 42.1K tweets in the last hour",     cta: "View tweets",     target: "chirp.spotlight.python-conf.open" },
  { label: "Breaking", title: "AI Safety Oversight Act passes Senate 67–33",     cta: "See more",        target: "chirp.spotlight.ai-bill.open" },
] as const;

type TweetMedia = {
  src: string;
  alt: string;
  position?: string;
};

const tweets = [
  {
    slug: "lena-hayes", name: "Lena Hayes", handle: "lenahayes", time: "18m",
    text: "Shipped the webhooks rewrite this morning. The best part is boring: retries are predictable now, payloads are easier to diff, and the docs finally match what the API actually does.",
    replies: 14, retweets: 89, likes: 312, av: "LH", bg: "bg-sky-600",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&h=520&fit=crop&q=82", alt: "Server racks with blue status lights", position: "center" },
    ],
  },
  {
    slug: "marcus-wu", name: "Marcus Wu", handle: "marcuswu", time: "42m",
    text: "Moved desks for one day and somehow became 30% more productive. The real productivity stack might just be sunlight, a clean keyboard, and no mystery cables.",
    replies: 8, retweets: 156, likes: 1204, av: "MW", bg: "bg-indigo-600",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&h=520&fit=crop&q=82", alt: "Laptop workstation on a desk", position: "center" },
      { src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=700&h=520&fit=crop&q=82", alt: "Dim office with monitors and chairs", position: "center" },
    ],
  },
  {
    slug: "priya-nair", name: "Priya Nair", handle: "priyanair", time: "1h",
    text: "Design review note to self: if the empty state needs a paragraph to explain it, the flow is probably asking the wrong question one step earlier.",
    replies: 23, retweets: 67, likes: 445, av: "PN", bg: "bg-rose-500",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=900&h=620&fit=crop&q=82", alt: "Colorful interface design boards", position: "center" },
      { src: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=620&h=620&fit=crop&q=82", alt: "Designer reviewing a mobile interface", position: "center" },
      { src: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=620&h=620&fit=crop&q=82", alt: "Design sketches and UI wireframes", position: "center" },
    ],
  },
  {
    slug: "tobias-klein", name: "Tobias Klein", handle: "tobiasklein", time: "2h",
    text: "Spent the afternoon replacing a 900-line internal tool with two small scripts and a README. Nobody clapped, which is how you know the change was good.",
    replies: 31, retweets: 203, likes: 2100, av: "TK", bg: "bg-amber-500",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=620&h=620&fit=crop&q=82", alt: "Code on a monitor", position: "center" },
      { src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=620&h=620&fit=crop&q=82", alt: "Developer typing code", position: "center" },
      { src: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=620&h=620&fit=crop&q=82", alt: "Terminal windows on a display", position: "center" },
      { src: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=620&h=620&fit=crop&q=82", alt: "Laptop with code editor open", position: "center" },
    ],
  },
  {
    slug: "sasha-bell", name: "Sasha Bell", handle: "sashabell", time: "3h",
    text: "Notification settings should have a 'tell me when this is actually my problem' option.",
    replies: 67, retweets: 445, likes: 3890, av: "SB", bg: "bg-violet-600",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=520&fit=crop&q=82", alt: "Laptop showing app notification activity", position: "center" },
    ],
  },
  {
    slug: "nadia-osei", name: "Nadia Osei", handle: "nadiaosei", time: "4h",
    text: "We tested async voice replies with three remote teams. The surprise: people sent shorter updates because recording made them think first.",
    replies: 44, retweets: 321, likes: 2780, av: "NO", bg: "bg-teal-600",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=700&h=520&fit=crop&q=82", alt: "Podcast studio microphone and mixer", position: "center" },
      { src: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=700&h=520&fit=crop&q=82", alt: "Audio recording setup with headphones", position: "center" },
    ],
  },
  { slug: "felix-roman",   name: "Felix Roman",   handle: "felixroman",   time: "5h",  text: "Permission prompts on page load still feel like a pop quiz. Give me context, then ask.", replies: 19,  retweets: 88,  likes: 673,  av: "FR", bg: "bg-orange-500", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&q=80" },
  {
    slug: "zoe-kim", name: "Zoe Kim", handle: "zoekim", time: "6h",
    text: "Read the new dynamic context paper twice. First pass: confusing. Second pass: still confusing, but now with three ideas I want to steal.",
    replies: 11, retweets: 55, likes: 431, av: "ZK", bg: "bg-pink-600",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1453733190371-0a9bedd82893?w=900&h=520&fit=crop&q=82", alt: "Research notes and charts on a desk", position: "center" },
    ],
  },
  { slug: "luke-stone",    name: "Luke Stone",    handle: "lukestone",    time: "7h",  text: "Enterprise buyers do not hate product-led growth. They hate discovering procurement, audit logs, and SSO were treated as stretch goals.", replies: 28,  retweets: 134, likes: 890,  av: "LS", bg: "bg-slate-500", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80" },
  { slug: "anna-voss",     name: "Anna Voss",     handle: "annavoss",     time: "9h",  text: "Postgres migration finished with 14 seconds of elevated latency and zero downtime. I will now stare at dashboards for the rest of the day anyway.", replies: 36,  retweets: 211, likes: 1670, av: "AV", bg: "bg-emerald-600", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80" },
  { slug: "ray-chen",      name: "Ray Chen",      handle: "raychen",      time: "10h", text: "Current terminal setup: Ghostty, Fish, Starship, one tasteful theme, and far too many aliases I pretend I remember.", replies: 52, retweets: 98, likes: 760, av: "RC", bg: "bg-blue-600", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&q=80" },
  {
    slug: "mia-torres", name: "Mia Torres", handle: "miatorres", time: "11h",
    text: "Tiny launch checklist improvement: we now add screenshots to every release note before QA starts. Suddenly half the 'is this expected?' questions disappeared.",
    replies: 12, retweets: 41, likes: 388, av: "MT", bg: "bg-cyan-600",
    avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=120&h=120&fit=crop&q=80",
  },
  {
    slug: "devon-price", name: "Devon Price", handle: "devonprice", time: "12h",
    text: "The fastest way to make a roadmap meeting useful is to bring the thing you are willing to delete.",
    replies: 18, retweets: 72, likes: 604, av: "DP", bg: "bg-lime-700",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&q=80",
  },
  {
    slug: "irene-cho", name: "Irene Cho", handle: "irenecho", time: "13h",
    text: "Morning run, quiet cafe, inbox at zero for exactly six minutes. I am choosing to count this as balance.",
    replies: 9, retweets: 22, likes: 318, av: "IC", bg: "bg-fuchsia-600",
    avatar: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=120&h=120&fit=crop&q=80",
    media: [
      { src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&h=520&fit=crop&q=82", alt: "Coffee on a cafe table", position: "center" },
    ],
  },
  {
    slug: "sam-rivera", name: "Sam Rivera", handle: "samrivera", time: "15h",
    text: "Support ticket of the day was solved by changing one label from 'Archive' to 'Hide from team'. Same behavior, completely different mental model.",
    replies: 21, retweets: 64, likes: 502, av: "SR", bg: "bg-red-600",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&h=120&fit=crop&q=80",
  },
  {
    slug: "maya-desai", name: "Maya Desai", handle: "mayadesai", time: "17h",
    text: "Spent ten minutes naming a variable and then wrote the rest of the function without stopping. This is either craft or procrastination.",
    replies: 16, retweets: 58, likes: 447, av: "MD", bg: "bg-purple-600",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&q=80",
  },
  {
    slug: "owen-park", name: "Owen Park", handle: "owenpark", time: "19h",
    text: "New office rule: if the meeting has no doc by the five-minute mark, it becomes a working session and someone opens a blank page.",
    replies: 25, retweets: 109, likes: 821, av: "OP", bg: "bg-stone-600",
    avatar: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=120&h=120&fit=crop&q=80",
  },
  {
    slug: "rachel-min", name: "Rachel Min", handle: "rachelmin", time: "21h",
    text: "The best customer calls are the ones where they casually describe the exact bug your team has been debating for two weeks.",
    replies: 33, retweets: 118, likes: 980, av: "RM", bg: "bg-emerald-700",
    avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=120&h=120&fit=crop&q=80",
  },
] as const;

const followSuggestions = [
  { slug: "ellie-brooks", name: "Ellie Brooks",    handle: "elliebrooks", bio: "Product designer at Stripe · prev Figma",          av: "EB", bg: "bg-pink-500",    avatar: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=120&h=120&fit=crop&q=80" },
  { slug: "cam-justice",  name: "Cameron Justice", handle: "camjustice",  bio: "Open source · React · TypeScript",                 av: "CJ", bg: "bg-sky-600",     avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&q=80" },
  { slug: "ryan-sol",     name: "Ryan Sol",        handle: "ryansol",     bio: "Engineering @Vercel · building fast things",        av: "RS", bg: "bg-slate-700",   avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=120&h=120&fit=crop&q=80" },
  { slug: "tara-west",    name: "Tara West",       handle: "tarawest",    bio: "Founder @Loopify · prev Notion",                   av: "TW", bg: "bg-violet-600",  avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&q=80" },
  { slug: "omar-chen",    name: "Omar Chen",       handle: "omarchen",    bio: "AI researcher · ML Systems · co-authored 3 papers", av: "OC", bg: "bg-teal-600",    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&q=80" },
  { slug: "jade-park",    name: "Jade Park",       handle: "jadepark",    bio: "Security engineer · CTF competitor",                av: "JP", bg: "bg-emerald-600", avatar: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=120&h=120&fit=crop&q=80" },
  { slug: "nina-flores",  name: "Nina Flores",     handle: "ninaflores",  bio: "Staff engineer @Notion · previously Airbnb",        av: "NF", bg: "bg-rose-600",    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&h=120&fit=crop&q=80" },
  { slug: "ben-hart",     name: "Ben Hart",        handle: "benhart",     bio: "PM · building in public · prev Linear",             av: "BH", bg: "bg-amber-600",   avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=120&h=120&fit=crop&q=80" },
] as const;

const rightPanelSuggestions = followSuggestions.slice(0, 3);

const dmConversations = [
  { name: "Kai Sullivan",        preview: "Did you see the new API update?",          time: "2h",  av: "KS", bg: "bg-sky-500" },
  { name: "Product Design Sync", preview: "Priya: Tokens are ready for review",       time: "4h",  av: "PD", bg: "bg-indigo-500" },
  { name: "Mia Torres",          preview: "Thanks for the feedback on the post!",     time: "1d",  av: "MT", bg: "bg-rose-500" },
  { name: "Dev Ops Team",        preview: "Luke: Deploys are green on staging",       time: "2d",  av: "DO", bg: "bg-slate-600" },
  { name: "Alex Carter",         preview: "When can we sync on the integration?",     time: "3d",  av: "AC", bg: "bg-amber-500" },
] as const;

const trendingTopics = [
  { id: "tech-summit",     tag: "#TechSummit2026", tweets: "42.1K", category: "Technology · Trending" },
  { id: "open-source-day", tag: "#OpenSourceDay",  tweets: "18.4K", category: "Tech · Trending" },
  { id: "python-conf",     tag: "#PythonConf",     tweets: "11.2K", category: "Programming · Trending" },
  { id: "ai-safety",       tag: "AI Safety Bill",  tweets: "8.9K",  category: "Politics · Trending" },
  { id: "design-systems",  tag: "#DesignSystems",  tweets: "6.7K",  category: "Design · Trending" },
  { id: "remote-teams",    tag: "Remote Teams",    tweets: "5.4K",  category: "Business · Trending" },
  { id: "ship-week",       tag: "#ShipWeek",        tweets: "4.8K",  category: "Startups · Trending" },
  { id: "database-day",    tag: "Database Day",     tweets: "3.2K",  category: "Engineering · Trending" },
  { id: "coffee-chat",     tag: "#CoffeeChat",      tweets: "2.7K",  category: "Lifestyle · Trending" },
] as const;

const visibleTrendingTopics = trendingTopics.slice(0, 5);
const extraTrendingTopics = trendingTopics.slice(5);

function fmtNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

function Avatar({ src, fallback, bg, size = "h-10 w-10" }: { src?: string; fallback: string; bg: string; size?: string }) {
  return (
    <div className={cx("overflow-hidden rounded-full flex-shrink-0 bg-[#202327]", size)}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className={cx("flex h-full w-full items-center justify-center text-[12px] font-bold text-white", bg)}>{fallback}</div>
      )}
    </div>
  );
}

function TweetMediaGrid({ media, tweetSlug }: { media?: readonly TweetMedia[]; tweetSlug: string }) {
  if (!media?.length) return null;

  const visibleMedia = media.slice(0, 4);
  const gridClass =
    visibleMedia.length === 1 ? "grid-cols-1" :
    visibleMedia.length === 2 ? "grid-cols-2" :
    "grid-cols-2 grid-rows-2";

  return (
    <div
      data-igg-id={`chirp.tweet.${tweetSlug}.media`}
      className={cx(
        "mt-3 grid overflow-hidden rounded-2xl border border-[#2f3336] bg-[#0f1419]",
        gridClass,
        visibleMedia.length === 1 ? "aspect-[16/9]" : "aspect-[16/10]",
      )}
    >
      {visibleMedia.map((item, index) => (
        <div
          key={item.src}
          className={cx(
            "relative min-h-0 overflow-hidden bg-[#16181c]",
            visibleMedia.length === 3 && index === 0 && "row-span-2",
            index > 0 && "border-l border-black",
            visibleMedia.length > 2 && index > 1 && "border-t border-black",
            visibleMedia.length === 3 && index === 1 && "border-t-0",
          )}
        >
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
            style={{ objectPosition: item.position ?? "center" }}
          />
          {media.length > 4 && index === 3 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-bold text-white">
              +{media.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChirpApp() {
  const searchParams = useSearchParams();
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? undefined;
  const initialState = useMemo(() => getChirpBenchmarkState(stateId), [stateId]);

  const [uiState, setUiState] = useState(initialState);
  const [activeMenu, setActiveMenu] = useState<MenuName>(
    initialState.tweetMoreOpen ? "tweet-more" :
    initialState.composeMediaOpen ? "compose-media" :
    initialState.profileMenuOpen ? "profile" : null,
  );
  const [searchOpen, setSearchOpen] = useState(initialState.searchOpen);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(initialState.phoneDialogOpen);
  const [asyncReady, setAsyncReady] = useState(initialState.asyncDelayMs === null);
  const [slideIndex, setSlideIndex] = useState(initialState.bannerSlide);
  const [slideTimerReset, setSlideTimerReset] = useState(0);
  const [trendingMenu, setTrendingMenu] = useState<string | null>(null);
  const [activeTweetMenu, setActiveTweetMenu] = useState<string | null>(initialState.tweetMoreOpen ? "lena-hayes" : null);
  const [trendsExpanded, setTrendsExpanded] = useState(false);
  const [rightFollowExpanded, setRightFollowExpanded] = useState(false);
  const [composeUploadStatus, setComposeUploadStatus] = useState<"idle" | "uploading" | "ready">("idle");
  const [dmUploadStatus, setDmUploadStatus] = useState<"idle" | "uploading" | "ready">("idle");

  const spotlightRef = useRef<HTMLDivElement>(null);
  const tweetsRef = useRef<HTMLDivElement>(null);
  const panel = useDraggablePanel({ x: 750, y: 85 });

  useEffect(() => {
    setUiState(initialState);
    setActiveMenu(
      initialState.tweetMoreOpen ? "tweet-more" :
      initialState.composeMediaOpen ? "compose-media" :
      initialState.profileMenuOpen ? "profile" : null,
    );
    setActiveTweetMenu(initialState.tweetMoreOpen ? "lena-hayes" : null);
    setSearchOpen(initialState.searchOpen);
    setPhoneDialogOpen(initialState.phoneDialogOpen);
    setAsyncReady(initialState.asyncDelayMs === null);
    setSlideIndex(initialState.bannerSlide);
    setSlideTimerReset(0);
    setComposeUploadStatus(initialState.composeUploadRequired ? "uploading" : "idle");
    setDmUploadStatus(initialState.dmUploadPanelOpen ? "uploading" : "idle");
  }, [initialState]);

  useEffect(() => { window.__CHIRP_BENCHMARK_STATE__ = uiState; }, [uiState]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __CHIRP_BENCHMARK_STATE__?: Record<string, unknown> }).__CHIRP_BENCHMARK_STATE__ ?? null;
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: true, runtimeState, ...result }, "*");
      } catch (error) {
        (event.source as Window | null)?.postMessage({ type: "igg-review-response", requestId: event.data.requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, "*");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (uiState.scrollTarget === "follow") window.scrollTo({ top: document.documentElement.scrollHeight });
    if (uiState.scrollTarget === "spotlight") spotlightRef.current?.scrollIntoView({ block: "start" });
  }, [uiState.scrollTarget]);

  useEffect(() => {
    if (uiState.asyncDelayMs === null) return;
    const t = window.setTimeout(() => setAsyncReady(true), uiState.asyncDelayMs);
    return () => window.clearTimeout(t);
  }, [uiState.asyncDelayMs]);

  useEffect(() => {
    const delay = uiState.autoBannerDelayMs ?? 2600;
    const t = window.setInterval(() => setSlideIndex((v) => (v + 1) % spotlightSlides.length), delay);
    return () => window.clearInterval(t);
  }, [slideTimerReset, uiState.autoBannerDelayMs]);

  function selectSpotlightSlide(index: number) {
    setSlideIndex(index);
    setSlideTimerReset((value) => value + 1);
  }

  useEffect(() => {
    if (dmUploadStatus !== "uploading") return;
    const t = window.setTimeout(() => setDmUploadStatus("ready"), ASYNC_UPLOAD_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [dmUploadStatus]);

  useEffect(() => {
    if (composeUploadStatus !== "uploading") return;
    const t = window.setTimeout(() => setComposeUploadStatus("ready"), ASYNC_UPLOAD_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [composeUploadStatus]);

  const slide = spotlightSlides[slideIndex];
  const composePostReady = asyncReady && (!uiState.composeUploadRequired || composeUploadStatus === "ready");

  return (
    <main
      className="flex min-h-screen bg-black text-[#e7e9ea]"
      onClick={() => { setActiveMenu(null); setTrendingMenu(null); setActiveTweetMenu(null); }}
    >

      {/* ── Left sidebar ── */}
      <aside className="sticky top-0 h-screen w-[275px] flex-shrink-0 flex flex-col justify-between px-3 py-2 border-r border-[#2f3336]">
        <div>
          {/* Chirp logo */}
          <div className="mb-2 flex h-14 w-fit items-center gap-3 rounded-full px-3 pr-5 text-[#e7e9ea] hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d9bf0] shadow-[0_8px_22px_rgba(29,155,240,0.32)]">
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden="true">
                <path d="M4.2 11.6c0-4.5 3.7-7.8 8.5-7.8 4.9 0 8.6 3.3 8.6 7.8s-3.7 7.8-8.6 7.8c-.9 0-1.8-.1-2.6-.4l-4.2 2.5 1.2-4.1a7.4 7.4 0 0 1-2.9-5.8Z" fill="white" />
                <path d="M9.2 10.6h7.1" stroke="#1d9bf0" strokeWidth="1.9" strokeLinecap="round" />
                <path d="M9.2 13.9h4.8" stroke="#1d9bf0" strokeWidth="1.9" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[24px] font-black tracking-normal text-[#e7e9ea]">Chirp</span>
          </div>

          {/* Nav */}
          <nav className="space-y-0.5">
            {[
              { id: "chirp.sidebar.home",          icon: "home"     as const, label: "Home",             active: true },
              { id: "chirp.sidebar.explore",        icon: "explore"  as const, label: "Explore",          active: false },
              { id: "chirp.sidebar.notifications",  icon: "bell"     as const, label: "Notifications",    active: false },
              { id: "chirp.sidebar.messages",       icon: "mail"     as const, label: "Messages",         active: false },
              { id: "chirp.sidebar.grok",           icon: "grok"     as const, label: "Grok",             active: false },
              { id: "chirp.sidebar.bookmarks",      icon: "bookmark" as const, label: "Bookmarks",        active: false },
              { id: "chirp.sidebar.lists",          icon: "list"     as const, label: "Lists",            active: false },
              { id: "chirp.sidebar.creator",        icon: "creator"  as const, label: "Creator Studio",   active: false },
              { id: "chirp.sidebar.profile",        icon: "user"     as const, label: "Profile",          active: false },
            ].map((item) => (
              <button
                key={item.id}
                data-igg-id={item.id}
                className={cx(
                  "flex w-full items-center gap-4 rounded-full px-3 py-3 text-[19px] font-normal transition-colors hover:bg-white/10",
                  item.active ? "font-bold text-[#e7e9ea]" : "text-[#e7e9ea]",
                )}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.label === "Notifications" && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#1d9bf0] text-[11px] font-bold text-white">3</span>
                )}
              </button>
            ))}

            {/* Premium with badge */}
            <button
              data-igg-id="chirp.sidebar.premium"
              className="flex w-full items-center gap-4 rounded-full px-3 py-3 text-[19px] font-normal transition-colors hover:bg-white/10 text-[#e7e9ea]"
            >
              <Icon name="premium" />
              <span>Premium</span>
              <span className="ml-auto rounded-full bg-[#1d9bf0] px-2 py-0.5 text-[10px] font-bold text-white">50% OFF</span>
            </button>
          </nav>

          {/* Post button */}
          <div className="mt-4 flex items-center gap-2">
            <button
              data-igg-id="chirp.sidebar.post"
              className="min-w-0 flex-1 rounded-full bg-[#1d9bf0] px-6 py-3 text-[17px] font-bold text-white hover:bg-[#1a8cd8] transition-colors"
            >
              Post
            </button>
            <div className="group relative flex-shrink-0">
              <button
                data-igg-id="chirp.sidebar.post-options"
                data-igg-type="hover_reveal"
                data-igg-prereq="chirp.sidebar.post-options"
                data-igg-label="Post options"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2f3336] text-[#71767b] transition-colors hover:border-[#1d9bf0]/60 hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0]"
                aria-label="Post options"
              >
                <Icon name="chev-down" />
              </button>
              <div
                data-igg-id="chirp.sidebar.post-options.tooltip"
                className="pointer-events-none absolute left-1/2 top-12 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#e7e9ea] px-2.5 py-1.5 text-xs font-semibold text-black opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
              >
                Post options
              </div>
            </div>
          </div>
        </div>

        {/* Profile footer + dropdown */}
        <div className="relative mb-2" onClick={(e) => e.stopPropagation()}>
          <button
            data-igg-id="chirp.profile.menu.button"
            data-igg-type="menu_reveal"
            onClick={() => setActiveMenu(activeMenu === "profile" ? null : "profile")}
            className="flex w-full items-center gap-3 rounded-full px-3 py-3 hover:bg-white/10 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#333639] text-[13px] font-bold text-white flex-shrink-0">YO</div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-bold text-[#e7e9ea] truncate">You</div>
              <div className="text-xs text-[#71767b] truncate">@yourhandle</div>
            </div>
            <Icon name="more" />
          </button>
          <Dropdown open={activeMenu === "profile"} className="bottom-16 left-0 w-72">
            <div className="px-4 py-3 border-b border-[#2f3336]">
              <div className="font-bold text-[#e7e9ea] text-sm">You</div>
              <div className="text-[#71767b] text-xs">@yourhandle</div>
            </div>
            <MenuItem id="chirp.profile.menu.profile"  type="menu_reveal" prereq="chirp.profile.menu.button"><Icon name="user" /> View profile</MenuItem>
            <MenuItem id="chirp.profile.menu.settings" type="menu_reveal" prereq="chirp.profile.menu.button"><Icon name="settings" /> Settings and support</MenuItem>
          </Dropdown>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-w-0">

        {/* Feed column */}
        <section className="flex-1 max-w-[600px] border-r border-[#2f3336]">

          {/* Sticky tabs */}
          <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
            <div className="flex">
              <button data-igg-id="chirp.feed.tab.for-you" className="flex-1 py-4 text-sm font-bold text-[#e7e9ea] border-b-2 border-[#1d9bf0] hover:bg-white/5 transition-colors">
                For you
              </button>
              <button data-igg-id="chirp.feed.tab.following" className="flex-1 py-4 text-sm font-medium text-[#71767b] hover:bg-white/5 hover:text-[#e7e9ea] transition-colors">
                Following
              </button>
            </div>
          </header>

          {/* Compose box */}
          <div className="border-b border-[#2f3336] px-4 pt-3 pb-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#333639] text-[13px] font-bold text-white">YO</div>
              <div className="flex-1">
                <div className="min-h-[52px] w-full py-2 text-[19px] text-[#71767b] cursor-text">What&apos;s happening?</div>
                <div className="flex items-center justify-between border-t border-[#2f3336] pt-2">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        data-igg-id="chirp.compose.media.button"
                        data-igg-type="menu_reveal"
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "compose-media" ? null : "compose-media"); }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
                      >
                        <Icon name="camera" />
                      </button>
                      <Dropdown open={activeMenu === "compose-media"} className="top-10 left-0 w-48">
                        <MenuItem id="chirp.compose.media.photo" type="menu_reveal" prereq="chirp.compose.media.button"><Icon name="camera" /> Photo / video</MenuItem>
                        <MenuItem id="chirp.compose.media.gif"   type="menu_reveal" prereq="chirp.compose.media.button"><Icon name="gif" /> GIF</MenuItem>
                        <MenuItem id="chirp.compose.media.poll"  type="menu_reveal" prereq="chirp.compose.media.button"><Icon name="poll" /> Poll</MenuItem>
                      </Dropdown>
                    </div>
                    {uiState.composeUploadRequired && (
                      <button
                        data-igg-id="chirp.compose.upload.attach"
                        data-igg-type="async_wait"
                        onClick={() => setComposeUploadStatus("uploading")}
                        className="flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
                      >
                        <Icon name="plus" />
                        {composeUploadStatus === "idle" ? "Attach" : composeUploadStatus === "uploading" ? "Uploading..." : "file attached"}
                      </button>
                    )}
                    <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"><Icon name="gif" /></button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"><Icon name="poll" /></button>
                  </div>
                  <button
                    data-igg-id="chirp.compose.submit"
                    data-igg-type="async_wait"
                    data-igg-label="Post"
                    aria-disabled={!composePostReady ? "true" : undefined}
                    className={cx(
                      "rounded-full px-5 py-1.5 text-sm font-bold text-white transition-colors",
                      composePostReady ? "bg-[#1d9bf0] hover:bg-[#1a8cd8]" : "cursor-wait bg-[#1d9bf0]/40",
                    )}
                  >
                    {composePostReady ? "Post" : "Post"}
                  </button>
                </div>
                {uiState.composeUploadRequired && composeUploadStatus !== "idle" && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#2f3336] bg-[#16181c] px-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d9bf0]/15 text-[#1d9bf0]">
                      <Icon name="embed" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[#e7e9ea]">launch-notes.png</div>
                      <div className="text-xs text-[#71767b]">{composeUploadStatus === "ready" ? "Ready to post" : "Uploading..."}</div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2f3336]">
                        <div
                          className={cx(
                            "h-full rounded-full bg-[#1d9bf0]",
                            composeUploadStatus === "ready" ? "w-full" : "chirp-upload-progress",
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tweet feed */}
          <div ref={tweetsRef}>
            {tweets.map((tweet, idx) => {
              const isFirstTweet = idx === 0;
              const hasDragTarget = idx < 5;
              const tweetMoreButtonId = isFirstTweet ? "chirp.tweet.more.button" : `chirp.tweet.${tweet.slug}.more`;
              return (
                <div
                  key={tweet.slug}
                  data-igg-id={`chirp.tweet.${tweet.slug}.row`}
                  className="group border-b border-[#2f3336] px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <div className="flex gap-3">
                    <Avatar src={tweet.avatar} fallback={tweet.av} bg={tweet.bg} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 min-w-0">
                          <span className="font-bold text-[15px] text-[#e7e9ea] truncate">{tweet.name}</span>
                          {(idx < 3) && <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d9bf0"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" /></svg>}
                          <span className="text-[#71767b] text-[15px] truncate">@{tweet.handle} · {tweet.time}</span>
                        </div>
                        <div className="relative ml-2 flex flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {idx < 8 && (
                            <button
                              data-igg-id={`chirp.tweet.${tweet.slug}.bookmark`}
                              data-igg-type="hover_reveal"
                              data-igg-prereq={`chirp.tweet.${tweet.slug}.row`}
                              data-igg-label={`Bookmark ${tweet.name}'s post`}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#71767b] hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Icon name="bookmark" />
                            </button>
                          )}
                          <button
                            data-igg-id={tweetMoreButtonId}
                            data-igg-type="menu_reveal"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(null);
                              setActiveTweetMenu(activeTweetMenu === tweet.slug ? null : tweet.slug);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#71767b] hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="more" />
                          </button>
                          <Dropdown open={activeTweetMenu === tweet.slug} className="right-0 top-9 w-64">
                            {isFirstTweet ? (
                              <>
                                <MenuItem id="chirp.tweet.more.delete"         type="menu_reveal" prereq="chirp.tweet.more.button" danger><Icon name="trash" /> Delete</MenuItem>
                                <MenuItem id="chirp.tweet.more.pin"            type="menu_reveal" prereq="chirp.tweet.more.button"><Icon name="pin" /> Pin to your profile</MenuItem>
                                <MenuItem id="chirp.tweet.more.not-interested" type="menu_reveal" prereq="chirp.tweet.more.button"><Icon name="flag" /> Not interested in this</MenuItem>
                                <MenuItem id="chirp.tweet.more.embed"          type="menu_reveal" prereq="chirp.tweet.more.button"><Icon name="embed" /> Embed post</MenuItem>
                              </>
                            ) : (
                              <>
                                <MenuItem id={`chirp.tweet.${tweet.slug}.more.not-interested`} type="menu_reveal" prereq={tweetMoreButtonId}><Icon name="flag" /> Not interested in this</MenuItem>
                                <MenuItem id={`chirp.tweet.${tweet.slug}.more.mute`}           type="menu_reveal" prereq={tweetMoreButtonId}><Icon name="mute" /> Mute @{tweet.handle}</MenuItem>
                                <MenuItem id={`chirp.tweet.${tweet.slug}.more.report`}         type="menu_reveal" prereq={tweetMoreButtonId} danger><Icon name="report" /> Report post</MenuItem>
                                <MenuItem id={`chirp.tweet.${tweet.slug}.more.embed`}          type="menu_reveal" prereq={tweetMoreButtonId}><Icon name="embed" /> Embed post</MenuItem>
                              </>
                            )}
                          </Dropdown>
                        </div>
                      </div>

                      <p className="mt-0.5 text-[15px] leading-snug text-[#e7e9ea]">{tweet.text}</p>
                      <TweetMediaGrid media={"media" in tweet ? tweet.media : undefined} tweetSlug={tweet.slug} />

                      <div className="mt-3 flex items-center justify-between text-[#71767b]">
                        <div className="flex items-center gap-4">
                          <button
                            data-igg-id={`chirp.tweet.${tweet.slug}.reply`}
                            data-igg-type="off_screen"
                            data-igg-label={`Reply to ${tweet.name}'s post`}
                            className="group/act flex items-center gap-1.5 text-sm hover:text-[#1d9bf0] transition-colors"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover/act:bg-[#1d9bf0]/10"><Icon name="reply" /></span>
                            <span className="text-[13px]">{fmtNum(tweet.replies)}</span>
                          </button>
                          <button
                            data-igg-id={`chirp.tweet.${tweet.slug}.repost`}
                            data-igg-type="off_screen"
                            data-igg-label={`Repost ${tweet.name}'s post`}
                            className="group/act flex items-center gap-1.5 text-sm hover:text-[#00ba7c] transition-colors"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover/act:bg-[#00ba7c]/10"><Icon name="retweet" /></span>
                            <span className="text-[13px]">{fmtNum(tweet.retweets)}</span>
                          </button>
                          <button
                            data-igg-id={`chirp.tweet.${tweet.slug}.like`}
                            data-igg-type="off_screen"
                            data-igg-label={`Like ${tweet.name}'s post`}
                            className="group/act flex items-center gap-1.5 text-sm hover:text-[#f91880] transition-colors"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover/act:bg-[#f91880]/10"><Icon name="heart" /></span>
                            <span className="text-[13px]">{fmtNum(tweet.likes)}</span>
                          </button>
                        </div>
                        <button
                          data-igg-id={hasDragTarget ? `chirp.tweet.${tweet.slug}.share` : undefined}
                          data-igg-type={hasDragTarget ? "drag_occlusion" : undefined}
                          data-igg-label={hasDragTarget ? `Share ${tweet.name}'s post` : undefined}
                          className="group/act flex items-center gap-1.5 text-sm hover:text-[#1d9bf0] transition-colors"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full group-hover/act:bg-[#1d9bf0]/10"><Icon name="share" /></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </section>

        {/* Right panel */}
        <aside className="hidden xl:block w-[350px] pl-6 pt-3 pr-4">
          {/* Search bar */}
          <div className="mb-4">
            <button
              data-igg-id="chirp.search.bar"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center gap-3 rounded-full bg-[#202327] px-4 py-2.5 text-sm text-[#71767b] hover:bg-[#2c3035] transition-colors border border-transparent hover:border-[#1d9bf0]/30"
            >
              <Icon name="search" /> Search
            </button>
          </div>

          {/* Spotlight banner */}
          <div ref={spotlightRef} className="mb-4 overflow-hidden rounded-2xl bg-[#16181c]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-4">
              <div className="mb-2 grid grid-cols-[82px_1fr_auto] items-center gap-2">
                <div>
                  <span className={cx(
                    "inline-flex min-w-[70px] justify-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                    slide.label === "Live" ? "bg-red-500 text-white" :
                    slide.label === "Breaking" ? "bg-orange-500 text-white" : "bg-[#1d9bf0]/20 text-[#1d9bf0]"
                  )}>{slide.label}</span>
                </div>
                <div className="flex w-8 justify-start gap-1">
                  {spotlightSlides.map((s, i) => (
                    <button
                      key={s.target}
                      data-igg-id={`chirp.spotlight.dot-${i + 1}`}
                      data-igg-type="auto_transition"
                      onClick={() => selectSpotlightSlide(i)}
                      className={cx("h-1.5 w-1.5 rounded-full transition-colors", slideIndex === i ? "bg-[#1d9bf0]" : "bg-[#71767b]")}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#71767b]">Live now</span>
              </div>
              <p className="text-[15px] font-bold leading-snug text-[#e7e9ea]">{slide.title}</p>
              <button
                data-igg-id={slide.target}
                data-igg-type={slide.target.includes("ai-bill") ? "auto_transition" : undefined}
                data-igg-wait-ms={slide.target.includes("ai-bill") ? "3600" : undefined}
                className="mt-3 rounded-full border border-[#1d9bf0] px-4 py-1.5 text-xs font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors"
              >
                {slide.cta}
              </button>
            </div>
          </div>

          {/* What's happening */}
          <div className="relative z-20 mb-4 rounded-2xl bg-[#16181c]" onClick={(e) => e.stopPropagation()}>
            <h3 className="px-4 pt-4 pb-2 text-xl font-extrabold text-[#e7e9ea]">What&apos;s happening</h3>
            {visibleTrendingTopics.map((t) => (
              <div
                key={t.id}
                data-igg-id={`chirp.trending.${t.id}.topic`}
                data-igg-type="off_screen"
                data-igg-label={`Open ${t.tag}`}
                className="relative group/trend px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#71767b]">{t.category}</div>
                    <div className="font-bold text-[15px] text-[#e7e9ea] mt-0.5">{t.tag}</div>
                    <div className="text-xs text-[#71767b] mt-0.5">{t.tweets} posts</div>
                  </div>
                  <div className="relative ml-2 flex-shrink-0">
                    <button
                      data-igg-id={`chirp.trending.${t.id}.more`}
                      data-igg-type="menu_reveal"
                      onClick={(e) => { e.stopPropagation(); setTrendingMenu(trendingMenu === t.id ? null : t.id); }}
                      className={cx(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0]",
                        trendingMenu === t.id ? "bg-[#1d9bf0]/10 text-[#1d9bf0] opacity-100" : "text-[#71767b] opacity-45 group-hover/trend:opacity-100",
                      )}
                    >
                      <Icon name="more" />
                    </button>
                    <Dropdown open={trendingMenu === t.id} className="right-0 top-9 w-64">
                      <MenuItem id={`chirp.trending.${t.id}.not-interested`} type="menu_reveal" prereq={`chirp.trending.${t.id}.more`}><Icon name="flag" /> Not interested in this</MenuItem>
                      <MenuItem id={`chirp.trending.${t.id}.mute`}           type="menu_reveal" prereq={`chirp.trending.${t.id}.more`}><Icon name="mute" /> Mute this topic</MenuItem>
                      <MenuItem id={`chirp.trending.${t.id}.report`}         type="menu_reveal" prereq={`chirp.trending.${t.id}.more`}><Icon name="report" /> Report</MenuItem>
                    </Dropdown>
                  </div>
                </div>
              </div>
            ))}
            <div
              className={cx(
                "overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
                trendsExpanded ? "max-h-72 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              {extraTrendingTopics.map((t) => (
                <div
                  key={t.id}
                  data-igg-id={`chirp.trending.${t.id}.topic`}
                  data-igg-type="off_screen"
                  data-igg-label={`Open ${t.tag}`}
                  className="relative group/trend px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[#71767b]">{t.category}</div>
                      <div className="font-bold text-[15px] text-[#e7e9ea] mt-0.5">{t.tag}</div>
                      <div className="text-xs text-[#71767b] mt-0.5">{t.tweets} posts</div>
                    </div>
                    <div className="relative ml-2 flex-shrink-0">
                      <button
                        data-igg-id={`chirp.trending.${t.id}.more`}
                        data-igg-type="menu_reveal"
                        onClick={(e) => { e.stopPropagation(); setTrendingMenu(trendingMenu === t.id ? null : t.id); }}
                        className={cx(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0]",
                          trendingMenu === t.id ? "bg-[#1d9bf0]/10 text-[#1d9bf0] opacity-100" : "text-[#71767b] opacity-45 group-hover/trend:opacity-100",
                        )}
                      >
                        <Icon name="more" />
                      </button>
                      <Dropdown open={trendingMenu === t.id} className="right-0 top-9 w-64">
                        <MenuItem id={`chirp.trending.${t.id}.not-interested`} type="menu_reveal" prereq={`chirp.trending.${t.id}.more`}><Icon name="flag" /> Not interested in this</MenuItem>
                        <MenuItem id={`chirp.trending.${t.id}.mute`}           type="menu_reveal" prereq={`chirp.trending.${t.id}.more`}><Icon name="mute" /> Mute this topic</MenuItem>
                        <MenuItem id={`chirp.trending.${t.id}.report`}         type="menu_reveal" prereq={`chirp.trending.${t.id}.more`}><Icon name="report" /> Report</MenuItem>
                      </Dropdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              data-igg-id="chirp.trending.show-more"
              onClick={() => setTrendsExpanded((v) => !v)}
              className="flex w-full px-4 py-3 text-left text-sm text-[#1d9bf0] hover:bg-white/5 transition-colors"
            >
              {trendsExpanded ? "Show less" : "Show more"}
            </button>
          </div>

          {/* Who to follow (right panel) */}
          <div className="rounded-2xl bg-[#16181c] overflow-hidden mb-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="px-4 pt-4 pb-2 text-xl font-extrabold text-[#e7e9ea]">Who to follow</h3>
            {rightPanelSuggestions.map((f) => (
              <div key={f.slug} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <Avatar src={f.avatar} fallback={f.av} bg={f.bg} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px] text-[#e7e9ea] truncate">{f.name}</div>
                  <div className="text-sm text-[#71767b] truncate">@{f.handle}</div>
                </div>
                <button
                  data-igg-id={`chirp.suggest.${f.slug}.follow`}
                  data-igg-type="off_screen"
                  data-igg-label={`Follow ${f.name}`}
                  className="rounded-full bg-[#e7e9ea] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#d0d3d7] transition-colors flex-shrink-0"
                >
                  Follow
                </button>
              </div>
            ))}
            <div
              className={cx(
                "overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
                rightFollowExpanded ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              {followSuggestions.slice(3).map((f) => (
                <div key={f.slug} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <Avatar src={f.avatar} fallback={f.av} bg={f.bg} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-[#e7e9ea] truncate">{f.name}</div>
                    <div className="text-sm text-[#71767b] truncate">@{f.handle}</div>
                  </div>
                  <button
                    data-igg-id={`chirp.suggest.${f.slug}.follow`}
                    data-igg-type="off_screen"
                    data-igg-label={`Follow ${f.name}`}
                    className="rounded-full bg-[#e7e9ea] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#d0d3d7] transition-colors flex-shrink-0"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
            <button
              data-igg-id="chirp.suggest.show-more"
              onClick={() => setRightFollowExpanded((v) => !v)}
              className="flex w-full px-4 py-3 text-left text-sm text-[#1d9bf0] hover:bg-white/5 transition-colors"
            >
              {rightFollowExpanded ? "Show less" : "Show more"}
            </button>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
            {["Terms of Service", "Privacy Policy", "Cookie Policy", "Accessibility", "Ads info", "More"].map((l) => (
              <span key={l} className="text-xs text-[#71767b] hover:underline cursor-pointer">{l}</span>
            ))}
            <span className="text-xs text-[#71767b]">© 2026 Chirp Corp.</span>
          </div>
        </aside>
      </div>

      {/* ── Search modal ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 pt-16 px-4" onClick={() => setSearchOpen(false)}>
          <div className="mx-auto w-[600px] overflow-hidden rounded-2xl bg-black border border-[#2f3336] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-[#2f3336] px-4 py-3">
              <span className="text-[#71767b]"><Icon name="search" /></span>
              <input data-igg-id="chirp.search.input" className="flex-1 text-[17px] outline-none bg-transparent text-[#e7e9ea] placeholder:text-[#71767b]" defaultValue="" placeholder="Search Chirp" autoFocus />
              <button data-igg-id="chirp.search.close" onClick={() => setSearchOpen(false)} className="rounded-full p-2 hover:bg-white/10 text-[#71767b]"><Icon name="x" /></button>
            </div>
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-bold text-[#71767b] uppercase tracking-wide">Recent searches</div>
              {["AI Safety Bill", "#TechSummit2026", "Chirp API v3", "@lenahayes"].map((q) => (
                <button key={q} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#e7e9ea] hover:bg-white/5">
                  <span className="text-[#71767b]"><Icon name="search" /></span>{q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Notification toasts (async_wait — states 6/7/8) ── */}
      {asyncReady && uiState.notificationType === "follow-request" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl border border-[#2f3336] bg-black px-5 py-4 shadow-2xl w-[400px]">
          <img src="https://i.pravatar.cc/40?img=12" alt="alex_dev" className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#e7e9ea]">@alex_dev wants to follow you</p>
            <p className="text-xs text-[#71767b]">You have a new follow request</p>
          </div>
          <div className="flex gap-2">
            <button
              data-igg-id="chirp.notification.accept"
              data-igg-type="async_wait"
              className="rounded-full bg-[#e7e9ea] px-4 py-1.5 text-sm font-bold text-black hover:bg-[#d0d3d7] transition-colors"
            >Accept</button>
            <button className="rounded-full border border-[#536471] px-4 py-1.5 text-sm font-bold text-[#e7e9ea] hover:bg-white/10 transition-colors">Decline</button>
          </div>
        </div>
      )}
      {asyncReady && uiState.notificationType === "mention" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl border border-[#2f3336] bg-black px-5 py-4 shadow-2xl w-[400px]">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1d9bf0]/20 text-[#1d9bf0]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#e7e9ea]">@sara_m mentioned you</p>
            <p className="text-xs text-[#71767b] truncate">"loving this thread by @you on AI tools"</p>
          </div>
          <button
            data-igg-id="chirp.notification.view"
            data-igg-type="async_wait"
            className="rounded-full border border-[#536471] px-4 py-1.5 text-sm font-bold text-[#e7e9ea] hover:bg-white/10 transition-colors flex-shrink-0"
          >View</button>
        </div>
      )}
      {asyncReady && uiState.notificationType === "milestone" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl border border-[#2f3336] bg-black px-5 py-4 shadow-2xl w-[420px]">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f91880]/20 text-[#f91880]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#e7e9ea]">Your post hit 100 likes 🎉</p>
            <p className="text-xs text-[#71767b]">See how your content is performing</p>
          </div>
          <button
            data-igg-id="chirp.notification.view-analytics"
            data-igg-type="async_wait"
            className="rounded-full bg-[#1d9bf0] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#1a8cd8] transition-colors flex-shrink-0"
          >View Analytics</button>
        </div>
      )}

      {/* ── Phone verification dialog (popup_occlusion) ── */}
      {phoneDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[480px] rounded-2xl bg-black border border-[#2f3336] p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#e7e9ea]">Verify your phone</h2>
                <p className="mt-2 text-[15px] text-[#71767b]">Add a phone number for extra account security. We&apos;ll send a verification code.</p>
              </div>
              <button data-igg-id="chirp.popup.dismiss" onClick={() => setPhoneDialogOpen(false)} className="rounded-full p-2 hover:bg-white/10 text-[#71767b] flex-shrink-0"><Icon name="x" /></button>
            </div>
            <div className="mt-2 rounded-2xl border border-[#2f3336] px-4 py-3">
              <div className="text-xs text-[#71767b] mb-1">Phone number</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#71767b]">+1</span>
                <input className="flex-1 text-sm outline-none bg-transparent text-[#e7e9ea] placeholder:text-[#3e4145]" placeholder="(555) 000-0000" />
              </div>
            </div>
            <button className="mt-5 w-full rounded-full bg-[#e7e9ea] py-3 text-[15px] font-bold text-black hover:bg-[#d0d3d7] transition-colors">Send code</button>
          </div>
        </div>
      )}

      {/* ── DM panel (drag_occlusion) ── */}
      {uiState.dmPanelOpen && (
        <div
          data-igg-id="chirp.drag.blocker"
          onMouseDown={panel.onMouseDown}
          className="fixed z-40 w-[430px] cursor-grab rounded-2xl border border-[#2f3336] bg-black shadow-2xl active:cursor-grabbing"
          style={{ left: panel.pos.x, top: panel.pos.y }}
        >
          <div className="flex items-center justify-between border-b border-[#2f3336] px-4 py-3 rounded-t-2xl">
            <div className="flex items-center gap-2 text-sm font-bold text-[#e7e9ea]"><Icon name="drag" /> Messages</div>
            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-[#71767b]"><Icon name="search" /></button>
              <span className="text-xs text-[#71767b]">Drag to move</span>
            </div>
          </div>
          <div className="divide-y divide-[#2f3336]">
            {dmConversations.map((dm) => (
              <div key={dm.name} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                <div className={cx("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white", dm.bg)}>{dm.av}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] text-[#e7e9ea] truncate">{dm.name}</span>
                    <span className="text-xs text-[#71767b] flex-shrink-0 ml-2">{dm.time}</span>
                  </div>
                  <div className="text-sm text-[#71767b] truncate">{dm.preview}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-[#2f3336]">
            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1d9bf0]/10 py-2 text-sm font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/20 transition-colors">
              <Icon name="plus" /> New message
            </button>
          </div>
        </div>
      )}

      {/* ── Compact DM upload panel (async file upload) ── */}
      {uiState.dmUploadPanelOpen && (
        <div
          data-igg-id="chirp.dm.upload.panel"
          className="fixed bottom-5 right-5 z-40 w-[360px] overflow-hidden rounded-2xl border border-[#2f3336] bg-black shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[#2f3336] px-4 py-3">
            <div>
              <div className="text-sm font-bold text-[#e7e9ea]">Message Kai</div>
              <div className="text-xs text-[#71767b]">@kaisullivan</div>
            </div>
            <span className="rounded-full bg-[#1d9bf0]/10 px-2 py-1 text-[11px] font-semibold text-[#1d9bf0]">DM</span>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="rounded-2xl border border-[#2f3336] bg-[#16181c] px-3 py-3">
              <div className="text-sm text-[#e7e9ea]">Can you review this spec?</div>
              <div className="mt-1 text-xs text-[#71767b]">Attach the file before sending.</div>
            </div>

            <button
              data-igg-id="chirp.dm.upload.attach"
              data-igg-type="async_wait"
              onClick={() => setDmUploadStatus("uploading")}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#2f3336] px-4 py-2.5 text-sm font-semibold text-[#e7e9ea] transition-colors hover:bg-white/5"
            >
              <Icon name="plus" />
              {dmUploadStatus === "idle" ? "Attach file" : dmUploadStatus === "uploading" ? "Uploading spec.pdf..." : "spec.pdf attached"}
            </button>

            {dmUploadStatus !== "idle" && (
              <div className="flex items-center gap-3 rounded-xl bg-[#16181c] px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d9bf0]/15 text-[#1d9bf0]">
                  <Icon name="embed" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#e7e9ea]">spec.pdf</div>
                  <div className="text-xs text-[#71767b]">{dmUploadStatus === "ready" ? "Ready to send" : "Uploading..."}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2f3336]">
                    <div
                      className={cx(
                        "h-full rounded-full bg-[#1d9bf0]",
                        dmUploadStatus === "ready" ? "w-full" : "chirp-upload-progress",
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                data-igg-id="chirp.dm.upload.file-button"
                data-igg-type="async_wait"
                aria-disabled={dmUploadStatus !== "ready" ? "true" : undefined}
                className={cx(
                  "rounded-full border px-4 py-2.5 text-sm font-bold transition-colors",
                  dmUploadStatus === "ready"
                    ? "border-[#1d9bf0] text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                    : "cursor-wait border-[#2f3336] text-[#71767b]",
                )}
              >
                Upload file
              </button>
              <button
                data-igg-id="chirp.dm.upload.send"
                data-igg-type="async_wait"
                aria-disabled={dmUploadStatus !== "ready" ? "true" : undefined}
                className={cx(
                  "rounded-full px-4 py-2.5 text-sm font-bold transition-colors",
                  dmUploadStatus === "ready"
                    ? "bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]"
                    : "cursor-wait bg-[#1d9bf0]/35 text-white/60",
                )}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ChirpPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <ChirpApp />
    </Suspense>
  );
}
