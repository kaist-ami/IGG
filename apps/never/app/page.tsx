"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNeverBenchmarkState } from "./never-states";
import { createReviewRuntime } from "../../../lib/review-runtime";

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = "#2563EB";
const BRAND_DARK = "#1D4ED8";
const BRAND_LIGHT = "#DBEAFE";

function BookmarkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.75C7 3.78 7.78 3 8.75 3h6.5C16.22 3 17 3.78 17 4.75v15.1l-5-3.05-5 3.05V4.75Z"
        fill="currentColor"
      />
      <path
        d="M8.75 4.5h6.5c.14 0 .25.11.25.25v12.42l-2.72-1.66a1.5 1.5 0 0 0-1.56 0L8.5 17.17V4.75c0-.14.11-.25.25-.25Z"
        fill="white"
        fillOpacity="0.28"
      />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = "ko" | "en" | "ja";

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
const DICTIONARY_LABELS = new Set(["Dictionary", "사전", "辞書"]);

function resolveInteractiveReviewElement(element: HTMLElement | null) {
  if (!element) return null;
  if (element.getAttribute("data-igg-id")) return element;
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
  runtimeStateKey: "__NEVER_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  resolveActionElement: resolveInteractiveReviewElement,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

type NewsItem = {
  id: number;
  category: string;
  title: string;
  press: string;
  time: string;
  img: string;
};

type TrendingItem = {
  rank: number;
  keyword: string;
  change: "up" | "down" | "new" | "same";
  diff?: number;
};

const WEATHER_ROW_IDS: Partial<Record<string, string>> = {
  Mon: "never.weather.mon-row",
  Tue: "never.weather.tue-row",
  Wed: "never.weather.wed-row",
  Thu: "never.weather.thu-row",
  Fri: "never.weather.fri-row",
  Sat: "never.weather.sat-row",
  Sun: "never.weather.sun-row",
};

const TRENDING_RANK_IDS: Partial<Record<number, string>> = {
  1: "never.trending.rank-1",
  2: "never.trending.rank-2",
  3: "never.trending.rank-3",
  5: "never.trending.rank-5",
  10: "never.trending.rank-10",
  15: "never.trending.rank-15",
};

type StockItem = {
  name: string;
  value: number;
  base: number;
  change: number;
  pct: number;
};

type CalendarMonth = {
  key: string;
  title: string;
  leadingEmpty: number;
  days: number;
  today?: number;
};

// ─── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  ko: {
    searchPlaceholder: "검색어를 입력해 주세요",
    login: "로그인",
    appDownload: "앱 다운로드",
    trending: "실시간 검색어",
    weather: "날씨",
    stock: "증권",
    entertainment: "연예 TV",
    sports: "스포츠",
    todayTopics: "오늘의 주제",
    pressEdit: "퍼블리셔",
    topicCast: "주제별캐스트",
    moreNews: "더보기",
    fold: "접기",
    seeMore: "더보기",
    weeklyOpen: "주간 예보 보기 ▾",
    weeklyClose: "주간 예보 닫기 ▲",
    loginPrompt: "로그인하고 Never를 더 편리하게",
    findId: "아이디 찾기",
    findPw: "비밀번호 찾기",
    signUp: "회원가입",
    agree: "동의",
    close: "닫기",
    cookieText: "Never는 서비스 향상을 위해 쿠키를 사용합니다. 계속 이용하시면 ",
    privacy: "개인정보처리방침",
    cookie: "쿠키 정책",
    cookieSuffix: "에 동의하는 것으로 간주됩니다.",
    breaking: "헤드라인",
    see20: "20위까지 보기 ▾",
    top10: "접기 ▲",
    justNow: "방금 전",
    adLabel: "광고",
    shortcuts: ["메일","카페","블로그","지식iN","쇼핑","Pay","TV","사전","뉴스","증권","부동산","지도","웹툰","여행","책","영화","뮤직","웨일","클로바","시리즈"],
    nav: ["메일","카페","블로그","지식iN","쇼핑","Pay","TV","사전","뉴스","증권","부동산","지도","웹툰","더보기 ▾"],
    footer: ["회사소개","인재채용","투자자정보","약관","개인정보처리방침","청소년보호정책","고객센터","광고 문의","제휴 문의"],
    footerCols: [
      { title: "회사", links: ["Never 소개","캠퍼스 채용","그린팩토리"] },
      { title: "서비스", links: ["Never 블로그","Never 카페","클로바"] },
      { title: "파트너", links: ["Never 광고","스마트스토어","라인"] },
      { title: "지원", links: ["고객센터","공지사항","서비스 현황"] },
    ],
    copyright: "© 2026 Never Corp. All Rights Reserved.",
    expand: "펼치기",
    collapse: "접기",
    issues: "이슈",
    relatedSearch: "연관 검색어",
    recentSearch: "최근 검색어",
    acOff: "자동완성 끄기",
    saveOff: "검색어 저장 끄기",
    otherLogin: "다른 계정으로 로그인",
    loading: "불러오는 중...",
    refresh: "새로고침",
  },
  en: {
    searchPlaceholder: "Search...",
    login: "Sign In",
    appDownload: "Get App",
    trending: "Trending Now",
    weather: "Weather",
    stock: "Markets",
    entertainment: "Entertainment",
    sports: "Sports",
    todayTopics: "Today's Topics",
    pressEdit: "Publisher",
    topicCast: "By Category",
    moreNews: "More",
    fold: "Collapse",
    seeMore: "See More",
    weeklyOpen: "Show weekly forecast ▾",
    weeklyClose: "Hide weekly forecast ▲",
    loginPrompt: "Sign in for a better Never experience",
    findId: "Find ID",
    findPw: "Find Password",
    signUp: "Sign Up",
    agree: "Accept",
    close: "Close",
    cookieText: "Never uses cookies to improve our services. By continuing, you agree to our ",
    privacy: "Privacy Policy",
    cookie: "Cookie Policy",
    cookieSuffix: ".",
    breaking: "BREAKING NEWS",
    see20: "See Top 20 ▾",
    top10: "Show Less ▲",
    justNow: "Just now",
    adLabel: "AD",
    shortcuts: ["Mail","Cafe","Blog","Q&A","Shopping","Pay","TV","Dictionary","News","Markets","Real Estate","Maps","Webtoon","Travel","Books","Movies","Music","Whale","Clova","Series"],
    nav: ["Mail","Cafe","Blog","Q&A","Shopping","Pay","TV","Dictionary","News","Markets","Real Estate","Maps","Webtoon","More ▾"],
    footer: ["About","Careers","Investors","Terms","Privacy Policy","Youth Policy","Help","Advertise","Partners"],
    footerCols: [
      { title: "Company", links: ["About Never","Campus Hiring","Green Factory"] },
      { title: "Services", links: ["Never Blog","Never Cafe","Clova"] },
      { title: "Partners", links: ["Never Ads","Smart Store","Line"] },
      { title: "Support", links: ["Help Center","Announcements","Status"] },
    ],
    copyright: "© 2026 Never Corp. All Rights Reserved.",
    expand: "Expand",
    collapse: "Collapse",
    issues: "Issues",
    relatedSearch: "Related searches",
    recentSearch: "Recent searches",
    acOff: "Disable autocomplete",
    saveOff: "Don't save searches",
    otherLogin: "Or sign in with",
    loading: "Loading...",
    refresh: "Refresh",
  },
  ja: {
    searchPlaceholder: "検索ワードを入力してください",
    login: "ログイン",
    appDownload: "アプリDL",
    trending: "急上昇ワード",
    weather: "天気",
    stock: "株式",
    entertainment: "エンタメ",
    sports: "スポーツ",
    todayTopics: "今日のトピック",
    pressEdit: "パブリッシャー",
    topicCast: "カテゴリ別",
    moreNews: "もっと見る",
    fold: "閉じる",
    seeMore: "もっと見る",
    weeklyOpen: "週間天気を見る ▾",
    weeklyClose: "閉じる ▲",
    loginPrompt: "ログインしてNeverをもっと便利に",
    findId: "ID検索",
    findPw: "PW検索",
    signUp: "新規登録",
    agree: "同意する",
    close: "閉じる",
    cookieText: "NeverはサービスのためCookieを使用します。続けてご利用の場合は ",
    privacy: "プライバシーポリシー",
    cookie: "Cookieポリシー",
    cookieSuffix: "に同意したものとみなします。",
    breaking: "ヘッドライン",
    see20: "トップ20を見る ▾",
    top10: "閉じる ▲",
    justNow: "たった今",
    adLabel: "広告",
    shortcuts: ["メール","カフェ","ブログ","知識iN","ショッピング","Pay","TV","辞書","ニュース","株式","不動産","地図","ウェブトゥーン","旅行","本","映画","ミュージック","Whale","Clova","シリーズ"],
    nav: ["メール","カフェ","ブログ","知識iN","ショッピング","Pay","TV","辞書","ニュース","株式","不動産","地図","ウェブトゥーン","もっと ▾"],
    footer: ["会社概要","採用情報","投資家情報","利用規約","プライバシーポリシー","青少年保護方針","サポート","広告","提携"],
    footerCols: [
      { title: "会社", links: ["Neverについて","採用情報","グリーンファクトリー"] },
      { title: "サービス", links: ["Neverブログ","Neverカフェ","Clova"] },
      { title: "パートナー", links: ["Never広告","スマートストア","Line"] },
      { title: "サポート", links: ["ヘルプセンター","お知らせ","サービス状況"] },
    ],
    copyright: "© 2026 Never Corp. All Rights Reserved.",
    expand: "展開する",
    collapse: "閉じる",
    issues: "イシュー",
    relatedSearch: "関連検索",
    recentSearch: "最近の検索",
    acOff: "自動完成をオフ",
    saveOff: "検索履歴を保存しない",
    otherLogin: "他のアカウントでログイン",
    loading: "読み込み中...",
    refresh: "更新",
  },
} as const;

// ─── News data ─────────────────────────────────────────────────────────────────

// ─── i18n time keys ──────────────────────────────────────────────────────────
const TM: Record<string, string> = {
  jn:"Just now",m3:"3 min ago",m25:"25 min ago",m38:"38 min ago",m52:"52 min ago",h1:"1 hr ago",h2:"2 hr ago",h3:"3 hr ago",h4:"4 hr ago",h5:"5 hr ago",h6:"6 hr ago",h7:"7 hr ago"
};

type LocalizedItem = {
  id: number;
  cat: string;
  title: string;
  press: string;
  tk: string;
  img: string;
};
function loc(item: LocalizedItem): NewsItem {
  return { id: item.id, category: item.cat, title: item.title, press: item.press, time: TM[item.tk], img: item.img };
}

// ─── Featured carousel (Animated/Shifting #1) ────────────────────────────────
const FEATURED_L: LocalizedItem[] = [
  { id:1, cat:"Politics", title:"National Briefing Puts Livelihood Stability and Investment at the Top of the Agenda", press:"Policy Brief", tk:"jn", img:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=740&h=400&fit=crop&auto=format&q=80" },
  { id:2, cat:"Economy", title:"KOSPI Breaks 2,650 — Semiconductor and Auto Stocks Surge in Tandem", press:"Market Report", tk:"m3", img:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=740&h=400&fit=crop&auto=format&q=80" },
  { id:3, cat:"Tech", title:"Next-Gen HBM4 Enters Mass Production as AI Chip Supply Race Intensifies", press:"Tech Brief", tk:"m25", img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=740&h=400&fit=crop&auto=format&q=80" },
  { id:4, cat:"World", title:"Summit Opens with Ukraine Support and Supply Chain Stability at the Center", press:"Global Report", tk:"m38", img:"https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?w=740&h=400&fit=crop&auto=format&q=80" },
  { id:5, cat:"Society", title:"Nationwide Air Quality Alert: Health Authorities Urge Mask Wearing", press:"Life Daily", tk:"m52", img:"https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=740&h=400&fit=crop&auto=format&q=80" },
];

// ─── Localized tab news ──────────────────────────────────────────────────────
const TAB_NEWS_L: Record<number, LocalizedItem[]> = {
  0: [
    { id:100, cat:"Politics", title:"Ruling and Opposition Clash at Budget Committee Over Stimulus Payment Scale", press:"Politics Desk", tk:"h1", img:"https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=200&h=130&fit=crop&q=80" },
    { id:101, cat:"Politics", title:"Regulatory Reform Package Expands Early-Stage Startup Support", press:"Policy Brief", tk:"h2", img:"https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=200&h=130&fit=crop&q=80" },
    { id:102, cat:"Politics", title:"Opposition to Refile Special Counsel Bill — Ruling Party Pushback Intensifies", press:"Focus Report", tk:"h3", img:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=130&fit=crop&q=80" },
    { id:103, cat:"Politics", title:"One Year to Local Elections — Party Candidate Lineups Begin to Take Shape", press:"City Wire", tk:"h4", img:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200&h=130&fit=crop&q=80" },
    { id:104, cat:"Politics", title:"Foreign Ministry Explores Stronger Korea-US-Japan Trilateral Cooperation", press:"Global Now", tk:"h5", img:"https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=200&h=130&fit=crop&q=80" },
  ],
  1: [
    { id:110, cat:"Economy", title:"Key Rate Held for a Third Meeting as Officials Watch Inflation Trends", press:"Market Report", tk:"h1", img:"https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=130&fit=crop&q=80" },
    { id:111, cat:"Economy", title:"USD/KRW Exchange Rate Falls 8 Won Day-over-Day to 1,341 Level", press:"Brief Post", tk:"h2", img:"https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=200&h=130&fit=crop&q=80" },
    { id:112, cat:"Economy", title:"Domestic Automakers Set a New North America Market Share Record", press:"Industry Watch", tk:"h2", img:"https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200&h=130&fit=crop&q=80" },
    { id:113, cat:"Economy", title:"Seoul Apartment Deposit-to-Price Ratio Tops 60% — Gap Investment Warning Signals Raised", press:"Morning Line", tk:"h3", img:"https://images.unsplash.com/photo-1555636222-cae831e670b3?w=200&h=130&fit=crop&q=80" },
    { id:114, cat:"Economy", title:"Exports Rise for Third Straight Month, Led by Semiconductors", press:"Market Desk", tk:"h4", img:"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=130&fit=crop&q=80" },
  ],
  2: [
    { id:120, cat:"Society", title:"Nationwide Teachers' Rally Announced as Education Officials Call for Talks", press:"Life Daily", tk:"h1", img:"https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=130&fit=crop&q=80" },
    { id:121, cat:"Society", title:"Seoul Metro Line 2 Gets New Trains — Congestion Relief Expected", press:"City Wire", tk:"h2", img:"https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=200&h=130&fit=crop&q=80" },
    { id:122, cat:"Society", title:"Government Announces Low-Birthrate Plan — First-Child Childcare Allowance Expanded Sharply", press:"Daily View", tk:"h3", img:"https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=200&h=130&fit=crop&q=80" },
    { id:123, cat:"Society", title:"Gangnam District Expands AI Illegal Parking Enforcement Citywide", press:"Brief Post", tk:"h4", img:"https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200&h=130&fit=crop&q=80" },
    { id:124, cat:"Society", title:"Peak Spring Yellow Dust — Jeju and South Jeolla Hit 'Very Bad' Air Quality", press:"Life Daily", tk:"h5", img:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=130&fit=crop&q=80" },
  ],
  3: [
    { id:130, cat:"Life", title:"Top 10 Spring Outing Destinations Revealed — Plan Your Perfect Weekend Trip", press:"Weekend Pick", tk:"h1", img:"https://images.unsplash.com/photo-1490349368154-73de9c9bc37c?w=200&h=130&fit=crop&q=80" },
    { id:131, cat:"Life", title:"The Complete Guide to Spring Wild Greens — Recipes for Wild Chives, Shepherd's Purse & Mugwort", press:"Life Note", tk:"h2", img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=130&fit=crop&q=80" },
    { id:132, cat:"Life", title:"Home Café Craze — Espresso Machine Sales Surge 40% Year-on-Year", press:"Life Note", tk:"h3", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=130&fit=crop&q=80" },
    { id:133, cat:"Culture", title:"National Museum of Korea Spring Exhibition Opens: 'Culture of the Joseon Royal Court'", press:"Culture Log", tk:"h4", img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=200&h=130&fit=crop&q=80" },
    { id:134, cat:"Culture", title:"Seoul Book Festival Opens This Month — Author Signings and Readings Line the Program", press:"Book Review", tk:"h5", img:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=130&fit=crop&q=80" },
  ],
  4: [
    { id:140, cat:"World", title:"EU Imposes Additional 25% Tariff on Chinese EVs — Trade Tensions Escalate", press:"Global Report", tk:"h1", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=130&fit=crop&q=80" },
    { id:141, cat:"World", title:"US Federal Reserve Signals Rate Cut This Year — Markets Rally", press:"Global Report", tk:"h2", img:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=130&fit=crop&q=80" },
    { id:142, cat:"World", title:"Japan's Cherry Blossoms Bloom Earlier Than Ever — Linked to Climate Anomalies", press:"World View", tk:"h3", img:"https://images.unsplash.com/photo-1522383225653-ed111181a951?w=200&h=130&fit=crop&q=80" },
    { id:143, cat:"World", title:"Israel-Hamas Ceasefire Talks Resume — Mediators Draw Global Attention", press:"Global Now", tk:"h4", img:"https://images.unsplash.com/photo-1526470498-9ae73c665de8?w=200&h=130&fit=crop&q=80" },
    { id:144, cat:"World", title:"China Announces Spring Stimulus Package — All-Out Push to Boost Consumer Spending", press:"Focus Report", tk:"h5", img:"https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=200&h=130&fit=crop&q=80" },
  ],
  5: [
    { id:150, cat:"Tech", title:"Next-Gen MR Headset Debuts with a New Workboard Mode", press:"Platform Wire", tk:"h1", img:"https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=200&h=130&fit=crop&q=80" },
    { id:151, cat:"Tech", title:"Document Assistant Launches to Automate Repetitive Workflows", press:"Signal Desk", tk:"h2", img:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=200&h=130&fit=crop&q=80" },
    { id:152, cat:"Science", title:"Research Team Demonstrates a Low-Power Quantum Link Component", press:"Lab Journal", tk:"h3", img:"https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=130&fit=crop&q=80" },
    { id:153, cat:"Tech", title:"Cloud Platform Opens a New Platform Engineering Hiring Track", press:"Stack Ledger", tk:"h4", img:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=130&fit=crop&q=80" },
    { id:154, cat:"Tech", title:"Tablet OS 3.2 Rolls Out with Faster Window Switching", press:"Kernel Post", tk:"h5", img:"https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=200&h=130&fit=crop&q=80" },
  ],
  6: [
    { id:160, cat:"Entertainment", title:"New Live Film Sells Out All Pre-Reservations in 1 Hour", press:"Stage Monitor", tk:"h1", img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=130&fit=crop&q=80" },
    { id:161, cat:"Entertainment", title:"Micro-Series Premiere Sends Platform Watch Time Up Sharply", press:"Frame Weekly", tk:"h2", img:"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=130&fit=crop&q=80" },
    { id:162, cat:"Entertainment", title:"New Harbor Thriller Enters an International Showcase Section", press:"Cinema Grid", tk:"h3", img:"https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&h=130&fit=crop&q=80" },
    { id:163, cat:"Entertainment", title:"Extra Night Pop-Up Shows Added as Booking Queues Form", press:"Loop Press", tk:"h4", img:"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=130&fit=crop&q=80" },
    { id:164, cat:"Entertainment", title:"Small-Venue World Circuit Dates Roll Out in Stages", press:"Echo Review", tk:"h5", img:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&h=130&fit=crop&q=80" },
  ],
  7: [
    { id:170, cat:"Sports", title:"Club Extends Its Unbeaten Run with Late Back-to-Back Goals", press:"Match Signal", tk:"h1", img:"https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&h=130&fit=crop&q=80" },
    { id:171, cat:"Sports", title:"Season Opener Ends with a Walk-Off in the 10th Inning", press:"Diamond Wire", tk:"h2", img:"https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=200&h=130&fit=crop&q=80" },
    { id:172, cat:"Sports", title:"Volleyball Club Expands Its Youth Clinic Tour Program", press:"Court File", tk:"h3", img:"https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=200&h=130&fit=crop&q=80" },
    { id:173, cat:"Sports", title:"Club Finalizes Its New-Season Roster with Revised Long-Term Options", press:"Touchline Post", tk:"h4", img:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=130&fit=crop&q=80" },
    { id:174, cat:"Sports", title:"Expansion Club Opens with a Debut Win and Record Attendance", press:"Arena Ledger", tk:"h5", img:"https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=200&h=130&fit=crop&q=80" },
  ],
};

// ─── Publisher cards (Async Updates #4) ──────────────────────────────────────
type PressItem = { press: string; abbr: string; color: string; news: string; img: string; };
const PRESS_L: PressItem[] = [
  { press:"Morning Line", abbr:"ML", color:"#1e40af", news:"Seoul Apartment Deposit Ratio Tops 60% — Gap Investment Alert Raised", img:"https://images.unsplash.com/photo-1555636222-cae831e670b3?w=280&h=160&fit=crop&q=80" },
  { press:"Market Desk", abbr:"MD", color:"#dc2626", news:"KOSPI Breaks 2,650 — Semiconductor and Auto Stocks Surge Together", img:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=280&h=160&fit=crop&q=80" },
  { press:"City Wire", abbr:"RTR", color:"#7c3aed", news:"President's New Year Conference: Economic Recovery Declared Top Priority", img:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=280&h=160&fit=crop&q=80" },
  { press:"Daily View", abbr:"DV", color:"#059669", news:"Nationwide Air Quality Alert: Authorities Urge Mask Wearing Nationwide", img:"https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=280&h=160&fit=crop&q=80" },
  { press:"Brief Post", abbr:"BP", color:"#d97706", news:"USD/KRW Settles at 1,340 Level — Export Companies Poised to Benefit", img:"https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=280&h=160&fit=crop&q=80" },
  { press:"Global Now", abbr:"GN", color:"#0891b2", news:"Summit Opens — Ukraine Support Tops the Agenda", img:"https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?w=280&h=160&fit=crop&q=80" },
  { press:"Weekend Pick", abbr:"WP", color:"#be185d", news:"Top 10 Spring Destinations Revealed — Make Your Weekend Plans Now", img:"https://images.unsplash.com/photo-1490349368154-73de9c9bc37c?w=280&h=160&fit=crop&q=80" },
  { press:"Focus Report", abbr:"FR", color:"#92400e", news:"National Teachers Union Announces Strike — Education Ministry Urges Dialogue", img:"https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=280&h=160&fit=crop&q=80" },
];

// ─── Trending (per language) ──────────────────────────────────────────────────
const TRENDING: TrendingItem[] = [
  { rank:1, keyword:"AsteraOS patch", change:"same" },{ rank:2, keyword:"Nimbus Pass", change:"up", diff:2 },{ rank:3, keyword:"HarborCloud roles", change:"new" },{ rank:4, keyword:"LatticePad preorder", change:"up", diff:1 },{ rank:5, keyword:"MiraeQ chip", change:"down", diff:1 },
  { rank:6, keyword:"Pixel Garden", change:"up", diff:3 },{ rank:7, keyword:"Orbit Note", change:"new" },{ rank:8, keyword:"Cinder Market", change:"down", diff:2 },{ rank:9, keyword:"Echo Rail", change:"same" },{ rank:10, keyword:"Prism Wallet", change:"up", diff:4 },
  { rank:11, keyword:"Luna Port", change:"up", diff:1 },{ rank:12, keyword:"Northwind Pass", change:"down", diff:3 },{ rank:13, keyword:"Quiet Lab", change:"new" },{ rank:14, keyword:"Solar Desk", change:"same" },{ rank:15, keyword:"Vector Camp", change:"up", diff:5 },
  { rank:16, keyword:"Paper Mint", change:"down", diff:2 },{ rank:17, keyword:"Nova Pantry", change:"up", diff:2 },{ rank:18, keyword:"Glass Harbor", change:"same" },{ rank:19, keyword:"Thread Dome", change:"down", diff:4 },{ rank:20, keyword:"Mellow Grid", change:"new" },
];

const BENCHMARK_KEYWORD = "Interactive GUI benchmark";

function cloneTrending(items: TrendingItem[]) {
  return items.map((item) => ({ ...item }));
}

function resequenceTrending(items: TrendingItem[]) {
  return items.slice(0, 20).map((item, index) => ({ ...item, rank: index + 1 }));
}

function withBenchmarkKeyword(
  items: TrendingItem[],
  rank: number,
  change: TrendingItem["change"],
  diff?: number
) {
  const next = cloneTrending(items).filter((item) => item.keyword !== BENCHMARK_KEYWORD);
  next.splice(Math.max(0, rank - 1), 0, {
    rank,
    keyword: BENCHMARK_KEYWORD,
    change,
    ...(diff !== undefined ? { diff } : {}),
  });

  return resequenceTrending(next);
}

function buildFixedTrendingScenarios() {
  const base = cloneTrending(TRENDING);
  const scenarioOne = resequenceTrending(base);
  const scenarioTwo = withBenchmarkKeyword(base, 4, "new");
  const scenarioThree = withBenchmarkKeyword(base, 1, "new");

  return [scenarioOne, scenarioTwo, scenarioThree];
}

// ─── Autocomplete (per language) ──────────────────────────────────────────────
const AUTOCOMPLETE: Record<string, string[]> = {
  "": ["weather","AsteraOS","Nimbus Pass","Orbit Note","Prism Wallet","lottery numbers","Echo Rail","today's news"],
  "w": ["weather","weather today","weekly forecast","weather Seoul"],
  "a": ["AsteraOS","Aster Glass","AI workboard","air quality"],
  "n": ["Nimbus Pass","Northwind Pass","Nova Pantry","news today"],
  "o": ["Orbit Note","Ocean Ledger","Open Harbor","outdoor forecast"],
  "p": ["Prism Wallet","Pixel Garden","Paper Mint","platform jobs"],
  "q": ["Quiet Lab","quantum link","queue design","quick notes"],
};

// ─── Breaking tickers (per language, Animated/Shifting #2) ───────────────────
const TICKERS = [
  "Luna Port expands autonomous shuttle service into the late-night window",
  "A coastal weather grid publishes a new low-fog mapping result",
  "Quiet Lab reveals a production timeline for its paper-texture e-ink panel",
  "The downtown loop extends its dawn express support desk by 30 minutes",
  "Northwind Pass starts live seat assignment for mountain routes",
  "Prism Wallet updates its rule sets for overseas micro-pay alerts",
  "Glass Harbor begins a 24-hour pilot for its shared work lounge",
];

// ─── Entertainment / Sports / Topics (localized) ─────────────────────────────
type EntItem = { id:number; title:string; img:string; views:string };
const ENT_L: EntItem[] = [
  { id:30, title:"A Rehearsal Film Draws Attention with Its Striking Stage-Shift Sequence", img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop&q=80", views:"1.24M" },
  { id:31, title:"A Short-Form Opener Sets a New Completion-Rate High", img:"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=200&fit=crop&q=80", views:"980K" },
  { id:32, title:"A Late-Night Set Is Added as Booking Queues Stretch Out", img:"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=200&fit=crop&q=80", views:"870K" },
  { id:33, title:"A New Release Lands in a Main International Showcase Section", img:"https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=200&fit=crop&q=80", views:"760K" },
];

type SportsItem = { id:number; title:string; img:string; league:string };
const SPORTS_L: SportsItem[] = [
  { id:40, title:"A Club Jumps the Table with Consecutive Late Shots", img:"https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&h=180&fit=crop&q=80", league:"NCL" },
  { id:41, title:"An Opening Series Delivers a Walk-Off Finish to Roaring Crowds", img:"https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=300&h=180&fit=crop&q=80", league:"RDS" },
  { id:42, title:"A Volleyball Team Expands Its Touring Youth Program for the Season", img:"https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=300&h=180&fit=crop&q=80", league:"NVA" },
];

type TopicItem = { label:string; img:string };
const TOPICS_L: TopicItem[] = [
  { label:"Spring Travel Picks", img:"https://images.unsplash.com/photo-1490349368154-73de9c9bc37c?w=240&h=160&fit=crop&q=80" },
  { label:"Healthy Diet Guide", img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=240&h=160&fit=crop&q=80" },
  { label:"Investing 101", img:"https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=240&h=160&fit=crop&q=80" },
  { label:"Home Café Recipes", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=240&h=160&fit=crop&q=80" },
  { label:"Pet Care Tips", img:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=240&h=160&fit=crop&q=80" },
  { label:"Camping Essentials", img:"https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=240&h=160&fit=crop&q=80" },
];

// ─── Ad data (Animated/Shifting #3) ─────────────────────────────────────────
type AdItem = {
  id: string;
  brand: string;
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
  ctaColor: string;
  img: string;
  bg: string;
};

const MAIN_ADS_1: AdItem[] = [
  {
    id: "nexphone",
    brand: "NexPhone",
    eyebrow: "New Arrival",
    headline: "Pro 25 Ultra. Here.",
    sub: "200MP AI Camera · 48hr Battery Life",
    cta: "Pre-Order Now",
    ctaColor: "#4338CA",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=160&fit=crop&q=80",
    bg: "linear-gradient(110deg, #1e1b4b 0%, #4338CA 55%, #6d28d9 100%)",
  },
  {
    id: "skywings",
    brand: "SkyWings Air",
    eyebrow: "Spring Sale",
    headline: "Up to 40% Off Flights",
    sub: "Jeju · Tokyo · Bangkok · Paris nonstop",
    cta: "Search Flights",
    ctaColor: "#0369a1",
    img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=160&fit=crop&q=80",
    bg: "linear-gradient(110deg, #0c4a6e 0%, #0369a1 55%, #0ea5e9 100%)",
  },
  {
    id: "goldtree",
    brand: "GoldTree Bank",
    eyebrow: "Limited Offer",
    headline: "4.5% Fixed Annual Rate",
    sub: "Cancel within 30 days · From ₩10,000",
    cta: "Open Account",
    ctaColor: "#92400e",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=160&fit=crop&q=80",
    bg: "linear-gradient(110deg, #78350f 0%, #b45309 55%, #d97706 100%)",
  },
];

const MAIN_ADS_2: AdItem[] = [
  {
    id: "fitmax",
    brand: "FitMax",
    eyebrow: "New Member Offer",
    headline: "First 3 Months Free",
    sub: "600+ gyms nationwide · Unlimited PT · App coaching",
    cta: "Start Free Trial",
    ctaColor: "#065f46",
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=160&fit=crop&q=80",
    bg: "linear-gradient(110deg, #064e3b 0%, #059669 55%, #10b981 100%)",
  },
  {
    id: "tastebox",
    brand: "TasteBox",
    eyebrow: "First Order Deal",
    headline: "Order Tonight, Arrive at Dawn",
    sub: "Fresh ingredients 2×/week · 30-min recipes",
    cta: "50% Off First Box",
    ctaColor: "#9a3412",
    img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=160&fit=crop&q=80",
    bg: "linear-gradient(110deg, #7c2d12 0%, #c2410c 55%, #f97316 100%)",
  },
];

const SIDE_AD: AdItem = {
  id: "studypro",
  brand: "StudyPro",
  eyebrow: "Online Learning",
  headline: "7-Day Unlimited Free Access",
  sub: "English · Coding · Design · Certificates",
  cta: "Start for Free",
  ctaColor: "#4338CA",
  img: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&h=160&fit=crop&q=80",
  bg: "linear-gradient(135deg, #312e81, #4338CA)",
};

// ─── Ad Banner Card ───────────────────────────────────────────────────────────
function AdBannerCard({
  ads,
  activeIdx,
  onSetIdx,
  onCta,
}: {
  ads: AdItem[];
  activeIdx: number;
  onSetIdx: (i: number) => void;
  onCta: (ad: AdItem) => void;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md h-[130px]">
      {ads.map((ad, i) => (
        <div
          key={ad.id}
          className={`absolute inset-0 flex items-center transition-opacity duration-700 ${i === activeIdx ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          style={{ background: ad.bg }}
        >
          {/* Background image — right half, blended */}
          <Image
            src={ad.img}
            alt=""
            width={420}
            height={130}
            className="absolute right-0 top-0 h-full w-[55%] object-cover"
            style={{ maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.7) 100%)" }}
          />
          {/* Subtle dot pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />

          {/* Content */}
          <div className="relative z-10 flex items-center justify-between w-full px-6 gap-4">
            <div className="flex-1 min-w-0">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50 border border-white/20 px-1.5 py-0.5 rounded">AD</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{ad.eyebrow}</span>
              </div>
              {/* Brand */}
              <div className="text-[11px] font-black text-white/80 mb-0.5">{ad.brand}</div>
              {/* Headline */}
              <div className="text-lg font-black text-white leading-tight">{ad.headline}</div>
              {/* Sub */}
              <div className="text-[11px] text-white/65 mt-0.5 truncate">{ad.sub}</div>
            </div>

            {/* CTA button — clearly clickable target */}
            <button
              data-igg-id={
                i === activeIdx && ad.id === "skywings"
                  ? "never.ad.skywings.cta"
                  : i === activeIdx && ad.id === "nexphone"
                    ? "never.ad.nexphone.preorder"
                    : i === activeIdx && ad.id === "tastebox"
                      ? "never.ad.tastebox.first-order-50-off"
                    : i === activeIdx && ad.id === "goldtree"
                      ? "never.ad.goldtree.open-account"
                    : i === activeIdx && ad.id === "fitmax"
                      ? "never.ad.fitmax.start-free-trial"
                    : undefined
              }
              onClick={(e) => { e.stopPropagation(); onCta(ad); }}
              className="shrink-0 bg-white text-sm font-black px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 hover:shadow-xl active:scale-95 transition-all whitespace-nowrap"
              style={{ color: ad.ctaColor }}
            >
              {ad.cta}
            </button>
          </div>

          {/* Progress dots — clickable */}
          <div className="absolute bottom-2.5 left-6 flex gap-1.5 items-center">
            {ads.map((dotAd, j) => (
              <button
                key={j}
                data-igg-id={
                  dotAd.id === "skywings"
                    ? "never.ad.skywings.dot"
                    : dotAd.id === "nexphone"
                      ? "never.ad.nexphone.dot"
                      : dotAd.id === "tastebox"
                        ? "never.ad.tastebox.dot"
                      : dotAd.id === "goldtree"
                        ? "never.ad.goldtree.dot"
                      : dotAd.id === "fitmax"
                        ? "never.ad.fitmax.dot"
                      : undefined
                }
                onClick={(e) => { e.stopPropagation(); onSetIdx(j); }}
                className={`h-1.5 rounded-full transition-all duration-300 bg-white hover:opacity-100 ${j === activeIdx ? "w-5 opacity-90" : "w-1.5 opacity-30"}`}
                aria-label={`Go to ad ${j + 1}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Side Ad Card ─────────────────────────────────────────────────────────────
function SideAdCard({ ad, onCta }: { ad: AdItem; onCta: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-black text-gray-700">{ad.brand}</span>
        <span className="text-[9px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded font-medium">AD</span>
      </div>
      <div className="relative h-32 mx-3 rounded-xl overflow-hidden mb-3" style={{ background: ad.bg }}>
        <Image src={ad.img} alt="" width={290} height={128}
          className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{ad.eyebrow}</div>
            <div className="text-sm font-black text-white leading-tight mt-0.5">{ad.headline}</div>
          </div>
          <div className="text-[10px] text-white/65 leading-snug">{ad.sub}</div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <button
          data-igg-id={ad.id === "studypro" ? "never.side-ad.start-for-free" : undefined}
          onClick={onCta}
          className="w-full py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-sm"
          style={{ background: ad.bg }}
        >
              {ad.cta}
        </button>
      </div>
    </div>
  );
}

// ─── Never Logo ───────────────────────────────────────────────────────────────
function NeverLogo({ iggId }: { iggId?: string }) {
  return (
    <div className="flex items-center gap-0.5 select-none group cursor-pointer" data-igg-id={iggId}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm transition-transform group-hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}
      >
        N
      </div>
      <span className="text-2xl font-black tracking-tight" style={{ color: BRAND }}>
        ever
      </span>
    </div>
  );
}

// ─── Trending change badge ─────────────────────────────────────────────────────
function ChangeBadge({ change, diff }: { change: TrendingItem["change"]; diff?: number }) {
  if (change === "new") return <span className="text-[9px] font-bold text-white bg-rose-500 px-1 py-0.5 rounded ml-1">NEW</span>;
  if (change === "up") return <span className="text-[10px] text-rose-500 ml-1 font-semibold">▲{diff}</span>;
  if (change === "down") return <span className="text-[10px] text-blue-500 ml-1 font-semibold">▼{diff}</span>;
  return <span className="text-[10px] text-gray-300 ml-1">—</span>;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 4 }: { size?: number }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-gray-200 animate-spin`}
      style={{ width: size * 4, height: size * 4, borderTopColor: BRAND }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MockPortalPage() {
  const [benchmarkStateId, setBenchmarkStateId] = useState("1");
  const lang: Lang = "en";
  const t = T.en;

  // Search
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(AUTOCOMPLETE[""]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suppressNextSearchFocusRef = useRef(false);

  // News section
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const pressLoading = false;
  const [expandedPublishers, setExpandedPublishers] = useState<Set<number>>(new Set());

  // Trending
  const [trending, setTrending] = useState<TrendingItem[]>(TRENDING);
  const [trendingExpanded, setTrendingExpanded] = useState(false);
  const [trendingUpdating, setTrendingUpdating] = useState(false);
  const [trendingScenarioIdx, setTrendingScenarioIdx] = useState(0);

  // Stock (Async Updates #2 + flash)
  const STOCK_DISPLAY: Record<string, string> = {
    KOSPI:   "KOSPI",
    KOSDAQ:  "KOSDAQ",
    Samsung: "Samsung",
    SKHynix: "SK Hynix",
  };
  const [stocks, setStocks] = useState<StockItem[]>([
    { name:"KOSPI",   value:2651.23, base:2632.81, change:18.42,  pct:0.70 },
    { name:"KOSDAQ",  value:871.55,  base:874.76,  change:-3.21,  pct:-0.37 },
    { name:"Samsung", value:74800,   base:73600,   change:1200,   pct:1.63 },
    { name:"SKHynix", value:182500,  base:179000,  change:3500,   pct:1.96 },
  ]);
  const [stockFlash, setStockFlash] = useState<Record<string, "up" | "down" | null>>({});

  // Widgets
  const [shortcutsExpanded, setShortcutsExpanded] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [cookieBanner, setCookieBanner] = useState(true);
  const [moreNavOpen, setMoreNavOpen] = useState(false);
  const moreNavRef = useRef<HTMLDivElement>(null);
  const [adIdx, setAdIdx] = useState(0);
  const [ad2Idx, setAd2Idx] = useState(0);
  const [adTimerReset, setAdTimerReset] = useState(0);
  const [ad2TimerReset, setAd2TimerReset] = useState(0);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerAnimate, setTickerAnimate] = useState(false);
  const [weatherPulse, setWeatherPulse] = useState(false); // Async Updates #5
  const [calendarMonthIdx, setCalendarMonthIdx] = useState(0);

  const calendarMonths: CalendarMonth[] = [
    { key: "2026-04", title: "April 2026", leadingEmpty: 3, days: 30, today: 8 },
    { key: "2026-05", title: "May 2026", leadingEmpty: 5, days: 31 },
    { key: "2026-06", title: "June 2026", leadingEmpty: 1, days: 30 },
  ];
  const currentCalendarMonth = calendarMonths[calendarMonthIdx];

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stateId = searchParams.get("stateId");
    const initialState = getNeverBenchmarkState(stateId);

    setBenchmarkStateId(initialState.id);
    setQuery(initialState.query);
    setSearchFocused(initialState.searchFocused);
    setTrendingExpanded(initialState.trendingExpanded);
    setWeatherExpanded(initialState.weatherExpanded);
    setLoginOpen(initialState.loginOpen);
    setCookieBanner(initialState.cookieBanner);
    setShortcutsExpanded(initialState.shortcutsExpanded);
    setMoreNavOpen(initialState.moreNavOpen);
    setAdIdx(initialState.adIdx);
    setAd2Idx(initialState.ad2Idx);
    setAdTimerReset(0);
    setAd2TimerReset(0);
    setTickerIdx(initialState.tickerIdx);

    window.requestAnimationFrame(() => {
      if (typeof initialState.initialScrollY === "number") {
        window.scrollTo({
          top: initialState.initialScrollY,
          behavior: "auto",
        });
        return;
      }

      window.scrollTo({
        top: initialState.scrollTarget === "bottom" ? document.documentElement.scrollHeight : 0,
        behavior: "auto",
      });
    });
  }, []);

  // ── Autocomplete suggestions ───────────────────────────────────────────────
  useEffect(() => {
    const ac = AUTOCOMPLETE;
    const key = Object.keys(ac).find(
      (k) => k && query.toLowerCase().startsWith(k.toLowerCase())
    );
    const fallback = [query+" news", query+" stock", query+" weather"];
    if (!query) setSuggestions(ac[""]);
    else if (key) setSuggestions(ac[key]);
    else setSuggestions(fallback);
  }, [query]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
      if (moreNavRef.current && !moreNavRef.current.contains(e.target as Node)) setMoreNavOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── News carousel (Animated/Shifting #1) ──────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setFeaturedIdx((i) => (i + 1) % FEATURED_L.length), 4000);
    return () => clearInterval(t);
  }, []);

  // ── Ad rotation (Animated/Shifting #3) ────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setAdIdx((i) => (i + 1) % MAIN_ADS_1.length), 5000);
    return () => clearInterval(t);
  }, [adTimerReset]);
  useEffect(() => {
    const t = setInterval(() => setAd2Idx((i) => (i + 1) % MAIN_ADS_2.length), 6000);
    return () => clearInterval(t);
  }, [ad2TimerReset]);

  function selectAdIndex(index: number) {
    setAdIdx(index);
    setAdTimerReset((value) => value + 1);
  }

  function selectAd2Index(index: number) {
    setAd2Idx(index);
    setAd2TimerReset((value) => value + 1);
  }

  // ── Ticker (Animated/Shifting #2) ─────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setTickerAnimate(true);
      setTimeout(() => {
        setTickerIdx((i) => (i + 1) % TICKERS.length);
        setTickerAnimate(false);
      }, 300);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // ── Stock update (Async Updates #2 + Animated/Shifting #5) ───────────────
  useEffect(() => {
    const t = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => {
          const delta = (Math.random() - 0.48) * s.value * 0.002;
          const newVal = Math.round((s.value + delta) * 100) / 100;
          const newChange = Math.round((newVal - s.base) * 100) / 100;
          const newPct = Math.round((newChange / s.base) * 10000) / 100;
          const dir = delta > 0 ? "up" : "down";
          setStockFlash((f) => ({ ...f, [s.name]: dir }));
          setTimeout(() => setStockFlash((f) => ({ ...f, [s.name]: null })), 700);
          return { ...s, value: newVal, change: newChange, pct: newPct };
        })
      );
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // ── Weather auto-refresh indicator (Async Updates #5) ─────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setWeatherPulse(true);
      setTimeout(() => setWeatherPulse(false), 1500);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // ── Initialize dynamic content ─────────────────────────────────────────────
  useEffect(() => {
    setSuggestions(AUTOCOMPLETE[""]);
    requestAnimationFrame(() => {
      const scenarios = buildFixedTrendingScenarios();
      setTrendingScenarioIdx(0);
      setTrending(scenarios[0]);
      setTrendingUpdating(false);
      setTickerIdx(0);
    });
  }, []);

  const togglePublisherExpansion = useCallback((index: number) => {
    setExpandedPublishers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const cycleTrendingScenario = useCallback(() => {
    setTrendingUpdating(true);
    window.setTimeout(() => {
      const scenarios = buildFixedTrendingScenarios();
      const nextIdx = (trendingScenarioIdx + 1) % scenarios.length;
      setTrendingScenarioIdx(nextIdx);
      setTrending(scenarios[nextIdx]);
      setTrendingUpdating(false);
    }, 400);
  }, [trendingScenarioIdx]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      cycleTrendingScenario();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [cycleTrendingScenario]);

  const moreServiceItems = [["Travel", "✈️"], ["Books", "📚"], ["Movies", "🎬"], ["Music", "🎵"], ["Whale", "🐳"], ["Clova", "🤖"], ["Series", "📱"], ["Weather", "⛅"], ["Sports", "⚽"]];
  const visibleShortcuts = moreServiceItems;
  const visibleTrending = trendingExpanded ? trending : trending.slice(0, 10);

  useEffect(() => {
    (
      window as Window & {
        __NEVER_BENCHMARK_STATE__?: Record<string, unknown>;
      }
    ).__NEVER_BENCHMARK_STATE__ = {
      stateId: benchmarkStateId,
      lang,
      query,
      searchFocused,
      trendingExpanded,
      weatherExpanded,
      loginOpen,
      cookieBanner,
      shortcutsExpanded,
      moreNavOpen,
      adIdx,
      ad2Idx,
      tickerIdx,
      featuredIdx,
      visibleTrendingCount: visibleTrending.length,
      visibleShortcutsCount: visibleShortcuts.length,
    };
  }, [
    ad2Idx,
    adIdx,
    benchmarkStateId,
    cookieBanner,
    featuredIdx,
    lang,
    loginOpen,
    moreNavOpen,
    query,
    searchFocused,
    shortcutsExpanded,
    tickerIdx,
    trendingExpanded,
    visibleShortcuts.length,
    visibleTrending.length,
    weatherExpanded,
  ]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __NEVER_BENCHMARK_STATE__?: Record<string, unknown> }).__NEVER_BENCHMARK_STATE__ ?? null;
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

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans">

      {/* ── [Transient Obstruction #3] Cookie Banner ────────────────────── */}
      {cookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] text-white px-6 py-3 flex items-center justify-between gap-4 shadow-2xl border-t-2" style={{ borderColor: BRAND }}>
          <p className="text-sm text-gray-300 flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
            <span>{t.cookieText}</span>
            <button className="underline hover:text-white transition-colors ml-1" style={{ color: "#a78bfa" }}>{t.privacy}</button>
            <span> &amp; </span>
            <button className="underline hover:text-white transition-colors" style={{ color: "#a78bfa" }}>{t.cookie}</button>
            <span>{t.cookieSuffix}</span>
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setCookieBanner(false)}
              data-igg-id="never.cookie.accept"
              className="text-sm px-5 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ background: BRAND }}
            >
              {t.agree}
            </button>
            <button
              onClick={() => setCookieBanner(false)}
              className="text-sm px-4 py-2 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-700 transition-all hover:scale-105"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* ── [Transient Obstruction #2] Login Modal ───────────────────────── */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLoginOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-[400px] max-w-full animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <NeverLogo />
              <button
                data-igg-id="never.login-modal.close"
                onClick={() => setLoginOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all hover:scale-110 text-lg">
                ×
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Username"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              <input type="password" placeholder="Password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
            </div>
            <button
              onClick={() => setLoginOpen(false)}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.02] mb-4"
              style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
              {t.login}
            </button>
            <div className="flex justify-center gap-4 text-xs text-gray-400 mb-5">
              <button className="hover:text-violet-600 transition-colors hover:underline">{t.findId}</button>
              <span className="text-gray-200">|</span>
              <button data-igg-id="never.login-modal.find-password" className="hover:text-violet-600 transition-colors hover:underline">{t.findPw}</button>
              <span className="text-gray-200">|</span>
              <button data-igg-id="never.login-modal.signup" className="font-semibold transition-colors hover:underline" style={{ color: BRAND }}>{t.signUp}</button>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-center text-gray-400 mb-3">{t.otherLogin}</p>
              <div className="flex gap-2">
                {["Google","Kakao","Apple"].map((p) => (
                  <button key={p}
                    onClick={() => setLoginOpen(false)}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-violet-300 hover:text-violet-600 transition-all hover:scale-105">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1080px] mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <NeverLogo iggId="never.nav.home" />

            {/* [Transient Obstruction #1] Search + autocomplete */}
            <div ref={searchRef} className="flex-1 relative max-w-[600px]">
              <div className={`flex items-center border-2 rounded-2xl overflow-hidden transition-all duration-200 ${searchFocused ? "shadow-lg" : "shadow-sm"}`}
                style={{ borderColor: searchFocused ? BRAND : "#e5e7eb" }}>
                <input
                  ref={searchInputRef}
                  data-igg-id="never.search.input"
                  type="text" value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onMouseDown={(e) => {
                    if (searchFocused) {
                      suppressNextSearchFocusRef.current = true;
                      e.preventDefault();
                      setSearchFocused(false);
                      searchInputRef.current?.blur();
                    }
                  }}
                  onFocus={() => {
                    if (suppressNextSearchFocusRef.current) {
                      suppressNextSearchFocusRef.current = false;
                      searchInputRef.current?.blur();
                      return;
                    }
                    setSearchFocused(true);
                  }}
                  placeholder={t.searchPlaceholder}
                  className="flex-1 px-5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setSearchFocused(false);
                    }
                  }}
                />
                {query && (
                  <button onClick={() => setQuery("")}
                    className="px-2 text-gray-300 hover:text-gray-500 transition-colors text-lg">×</button>
                )}
                <button
                  onClick={() => setSearchFocused(false)}
                  className="px-4 py-2.5 text-white transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2.5"/>
                    <path d="M20 20L16.65 16.65" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {searchFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-1 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    {query ? t.relatedSearch : t.recentSearch}
                  </div>
                  {suggestions.map((s, i) => (
                    <button key={i}
                      type="button"
                      data-igg-id={
                        s === "Samsung stock"
                          ? "never.search.suggestion.samsung-stock"
                          : s === "lottery numbers"
                            ? "never.search.suggestion.lottery-numbers"
                            : undefined
                      }
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-3 transition-all group"
                      onClick={(e) => {
                        e.preventDefault();
                      }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-gray-300 group-hover:text-violet-400 shrink-0 transition-colors">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                        <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>{s}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-50 px-4 py-2 flex justify-between text-[10px] text-gray-400">
                    <button className="hover:text-gray-600 transition-colors">{t.acOff}</button>
                    <button data-igg-id="never.search.save-off" className="hover:text-gray-600 transition-colors">{t.saveOff}</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button onClick={() => setLoginOpen(true)}
                className="text-sm font-medium px-3 py-2 rounded-xl hover:bg-violet-50 transition-all hover:scale-105"
                style={{ color: BRAND }}>
                {t.login}
              </button>
              <button
                data-igg-id="never.header.get-app"
                className="text-sm text-white px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-90 hover:scale-105 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
                {t.appDownload}
              </button>
            </div>
          </div>

          {/* Nav — scrollable items + More button outside overflow container */}
          <div className="flex items-end">
            <nav className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1">
              {t.nav.slice(0, -1).map((item) => (
                <button key={item}
                  data-igg-id={
                    DICTIONARY_LABELS.has(String(item))
                      ? "never.nav.dictionary"
                      : item === "Mail"
                        ? "never.nav.mail"
                      : item === "Cafe"
                        ? "never.nav.cafe"
                      : item === "Blog"
                        ? "never.nav.blog"
                      : item === "Shopping"
                        ? "never.nav.shopping"
                      : item === "News"
                        ? "never.nav.news"
                      : item === "Maps"
                        ? "never.nav.map"
                      : item === "Webtoon"
                        ? "never.nav.webtoon"
                      : undefined
                  }
                  className="shrink-0 text-sm px-3 py-2 text-gray-500 rounded-t font-medium transition-all hover:text-violet-700 hover:bg-violet-50 relative group">
                  {item}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 group-hover:w-4/5 transition-all duration-200 rounded-full" style={{ background: BRAND }} />
                </button>
              ))}
            </nav>

            {/* More ▾ dropdown — outside overflow-x-auto so it isn't clipped */}
            <div ref={moreNavRef} className="relative shrink-0">
              <button
                onClick={() => setMoreNavOpen((v) => !v)}
                data-igg-id="never.nav.more-trigger"
                className={`text-sm px-3 py-2 font-medium transition-all rounded-t relative group ${moreNavOpen ? "text-violet-700 bg-violet-50" : "text-gray-500 hover:text-violet-700 hover:bg-violet-50"}`}>
                {t.nav[t.nav.length - 1]}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200" style={{ background: BRAND, width: moreNavOpen ? "80%" : "0%" }} />
              </button>

              {moreNavOpen && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    More Services
                  </div>
                  <div className="grid grid-cols-3 gap-0 p-3">
                    {moreServiceItems.map(([label, icon]) => (
                      <button key={label}
                        data-igg-id={
                          label === "Weather" || label === "날씨" || label === "天気"
                            ? "never.nav.more.weather"
                            : label === "Series" || label === "시리즈" || label === "シリーズ"
                              ? "never.shortcuts.series"
                              : undefined
                        }
                        onClick={() => setMoreNavOpen(false)}
                        className="flex flex-col items-center gap-1 px-2 py-3 hover:bg-violet-50 rounded-xl transition-all group">
                        <span className="text-xl">{icon}</span>
                        <span className="text-[10px] text-gray-600 group-hover:text-violet-700 font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2.5 flex justify-between items-center">
                    <span className="text-xs text-gray-400">All services</span>
                    <button className="text-xs font-semibold hover:underline transition-colors" style={{ color: BRAND }}>→</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── [Animated/Shifting #2] Ticker ───────────────────────────────── */}
      <div className="text-white" style={{ background: `linear-gradient(90deg, ${BRAND_DARK}, ${BRAND})` }}>
        <div className="max-w-[1080px] mx-auto px-4 py-2 flex items-center gap-3">
          <span className="shrink-0 text-[10px] font-black bg-white px-2 py-0.5 rounded-md" style={{ color: BRAND }}>
            {t.breaking}
          </span>
          <div className="overflow-hidden flex-1 h-5 relative">
            <button
              data-igg-id={
                TICKERS[tickerIdx] === "Quiet Lab reveals a production timeline for its paper-texture e-ink panel"
                  ? "never.breaking.quiet-lab"
                  : TICKERS[tickerIdx] === "Northwind Pass starts live seat assignment for mountain routes"
                    ? "never.breaking.northwind-pass"
                    : TICKERS[tickerIdx] === "Prism Wallet updates its rule sets for overseas micro-pay alerts"
                      ? "never.breaking.prism-wallet"
                      : TICKERS[tickerIdx] === "Glass Harbor begins a 24-hour pilot for its shared work lounge"
                        ? "never.breaking.glass-harbor"
                      : TICKERS[tickerIdx] === "The downtown loop extends its dawn express support desk by 30 minutes"
                        ? "never.breaking.downtown-loop"
                      : undefined
              }
              className={`absolute inset-0 flex items-center text-sm font-medium transition-all duration-300 hover:underline text-left w-full ${tickerAnimate ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}
            >
              {TICKERS[tickerIdx]}
            </button>
          </div>
          <div className="shrink-0 flex gap-1">
            <button
              data-igg-id="never.breaking.prev"
              onClick={() => setTickerIdx((i) => (i - 1 + TICKERS.length) % TICKERS.length)}
              className="text-white/60 hover:text-white transition-colors px-1 hover:scale-125">▲</button>
            <button
              data-igg-id="never.breaking.next"
              onClick={() => setTickerIdx((i) => (i + 1) % TICKERS.length)}
              className="text-white/60 hover:text-white transition-colors px-1 hover:scale-125">▼</button>
          </div>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="max-w-[1080px] mx-auto px-4 py-5 flex gap-5">

        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* News card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {pressLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size={8} />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {PRESS_L.slice(0, 4).map((item, pi) => {
                  const tabMap: Record<number, number> = { 0: 1, 1: 0, 2: 2, 3: 3 };
                  const tabIdx = tabMap[pi] ?? (pi % Object.keys(TAB_NEWS_L).length);
                  const sourceNews = TAB_NEWS_L[tabIdx]?.map((i) => loc(i)) ?? [];
                  const pressNews = sourceNews.slice(pi % 2, (pi % 2) + 4);
                  const expanded = expandedPublishers.has(pi);
                  const visiblePressNews = expanded ? pressNews : pressNews.slice(0, 2);
                  return (
                    <section key={item.abbr} className="p-4">
                      <div
                        className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ background: item.color + "14" }}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black text-white"
                          style={{ background: item.color }}
                        >
                          {item.abbr.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black leading-tight" style={{ color: item.color }}>
                            {item.press}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Latest picks
                          </div>
                        </div>
                        <span className="ml-auto text-[10px] text-gray-400">
                          Just now
                        </span>
                      </div>

                      <div className="space-y-0 divide-y divide-gray-50 rounded-2xl border border-gray-100 bg-white">
                        {visiblePressNews.map((news, newsIdx) => (
                          <div
                            key={news.id}
                            data-igg-id={
                              item.abbr === "RTR" && newsIdx === 0
                                ? "never.news.publisher.reuters-card"
                                : item.abbr === "RTR" && newsIdx === 1
                                  ? "never.news.publisher.reuters.featured"
                                  : news.title === "Seoul Book Festival Opens This Month — Author Signings and Readings Line the Program"
                                    ? "never.news.book-festival"
                                  : undefined
                            }
                            className="flex gap-3 px-4 py-3 cursor-pointer group hover:bg-violet-50 transition-all"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold uppercase" style={{ color: item.color }}>
                                {news.category}
                              </span>
                              <p className="mt-0.5 text-sm font-medium text-gray-800 group-hover:text-violet-700 transition-colors line-clamp-2">
                                {news.title}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {news.time}
                              </p>
                            </div>
                            <Image
                              src={news.img}
                              alt={news.title}
                              width={88}
                              height={60}
                              className="h-15 w-22 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                            />
                          </div>
                        ))}
                      </div>

                      {pressNews.length > 2 && (
                        <div className="pt-3 text-center">
                          <button
                            onClick={() => togglePublisherExpansion(pi)}
                            data-igg-id={
                              pi === 0
                                ? "never.news.more.expand"
                                : item.press === "Daily View"
                                  ? "never.news.daily-view.more"
                                  : undefined
                            }
                            className="text-sm font-medium transition-all hover:scale-105"
                            style={{ color: item.color }}
                          >
                            {expanded
                              ? `${t.fold} ▲`
                              : "View more articles ▾"}
                          </button>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {/* [Folded #4] More news button */}
          </div>

          {/* [Animated/Shifting #3] Ad banner 1 */}
          <AdBannerCard
            ads={MAIN_ADS_1}
            activeIdx={adIdx % MAIN_ADS_1.length}
            onSetIdx={selectAdIndex}
            onCta={() => undefined}
          />

          {/* Entertainment (Off-screen #2 — below fold) */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-bold text-gray-900">{t.entertainment}</h3>
              <button data-igg-id="never.entertainment.see-more"
                className="text-xs font-medium transition-colors hover:underline" style={{ color: BRAND }}>{t.seeMore} ›</button>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {ENT_L.map((item, index) => (
                <div key={item.id} data-igg-id={index === 0 ? "never.entertainment.first-article" : index === 1 ? "never.entertainment.second-article" : undefined} className="cursor-pointer group">
                  <div className="relative rounded-xl overflow-hidden">
                    <Image src={item.img} alt={item.title} width={300} height={180}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/50 transition-all" />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">👁 {item.views}</div>
                  </div>
                  <div className="mt-2 flex items-start gap-2">
                    <p className="min-w-0 flex-1 text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-violet-700 transition-colors">{item.title}</p>
                    <button
                      data-igg-id={index === 0 ? "never.entertainment.first-article.bookmark" : index === 1 ? "never.entertainment.second-article.bookmark" : undefined}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm opacity-0 transition-opacity hover:bg-violet-50 group-hover:opacity-100"
                      aria-label="Bookmark"
                      onClick={e => e.stopPropagation()}
                    >
                      <BookmarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sports (Off-screen #3) */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-bold text-gray-900">{t.sports}</h3>
              <button
                className="text-xs font-medium transition-colors hover:underline" style={{ color: BRAND }}>{t.seeMore} ›</button>
            </div>
            <div className="space-y-3 px-4 pb-4">
              {SPORTS_L.map((item) => (
                <div
                  key={item.id}
                  data-igg-id={
                    item.title === "A Volleyball Team Expands Its Touring Youth Program for the Season"
                        ? "never.sports.volleyball-youth-program"
                      : item.id === 40
                        ? "never.sports.first-article"
                      : item.id === 41
                        ? "never.sports.second-article"
                        : undefined
                  }
                  className="flex gap-3 cursor-pointer group hover:bg-violet-50 -mx-1 px-1 py-1.5 rounded-xl transition-all relative"
                >
                  <div className="relative shrink-0">
                    <Image src={item.img} alt={item.title} width={120} height={80}
                      className="w-24 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform duration-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white text-xs" style={{ background: BRAND }}>{item.league}</span>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-violet-700 transition-colors mt-1 line-clamp-2">{item.title}</p>
                      </div>
                      <button
                        data-igg-id={
                          item.id === 40 ? "never.sports.first-article.bookmark" :
                          item.id === 41 ? "never.sports.second-article.bookmark" :
                          item.id === 42 ? "never.sports.third-article.bookmark" :
                          undefined
                        }
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-600 shadow-sm opacity-0 transition-opacity hover:bg-violet-50 group-hover:opacity-100"
                        aria-label="Bookmark"
                        onClick={e => e.stopPropagation()}
                      >
                        <BookmarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* [Animated/Shifting #3 cont.] Ad banner 2 (Off-screen #4) */}
          <AdBannerCard
            ads={MAIN_ADS_2}
            activeIdx={ad2Idx % MAIN_ADS_2.length}
            onSetIdx={selectAd2Index}
            onCta={() => undefined}
          />

          {/* Today's Topics (Off-screen #3) */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="font-bold text-gray-900">{t.todayTopics}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 px-4 pb-4">
              {TOPICS_L.map((topic, ti) => (
                <div
                  key={ti}
                  data-igg-id={
                    topic.label === "Home Café Recipes"
                      ? "never.topics.home-cafe"
                      : topic.label === "Spring Travel Picks"
                        ? "never.topics.travel"
                      : topic.label === "Pet Care Tips"
                        ? "never.topics.pet-care-tips"
                        : undefined
                  }
                  className="cursor-pointer group"
                >
                  <div className="relative rounded-xl overflow-hidden">
                    <Image src={topic.img} alt={topic.label} width={240} height={130}
                      className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-violet-900/60 transition-all duration-300" />
                    <p className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-bold leading-snug">{topic.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="w-[290px] shrink-0 space-y-4">

          {/* Login widget */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl" style={{ background: BRAND_LIGHT }}>👤</div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{t.loginPrompt}</p>
              <button onClick={() => setLoginOpen(true)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm mb-3"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
                {t.login}
              </button>
              <div className="flex justify-center gap-3 text-xs text-gray-400">
                <button className="hover:text-violet-600 hover:underline transition-colors">{t.findId}</button>
                <span className="text-gray-200">|</span>
                <button className="hover:text-violet-600 hover:underline transition-colors">{t.findPw}</button>
                <span className="text-gray-200">|</span>
                <button className="font-semibold hover:underline transition-colors" style={{ color: BRAND }}>{t.signUp}</button>
              </div>
            </div>
          </div>

          {/* [Animated/Shifting #4 + Async Updates #1 + Folded #2] Trending */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">{t.trending}</h3>
                {trendingUpdating && <Spinner size={3} />}
              </div>
              <button onClick={cycleTrendingScenario}
                className="text-gray-400 hover:text-violet-600 transition-all hover:scale-125 text-sm"
                title={t.refresh}>↺</button>
            </div>
            <div className="divide-y divide-gray-50">
              {visibleTrending.map((item, i) => (
                <button key={item.keyword}
                  data-igg-id={
                    item.keyword === "IU concert tickets"
                      ? "never.trending.keyword.iu-concert-tickets"
                      : item.keyword === "Interactive GUI benchmark" && item.rank === 1
                        ? "never.trending.benchmark-rank-1"
                      : TRENDING_RANK_IDS[item.rank]
                  }
                  onClick={() => setQuery(item.keyword)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-violet-50 transition-all text-left group hover:pl-6">
                  <span className={`text-sm font-black w-5 shrink-0 transition-colors ${i < 3 ? "" : "text-gray-400"}`}
                    style={i < 3 ? { color: BRAND } : {}}>
                    {item.rank}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-violet-700 transition-colors truncate font-medium">{item.keyword}</span>
                  <ChangeBadge change={item.change} diff={item.diff} />
                </button>
              ))}
            </div>
            <button onClick={() => setTrendingExpanded((v) => !v)}
              data-igg-id="never.trending.expand-toggle"
              className="w-full py-2.5 text-xs font-medium text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-all border-t border-gray-50 flex items-center justify-center gap-1">
              {trendingExpanded ? t.top10 : t.see20}
            </button>
          </div>

          {/* [Folded #3 + Async Updates #5] Weather */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">Seoul · Now</span>
                <span className={`text-xs text-gray-400 transition-all ${weatherPulse ? "text-violet-500 font-bold" : ""}`}>
                  2026.04.08
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-4xl font-thin text-gray-900">13°</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Sunny ☀️
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-1">
                  <div>Dust <span className="text-orange-500 font-bold">Bad</span></div>
                  <div>Humidity <span className="text-blue-500 font-bold">42%</span></div>
                  <div className="text-gray-400">Wind 3m/s</div>
                </div>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>Low 6°</span>
                <span>High 17°</span>
              </div>
            </div>
            <button onClick={() => setWeatherExpanded((v) => !v)}
              data-igg-id="never.weather.expand-toggle"
              className="w-full px-4 py-2 text-xs font-medium text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all border-t border-gray-100 flex items-center justify-center gap-1">
              {weatherExpanded ? t.weeklyClose : t.weeklyOpen}
            </button>
            {weatherExpanded && (
              <div className="px-4 pb-4 space-y-1.5">
                {[
                  { d:"수/Wed/水", icon:"🌤", lo:7, hi:16 },
                  { d:"목/Thu/木", icon:"🌧", lo:5, hi:12 },
                  { d:"금/Fri/金", icon:"🌧", lo:4, hi:11 },
                  { d:"토/Sat/土", icon:"⛅", lo:6, hi:14 },
                  { d:"일/Sun/日", icon:"☀️", lo:8, hi:18 },
                  { d:"월/Mon/月", icon:"☀️", lo:9, hi:20 },
                  { d:"화/Tue/火", icon:"🌤", lo:10, hi:21 },
                ].map(({ d, icon, lo, hi }) => {
                  const label = d.split("/")[1];
                  return (
                    <div
                      key={d}
                      data-igg-id={
                        WEATHER_ROW_IDS[label]
                      }
                      className="flex items-center justify-between text-sm hover:bg-violet-50 px-1 py-0.5 rounded-lg transition-colors"
                    >
                      <span className="text-gray-500 w-6 text-xs font-medium">{label}</span>
                      <span className="text-base">{icon}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-blue-500 font-medium">{lo}°</span>
                        <span className="text-red-400 font-medium">{hi}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* [Async Updates #2 + Animated/Shifting #5] Stock */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="font-bold text-gray-900 text-sm">{t.stock}</h3>
              <button
                data-igg-id="never.markets.see-more"
                className="text-xs font-medium hover:underline transition-colors" style={{ color: BRAND }}>{t.seeMore} ›</button>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {stocks.map((s) => (
                <div key={s.name}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all duration-300 cursor-pointer hover:bg-violet-50 group ${stockFlash[s.name] === "up" ? "bg-red-50" : stockFlash[s.name] === "down" ? "bg-blue-50" : ""}`}
                >
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-violet-700 transition-colors">{STOCK_DISPLAY[s.name] ?? s.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {s.value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[11px] font-bold ${s.change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                      {s.change >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(s.change).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}{" "}
                      <span className="font-medium">({Math.abs(s.pct).toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">
                {currentCalendarMonth.title}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalendarMonthIdx((idx) => Math.max(0, idx - 1))}
                  data-igg-id="never.calendar.prev-month"
                  className="text-gray-400 hover:text-violet-600 px-1.5 py-0.5 rounded hover:bg-violet-50 transition-all text-xs"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCalendarMonthIdx((idx) => Math.min(calendarMonths.length - 1, idx + 1))}
                  data-igg-id="never.calendar.next-month"
                  className="text-gray-400 hover:text-violet-600 px-1.5 py-0.5 rounded hover:bg-violet-50 transition-all text-xs"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0">
              {(["Su","Mo","Tu","We","Th","Fr","Sa"]).map((d) => (
                <div key={d} className={`text-center text-[10px] font-bold py-1 ${d==="일"||d==="Su"||d==="日" ? "text-red-400" : d==="토"||d==="Sa"||d==="土" ? "text-blue-400" : "text-gray-400"}`}>{d}</div>
              ))}
              {Array.from({ length: currentCalendarMonth.leadingEmpty }).map((_, i) => <div key={`${currentCalendarMonth.key}-e-${i}`} />)}
              {Array.from({ length: currentCalendarMonth.days }).map((_, i) => {
                const day = i + 1;
                const isToday = day === currentCalendarMonth.today;
                const dow = (currentCalendarMonth.leadingEmpty + i) % 7;
                const isoDate = `${currentCalendarMonth.key}-${String(day).padStart(2, "0")}`;
                return (
                  <button key={day}
                    data-igg-id={
                      isoDate === "2026-04-01"
                        ? "never.calendar.date-2026-04-01"
                        : isoDate === "2026-04-15"
                          ? "never.calendar.date-2026-04-15"
                        : isoDate === "2026-06-27"
                          ? "never.calendar.date-2026-06-27"
                          : undefined
                    }
                    className={`text-center text-[11px] py-1.5 rounded-full mx-0.5 transition-all hover:scale-110 font-medium ${
                      isToday ? "text-white shadow-sm" :
                      dow === 0 ? "text-red-400 hover:bg-red-50" :
                      dow === 6 ? "text-blue-400 hover:bg-blue-50" :
                      "text-gray-700 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                    style={isToday ? { background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` } : {}}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side ad */}
          <SideAdCard
            ad={SIDE_AD}
            onCta={() => undefined}
          />
        </div>
      </main>

      {/* ── [Off-screen #5] Footer ─────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-[1080px] mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6 text-xs text-gray-500">
            {t.footer.map((link) => (
              <button key={link}
                data-igg-id={link === "Careers" ? "never.footer.careers" : link === "About" ? "never.footer.about" : link === "Privacy Policy" ? "never.footer.privacy" : undefined}
                className="hover:text-violet-600 hover:underline transition-colors">
                {link}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {t.footerCols.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">{col.title}</h4>
                {col.links.map((l) => (
                  <button key={l}
                    className="block text-xs text-gray-400 hover:text-violet-600 hover:underline transition-colors mb-1.5">
                    {l}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-5 flex flex-wrap items-center justify-between gap-3">
            <NeverLogo />
            <p className="text-xs text-gray-400">{t.copyright}</p>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
              {(["en","ko","ja"] as Lang[]).map((l) => (
                <button key={l}
                  data-igg-id={l === "ko" ? "never.footer.lang-ko" : l === "ja" ? "never.footer.lang-ja" : l === "en" ? "never.footer.lang-en" : undefined}
                  className={`px-3 py-1.5 font-medium transition-all ${lang === l ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  style={lang === l ? { background: BRAND } : {}}>
                  {l === "ko" ? "한국어" : l === "en" ? "English" : "日本語"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
