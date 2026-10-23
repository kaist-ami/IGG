"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { PRODUCTS } from "../../products-data";
import { cloneCartItems, DEFAULT_CART_ITEMS, getShoppingBenchmarkState } from "../../shopping-states";
import { createReviewRuntime } from "../../../../../lib/review-runtime";

/* ── related products carousel ──────────────────────────────────────── */
const RELATED_PRODUCTS = [
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: "₩449,000",
    original: null,
    discount: null,
    badge: "Premium",
    rating: 4.9,
    reviews: 8921,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Bose QC45 Noise-Canceling Headphones",
    price: "₩389,000",
    original: null,
    discount: null,
    badge: "Best Seller",
    rating: 4.8,
    reviews: 5432,
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Samsung Galaxy Buds2 Pro",
    price: "₩229,000",
    original: null,
    discount: null,
    badge: "Rocket Delivery",
    rating: 4.6,
    reviews: 12043,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Apple AirPods Pro 2nd Gen",
    price: "₩389,000",
    original: null,
    discount: null,
    badge: "Official Store",
    rating: 4.9,
    reviews: 24891,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "JBL Tune 760NC Wireless Headphones",
    price: "₩149,000",
    original: null,
    discount: null,
    badge: "Regular Price",
    rating: 4.5,
    reviews: 3201,
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Sennheiser CX 400BT Earphones",
    price: "₩159,000",
    original: null,
    discount: null,
    badge: "Regular Price",
    rating: 4.7,
    reviews: 4108,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Anker Soundcore Q45 Headphones",
    price: "₩49,000",
    original: "₩89,000",
    discount: "44%",
    badge: "Free Shipping",
    rating: 4.5,
    reviews: 2874,
    image: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&h=400&fit=crop&q=80",
  },
];

/* ── extra images for the earphone gallery ───────────────────────────── */
const EARPHONE_GALLERY = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=600&h=600&fit=crop&q=80",
];

const PRODUCT_MARQUEE_ITEMS = [
  "🚀 Wow member benefits",
  "🎁 ₩5,000 signup coupon, instant reward",
  "⚡ Time deals closing in 3 hours — hurry!",
  "🌟 Brand Week up to 58% off",
  "💳 Instant card discount up to 15%",
  "🎉 Gold Box opens at 10 AM",
];

const COLOR_OPTIONS = [
  { value: "Black", label: "Black", swatchClassName: "bg-[#111827]" },
  { value: "White", label: "White", swatchClassName: "bg-white border border-[#cbd5e1]" },
  { value: "Navy", label: "Navy", swatchClassName: "bg-[#1e3a8a]" },
];

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

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  if (id !== "earphones") {
    notFound();
  }

  const product = PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[3];
  const gallery = EARPHONE_GALLERY;

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [relatedIdx, setRelatedIdx] = useState(0);
  const relatedVisible = 4;
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cardStep, setCardStep] = useState(0);
  useEffect(() => {
    function measure() {
      if (carouselRef.current) {
        const w = carouselRef.current.offsetWidth;
        setCardStep((w - (relatedVisible - 1) * 16) / relatedVisible + 16);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const [tab, setTab] = useState<"info" | "review" | "qna" | "return">("info");
  const [benchmarkStateId, setBenchmarkStateId] = useState("product.default");
  const [benchmarkScrollTarget, setBenchmarkScrollTarget] = useState<"top" | "bottom" | "todayDiscovery">("top");
  const [selectedColor, setSelectedColor] = useState("Black");
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [myMenuOpen, setMyMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [interestPopupOpen, setInterestPopupOpen] = useState(false);
  const [consultationWidgetOpen, setConsultationWidgetOpen] = useState(false);
  const [consultationResolved, setConsultationResolved] = useState(false);
  const [cartItems, setCartItems] = useState(() => cloneCartItems(DEFAULT_CART_ITEMS));

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stateId = searchParams.get("stateId") ?? searchParams.get("stateid");
    const initialState = getShoppingBenchmarkState(stateId);
    const resolvedStateId = initialState.route === "product" ? initialState.id : "product.default";

    setBenchmarkStateId(resolvedStateId);
    setBenchmarkScrollTarget(initialState.scrollTarget);
    setColorMenuOpen(initialState.product.colorMenuOpen);
    setInterestPopupOpen(false);
    setConsultationWidgetOpen(initialState.product.consultationWidgetOpen);
    setConsultationResolved(false);
    setCartItems(cloneCartItems(initialState.cartItems));
    window.scrollTo({
      top: initialState.scrollTarget === "bottom" ? document.documentElement.scrollHeight : 0,
      behavior: "auto",
    });

    if (initialState.product.interestPopupDelayMs) {
      const timeoutId = window.setTimeout(() => {
        setInterestPopupOpen(true);
      }, initialState.product.interestPopupDelayMs);

      return () => window.clearTimeout(timeoutId);
    }

    if (initialState.product.consultationResolveDelayMs) {
      const timeoutId = window.setTimeout(() => {
        setConsultationResolved(true);
      }, initialState.product.consultationResolveDelayMs);

      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    (window as Window & {
      __SHOPPING_BENCHMARK_STATE__?: Record<string, unknown>;
    }).__SHOPPING_BENCHMARK_STATE__ = {
      stateId: benchmarkStateId,
      route: "product",
      page: "product.earphones",
      productId: product.id,
      activeImg,
      qty,
      tab,
      colorMenuOpen,
      selectedColor,
      myMenuOpen,
      cartOpen,
      interestPopupOpen,
      consultationWidgetOpen,
      consultationResolved,
      cartItems,
      scrollTarget: benchmarkScrollTarget,
    };
  }, [activeImg, benchmarkScrollTarget, benchmarkStateId, cartItems, cartOpen, colorMenuOpen, consultationResolved, consultationWidgetOpen, interestPopupOpen, myMenuOpen, product.id, qty, selectedColor, tab]);

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

  function addToCart() {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.name === product.name);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], qty: next[existingIndex].qty + qty };
        return next;
      }
      return [...prev, { name: product.name, price: product.price, image: product.image, qty }];
    });
  }

  const priceNum = parseInt(product.price.replace(/[^0-9]/g, ""), 10);
  const selectedColorOption = COLOR_OPTIONS.find((option) => option.value === selectedColor) ?? COLOR_OPTIONS[0];

  function closeInterestPopup() {
    setInterestPopupOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f6fa] text-[#111827]">
      {interestPopupOpen && (
        <div className="fixed bottom-6 right-6 z-[70] w-[340px] rounded-2xl border border-[#dbe4f2] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[18px]">
              🎧
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[16px] font-extrabold leading-5 text-[#111827]">Looks like you&apos;re interested in earphones</p>
              <p className="mt-1.5 text-[12px] leading-[1.45] text-[#6b7280]">
                Discover more products and deals at the Digital Festa.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setInterestPopupOpen(false)}
              data-igg-id="shopping.product.earphones.interest-popup.dismiss"
              className="rounded-xl border border-[#dbe4f2] bg-white py-3 text-[13px] font-bold text-[#6b7280] transition-colors hover:border-[#0b4ea2] hover:text-[#0b4ea2]"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={closeInterestPopup}
              data-igg-id="shopping.product.earphones.interest-popup.cta"
              className="rounded-xl bg-[#0b4ea2] px-3 py-3 text-[13px] font-bold leading-4 text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Learn More
            </button>
          </div>
        </div>
      )}

      {consultationWidgetOpen && (
        <div className="fixed bottom-6 right-6 z-[72] w-[360px] overflow-hidden rounded-2xl border border-[#dbe4f2] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <div className="border-b border-[#e8eef8] bg-[#0b4ea2] px-4 py-3 text-white">
            <p className="text-[14px] font-bold">Capang Customer Support</p>
            <p className="mt-0.5 text-[12px] text-blue-100">Live chat connected</p>
          </div>
          <div className="space-y-3 bg-[#f8fbff] px-4 py-4">
            <div className="flex justify-end">
              <div className="max-w-[250px] rounded-2xl rounded-tr-md bg-[#0b4ea2] px-3 py-2.5 text-white shadow-sm">
                <p className="text-[12px] leading-[1.45]">
                  I&apos;d like to check the delivery date and stock for the Black option.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-[14px] shadow-sm">
                👩‍💼
              </div>
              <div className="max-w-[270px] rounded-2xl rounded-tl-md bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[12px] leading-[1.45] text-[#374151]">
                  Happy to check. The Black option is in stock and will arrive tomorrow if ordered before 11:30 PM tonight.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[250px] rounded-2xl rounded-tr-md bg-[#0b4ea2] px-3 py-2.5 text-white shadow-sm">
                <p className="text-[12px] leading-[1.45]">
                  Great, confirmed. I&apos;ll place the order now.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-[14px] shadow-sm">
                💬
              </div>
              <div className="max-w-[270px] rounded-2xl rounded-tl-md bg-white px-3 py-2.5 shadow-sm">
                {!consultationResolved ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#94a3b8] [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#94a3b8] [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#94a3b8]" />
                  </div>
                ) : (
                  <div>
                    <p className="text-[13px] font-semibold leading-5 text-[#111827]">
                      Thank you. We&apos;ve confirmed the Black option is in stock and will arrive tomorrow.
                    </p>
                    <p className="mt-1.5 text-[12px] leading-[1.45] text-[#6b7280]">
                      Click the End Consultation button below to close this chat.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-disabled={!consultationResolved}
              data-igg-id="shopping.product.earphones.consultation.end"
              onClick={() => {
                if (!consultationResolved) return;
                setConsultationWidgetOpen(false);
              }}
              className={`w-full rounded-xl py-3 text-[14px] font-bold transition-colors ${
                consultationResolved
                  ? "bg-[#0b4ea2] text-white hover:bg-[#1d4ed8]"
                  : "cursor-not-allowed bg-[#dbe4f2] text-[#94a3b8]"
              }`}
            >
              End Consultation
            </button>
          </div>
        </div>
      )}

      {/* ── top utility bar ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-1.5 text-[12px] text-[#6b7280]">
          <div className="flex items-center gap-0.5">
            <button className="px-2 py-1 hover:text-[#111827]">Bookmarks</button>
            <button className="flex items-center gap-0.5 px-2 py-1 hover:text-[#111827]">
              Sell on Capang <span className="text-[10px]">▼</span>
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            {["Sign In", "Sign Up", "Help Center", "Sell on Capang"].map((t) => (
              <button key={t} className="px-2 py-1 whitespace-nowrap hover:text-[#111827]">{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-[#e8f0fe] py-1.5">
        <div
          className="inline-flex gap-10 whitespace-nowrap text-[13px] font-medium text-[#1d4ed8]"
          style={{ animation: "marquee 28s linear infinite" }}
        >
          {[...PRODUCT_MARQUEE_ITEMS, ...PRODUCT_MARQUEE_ITEMS].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      {/* ── header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#dbe4f2] shadow-sm">
        <div className="mx-auto max-w-[1240px] px-5">
          <div className="flex items-center gap-4 py-3">
            <Link href="/" className="flex items-center gap-2 min-w-[140px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0b4ea2] text-xl font-black text-white">C</div>
              <div>
                <div className="text-[26px] font-black leading-none text-[#0b4ea2]">Capang</div>
                <div className="text-[10px] uppercase tracking-widest text-[#6b7280]">everyday commerce</div>
              </div>
            </Link>
            <div className="flex-1">
              <div className="flex h-11 overflow-hidden rounded border-2 border-[#0b4ea2]">
                <select className="hidden border-r border-[#dbe4f2] bg-[#f8fbff] px-3 text-sm text-[#374151] lg:block">
                  <option>All</option>
                  <option>Electronics</option>
                  <option>Food</option>
                  <option>Fashion</option>
                </select>
                <input className="flex-1 px-4 text-sm outline-none placeholder:text-[#aab4c4]" placeholder="Search for products" />
                <button className="flex w-12 items-center justify-center bg-[#0b4ea2] text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4" />
                    <path d="M16.2 16.2L21 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="hidden items-center gap-5 lg:flex">
              <div
                className="relative"
                onMouseEnter={() => setMyMenuOpen(true)}
                onMouseLeave={() => setMyMenuOpen(false)}
              >
                <button className="flex flex-col items-center gap-0.5 text-[#374151] transition-colors hover:text-[#0b4ea2]">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[11px] font-semibold leading-none">My Capang</span>
                </button>

                {myMenuOpen && (
                  <div className="absolute right-0 top-full z-50 w-[260px] overflow-hidden rounded-b-lg border border-[#e5e7eb] bg-white shadow-2xl" style={{ animation: "dropDown .12s ease" }}>
                    <div className="bg-[#0b4ea2] px-5 py-4">
                      <p className="text-[15px] font-bold text-white">Hello, Customer!</p>
                      <p className="mt-1 text-[12px] text-blue-200">Sign in for more benefits</p>
                    </div>
                    <div className="py-2">
                      {[
                        { icon: "📦", label: "My Orders", sub: "Check delivery status" },
                        { icon: "↩️", label: "Returns & Exchanges", sub: "Apply & check status" },
                        { icon: "🎟️", label: "Coupons", sub: "View your coupons" },
                      ].map((item) => (
                        <button key={item.label} className="flex w-full items-center gap-3 px-5 py-3 transition-colors hover:bg-[#f5f7ff]">
                          <span className="w-7 text-center text-[20px]">{item.icon}</span>
                          <div className="text-left">
                            <p className="text-[14px] font-semibold text-[#111827]">{item.label}</p>
                            <p className="text-[12px] text-[#9ca3af]">{item.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setCartOpen(true)}
                onMouseLeave={() => setCartOpen(false)}
              >
                <button className="flex flex-col items-center gap-0.5 text-[#374151] transition-colors hover:text-[#0b4ea2]">
                  <div className="relative">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {cartItems.length > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-black text-white">
                        {cartItems.reduce((sum, item) => sum + item.qty, 0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold leading-none">Cart</span>
                </button>

                {cartOpen && (
                  <div className="absolute right-0 top-full z-50 w-[390px] overflow-hidden rounded-b-lg border border-[#e5e7eb] bg-white shadow-2xl" style={{ animation: "dropDown .12s ease" }}>
                    <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
                      <p className="text-[15px] font-bold">Cart</p>
                      <span className="text-[13px] text-[#6b7280]">{cartItems.reduce((sum, item) => sum + item.qty, 0)} item(s)</span>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto">
                      {cartItems.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4 last:border-0 hover:bg-[#fafcff]">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-[#f6f7fb]">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-[14px] font-semibold">{item.name}</p>
                            <p className="mt-0.5 text-[13px] font-bold text-[#0b4ea2]">{item.price}</p>
                            <div className="mt-1 flex items-center gap-1">
                              <button
                                onClick={() => setCartItems((prev) => {
                                  const next = [...prev];
                                  if (next[index].qty <= 1) next.splice(index, 1);
                                  else next[index] = { ...next[index], qty: next[index].qty - 1 };
                                  return next;
                                })}
                                className="h-6 w-6 rounded border text-[13px] leading-none hover:bg-[#f3f4f6]"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-[13px] font-bold">{item.qty}</span>
                              <button
                                onClick={() => setCartItems((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], qty: next[index].qty + 1 };
                                  return next;
                                })}
                                className="h-6 w-6 rounded border text-[13px] leading-none hover:bg-[#f3f4f6]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => setCartItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                            className="flex-shrink-0 text-lg leading-none text-[#9ca3af] hover:text-[#ef4444]"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[#eef2f7] px-5 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[14px] text-[#6b7280]">Subtotal</span>
                        <span className="text-[18px] font-black text-[#111827]">
                          {cartItems.reduce((sum, item) => {
                            const price = parseInt(item.price.replace(/[^0-9]/g, ""), 10);
                            return sum + price * item.qty;
                          }, 0).toLocaleString()}
                        </span>
                      </div>
                      <button className="w-full rounded-sm bg-[#0b4ea2] py-3 text-[14px] font-black text-white hover:bg-[#1d4ed8] transition-colors">
                        Go to Cart →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── breadcrumb ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#eef2f7]">
        <div className="mx-auto max-w-[1240px] px-5 py-2.5 text-[12px] text-[#6b7280] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#0b4ea2]">Home</Link>
          <span>›</span>
          <span className="hover:text-[#0b4ea2] cursor-pointer">Electronics</span>
          <span>›</span>
          <span className="hover:text-[#0b4ea2] cursor-pointer">Audio</span>
          <span>›</span>
          <span className="hover:text-[#0b4ea2] cursor-pointer">Bluetooth Earphones</span>
          <span>›</span>
          <span className="text-[#111827] font-medium line-clamp-1 max-w-[260px]">{product.name}</span>
        </div>
      </div>

      {/* ── main product layout ─────────────────────────────────────── */}
      <div className="mx-auto max-w-[1240px] px-5 py-6">
        <div className="flex gap-10">

          {/* ── LEFT: image gallery ─────────────────────────────────── */}
          <div className="flex w-[600px] flex-shrink-0 gap-4">
            {/* thumbnails */}
            <div className="flex flex-col gap-3">
              {gallery.map((src, i) => (
                <button key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-md border-2 bg-white transition-all
                    ${i === activeImg ? "border-[#0b4ea2] shadow-sm" : "border-[#e5e7eb] hover:border-[#93c5fd]"}`}>
                  <Image src={src} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
            {/* main image */}
            <div className="relative flex-1 overflow-hidden rounded-md border border-[#e5e7eb] bg-white shadow-sm"
              data-igg-id={product.id === "earphones" ? "shopping.product.earphones.image-main" : undefined}
              style={{ aspectRatio: "1/1" }}>
              <Image src={gallery[activeImg]} alt={product.name} fill className="object-cover scale-[1.06]" />
              <div className="absolute left-2 top-2 rounded-sm bg-[#ef4444] px-2 py-0.5 text-[13px] font-bold text-white">
                {product.discount} off
              </div>
            </div>
          </div>

          {/* ── RIGHT: product info ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* badge + title */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex rounded-sm bg-[#eff6ff] px-2 py-0.5 text-[12px] font-bold text-[#0b4ea2]">{product.badge}</span>
              <span className="text-[12px] text-[#6b7280]">Rocket Delivery</span>
            </div>
            <h1 className="text-[20px] font-bold leading-tight text-[#111827]">
              {product.name}
            </h1>

            {/* rating row */}
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[#f59e0b] text-[14px]">{"★".repeat(Math.round(product.rating))}</span>
                <span className="text-[13px] font-bold text-[#111827]">{product.rating}</span>
              </div>
              <button className="text-[13px] text-[#0b4ea2] underline">
                {product.reviews.toLocaleString()} Reviews
              </button>
              <span className="text-[12px] text-[#6b7280]">· Loved by Wow members</span>
            </div>

            <div className="mt-4 border-t border-[#eef2f7]" />

            {/* price */}
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-black text-[#111827]">{product.price}</span>
                <span className="text-[16px] font-bold text-[#ef4444]">{product.discount} off</span>
              </div>
              <p className="mt-0.5 text-[13px] text-[#9ca3af] line-through">{product.originalPrice}</p>
            </div>

            {/* coupon / benefit row */}
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-[70px] flex-shrink-0 text-[#6b7280]">Coupon Discount</span>
                <span className="font-semibold text-[#0b4ea2]">Up to 5% coupon discount available</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-[70px] flex-shrink-0 text-[#6b7280]">Card Discount</span>
                <span className="font-semibold">5% instant discount (Hyundai·Shinhan·Samsung Card)</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-[70px] flex-shrink-0 text-[#6b7280]">Interest-Free</span>
                <span className="font-semibold">Up to 12-month interest-free</span>
              </div>
            </div>

            <div className="mt-4 border-t border-[#eef2f7]" />

            {/* delivery */}
            <div className="mt-4 flex flex-col gap-2 text-[13px]">
              <div className="flex items-start gap-2">
                <span className="w-[70px] flex-shrink-0 text-[#6b7280]">Shipping</span>
                <div>
                  <span className="font-bold text-[#0b4ea2]">Rocket Delivery</span>
                  <span className="ml-1 text-[#6b7280]">Arrives tomorrow (Thu)</span>
                  <div className="mt-0.5 text-[#6b7280]">Order before 11:30 PM · Free shipping</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-[70px] flex-shrink-0 text-[#6b7280]">Seller</span>
                <span className="font-semibold text-[#0b4ea2] underline cursor-pointer">Capang Official Store</span>
              </div>
            </div>

            <div className="mt-4 border-t border-[#eef2f7]" />

            {/* options */}
            <div className="mt-4">
              <p className="mb-2 text-[13px] font-semibold text-[#374151]">Options</p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setColorMenuOpen((open) => !open)}
                  data-igg-id="shopping.product.earphones.color-trigger"
                  className="flex h-11 w-full items-center justify-between rounded border border-[#dbe4f2] bg-white px-3 text-[13px] font-semibold text-[#374151] outline-none transition-colors hover:border-[#0b4ea2]"
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${selectedColorOption.swatchClassName}`} />
                    <span>Color: {selectedColorOption.label}</span>
                  </span>
                  <span className={`text-[10px] text-[#6b7280] transition-transform ${colorMenuOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {colorMenuOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-[#dbe4f2] bg-white shadow-lg" style={{ animation: "dropDown .12s ease" }}>
                    {COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-igg-id={option.value === "Navy" ? "shopping.product.earphones.color-navy" : undefined}
                        onClick={() => {
                          setSelectedColor(option.value);
                          setColorMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-3 text-left transition-colors hover:bg-[#f5f7ff]"
                      >
                        <span className="flex items-center gap-2 text-[13px] font-semibold text-[#374151]">
                          <span className={`h-3 w-3 rounded-full ${option.swatchClassName}`} />
                          <span>{option.label}</span>
                        </span>
                        {selectedColor === option.value && <span className="text-[12px] font-bold text-[#0b4ea2]">Selected</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* quantity */}
            <div className="mt-4 flex items-center gap-3">
              <p className="text-[13px] font-semibold text-[#374151]">Quantity</p>
              <div className="flex items-center overflow-hidden rounded border border-[#e5e7eb]">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="h-8 w-8 text-lg leading-none text-[#374151] hover:bg-[#f3f4f6] transition-colors">−</button>
                <span className="w-10 text-center text-[14px] font-bold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  data-igg-id="shopping.product.earphones.quantity.increase"
                  className="h-8 w-8 text-lg leading-none text-[#374151] hover:bg-[#f3f4f6] transition-colors">+</button>
              </div>
              <span className="text-[13px] text-[#6b7280]">
                Total <strong className="text-[#111827]">₩{(priceNum * qty).toLocaleString()}</strong>
              </span>
            </div>

            {/* CTA buttons */}
            <div className="mt-5 flex gap-2">
              <button onClick={addToCart}
                className="flex-1 rounded-sm border-2 border-[#0b4ea2] py-3.5 text-[15px] font-bold text-[#0b4ea2] hover:bg-[#eff6ff] transition-colors">
                Add to Cart
              </button>
              <button
                data-igg-id="shopping.product.earphones.buy-now"
                className="flex-1 rounded-sm bg-[#0b4ea2] py-3.5 text-[15px] font-bold text-white hover:bg-[#1d4ed8] transition-colors"
              >
                Buy Now →
              </button>
            </div>

            {/* share */}
            <div className="mt-3 flex items-center gap-2">
              <div className="relative">
                {shareMenuOpen && (
                  <div
                    className="absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 rounded-xl border border-[#dbe4f2] bg-white px-3 py-2 shadow-lg"
                    style={{ animation: "dropDown .12s ease" }}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-igg-id="shopping.product.earphones.share-mail"
                        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe4f2] bg-white text-[18px] hover:border-[#0b4ea2] hover:bg-[#eff6ff]"
                      >
                        📧
                        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-[#111827] px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          mail
                        </span>
                      </button>
                      <button
                        type="button"
                        data-igg-id="shopping.product.earphones.share-message"
                        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe4f2] bg-white text-[18px] hover:border-[#0b4ea2] hover:bg-[#eff6ff]"
                      >
                        💬
                        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-[#111827] px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          message
                        </span>
                      </button>
                    </div>
                    <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#dbe4f2] bg-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShareMenuOpen((open) => !open)}
                  data-igg-id="shopping.product.earphones.share-trigger"
                  className="flex items-center gap-1.5 rounded border border-[#e5e7eb] px-3 py-2 text-[13px] text-[#6b7280] hover:border-[#93c5fd] hover:text-[#0b4ea2] transition-colors"
                >
                  ↗ Share
                </button>
              </div>
            </div>

            {/* PC savings box */}
            <div className="mt-4 rounded-sm bg-[#f8faff] border border-[#dbe4f2] px-4 py-3 text-[13px]">
              <p className="font-bold text-[#111827] mb-1">Easy payment on PC too</p>
              <div className="flex items-center gap-2 text-[#6b7280]">
                <span className="text-base">💳</span>
                <span>Capang Pay · Naver Pay · Kakao Pay and more</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── related products carousel ──────────────────────────────── */}
        <div className="mt-8 rounded-sm border border-[#dbe4f2] bg-white overflow-hidden">
          <div className="border-b border-[#eef2f7] px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-[18px] font-black uppercase tracking-wide text-[#111827]">Compare Similar Products</p>
              <h2 className="mt-0.5 text-[13px] font-semibold text-[#6b7280]">You Might Also Like</h2>
            </div>
            <span className="text-[13px] text-[#9ca3af] font-semibold">
              {relatedIdx + 1}–{Math.min(relatedIdx + relatedVisible, RELATED_PRODUCTS.length)} / {RELATED_PRODUCTS.length}
            </span>
          </div>
          <div className="relative px-8 py-5">
            {/* left arrow */}
            <button
              onClick={() => {
                if (relatedIdx === 0) return;
                setRelatedIdx(i => Math.max(i - 1, 0));
              }}
              aria-disabled={relatedIdx === 0}
              data-igg-id="shopping.product.earphones.related.prev"
              className={`absolute left-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-[#d1d5db] bg-white text-[24px] text-[#4b5563] shadow-sm transition-colors hover:border-[#0b4ea2] hover:text-[#0b4ea2] ${
                relatedIdx === 0 ? "cursor-not-allowed opacity-25" : ""
              }`}
            >
              ‹
            </button>
            {/* right arrow */}
            <button
              onClick={() => {
                if (relatedIdx >= RELATED_PRODUCTS.length - relatedVisible) return;
                setRelatedIdx(i => Math.min(i + 1, RELATED_PRODUCTS.length - relatedVisible));
              }}
              aria-disabled={relatedIdx >= RELATED_PRODUCTS.length - relatedVisible}
              data-igg-id="shopping.product.earphones.related.next"
              className={`absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-[#d1d5db] bg-white text-[24px] text-[#4b5563] shadow-sm transition-colors hover:border-[#0b4ea2] hover:text-[#0b4ea2] ${
                relatedIdx >= RELATED_PRODUCTS.length - relatedVisible ? "cursor-not-allowed opacity-25" : ""
              }`}
            >
              ›
            </button>
            <div className="overflow-hidden" ref={carouselRef}>
              <div
                className="flex gap-4 transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${relatedIdx * cardStep}px)` }}
              >
                {RELATED_PRODUCTS.map((p) => (
                  <article key={p.name} className="group flex-shrink-0 cursor-pointer bg-white hover:bg-[#fafcff] transition-colors" style={{ width: cardStep ? `${cardStep - 16}px` : "calc(25% - 12px)" }}>
                    <div className="relative mb-3 overflow-hidden rounded-sm bg-[#f6f7fb]" style={{ aspectRatio: "1/1" }}>
                      <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    <span className="inline-flex rounded-sm bg-[#eff6ff] px-1.5 py-0.5 text-[11px] font-bold text-[#0b4ea2]">{p.badge}</span>
                    <h3
                      data-igg-id={p.name === "Anker Soundcore Q45 Headphones" ? "shopping.product.earphones.related.discounted-title" : undefined}
                      className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-5 cursor-pointer hover:text-[#0b4ea2] hover:underline"
                    >
                      {p.name}
                    </h3>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <p className="text-[16px] font-black">{p.price}</p>
                      {p.discount && (
                        <span className="rounded-sm bg-[#ef4444] px-1.5 py-0.5 text-[11px] font-bold text-white">{p.discount}</span>
                      )}
                    </div>
                    {p.original && <p className="text-[11px] text-[#9ca3af] line-through">{p.original}</p>}
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#f59e0b]">
                      {"★".repeat(Math.round(p.rating))}
                      <span className="text-[#9ca3af]">({p.reviews.toLocaleString()})</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB section ────────────────────────────────────────────── */}
        <div className="mt-8 rounded-sm border border-[#dbe4f2] bg-white overflow-hidden">
          {/* tabs */}
          <div className="flex border-b border-[#eef2f7]">
            {(["info", "review", "qna", "return"] as const).map((t) => {
              const label = { info: "Product Info", review: `Reviews (${product.reviews.toLocaleString()})`, qna: "Q&A", return: "Returns & Exchanges" }[t];
              return (
                <button
                  key={t}
                  data-igg-id={t === "return" ? "shopping.product.earphones.tab-return" : undefined}
                  onClick={() => setTab(t)}
                  className={`px-6 py-3.5 text-[14px] font-semibold transition-colors border-b-2
                    ${tab === t ? "border-[#0b4ea2] text-[#0b4ea2]" : "border-transparent text-[#6b7280] hover:text-[#374151]"}`}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* tab content */}
          <div className="p-6">
            {tab === "info" && (
              <div className="max-w-[800px] mx-auto">
                {/* product detail image */}
                <div className="relative w-full overflow-hidden rounded-sm bg-[#f6f7fb] mb-6" style={{ aspectRatio: "16/9" }}>
                  <Image src={gallery[0]} alt={product.name} fill className="object-cover" />
                </div>
                <h2 className="text-[18px] font-bold mb-4">Product Details</h2>
                <div className={`overflow-hidden transition-all duration-300 ${infoExpanded ? "max-h-[520px]" : "max-h-[172px]"}`}>
                  <div className="space-y-3 text-[14px] text-[#374151]">
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Product Name</span>
                      <span>{product.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Connectivity</span>
                      <span>Bluetooth 5.3</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Wear Type</span>
                      <span>In-ear (Canal)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Noise Canceling</span>
                      <span>Hybrid ANC Applied</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Battery</span>
                      <span>7h earbuds + 21h case (28h total)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Water Resistance</span>
                      <span>IPX5</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Charging</span>
                      <span>USB-C, wireless charging supported</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[120px] flex-shrink-0 text-[#6b7280] font-medium">Contents</span>
                      <span>Earbuds × 2, charging case, USB-C cable, ear tips (S/M/L)</span>
                    </div>
                  </div>
                </div>
                {!infoExpanded && (
                  <div className="pointer-events-none relative -mt-10 h-10 bg-gradient-to-t from-white to-transparent" />
                )}
                <button
                  type="button"
                  data-igg-id="shopping.product.earphones.info-expand"
                  onClick={() => setInfoExpanded((prev) => !prev)}
                  className="mx-auto mt-4 flex h-11 items-center justify-center rounded-sm border border-[#dbe4f2] bg-white px-5 text-[13px] font-bold text-[#374151] transition-colors hover:border-[#0b4ea2] hover:text-[#0b4ea2]"
                >
                  {infoExpanded ? "Collapse" : "Show More Info"}
                </button>

                <div className="mt-6 rounded-sm bg-[#fffbeb] border border-[#fef3c7] px-4 py-3 text-[13px] text-[#92400e]">
                  ⚠️ Earphones cannot be returned for hygiene reasons. Exchange or refund only if the product differs.
                </div>
              </div>
            )}

            {tab === "review" && (
              <div className="max-w-[800px] mx-auto" data-igg-id={product.id === "earphones" ? "shopping.product.earphones.review-section" : undefined}>
                <div className="flex items-center gap-6 mb-6 p-4 rounded-sm bg-[#f8faff] border border-[#dbe4f2]">
                  <div className="text-center">
                    <p className="text-[48px] font-black text-[#111827] leading-none">{product.rating}</p>
                    <p className="text-[#f59e0b] text-lg mt-1">{"★".repeat(Math.round(product.rating))}</p>
                    <p className="text-[12px] text-[#6b7280] mt-1">{product.reviews.toLocaleString()} Reviews Total</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 6 : star === 2 ? 2 : 2;
                      return (
                        <div key={star} className="flex items-center gap-2 text-[12px]">
                          <span className="w-4 text-right text-[#f59e0b] font-bold">{star}</span>
                          <span className="text-[#f59e0b] text-xs">★</span>
                          <div className="flex-1 h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                            <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-[#6b7280]">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {[
                  { name: "Kim M.**", rating: 5, date: "2026.04.10", text: "The noise canceling is great. You barely hear anything on the subway. Sound quality and battery life are both excellent!" },
                  { name: "Lee S.**", rating: 5, date: "2026.04.08", text: "Really good value for the price. Comfortable fit and great call quality. Would buy again." },
                  { name: "Park J.**", rating: 4, date: "2026.04.05", text: "Overall satisfied. The case material looks a bit cheap, which is a minor downside." },
                ].map((r, i) => (
                  <div key={i} className="border-b border-[#eef2f7] py-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px]">{r.name}</span>
                        <span className="text-[#f59e0b] text-[12px]">{"★".repeat(r.rating)}</span>
                      </div>
                      <span className="text-[12px] text-[#9ca3af]">{r.date}</span>
                    </div>
                    <p className="text-[13px] text-[#374151]">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "qna" && (
              <div className="max-w-[800px] mx-auto">
                <p className="text-[14px] text-[#6b7280] text-center py-8">No questions yet. Feel free to ask!</p>
                <button className="mx-auto block rounded-sm bg-[#0b4ea2] px-6 py-2.5 text-[14px] font-bold text-white hover:bg-[#1d4ed8]">
                  Ask a Question
                </button>
              </div>
            )}

            {tab === "return" && (
              <div className="max-w-[800px] mx-auto text-[13px] text-[#374151] space-y-4">
                <div>
                  <h3 className="font-bold text-[15px] mb-2">Return Policy</h3>
                  <ul className="space-y-1.5 list-disc list-inside text-[#6b7280]">
                    <li>Returns accepted within 7 days of receipt.</li>
                    <li>A ₩5,000 round-trip return fee applies for change-of-mind returns.</li>
                    <li>Opened ear tips cannot be returned for hygiene reasons.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-[15px] mb-2">Exchange Policy</h3>
                  <ul className="space-y-1.5 list-disc list-inside text-[#6b7280]">
                    <li>Free exchange for defective or incorrectly shipped items.</li>
                    <li>Round-trip shipping fee applies for change-of-mind exchanges.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes dropDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </main>
  );
}
