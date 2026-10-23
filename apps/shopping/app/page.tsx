"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { PRODUCTS } from "./products-data";
import { cloneCartItems, type CartItem, DEFAULT_CART_ITEMS, getShoppingBenchmarkState } from "./shopping-states";
import { createReviewRuntime } from "../../../lib/review-runtime";

/* ─── data ──────────────────────────────────────────────────────────────── */

const TOP_LINKS = [
  "Rocket Delivery",
  "Global Direct",
  "Gold Box",
  "Events & Coupons",
  "Best",
  "Today's Deals",
  "Rocket Luxury",
  "Rocket Install",
];

const CATEGORIES = [
  { name: "Fashion",  icon: "👗", subs: ["Women's", "Men's", "Outerwear", "Underwear", "Bags", "Shoes"] },
  { name: "Beauty",          icon: "💄", subs: ["Skincare", "Makeup", "Fragrance", "Hair Care", "Men's Beauty"] },
  { name: "Baby & Kids",    icon: "🍼", subs: ["Diapers & Wipes", "Baby Food", "Toys", "Kids' Clothing", "Nursing"] },
  { name: "Food",          icon: "🥗", subs: ["Fresh Produce", "Snacks", "Beverages", "Health Foods", "Ready Meals"] },
  { name: "Kitchen",       icon: "🍳", subs: ["Pots & Pans", "Storage", "Tableware", "Coffee & Tea", "Cooking Tools"] },
  { name: "Household",       icon: "🧹", subs: ["Cleaning", "Laundry", "Bathroom", "Air Fresheners", "Organization"] },
  { name: "Home Decor",     icon: "🛋️", subs: ["Bedding & Curtains", "Lighting", "Furniture", "Decor", "Wallpaper"] },
  { name: "Electronics",     icon: "📱", subs: ["TV & Video", "PC & Laptops", "Smartphones", "Audio", "Cameras"] },
  { name: "Sports",    icon: "⚽", subs: ["Fitness", "Hiking", "Cycling", "Swimming", "Camping"] },
  { name: "Automotive",     icon: "🚗", subs: ["Car Care", "Dash Cams", "Car Seats", "Air Fresheners", "Car Wash"] },
  { name: "Books & Music",      icon: "📚", subs: ["Domestic Books", "Foreign Books", "Music & DVD", "Instruments", "Stationery"] },
  { name: "Toys & Hobbies",      icon: "🎮", subs: ["LEGO & Blocks", "RC Toys", "Puzzles", "Board Games", "Figures"] },
  { name: "Pets",       icon: "🐾", subs: ["Food & Treats", "Accessories", "Clothing", "Medicine"] },
  { name: "Health",  icon: "💊", subs: ["Supplements", "Protein", "Diet Foods", "Medical Devices"] },
];

const HERO_SLIDES = [
  {
    id: "gold-box",
    label: "Today's Deals", title: "Capang Gold Box",
    headline: "Hottest items\nat the lowest prices",
    copy: "Time deals ending at midnight, brand coupons, instant card discounts",
    bg: "linear-gradient(135deg,#0b4ea2 0%,#1d6de0 60%,#69a7ff 100%)",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&h=600&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200&h=130&fit=crop&q=70",
  },
  {
    id: "rocket-fresh",
    label: "Quick Grocery", title: "Rocket Fresh",
    headline: "Order tonight,\narrives tomorrow morning",
    copy: "Fresh food, meal kits, bakery — overnight delivery",
    bg: "linear-gradient(135deg,#0f766e 0%,#11998e 60%,#5ad1c4 100%)",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&h=600&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=130&fit=crop&q=70",
  },
  {
    id: "brand-week",
    label: "Brand Week", title: "Brand Week",
    headline: "Top appliances & living brands\nup to 58% off",
    copy: "Exclusive bundles with free gifts included",
    bg: "linear-gradient(135deg,#7c2d12 0%,#d9480f 60%,#ff9b54 100%)",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&h=600&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&h=130&fit=crop&q=70",
  },
  {
    id: "beauty-festa",
    label: "Beauty Festa", title: "Beauty Festa",
    headline: "K-Beauty brands\nexclusive lowest prices",
    copy: "Skincare to makeup at the best prices",
    bg: "linear-gradient(135deg,#831843 0%,#db2777 60%,#f9a8d4 100%)",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&h=600&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&h=130&fit=crop&q=70",
  },
  {
    id: "digital-festa",
    label: "Digital Deals", title: "Digital Festa",
    headline: "Laptops, TVs & appliances\nbest prices ever",
    copy: "Instant card discount + up to 24-month interest-free installments",
    bg: "linear-gradient(135deg,#1e1b4b 0%,#4338ca 60%,#818cf8 100%)",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&h=600&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=130&fit=crop&q=70",
  },
];

const MARQUEE_ITEMS = [
  "🚀 Rocket Delivery deals up to 70% off",
  "📦 Free Rocket Delivery — Wow member benefit",
  "🎁 ₩5,000 signup coupon, instant reward",
  "⚡ Time deals closing in 3 hours — hurry!",
  "🌟 Brand Week up to 58% off",
  "💳 Instant card discount up to 15%",
  "🎉 Gold Box opens at 10 AM",
  "👑 Wow members get an extra 5% off",
];

const HOME_EVENT_NOTICES = {
  delivery: {
    eyebrow: "Rocket Delivery",
    title: "Your order is arriving today",
    body: "Track the Rocket Delivery package arriving before 7 PM.",
    ctaLabel: "Track delivery",
    ctaId: "shopping.home.async.delivery.track",
    icon: "📦",
    accent: "from-[#0b4ea2] to-[#60a5fa]",
  },
  coupon: {
    eyebrow: "Member benefit",
    title: "Exclusive coupon is ready",
    body: "A member-only ₩7,000 coupon was added to your Coupon Box.",
    ctaLabel: "View coupon",
    ctaId: "shopping.home.async.coupon.view",
    icon: "🎟️",
    accent: "from-[#7c3aed] to-[#ec4899]",
  },
  timedeal: {
    eyebrow: "Time Deal",
    title: "Electronics flash deal opened",
    body: "The next 30-minute deal is live with extra card discounts.",
    ctaLabel: "See time deal",
    ctaId: "shopping.home.async.timedeal.see",
    icon: "⚡",
    accent: "from-[#ea580c] to-[#facc15]",
  },
} as const;

const TIME_DEALS = [
  { name: "4K UHD Smart TV 55-inch", price: "₩489,000", original: "₩890,000", discount: "45%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop&q=80", rating: 4.7, reviews: 2341 },
  { name: "Robot Vacuum with Auto-Empty Station", price: "₩329,000", original: "₩599,000", discount: "45%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=400&fit=crop&q=80", rating: 4.6, reviews: 1893 },
  { name: "Large Air Fryer 6L", price: "₩69,900", original: "₩129,000", discount: "46%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&q=80", rating: 4.8, reviews: 5621 },
  { name: "High-Performance Wireless Gaming Mouse", price: "₩42,000", original: "₩79,000", discount: "47%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop&q=80", rating: 4.5, reviews: 3204 },
  { name: "Fully Automatic Drip Coffee Machine", price: "₩159,000", original: "₩289,000", discount: "44%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&q=80", rating: 4.8, reviews: 2784 },
  { name: "3-Seat Fabric Sofa", price: "₩219,000", original: "₩398,000", discount: "45%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80", rating: 4.6, reviews: 1148 },
  { name: "Slim Cordless Vacuum All-in-One", price: "₩179,000", original: "₩329,000", discount: "46%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop&q=80", rating: 4.7, reviews: 1962 },
  { name: "Foldable Camping Table & Chair Set", price: "₩58,900", original: "₩109,000", discount: "45%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop&q=80", rating: 4.5, reviews: 1542 },
  { name: "Slim Laptop 15.6-inch 512GB", price: "₩689,000", original: "₩1,190,000", discount: "42%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&q=80", rating: 4.7, reviews: 3102 },
  { name: "Waterproof Trekking Backpack 30L", price: "₩38,000", original: "₩69,000", discount: "44%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&q=80", rating: 4.6, reviews: 2418 },
  { name: "LED Floor Lamp 3-Level Brightness", price: "₩29,900", original: "₩52,000", discount: "42%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop&q=80", rating: 4.7, reviews: 1876 },
  { name: "TPE Non-Slip Yoga Mat 6mm", price: "₩22,900", original: "₩39,000", discount: "41%", badge: "Time Deal", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&q=80", rating: 4.8, reviews: 4291 },
];


function getImageFallbackMeta(label: string) {
  if (/shirt|pants|skirt|jacket|dress|running|hiking|fashion/.test(label)) return { emoji: "👕", bg: "#fdf2f8" };
  if (/salmon|strawberry|tangerine|yogurt|avocado|food|tofu/.test(label)) return { emoji: "🥗", bg: "#ecfdf5" };
  if (/earphone|speaker|keyboard|webcam|laptop|TV|mouse|charger|smartwatch|electronics|vacuum/.test(label)) return { emoji: "🎧", bg: "#eff6ff" };
  if (/serum|sunscreen|foundation|liptint|maskpack|beauty/.test(label)) return { emoji: "💄", bg: "#fff1f2" };
  if (/sofa|pillow|lamp|table|chair/.test(label)) return { emoji: "🛋️", bg: "#f5f3ff" };
  if (/backpack|carrier|camping/.test(label)) return { emoji: "🎒", bg: "#fff7ed" };
  return { emoji: "🛍️", bg: "#f3f4f6" };
}

function createFallbackDataUrl(label: string) {
  const { emoji, bg } = getImageFallbackMeta(label);
  const shortLabel = label.length > 18 ? `${label.slice(0, 18)}...` : label;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <rect width="800" height="800" rx="36" fill="${bg}" />
      <rect x="36" y="36" width="728" height="728" rx="28" fill="white" stroke="#e5e7eb" />
      <text x="400" y="315" text-anchor="middle" font-size="136">${emoji}</text>
      <text x="400" y="430" text-anchor="middle" font-size="34" font-weight="700" fill="#111827">${shortLabel}</text>
      <text x="400" y="490" text-anchor="middle" font-size="22" fill="#6b7280">Capang Image Placeholder</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function SafeImage({ src, alt, ...props }: Omit<ImageProps, "src" | "alt"> & { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={imgSrc.startsWith("data:")}
      onError={() => setImgSrc(createFallbackDataUrl(alt))}
    />
  );
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
  runtimeStateKey: "__SHOPPING_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  resolveActionElement: resolveInteractiveReviewElement,
  captureClickTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
  captureHoverTargetSelector: "[data-igg-id],button,a,[role='button'],[role='tab']",
});

/* ─── page ──────────────────────────────────────────────────────────────── */

export default function ShoppingHomePage() {
  const [benchmarkStateId, setBenchmarkStateId] = useState("default");
  const [benchmarkScrollTarget, setBenchmarkScrollTarget] = useState<"top" | "bottom" | "todayDiscovery">("top");

  /* hero auto-slide */
  const [activeHero, setActiveHero] = useState(0);
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  function resetHeroTimer() {
    if (heroTimer.current) clearInterval(heroTimer.current);
    heroTimer.current = setInterval(() => setActiveHero(p => (p + 1) % HERO_SLIDES.length), 4500);
  }
  useEffect(() => {
    resetHeroTimer();
    return () => { if (heroTimer.current) clearInterval(heroTimer.current); };
  }, []);

  /* category mega-menu */
  const [catOpen, setCatOpen]       = useState(false);
  const [hoveredCat, setHoveredCat] = useState(0);
  const catRef = useRef<HTMLDivElement>(null);
  const todayDiscoveryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!catRef.current?.contains(event.target as Node)) {
        setCatOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  /* promo modal */
  const [showRoulette, setShowRoulette]   = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  /* wishlist / cart */
  const [cartItems, setCartItems] = useState<CartItem[]>(cloneCartItems(DEFAULT_CART_ITEMS));
  const [cartOpen, setCartOpen]     = useState(false);
  const [myMenuOpen, setMyMenuOpen] = useState(false);
  const [timeDealPage, setTimeDealPage] = useState(0);
  const [homeEventDelayMs, setHomeEventDelayMs] = useState<number | null>(null);
  const [homeEventKind, setHomeEventKind] = useState<keyof typeof HOME_EVENT_NOTICES | null>(null);
  const [homeEventVisible, setHomeEventVisible] = useState(false);

  const timeDealsPerPage = 4;
  const timeDealPageCount = Math.ceil(TIME_DEALS.length / timeDealsPerPage);
  const visibleTimeDeals = TIME_DEALS.slice(
    timeDealPage * timeDealsPerPage,
    (timeDealPage + 1) * timeDealsPerPage,
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stateId = searchParams.get("stateId") ?? searchParams.get("stateid");
    const initialState = getShoppingBenchmarkState(stateId);

    if (initialState.route === "product" && initialState.productId) {
      window.location.replace(`/product/${initialState.productId}?stateId=${initialState.id}`);
      return;
    }

    setBenchmarkStateId(initialState.id);
    setCartItems(cloneCartItems(initialState.cartItems));
    setShowRoulette(initialState.home.showPromoModal);
    setActiveHero(initialState.home.activeHero);
    setTimeDealPage(initialState.home.timeDealPage);
    setMyMenuOpen(initialState.home.myMenuOpen);
    setCartOpen(initialState.home.cartOpen);
    setCatOpen(initialState.home.catOpen);
    setHomeEventDelayMs(initialState.home.eventDelayMs);
    setHomeEventKind(initialState.home.eventKind);
    setHomeEventVisible(initialState.home.eventDelayMs === null);
    setBenchmarkScrollTarget(initialState.scrollTarget);

    requestAnimationFrame(() => {
      if (initialState.scrollTarget === "todayDiscovery" && todayDiscoveryRef.current) {
        const top = Math.max(todayDiscoveryRef.current.offsetTop - 170, 0);
        window.scrollTo({ top, behavior: "auto" });
        return;
      }
      window.scrollTo({
        top: initialState.scrollTarget === "bottom" ? document.documentElement.scrollHeight : 0,
        behavior: "auto",
      });
    });
  }, []);

  useEffect(() => {
    (window as Window & {
      __SHOPPING_BENCHMARK_STATE__?: Record<string, unknown>;
    }).__SHOPPING_BENCHMARK_STATE__ = {
      stateId: benchmarkStateId,
      route: "home",
      page: "shopping.home",
      cartItems,
      showRoulette,
      activeHero,
      timeDealPage,
      catOpen,
      myMenuOpen,
      cartOpen,
      homeEventKind,
      homeEventVisible,
      scrollTarget: benchmarkScrollTarget,
    };
  }, [activeHero, benchmarkScrollTarget, benchmarkStateId, cartItems, cartOpen, catOpen, homeEventKind, homeEventVisible, myMenuOpen, showRoulette, timeDealPage]);

  useEffect(() => {
    if (homeEventDelayMs === null || !homeEventKind) return;
    const timer = window.setTimeout(() => setHomeEventVisible(true), homeEventDelayMs);
    return () => window.clearTimeout(timer);
  }, [homeEventDelayMs, homeEventKind]);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __SHOPPING_BENCHMARK_STATE__?: Record<string, unknown> }).__SHOPPING_BENCHMARK_STATE__ ?? null;
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

  function addToCart(name: string) {
    const prod = PRODUCTS.find(p => p.name === name);
    if (prod) {
      setCartItems(prev => {
        const idx = prev.findIndex(c => c.name === name);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
          return next;
        }
        return [...prev, { name: prod.name, price: prod.price, image: prod.image.replace("w=400&h=400", "w=80&h=80"), qty: 1 }];
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6fa] text-[#111827]">

      {homeEventKind && homeEventVisible && (
        <HomeEventNotice
          notice={HOME_EVENT_NOTICES[homeEventKind]}
          onClose={() => setHomeEventVisible(false)}
        />
      )}

      {/* ── coupon ad modal ──────────────────────────────────────────── */}
      {showRoulette && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="relative w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-6 pb-5 pt-6 text-center" style={{ background: "linear-gradient(135deg,#0b4ea2,#2563eb 55%,#60a5fa 100%)" }}>
              <div className="text-xs font-semibold uppercase tracking-[.2em] text-blue-200">Capang Coupon Box</div>
              <h2 className="mt-2 text-[28px] font-black text-white">Your Coupon Box Has Arrived</h2>
              <p className="mt-2 text-sm text-blue-100">Check your exclusive discount coupons and member benefits available today.</p>
            </div>
            <div className="px-6 py-6">
              <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-2xl">
                    🎁
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-black text-[#111827]">Today&apos;s Coupons Just for You</p>
                    <p className="mt-1 text-[13px] leading-5 text-[#6b7280]">
                      Up to ₩10,000 discount coupon, extra cart discount, and category-stacking coupons await.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full bg-[#dbeafe] px-2.5 py-1 text-[11px] font-bold text-[#1d4ed8]">Expires Today</span>
                  <span className="rounded-full bg-[#fee2e2] px-2.5 py-1 text-[11px] font-bold text-[#dc2626]">Up to ₩10,000</span>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setShowRoulette(false)}
                  className="flex-1 rounded-xl bg-[#0b4ea2] py-3 text-sm font-black text-white hover:bg-[#1d4ed8]"
                >
                  View Coupon Box
                </button>
                <button
                  onClick={() => setShowRoulette(false)}
                  data-igg-id="shopping.home.promo-modal.dismiss"
                  className="flex-1 rounded-xl border border-[#dbe4f2] bg-white py-3 text-sm font-bold text-[#6b7280] hover:border-[#0b4ea2] hover:text-[#0b4ea2]"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── top utility bar ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-1.5 text-[12px] text-[#6b7280]">
          <div className="flex items-center gap-0.5">
            <button className="px-2 py-1 hover:text-[#111827]">Bookmarks</button>
            <div className="relative group">
              <button data-igg-id="shopping.home.sell-trigger" className="flex items-center gap-0.5 px-2 py-1 hover:text-[#111827]">
                Sell on Capang <span className="text-[10px]">▼</span>
              </button>
              <div className="absolute left-0 top-full z-50 hidden group-hover:block w-[160px] bg-white shadow-lg border border-[#e5e7eb] rounded-b py-1"
                style={{ animation: "dropDown .12s ease" }}>
                {["New Seller Application","Application Status","Seller Training","Partners Center"].map(t => (
                  <button key={t}
                    data-igg-id={
                      t === "New Seller Application" ? "shopping.home.sell.new-application" :
                      t === "Application Status" ? "shopping.home.sell.status" :
                      t === "Seller Training" ? "shopping.home.sell.training" :
                      t === "Partners Center" ? "shopping.home.sell.partners" :
                      undefined
                    }
                    className="block w-full px-4 py-2 text-left text-[12px] text-[#374151] hover:bg-[#f5f7ff] hover:text-[#0b4ea2]">{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {["Sign In","Sign Up","Help Center","Sell on Capang"].map(t => (
              <button
                key={t}
                data-igg-id={t === "Sign Up" ? "shopping.home.top-signup" : undefined}
                className="px-2 py-1 hover:text-[#111827] whitespace-nowrap"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── marquee ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden bg-[#e8f0fe] py-1.5">
        <div className="inline-flex gap-10 whitespace-nowrap text-[13px] font-medium text-[#1d4ed8]"
          style={{ animation: "marquee 28s linear infinite" }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      {/* ── header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#dbe4f2] shadow-sm">
        <div className="mx-auto max-w-[1240px] px-5">
          <div className="flex items-center gap-4 py-3">
            {/* logo */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0b4ea2] text-xl font-black text-white">C</div>
              <div>
                <div className="text-[26px] font-black leading-none text-[#0b4ea2]">Capang</div>
                <div className="text-[10px] uppercase tracking-widest text-[#6b7280]">everyday commerce</div>
              </div>
            </div>
            {/* search */}
            <div className="flex-1">
              <div className="flex h-11 overflow-hidden rounded border-2 border-[#0b4ea2]">
                <select className="hidden border-r border-[#dbe4f2] bg-[#f8fbff] px-3 text-sm text-[#374151] lg:block">
                  <option>All</option><option>Electronics</option><option>Food</option><option>Fashion</option>
                </select>
                <input className="flex-1 px-4 text-sm outline-none placeholder:text-[#aab4c4]" placeholder="Search for products" />
                <button className="flex w-12 items-center justify-center bg-[#0b4ea2] text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4"/>
                    <path d="M16.2 16.2L21 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* actions: My Capang + Cart */}
            <div className="hidden items-center gap-5 lg:flex">

              {/* My Capang */}
              <div className="relative"
                onMouseEnter={() => setMyMenuOpen(true)}
                onMouseLeave={() => setMyMenuOpen(false)}>
                <button className="flex flex-col items-center gap-0.5 text-[#374151] hover:text-[#0b4ea2] transition-colors">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[11px] font-semibold leading-none">My Capang</span>
                </button>

                {myMenuOpen && (
                  <div className="absolute right-0 top-full z-50 w-[200px] bg-white shadow-2xl border border-[#e5e7eb] rounded-b-lg overflow-hidden"
                    style={{ animation: "dropDown .12s ease" }}>
                    <div className="bg-[#0b4ea2] px-4 py-3">
                      <p className="text-white font-bold text-[14px]">Hello, Customer!</p>
                      <p className="text-blue-200 text-[11px] mt-0.5">Sign in for more benefits</p>
                    </div>
                    <div className="py-1">
                      {[
                        { icon: "📦", label: "My Orders", sub: "Check delivery status" },
                        { icon: "↩️", label: "Returns & Exchanges", sub: "Apply & check status" },
                        { icon: "🎟️", label: "Coupons", sub: "View your coupons" },
                      ].map(item => (
                        <button key={item.label}
                          className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-[#f5f7ff] transition-colors">
                          <span className="text-[18px] w-6 text-center">{item.icon}</span>
                          <div className="text-left">
                            <p className="text-[13px] font-semibold text-[#111827]">{item.label}</p>
                            <p className="text-[11px] text-[#9ca3af]">{item.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="relative"
                onMouseEnter={() => setCartOpen(true)}
                onMouseLeave={() => setCartOpen(false)}>
                <button
                  data-igg-id="shopping.home.cart-trigger"
                  className="flex flex-col items-center gap-0.5 text-[#374151] hover:text-[#0b4ea2] transition-colors"
                >
                  <div className="relative">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {cartItems.length > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-black text-white">
                        {cartItems.reduce((s, c) => s + c.qty, 0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold leading-none">Cart</span>
                </button>

                {cartOpen && (
                  <div className="absolute right-0 top-full z-50 w-[340px] bg-white shadow-2xl border border-[#e5e7eb] rounded-b-lg overflow-hidden"
                    style={{ animation: "dropDown .12s ease" }}>
                    <div className="border-b border-[#eef2f7] px-4 py-3 flex items-center justify-between">
                      <p className="font-bold text-[14px]">Cart</p>
                      <span className="text-[12px] text-[#6b7280]">{cartItems.reduce((s,c)=>s+c.qty,0)} item(s)</span>
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[13px] text-[#9ca3af]">Your cart is empty</div>
                    ) : (
                      <div className="max-h-[260px] overflow-y-auto" data-igg-id="shopping.home.cart.items-scroll">
                        {cartItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafcff]">
                            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-[#f6f7fb]">
                              <SafeImage src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="line-clamp-1 text-[13px] font-semibold">{item.name}</p>
                              <p className="text-[12px] text-[#0b4ea2] font-bold mt-0.5">{item.price}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  data-igg-id={
                                    item.name === "Premium Cleaned Salmon 300g" ? "shopping.home.cart.salmon.decrease" :
                                    item.name === "Noise-Canceling Bluetooth Earphones" ? "shopping.home.cart.earphones.decrease" :
                                    item.name === "Stainless Steel Electric Kettle 1.7L" ? "shopping.home.cart.kettle.decrease" :
                                    item.name === "Capang Basics Daily T-Shirt 3-Pack" ? "shopping.home.cart.tshirt.decrease" :
                                    undefined
                                  }
                                  onClick={() => setCartItems(prev => {
                                  const next = [...prev];
                                  if (next[i].qty <= 1) { next.splice(i, 1); } else { next[i] = { ...next[i], qty: next[i].qty - 1 }; }
                                  return next;
                                })} className="h-5 w-5 rounded border text-[12px] leading-none hover:bg-[#f3f4f6]">−</button>
                                <span className="w-5 text-center text-[12px] font-bold">{item.qty}</span>
                                <button onClick={() => setCartItems(prev => {
                                  const next = [...prev];
                                  next[i] = { ...next[i], qty: next[i].qty + 1 };
                                  return next;
                                })}
                                  data-igg-id={
                                    item.name === "Premium Cleaned Salmon 300g" ? "shopping.home.cart.salmon.increase" :
                                    item.name === "Noise-Canceling Bluetooth Earphones" ? "shopping.home.cart.earphones.increase" :
                                    item.name === "Stainless Steel Electric Kettle 1.7L" ? "shopping.home.cart.kettle.increase" :
                                    item.name === "Capang Basics Daily T-Shirt 3-Pack" ? "shopping.home.cart.tshirt.increase" :
                                    undefined
                                  }
                                  className="h-5 w-5 rounded border text-[12px] leading-none hover:bg-[#f3f4f6]">+</button>
                              </div>
                            </div>
                            <button
                              data-igg-id={
                                item.name === "Premium Cleaned Salmon 300g" ? "shopping.home.cart.salmon.remove" :
                                item.name === "Noise-Canceling Bluetooth Earphones" ? "shopping.home.cart.earphones.remove" :
                                item.name === "Stainless Steel Electric Kettle 1.7L" ? "shopping.home.cart.kettle.remove" :
                                item.name === "Capang Basics Daily T-Shirt 3-Pack" ? "shopping.home.cart.tshirt.remove" :
                                undefined
                              }
                              onClick={() => setCartItems(prev => prev.filter((_, j) => j !== i))}
                              className="flex-shrink-0 text-[#9ca3af] hover:text-[#ef4444] text-lg leading-none">×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-[#eef2f7] px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] text-[#6b7280]">Subtotal</span>
                        <span className="font-black text-[16px] text-[#111827]">
                          {cartItems.reduce((s, c) => {
                            const n = parseInt(c.price.replace(/[^0-9]/g,""), 10);
                            return s + n * c.qty;
                          }, 0).toLocaleString()}
                        </span>
                      </div>
                      <button
                        data-igg-id="shopping.home.cart.buy"
                        className="w-full rounded-sm bg-[#0b4ea2] py-2.5 text-[14px] font-black text-white hover:bg-[#1d4ed8] transition-colors"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── nav bar: categories + links ─────────────────────────── */}
          <nav className="flex items-center pb-0 border-t border-[#f0f2f8]">

            {/* category button (mega-menu trigger) */}
            <div ref={catRef} className="relative">

              <button data-igg-id="shopping.home.category-trigger" className={`flex items-center gap-2 h-11 px-4 text-sm font-bold transition-colors border-r border-[#f0f2f8]
                ${catOpen ? "bg-[#0b4ea2] text-white" : "text-[#111827] hover:bg-[#f5f7ff]"}`}
                onClick={() => setCatOpen((open) => !open)}>
                {/* hamburger */}
                <span className="flex flex-col gap-[4px]">
                  <span className={`block h-[2px] w-4 rounded transition-colors ${catOpen ? "bg-white" : "bg-[#374151]"}`}/>
                  <span className={`block h-[2px] w-4 rounded transition-colors ${catOpen ? "bg-white" : "bg-[#374151]"}`}/>
                  <span className={`block h-[2px] w-4 rounded transition-colors ${catOpen ? "bg-white" : "bg-[#374151]"}`}/>
                </span>
                Categories
                <span className={`text-[10px] transition-transform ${catOpen ? "rotate-180 text-white" : "text-[#6b7280]"}`}>▼</span>
              </button>

              {/* ── MEGA DROPDOWN ───────────────────────────────────── */}
              {catOpen && (
                <div className="absolute top-full left-0 z-50 flex w-[540px] shadow-2xl border border-[#dbe4f2] rounded-b-md overflow-hidden"
                  style={{ animation: "dropDown .15s ease" }}>

                  {/* left: category list */}
                  <div className="w-[200px] flex-shrink-0 bg-white border-r border-[#f0f2f8]">
                    {CATEGORIES.map((cat, i) => (
                      <button key={cat.name}
                        onMouseEnter={() => setHoveredCat(i)}
                        data-igg-id={cat.name === "Fashion" ? "shopping.home.nav.women" : cat.name === "Baby & Kids" ? "shopping.home.nav.kids" : cat.name === "Beauty" ? "shopping.home.nav.beauty" : cat.name === "Food" ? "shopping.home.nav.food" : cat.name === "Electronics" ? "shopping.home.nav.electronics" : undefined}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] border-b border-[#f5f6fa] last:border-0 transition-colors
                          ${hoveredCat === i ? "bg-[#eff6ff] text-[#0b4ea2] font-semibold" : "text-[#374151] hover:bg-[#f7f9fe]"}`}>
                        <span className="text-base w-5 text-center leading-none">{cat.icon}</span>
                        <span className="flex-1">{cat.name}</span>
                        <span className="text-[10px] text-[#9ca3af]">›</span>
                      </button>
                    ))}
                  </div>

                  {/* right: subcategories for hovered category */}
                  <div className="flex-1 bg-[#fafbff] p-4">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#e5e9f2]">
                      <span className="text-2xl">{CATEGORIES[hoveredCat].icon}</span>
                      <span className="font-bold text-[#0b4ea2]">{CATEGORIES[hoveredCat].name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORIES[hoveredCat].subs.map(sub => (
                        <button key={sub}
                          data-igg-id={
                            sub === "Men's" ? "shopping.home.nav.men" :
                            sub === "Audio" ? "shopping.home.nav.electronics.audio" :
                            sub === "Skincare" ? "shopping.home.nav.beauty.skincare" :
                            sub === "Fresh Produce" ? "shopping.home.nav.food.fresh" :
                            undefined
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded text-[13px] text-left text-[#374151] hover:bg-[#eff6ff] hover:text-[#0b4ea2] transition-colors">
                          <span className="text-[#0b4ea2] text-xs">›</span>{sub}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-md bg-[#eff6ff] px-3 py-2 text-xs text-[#0b4ea2] font-medium">
                      ✨ {CATEGORIES[hoveredCat].name} Today&apos;s Deals →
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* regular nav links */}
            <div className="flex items-center gap-1 overflow-x-auto px-2">
              {TOP_LINKS.map((l, i) => (
                <button key={l}
                  data-igg-id={i === 0 ? "shopping.home.top-link-first" : undefined}
                  className={`h-11 whitespace-nowrap px-3 text-[13px] font-semibold transition-colors
                    ${i === 0 ? "text-[#0b4ea2]" : "text-[#374151] hover:text-[#0b4ea2]"}`}>
                  {l}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1240px] px-5 pt-4 pb-10 flex flex-col gap-3">

        {/* ── HERO BANNER ──────────────────────────────────────────── */}
        <div className="flex h-[360px] rounded-sm overflow-hidden border border-[#dbe4f2] bg-white">
          {/* main slide */}
          <div className="relative flex-1 overflow-hidden">
            {HERO_SLIDES.map((s, idx) => (
              <div key={s.title}
                className="absolute inset-0 flex"
                style={{ background: s.bg, opacity: idx === activeHero ? 1 : 0, transition: "opacity .65s ease", pointerEvents: idx === activeHero ? "auto" : "none" }}>
                <div className="flex flex-col justify-between px-8 py-7 text-white w-[55%]">
                  <div>
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[.2em]">{s.label}</span>
                    <p className="mt-3 text-lg font-black text-white/90">{s.title}</p>
                    <h1 className="mt-2 whitespace-pre-line text-[2rem] font-black leading-snug">{s.headline}</h1>
                    <p className="mt-3 text-sm leading-6 text-white/80">{s.copy}</p>
                    <button
                      data-igg-id={`shopping.home.hero.${s.id}.cta`}
                      className="mt-5 rounded-full bg-white/25 px-5 py-2 text-sm font-bold hover:bg-white/35"
                    >
                      Shop Now →
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {HERO_SLIDES.map((heroSlide, di) => (
                      <button key={di}
                        data-igg-id={`shopping.home.hero.${heroSlide.id}.dot`}
                        onClick={() => { setActiveHero(di); resetHeroTimer(); }}
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: di === activeHero ? 24 : 6, background: di === activeHero ? "white" : "rgba(255,255,255,.4)" }} />
                    ))}
                  </div>
                </div>
                <div className="relative w-[45%]">
                  <SafeImage src={s.image} alt={s.title} fill className="object-cover" />
                </div>
              </div>
            ))}
          </div>

          {/* right thumbnail list */}
          <div className="w-[160px] flex-shrink-0 flex flex-col border-l border-[#e5e9f2] bg-[#f8faff] overflow-y-auto">
            {HERO_SLIDES.map((s, idx) => (
              <button key={s.title}
                onClick={() => { setActiveHero(idx); resetHeroTimer(); }}
                className={`flex flex-col text-left transition-all border-b border-[#e5e9f2] last:border-0
                  ${idx === activeHero ? "bg-white outline outline-2 outline-[#0b4ea2] outline-offset-[-2px]" : "hover:bg-white"}`}>
                <div className="relative w-full h-[72px] overflow-hidden">
                  <SafeImage src={s.thumb} alt={s.title} fill className="object-cover" />
                  {idx === activeHero && <div className="absolute inset-0 bg-[#0b4ea2]/10" />}
                </div>
                <div className="px-2.5 py-2">
                  <p className={`text-[11px] font-bold leading-tight line-clamp-1 ${idx === activeHero ? "text-[#0b4ea2]" : "text-[#374151]"}`}>{s.title}</p>
                  <p className="mt-0.5 text-[10px] text-[#6b7280] line-clamp-1">{s.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── scrolling blue ad ticker ────────────────────────────── */}
        <div className="overflow-hidden rounded-sm bg-[#0b4ea2] py-2.5 border border-[#0a3f88]">
          <div className="inline-flex gap-8 whitespace-nowrap text-[13px] font-semibold text-white"
            style={{ animation: "marquee 18s linear infinite" }}>
            {["🎁 Today's deals up to 70% off","📦 Free same-day Rocket Delivery","💳 15% instant card discount","👑 Unlimited free shipping for Wow members","⚡ Time deals open at 10 AM","🌟 ₩5,000 signup coupon",
              "🎁 Today's deals up to 70% off","📦 Free same-day Rocket Delivery","💳 15% instant card discount","👑 Unlimited free shipping for Wow members"].map((t,i)=><span key={i}>{t}</span>)}
          </div>
        </div>

        {/* ── coupon roulette CTA ─────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-sm border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] to-[#dbeafe] px-5 py-4 cursor-pointer hover:shadow-md transition-all"
          onClick={() => setShowRoulette(true)}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3b82f6]">Just for You</p>
            <p className="mt-0.5 text-lg font-black text-[#0b4ea2]">Coupon Roulette 🎯 — Spin Now!</p>
          </div>
          <button className="rounded-full bg-[#0b4ea2] px-5 py-2 text-sm font-bold text-white hover:bg-[#1d4ed8]">Spin</button>
        </div>

        {/* ── products grid ───────────────────────────────────────── */}
        <div ref={todayDiscoveryRef} className="rounded-sm border border-[#dbe4f2] bg-white">
          <div className="border-b border-[#eef2f7] px-5 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">Capang Pick</p>
            <h2 className="mt-0.5 text-xl font-black">Today&apos;s Discovery</h2>
          </div>
          <div className="grid gap-px bg-[#eef2f7] sm:grid-cols-2 xl:grid-cols-3">
            {PRODUCTS.map((p) => (
              <article key={p.name} className="group bg-white p-4 hover:bg-[#fafcff] transition-colors">
                <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
                  <div className="relative h-[130px] overflow-hidden rounded-sm bg-[#f6f7fb]">
                    <SafeImage src={p.image} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute left-1.5 top-1.5 rounded-sm bg-[#ef4444] px-1.5 py-0.5 text-[11px] font-bold text-white">{p.discount}</div>
                    <button
                      data-igg-id={
                        p.name === "Wireless Mechanical Keyboard Tenkeyless" ? "shopping.home.today-discovery.keyboard.wishlist" :
                        p.name === "Capang Basics Daily T-Shirt 3-Pack" ? "shopping.home.today-discovery.capang-basics.wishlist" :
                        p.name === "Lightweight Cushion Running Shoes" ? "shopping.home.today-discovery.running-shoes.wishlist" :
                        undefined
                      }
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity text-[15px] text-[#ef4444]"
                      aria-label="Add to wishlist"
                    >♡</button>
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex rounded-sm bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-bold text-[#0b4ea2]">{p.badge}</span>
                    <button
                      type="button"
                      data-igg-id={p.name === "Wireless Mechanical Keyboard Tenkeyless" ? "shopping.home.today-discovery.keyboard.title" : p.name === "Capang Basics Daily T-Shirt 3-Pack" ? "shopping.home.today-discovery.capang-basics.title" : undefined}
                      className="mt-1.5 line-clamp-2 cursor-pointer text-left text-[14px] font-semibold leading-5 hover:text-[#0b4ea2] hover:underline active:scale-[0.99]"
                    >
                      {p.name}
                    </button>
                    <p className="mt-1.5 text-lg font-black">{p.price}</p>
                    <p className="text-[11px] text-[#9ca3af] line-through">{p.originalPrice}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#f59e0b]">
                      {"★".repeat(Math.round(p.rating))}
                      <span className="text-[#9ca3af]">({p.reviews.toLocaleString()})</span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        data-igg-id={
                          p.name === "Lightweight Cushion Running Shoes"
                            ? "shopping.home.today-discovery.running-shoes.cart"
                            : p.name === "Capang Basics Daily T-Shirt 3-Pack"
                              ? "shopping.home.today-discovery.capang-basics.cart"
                              : p.name === "Wireless Mechanical Keyboard Tenkeyless"
                                ? "shopping.home.today-discovery.keyboard.cart"
                              : undefined
                        }
                        onClick={() => addToCart(p.name)}
                        className="rounded-sm border border-[#0b4ea2] py-1.5 text-[13px] font-bold text-[#0b4ea2] hover:bg-[#eff6ff]"
                      >
                        Cart
                      </button>
                      <button
                        onClick={() => addToCart(p.name)}
                        className="rounded-sm bg-[#0b4ea2] py-1.5 text-[13px] font-bold text-white hover:bg-[#1d4ed8]"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ── mid-page banner ad (sliding) ────────────────────────── */}
        <BannerAd />

        {/* ── HOT TREND: category picks ────────────────────────────── */}
        <HotTrend addToCart={addToCart} initialFilterPanelOpen={showFilterPanel} />

        {/* ── flash deal strip ────────────────────────────────────── */}
        <div className="rounded-sm border border-[#dbe4f2] bg-white overflow-hidden">
          <div className="border-b border-[#eef2f7] px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">Today Only</p>
              <h2 className="mt-0.5 text-xl font-black">⚡ Time Deals</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[24px] font-black tracking-tight text-[#111827]">
                {timeDealPage + 1}/{timeDealPageCount}
              </span>
              <button className="text-[13px] text-[#0b4ea2] font-semibold hover:underline">See All →</button>
            </div>
          </div>
          <div className="relative px-6 py-6">
            <button
              onClick={() => {
                if (timeDealPage === 0) return;
                setTimeDealPage((prev) => Math.max(prev - 1, 0));
              }}
              aria-disabled={timeDealPage === 0}
              data-igg-id="shopping.home.time-deals.prev"
              className={`absolute left-2 top-[128px] z-10 flex h-12 w-12 items-center justify-center rounded-md border border-[#d1d5db] bg-white text-[34px] leading-none text-[#4b5563] shadow-sm transition-colors hover:border-[#0b4ea2] hover:text-[#0b4ea2] ${
                timeDealPage === 0 ? "cursor-not-allowed opacity-0" : ""
              }`}
              aria-label="previous time deals"
            >
              ‹
            </button>
            <button
              onClick={() => {
                if (timeDealPage === timeDealPageCount - 1) return;
                setTimeDealPage((prev) => Math.min(prev + 1, timeDealPageCount - 1));
              }}
              aria-disabled={timeDealPage === timeDealPageCount - 1}
              data-igg-id="shopping.home.time-deals.next"
              className={`absolute right-2 top-[128px] z-10 flex h-12 w-12 items-center justify-center rounded-md border border-[#d1d5db] bg-white text-[34px] leading-none text-[#4b5563] shadow-sm transition-colors hover:border-[#0b4ea2] hover:text-[#0b4ea2] ${
                timeDealPage === timeDealPageCount - 1 ? "cursor-not-allowed opacity-40" : ""
              }`}
              aria-label="next time deals"
            >
              ›
            </button>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleTimeDeals.map((p) => (
              <article key={p.name} className="group bg-white hover:bg-[#fafcff] transition-colors">
                <div className="relative mb-3 h-[190px] overflow-hidden rounded-sm bg-[#f6f7fb]">
                  <SafeImage src={p.image} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute left-1.5 top-1.5 rounded-sm bg-[#ef4444] px-1.5 py-0.5 text-[11px] font-bold text-white">{p.discount}</div>
                </div>
                <span className="inline-flex rounded-sm bg-[#fef2f2] px-1.5 py-0.5 text-[11px] font-bold text-[#ef4444]">⚡ {p.badge}</span>
                <button
                  type="button"
                  data-igg-id={p.name === "Waterproof Trekking Backpack 30L" ? "shopping.home.time-deals.backpack.title" : p.name === "Large Air Fryer 6L" ? "shopping.home.time-deals.airfryer.title" : undefined}
                  className="mt-1.5 line-clamp-2 cursor-pointer text-left text-[13px] font-semibold leading-5 hover:text-[#0b4ea2] hover:underline active:scale-[0.99]"
                >
                  {p.name}
                </button>
                <p className="mt-1.5 text-[17px] font-black">{p.price}</p>
                <p className="text-[11px] text-[#9ca3af] line-through">{p.original}</p>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#f59e0b]">
                  {"★".repeat(Math.round(p.rating))}
                  <span className="text-[#9ca3af]">({p.reviews.toLocaleString()})</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    data-igg-id={p.name === "Waterproof Trekking Backpack 30L" ? "shopping.home.time-deals.backpack.cart" : p.name === "Large Air Fryer 6L" ? "shopping.home.time-deals.airfryer.cart" : undefined}
                    onClick={() => addToCart(p.name)}
                    className="rounded-sm border border-[#0b4ea2] py-1.5 text-[13px] font-bold text-[#0b4ea2] hover:bg-[#eff6ff]"
                  >
                    Cart
                  </button>
                  <button
                    data-igg-id={p.name === "Large Air Fryer 6L" ? "shopping.home.time-deals.airfryer.buy" : undefined}
                    onClick={() => addToCart(p.name)}
                    className="rounded-sm bg-[#0b4ea2] py-1.5 text-[13px] font-bold text-white hover:bg-[#1d4ed8]"
                  >
                    Buy Now
                  </button>
                </div>
              </article>
            ))}
          </div>
          </div>
        </div>

        {/* ── ramen promo banner ───────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-sm h-[140px]"
          style={{ background: "linear-gradient(135deg,#7f1d1d 0%,#dc2626 55%,#f59e0b 100%)" }}>
          <div className="absolute inset-0 flex items-center px-10 gap-8">
            <div className="text-white">
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-orange-200">Hot Deal</p>
              <h3 className="mt-1 text-[26px] font-black leading-tight">Noodle Pasta Festa 🍜</h3>
              <p className="mt-1 text-[13px] text-orange-100">Shin Ramen, Chapaghetti & Neoguri bundles up to 42% off</p>
            </div>
            <button
              data-igg-id="shopping.home.ramen-festa.cta"
              className="ml-auto rounded-full bg-white px-6 py-2.5 text-[13px] font-black text-[#b91c1c] hover:bg-orange-50 transition-colors whitespace-nowrap"
            >
              See Noodle Deals →
            </button>
          </div>
        </div>

        {/* ── recommend by interest ────────────────────────────────── */}
        <div className="rounded-sm border border-[#dbe4f2] bg-white overflow-hidden">
          <div className="border-b border-[#eef2f7] px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">You Might Also Like</p>
              <h2 className="mt-1 text-[24px] font-black leading-none text-[#111827]">Personalized Picks</h2>
            </div>
            <button className="text-[13px] text-[#0b4ea2] font-semibold hover:underline">More →</button>
          </div>
          <div className="flex overflow-x-auto gap-px bg-[#eef2f7]">
            {[
              { name: "Hydrating Calming Sheet Mask 10-Pack", price: "₩12,900", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop&q=80", discount: "35%" },
              { name: "Ultra-Lightweight Foldable Hair Dryer", price: "₩38,900", image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop&q=80", discount: "22%" },
              { name: "Mini Blender Smoothie Maker", price: "₩39,000", image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop&q=80", discount: "30%" },
              { name: "Fully Waterproof Wireless Earbuds", price: "₩59,000", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop&q=80", discount: "38%" },
              { name: "Waterproof Trekking Hiking Shoes", price: "₩69,000", image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop&q=80", discount: "33%" },
              { name: "Insulated Tumbler 500ml", price: "₩24,900", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop&q=80", discount: "17%" },
              { name: "Foldable Mini Camping Lantern", price: "₩31,900", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&h=400&fit=crop&q=80", discount: "26%" },
            ].map((p) => (
              <article key={p.name} className="group bg-white p-3 w-[170px] flex-shrink-0 hover:bg-[#fafcff] transition-colors">
                <div className="relative h-[150px] overflow-hidden rounded-sm bg-[#f6f7fb] mb-2">
                  <SafeImage src={p.image} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute left-1.5 top-1.5 rounded-sm bg-[#ef4444] px-1.5 py-0.5 text-[11px] font-bold text-white">{p.discount}</div>
                </div>
                <button
                  type="button"
                  data-igg-id={p.name === "Waterproof Trekking Hiking Shoes" ? "shopping.home.recommend-hiking-shoes.title" : undefined}
                  className="line-clamp-2 cursor-pointer text-left text-[12px] font-semibold leading-4 hover:text-[#0b4ea2] hover:underline active:scale-[0.99]"
                >
                  {p.name}
                </button>
                <p className="mt-1 text-[15px] font-black">{p.price}</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => addToCart(p.name)}
                    className="rounded-sm border border-[#0b4ea2] py-1.5 text-[11px] font-bold text-[#0b4ea2] hover:bg-[#eff6ff]"
                  >
                    Cart
                  </button>
                  <button
                    data-igg-id={p.name === "Waterproof Trekking Hiking Shoes" ? "shopping.home.recommend-hiking-shoes.buy" : undefined}
                    onClick={() => addToCart(p.name)}
                    className="rounded-sm bg-[#0b4ea2] py-1.5 text-[11px] font-bold text-white hover:bg-[#1d4ed8]"
                  >
                    Buy Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

      </div>

      {/* ── footer ───────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#e5e7eb] mt-8">
        {/* top footer links */}
        <div className="border-b border-[#eef2f7]">
          <div className="mx-auto max-w-[1240px] px-5 py-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[#6b7280]">
            {["Announcements","Help Center","Consumer Policy","Terms of Service","Privacy Policy","Youth Policy","Sell on Capang","Partners","IR","Careers","Advertise","FAQ","Investor Relations","Global Sites"].map(t => (
              <button
                key={t}
                data-igg-id={t === "Careers" ? "shopping.home.footer-careers" : undefined}
                className="hover:text-[#374151] hover:underline whitespace-nowrap"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* main footer */}
        <div className="mx-auto max-w-[1240px] px-5 py-8">
          <div className="flex gap-10 flex-wrap">
            {/* logo + company info */}
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b4ea2] text-lg font-black text-white">C</div>
                <span className="text-[22px] font-black text-[#0b4ea2]">capang</span>
              </div>
              <div className="text-[12px] text-[#9ca3af] leading-6 space-y-0.5">
                <p>Capang LLC | CEO: Kim Capang</p>
                <p>123 Teheran-ro, Gangnam-gu, Seoul | Reg. No.: 123-45-67890</p>
                <p>E-commerce Reg.: 2020-Seoul-0000 | Privacy Officer: Lee Boan</p>
                <p>Email: cs@capang.com</p>
                <p className="mt-2 text-[11px]">© 2024 Capang. All rights reserved.</p>
              </div>
            </div>

            {/* customer service */}
            <div className="min-w-[160px]">
              <p className="font-bold text-[14px] text-[#111827] mb-3">Customer Service</p>
              <p className="text-[24px] font-black text-[#0b4ea2]">1577-7011</p>
              <p className="text-[12px] text-[#6b7280] mt-1">Mon–Fri 09:00–18:00</p>
              <p className="text-[12px] text-[#6b7280]">Closed weekends & holidays</p>
              <button className="mt-3 rounded border border-[#0b4ea2] px-3 py-1.5 text-[12px] font-semibold text-[#0b4ea2] hover:bg-[#eff6ff] transition-colors">
                Contact Us
              </button>
            </div>

            {/* useful links */}
            <div className="min-w-[140px]">
              <p className="font-bold text-[14px] text-[#111827] mb-3">Quick Links</p>
              <div className="space-y-2 text-[13px] text-[#6b7280]">
                {["My Capang","Order Tracking","Returns & Exchanges","Contact Us","Gift Cards & Coupons","Events"].map(l => (
                  <button key={l} className="block hover:text-[#0b4ea2] text-left">{l}</button>
                ))}
              </div>
            </div>

            {/* company links */}
            <div className="min-w-[140px]">
              <p className="font-bold text-[14px] text-[#111827] mb-3">About Us</p>
              <div className="space-y-2 text-[13px] text-[#6b7280]">
                {["About Us","ESG","Newsroom","IR","Careers","Capang Logistics","Capang Pay"].map(l => (
                  <button key={l} className="block hover:text-[#0b4ea2] text-left">{l}</button>
                ))}
              </div>
            </div>

            {/* app download + sns */}
            <div className="min-w-[140px]">
              <p className="font-bold text-[14px] text-[#111827] mb-3">Get the App</p>
              <div className="flex flex-col gap-2 mb-4">
                {[["📱 App Store","bg-[#111827]"],["▶ Google Play","bg-[#111827]"]].map(([label, cls]) => (
                  <button key={label} className={`${cls} text-white rounded px-3 py-1.5 text-[12px] font-semibold hover:opacity-80 text-left`}>{label}</button>
                ))}
              </div>
              <p className="font-bold text-[14px] text-[#111827] mb-2">SNS</p>
              <div className="flex gap-2">
                {["f","in","🐦","▶"].map((icon, i) => (
                  <button key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f6] text-[13px] font-bold text-[#374151] hover:bg-[#0b4ea2] hover:text-white transition-colors">
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* bottom footer */}
        <div className="border-t border-[#eef2f7] bg-[#f9fafb]">
          <div className="mx-auto max-w-[1240px] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] text-[#9ca3af]">
              Some products sold on Capang are listed by third-party sellers, not sold directly by Capang.
              Product details, prices, and shipping information are provided by sellers. Capang acts as an intermediary platform and is not directly liable for sales.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee    { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes dropDown   { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatPulse {
          0%,100%{transform:scale(1);    box-shadow:0 0 0 0    rgba(239,68,68,.5)}
          50%    {transform:scale(1.07); box-shadow:0 0 0 12px rgba(239,68,68,0)}
        }
        @keyframes slideLeft { from{transform:translateX(0)} to{transform:translateX(-100%)} }
      `}</style>
    </main>
  );
}

function HomeEventNotice({
  notice,
  onClose,
}: {
  notice: (typeof HOME_EVENT_NOTICES)[keyof typeof HOME_EVENT_NOTICES];
  onClose: () => void;
}) {
  return (
    <div className="fixed right-6 top-40 z-[70] w-[360px] overflow-hidden rounded-2xl border border-[#dbe4f2] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.24)]">
      <div className={`h-1.5 bg-gradient-to-r ${notice.accent}`} />
      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-2xl">
            {notice.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[.14em] text-[#0b4ea2]">Capang</span>
              <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
              <span className="truncate text-[11px] font-semibold text-[#64748b]">{notice.eyebrow}</span>
            </div>
            <div className="text-[15px] font-black text-[#111827]">{notice.title}</div>
            <p className="mt-1 text-[13px] leading-5 text-[#64748b]">{notice.body}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#334155]"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
        <div className="flex items-center gap-2 border-t border-[#eef2f7] pt-3">
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-[12px] font-bold text-[#64748b] hover:bg-[#f8fafc] hover:text-[#334155]"
          >
            Later
          </button>
          <button
            data-igg-id={notice.ctaId}
            data-igg-type="async_wait"
            data-igg-label={notice.ctaLabel}
            onClick={onClose}
            className="ml-auto rounded-xl bg-[#0b4ea2] px-4 py-2 text-[12px] font-black text-white hover:bg-[#1d4ed8]"
          >
            {notice.ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── BannerAd ──────────────────────────────────────────────────────────── */

const AD_BANNERS = [
  {
    id: "tofu",
    bg: "linear-gradient(135deg,#065f46 0%,#10b981 60%,#6ee7b7 100%)",
    tag: "Healthy Choice",
    title: "The era of\npremium tofu is here",
    sub: "Pulmuone high-density tofu — 30% richer",
    cta: "Shop Now",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=300&fit=crop&q=80",
  },
  {
    id: "skincare",
    bg: "linear-gradient(135deg,#7c2d12 0%,#dc2626 60%,#fca5a5 100%)",
    tag: "Today's Deal",
    title: "Skincare up to\n65% off",
    sub: "Popular K-Beauty brands, all in one place",
    cta: "See Deals",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=300&fit=crop&q=80",
  },
  {
    id: "electronics",
    bg: "linear-gradient(135deg,#1e3a5f 0%,#1d6de0 60%,#93c5fd 100%)",
    tag: "Electronics Deal",
    title: "Summer essentials\nFans & AC on sale",
    sub: "Order today, arrive tomorrow — Rocket Delivery",
    cta: "Check Deals",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=300&fit=crop&q=80",
  },
];

function BannerAd() {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function reset() {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setActive(p => (p + 1) % AD_BANNERS.length), 4000);
  }
  useEffect(() => { reset(); return () => { if (timer.current) clearInterval(timer.current); }; }, []);

  return (
    <div className="relative overflow-hidden rounded-sm h-[140px] border border-[#dbe4f2]">
      {AD_BANNERS.map((b, i) => (
        <div key={i}
          className="absolute inset-0 flex items-center px-10 gap-8 transition-opacity duration-700"
          style={{ background: b.bg, opacity: i === active ? 1 : 0, pointerEvents: i === active ? "auto" : "none" }}>
          <div className="flex-1 text-white">
            <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">{b.tag}</span>
            <h3 className="mt-1.5 whitespace-pre-line text-[22px] font-black leading-tight">{b.title}</h3>
            <p className="mt-1 text-[12px] text-white/80">{b.sub}</p>
          </div>
          <div className="relative h-[110px] w-[180px] flex-shrink-0 overflow-hidden rounded-sm">
            <SafeImage src={b.image} alt={b.title} fill className="object-cover" />
          </div>
          <button
            data-igg-id={`shopping.home.mid-banner.${b.id}.cta`}
            className="flex-shrink-0 rounded-full bg-white/25 px-5 py-2 text-[13px] font-bold text-white hover:bg-white/40 whitespace-nowrap"
          >
            {b.cta} →
          </button>
        </div>
      ))}

      {/* prev / next */}
      <button onClick={() => { setActive(p => (p - 1 + AD_BANNERS.length) % AD_BANNERS.length); reset(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40">‹</button>
      <button onClick={() => { setActive(p => (p + 1) % AD_BANNERS.length); reset(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40">›</button>

      {/* dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {AD_BANNERS.map((_, i) => (
          <button
            key={i}
            data-igg-id={`shopping.home.mid-banner.${AD_BANNERS[i].id}.dot`}
            onClick={() => { setActive(i); reset(); }}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === active ? 18 : 5, background: i === active ? "white" : "rgba(255,255,255,.5)" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── HotTrend ──────────────────────────────────────────────────────────── */

const HOT_CATS = [
  {
    name: "Women's Fashion",
    icon: "👗",
    color: "#db2777",
    items: [
      { name: "Linen Wide-Leg Pants", price: "₩28,900", discount: "35%", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&h=300&fit=crop&q=80" },
      { name: "Chiffon Pleated Long Skirt", price: "₩32,000", discount: "28%", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=300&h=300&fit=crop&q=80" },
      { name: "Oversized Crop Jacket", price: "₩45,900", discount: "42%", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=300&fit=crop&q=80" },
      { name: "Daily Stripe Shirt", price: "₩19,900", discount: "20%", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop&q=80" },
    ],
  },
  {
    name: "Electronics",
    icon: "📱",
    color: "#0b4ea2",
    items: [
      { name: "Wireless Bluetooth Speaker", price: "₩39,000", discount: "30%", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop&q=80" },
      { name: "USB-C Fast Charger 65W", price: "₩22,900", discount: "25%", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300&h=300&fit=crop&q=80" },
      { name: "Slim Wireless Keyboard", price: "₩35,000", discount: "20%", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop&q=80" },
      { name: "Webcam FHD 1080p", price: "₩49,000", discount: "35%", image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300&h=300&fit=crop&q=80" },
    ],
  },
  {
    name: "Food",
    icon: "🥗",
    color: "#16a34a",
    items: [
      { name: "Jeju Tangerines 3kg Premium", price: "₩18,900", discount: "22%", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=300&h=300&fit=crop&q=80" },
      { name: "Korean Frozen Strawberries 500g", price: "₩9,900", discount: "15%", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop&q=80" },
      { name: "Premium Greek Yogurt", price: "₩12,500", discount: "10%", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop&q=80" },
      { name: "Organic Avocado 3-Pack", price: "₩8,900", discount: "18%", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&h=300&fit=crop&q=80" },
    ],
  },
  {
    name: "Beauty",
    icon: "💄",
    color: "#db2777",
    items: [
      { name: "Vitamin C Serum 30ml", price: "₩24,000", discount: "40%", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop&q=80" },
      { name: "Sunscreen SPF50+ 50ml", price: "₩19,900", discount: "33%", image: "https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=300&h=300&fit=crop&q=80" },
      { name: "Cushion Foundation Refill", price: "₩28,000", discount: "25%", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop&q=80" },
      { name: "Best-Selling Lip Tint", price: "₩14,900", discount: "20%", image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=300&h=300&fit=crop&q=80" },
    ],
  },
];

function HotTrend({ addToCart, initialFilterPanelOpen }: { addToCart: (n: string) => void; initialFilterPanelOpen: boolean }) {
  const [activeCat, setActiveCat] = useState(0);
  const [filterPanelWidth, setFilterPanelWidth] = useState(() => initialFilterPanelOpen ? 120 : 0);
  const cat = HOT_CATS[activeCat];

  useEffect(() => {
    setFilterPanelWidth(initialFilterPanelOpen ? 120 : 0);
  }, [initialFilterPanelOpen]);

  return (
    <div className="rounded-sm border border-[#dbe4f2] bg-white overflow-hidden">
      <div className="border-b border-[#eef2f7] px-5 py-3.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9ca3af]">HOT TREND</p>
        <h2 className="mt-0.5 text-xl font-black">Category Picks</h2>
      </div>
      <div className="flex">
        {/* category sidebar */}
        <div className="w-[160px] flex-shrink-0 border-r border-[#eef2f7] bg-[#fafbff]">
          {HOT_CATS.map((c, i) => (
            <button key={c.name} onClick={() => setActiveCat(i)}
              data-igg-id={c.name === "Food" ? "shopping.home.hottrend.category-food" : c.name === "Women's Fashion" ? "shopping.home.hottrend.category-fashion" : undefined}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 text-left text-[14px] font-semibold border-b border-[#f0f2f8] last:border-0 transition-colors
                ${i === activeCat ? "bg-white text-[#0b4ea2] border-l-2 border-l-[#0b4ea2]" : "text-[#374151] hover:bg-white"}`}>
              <span className="text-xl w-6 text-center">{c.icon}</span>
              <span className="flex-1 leading-tight">{c.name}</span>
              {i === activeCat && <span className="text-[10px] text-[#0b4ea2]">›</span>}
            </button>
          ))}
          <div className="px-4 py-3">
            <button className="w-full rounded border border-[#dbe4f2] py-2 text-[12px] font-semibold text-[#6b7280] hover:border-[#0b4ea2] hover:text-[#0b4ea2] transition-colors">
              See All →
            </button>
          </div>
        </div>

        {/* product grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#eef2f7]">
            {cat.items.map((p) => (
              <article key={p.name} className="group bg-white p-4 hover:bg-[#fafcff] transition-colors">
                <div className="relative h-[140px] overflow-hidden rounded-sm bg-[#f6f7fb] mb-3">
                  <SafeImage src={p.image} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute left-1.5 top-1.5 rounded-sm bg-[#ef4444] px-1.5 py-0.5 text-[11px] font-bold text-white">{p.discount}</div>
                </div>
                <button
                  type="button"
                  data-igg-id={p.name === "Premium Greek Yogurt" ? "shopping.home.hottrend.greek-yogurt.title" : undefined}
                  className="line-clamp-2 cursor-pointer text-left text-[13px] font-semibold leading-5 hover:text-[#0b4ea2] hover:underline active:scale-[0.99]"
                >
                  {p.name}
                </button>
                <p className="mt-1.5 text-[16px] font-black">{p.price}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addToCart(p.name)}
                    className="rounded-sm border border-[#0b4ea2] py-1.5 text-[12px] font-bold text-[#0b4ea2] hover:bg-[#eff6ff] transition-colors"
                  >
                    Cart
                  </button>
                  <button
                    data-igg-id={p.name === "Premium Greek Yogurt" ? "shopping.home.hottrend.greek-yogurt.buy" : undefined}
                    onClick={() => addToCart(p.name)}
                    className="rounded-sm bg-[#0b4ea2] py-1.5 text-[12px] font-bold text-white hover:bg-[#1d4ed8] transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* ── Sort & Filter panel (draggable right-side panel) ───────── */}
          {filterPanelWidth > 0 && (
            <div
              style={{ position:"fixed", top:0, right:0, height:"100vh", width:filterPanelWidth, backgroundColor:"#fff", boxShadow:"-4px 0 20px rgba(11,78,162,0.12)", zIndex:40, display:"flex", flexDirection:"column", borderLeft:"1px solid #dbe4f2" }}
            >
              {/* resize handle */}
              <div
                style={{ position:"absolute", left:0, top:0, height:"100%", width:4, cursor:"col-resize", zIndex:1 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startW = filterPanelWidth;
                  function onMove(ev: MouseEvent) { setFilterPanelWidth(Math.max(120, Math.min(500, startW + (startX - ev.clientX)))); }
                  function onUp() { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }
                  document.addEventListener("mousemove", onMove);
                  document.addEventListener("mouseup", onUp);
                }}
              />
              <div style={{ padding:"20px 16px 14px", borderBottom:"1px solid #eef2f7", fontWeight:800, fontSize:15, color:"#111827", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span>{filterPanelWidth >= 180 ? "Sort & Filter" : "⇄"}</span>
                <button onClick={() => setFilterPanelWidth(0)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:16, padding:"0 4px" }}>✕</button>
              </div>
              {filterPanelWidth >= 280 && (
                <div style={{ padding:"16px", overflowY:"auto", flex:1 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Sort by</p>
                  {[
                    { id:"shopping.filter.sort.popular",   label:"Most Popular"       },
                    { id:"shopping.filter.sort.newest",    label:"Newest Arrivals"    },
                    { id:"shopping.filter.sort.price-asc", label:"Price: Low to High" },
                    { id:"shopping.filter.sort.price-desc",label:"Price: High to Low" },
                    { id:"shopping.filter.sort.rating",    label:"Highest Rated"      },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      data-igg-id={opt.id}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 12px", marginBottom:6, borderRadius:7, border:"1px solid #e5e7eb", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer", background:"#fff" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* sub-category tag strip */}
          <div className="border-t border-[#eef2f7] px-4 py-3 flex flex-wrap gap-2">
            {["HOT Keywords"].concat(
              activeCat === 0 ? ["Summer Dress","Linen Pants","Crop Tee","Oversized Shirt","Mini Skirt","Jacket"] :
              activeCat === 1 ? ["Bluetooth","Charger","Mouse","Keyboard","Monitor","Speaker"] :
              activeCat === 2 ? ["Fresh Fruit","Meal Kit","Organic","Health Food","Ready Meals","Beverages"] :
              ["Serum","Sunscreen","Cushion","Lip Tint","Sheet Mask","Eye Cream"]
            ).map((tag, i) => (
              <span key={tag}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold cursor-pointer transition-colors
                  ${i === 0 ? "bg-[#fef2f2] text-[#ef4444]" : "bg-[#f3f4f6] text-[#374151] hover:bg-[#eff6ff] hover:text-[#0b4ea2]"}`}>
                {i === 0 ? "🔥 " : ""}{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
