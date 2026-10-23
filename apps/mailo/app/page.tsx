"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createReviewRuntime } from "../../../lib/review-runtime";
import { getMailoBenchmarkState, type MailoTab } from "./mailo-states";

// ─── Review runtime ───────────────────────────────────────────────────────────

function resolveReviewElement(selector?: string | null) {
  if (!selector) return null;
  const direct = document.querySelector(selector);
  if (direct) return direct as HTMLElement;
  const m = selector.match(/\[data-igg-id=['"]([^'"]+)['"]\]/);
  if (m) return document.querySelector(`[data-igg-id="${m[1]}"]`) as HTMLElement | null;
  return null;
}

function buildReviewSelector(element: HTMLElement | null) {
  if (!element) return null;
  const tagged = element.closest("[data-igg-id]") as HTMLElement | null;
  const id = tagged?.getAttribute("data-igg-id");
  if (id) return `[data-igg-id='${id}']`;
  return null;
}

const { installReviewCapture, executeReviewAction } = createReviewRuntime({
  runtimeStateKey: "__MAILO_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "button,a,input,textarea,[role='button'],[role='tab'],[data-igg-id]",
  captureHoverTargetSelector: "button,a,[role='button'],[role='tab'],[data-igg-id]",
  captureHoverType: "move",
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Email = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  labels: string[];
  hasAttachment?: boolean;
  tab: "primary" | "social" | "promotions";
  rowIggId?: string;
  starIggId?: string;
  archiveIggId?: string;
  deleteIggId?: string;
  snoozeIggId?: string;
  moreIggId?: string;
  moreMarkImportantIggId?: string;
  moreReportSpamIggId?: string;
};

type IconName =
  | "archive"
  | "apps"
  | "attachment"
  | "bell"
  | "calendar"
  | "chevronDown"
  | "chevronRight"
  | "clock"
  | "close"
  | "compose"
  | "draft"
  | "drive"
  | "external"
  | "eye"
  | "folder"
  | "help"
  | "inbox"
  | "label"
  | "link"
  | "mail"
  | "menu"
  | "mood"
  | "pro"
  | "search"
  | "send"
  | "settings"
  | "spam"
  | "star"
  | "trash";

function Icon({ name, className = "h-5 w-5", filled = false, style }: { name: IconName; className?: string; filled?: boolean; style?: React.CSSProperties }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "star") {
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3.8 2.45 5 5.5.8-3.98 3.88.94 5.48L12 16.38l-4.91 2.58.94-5.48L4.05 9.6l5.5-.8L12 3.8Z" />
      </svg>
    );
  }

  const paths: Record<Exclude<IconName, "star">, ReactNode> = {
    archive: <><path d="M4 7h16" /><path d="M5 7l1 13h12l1-13" /><path d="M8 4h8l1 3H7l1-3Z" /><path d="M10 11h4" /></>,
    apps: <><path d="M5 5h4v4H5z" /><path d="M15 5h4v4h-4z" /><path d="M5 15h4v4H5z" /><path d="M15 15h4v4h-4z" /></>,
    attachment: <path d="M7.5 12.5 13.9 6a3.2 3.2 0 0 1 4.5 4.5l-7.7 7.7a4.4 4.4 0 0 1-6.2-6.2l7.1-7.1" />,
    bell: <><path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 2 5.5 2 7H4.5c0-1.5 2-2 2-7Z" /><path d="M9.8 19a2.3 2.3 0 0 0 4.4 0" /></>,
    calendar: <><path d="M7 3v3" /><path d="M17 3v3" /><path d="M4.5 8h15" /><path d="M5 5.5h14v14H5z" /></>,
    chevronDown: <path d="m7 9 5 5 5-5" />,
    chevronRight: <path d="m9 6 6 6-6 6" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
    close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
    compose: <><path d="M5 19h4l9.5-9.5a2.1 2.1 0 0 0-3-3L6 16l-1 3Z" /><path d="m14 7 3 3" /></>,
    draft: <><path d="M6 4h9l3 3v13H6z" /><path d="M14 4v4h4" /><path d="M9 13h6" /><path d="M9 16h4" /></>,
    drive: <><path d="M8 4h8l4 7-4 7H8l-4-7 4-7Z" /><path d="M8 18 12 11 8 4" /><path d="M16 18 12 11l4-7" /><path d="M4 11h16" /></>,
    external: <><path d="M8 8h8v8" /><path d="M16 8 7 17" /></>,
    eye: <><path d="M3.5 12s3-5.5 8.5-5.5S20.5 12 20.5 12s-3 5.5-8.5 5.5S3.5 12 3.5 12Z" /><circle cx="12" cy="12" r="2.4" /></>,
    folder: <><path d="M4 6h6l2 2h8v10.5H4z" /></>,
    help: <><circle cx="12" cy="12" r="8" /><path d="M9.8 9.5a2.3 2.3 0 0 1 4.4.9c0 1.8-2.2 2-2.2 3.6" /><path d="M12 17h.01" /></>,
    inbox: <><path d="M4 5h16v14H4z" /><path d="M4 14h4l2 3h4l2-3h4" /></>,
    label: <><path d="M4 6h9l7 6-7 6H4z" /><circle cx="8" cy="12" r="1" /></>,
    link: <><path d="M10 13.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" /><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" /></>,
    mail: <><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></>,
    menu: <><path d="M5 7h14" /><path d="M5 12h14" /><path d="M5 17h14" /></>,
    mood: <><circle cx="12" cy="12" r="8" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M8.8 14.2a4.4 4.4 0 0 0 6.4 0" /></>,
    pro: <><path d="M12 3 14.5 9l6.5.5-5 4.1 1.6 6.4L12 16.5 6.4 20 8 13.6l-5-4.1L9.5 9 12 3Z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
    send: <><path d="M4 5l16 7-16 7 3-7-3-7Z" /><path d="M7 12h7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7.8 7.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-1.8-1L14.4 3h-4.8l-.3 3.1a7.4 7.4 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.4 7.4 0 0 0 1.8 1l.3 3.1h4.8l.3-3.1a7.4 7.4 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" /></>,
    spam: <><path d="M8 4h8l4 4v8l-4 4H8l-4-4V8z" /><path d="M12 8v5" /><path d="M12 16h.01" /></>,
    trash: <><path d="M5 7h14" /><path d="M9 7V4h6v3" /><path d="M7 7l1 13h8l1-13" /><path d="M10 11v5" /><path d="M14 11v5" /></>,
  };

  return <svg {...common} style={style}>{paths[name]}</svg>;
}

// ─── Email data ───────────────────────────────────────────────────────────────

const EMAILS: Email[] = [
  // PRIMARY
  {
    id: "e1", tab: "primary", from: "Marcus Park", subject: "Q3 Design Review — Assets Ready",
    preview: "Hi, I've uploaded the final assets for the Q3 design review to the shared Drive folder...",
    time: "10:24 AM", read: false, starred: false, labels: ["work"], hasAttachment: true,
    rowIggId: "mailo.inbox.e1.row", starIggId: "mailo.inbox.e1.star",
    archiveIggId: "mailo.inbox.e1.archive", deleteIggId: "mailo.inbox.e1.delete",
    snoozeIggId: "mailo.inbox.e1.snooze",
    moreIggId: "mailo.inbox.e1.more",
    moreMarkImportantIggId: "mailo.inbox.e1.more.mark-important",
    moreReportSpamIggId: "mailo.inbox.e1.more.report-spam",
  },
  {
    id: "e2", tab: "primary", from: "Sarah Chen", subject: "Weekend hiking trip — anyone joining?",
    preview: "Hey! Planning a day hike to Bukhansan this Saturday, leaving at 7am. Want to join?",
    time: "9:18 AM", read: true, starred: true, labels: ["personal"],
    rowIggId: "mailo.inbox.e2.row", starIggId: "mailo.inbox.e2.star",
    archiveIggId: "mailo.inbox.e2.archive", snoozeIggId: "mailo.inbox.e2.snooze",
  },
  {
    id: "e3", tab: "primary", from: "Minjoon Lee", subject: "Invoice #1042 — May Freelance Work",
    preview: "Please find attached invoice #1042 for the work completed in May 2026...",
    time: "Yesterday", read: false, starred: false, labels: ["finance"], hasAttachment: true,
    rowIggId: "mailo.inbox.e3.row", starIggId: "mailo.inbox.e3.star",
    archiveIggId: "mailo.inbox.e3.archive", deleteIggId: "mailo.inbox.e3.delete",
    moreIggId: "mailo.inbox.e3.more",
    moreReportSpamIggId: "mailo.inbox.e3.more.report-spam",
  },
  {
    id: "e4", tab: "primary", from: "Ella Roberts", subject: "Re: Product Roadmap Feedback",
    preview: "Thanks for the detailed notes! I've incorporated most of the changes. The timeline section...",
    time: "Yesterday", read: true, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e4.row", starIggId: "mailo.inbox.e4.star",
    archiveIggId: "mailo.inbox.e4.archive",
  },
  {
    id: "e5", tab: "primary", from: "David Yoon", subject: "Flight Confirmation: ICN → LAX, Jun 12",
    preview: "Your booking is confirmed. Flight KE17 departs Incheon at 22:30. Seat: 34A. Check-in opens...",
    time: "Mon", read: false, starred: true, labels: ["travel"], hasAttachment: true,
    rowIggId: "mailo.inbox.e5.row", starIggId: "mailo.inbox.e5.star",
    snoozeIggId: "mailo.inbox.e5.snooze",
  },
  {
    id: "e6", tab: "primary", from: "GitHub", subject: "PR #241: Add dark mode support",
    preview: "[designco/ui-kit] minjoon-dev opened a pull request: 'Add dark mode support for all components'...",
    time: "Mon", read: true, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e6.row",
  },
  {
    id: "e7", tab: "primary", from: "Hyunwoo Jang", subject: "Meeting rescheduled to 3pm",
    preview: "Hey, sorry for the short notice — had to push the standup to 3pm today due to a client call...",
    time: "Sun", read: false, starred: false, labels: [],
    rowIggId: "mailo.inbox.e7.row",
  },
  {
    id: "e8", tab: "primary", from: "Kakao Corp", subject: "New login detected on your account",
    preview: "A new login was detected on your Kakao account from Seoul, KR using Chrome on macOS...",
    time: "Sun", read: true, starred: false, labels: ["urgent"],
    rowIggId: "mailo.inbox.e8.row",
  },
  {
    id: "e9", tab: "primary", from: "Jisu Kim", subject: "Lunch tomorrow?",
    preview: "Are you free for lunch tomorrow? There's a new ramen place near Gangnam station I've been wanting...",
    time: "Sat", read: true, starred: false, labels: ["personal"],
    rowIggId: "mailo.inbox.e9.row",
  },
  {
    id: "e10", tab: "primary", from: "Yoona Choi", subject: "Can you review this doc?",
    preview: "Hi, I've shared a Notion doc with the revised UX copy for the onboarding flow. Could you take a look...",
    time: "Sat", read: true, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e10.row",
  },
  {
    id: "e11", tab: "primary", from: "Daisy Park", subject: "Birthday dinner plans",
    preview: "So we're thinking Oakroom on the 15th — does 7pm work? It seats 8 max so please confirm ASAP...",
    time: "Fri", read: true, starred: true, labels: ["personal"],
    rowIggId: "mailo.inbox.e11.row",
  },
  {
    id: "e12", tab: "primary", from: "KEB Hana Bank", subject: "Transaction summary: May 2026",
    preview: "Your Hana Bank account summary for May 2026 is now available. Total credits: ₩4,200,000...",
    time: "May 9", read: true, starred: false, labels: ["finance"], hasAttachment: true,
    rowIggId: "mailo.inbox.e12.row",
  },
  {
    id: "e13", tab: "primary", from: "Naver Works", subject: "Document shared: Sprint #22 Retro Notes",
    preview: "Minjoon Lee has shared 'Sprint #22 Retrospective Notes' with you via Naver Works...",
    time: "May 8", read: true, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e13.row",
  },
  {
    id: "e14", tab: "primary", from: "Coupang", subject: "Your Coupang order #7792 has shipped!",
    preview: "Great news! Your order of 'ErgoChair Pro 2 — Black' is on its way. Expected delivery: May 11...",
    time: "May 8", read: false, starred: false, labels: [],
    rowIggId: "mailo.inbox.e14.row",
  },
  {
    id: "e15", tab: "primary", from: "Air Seoul", subject: "Check-in open: GMP → CJU, May 14",
    preview: "Your check-in for flight RS122 is now open. Please check in between now and 1 hour before departure...",
    time: "May 7", read: true, starred: false, labels: ["travel"],
    rowIggId: "mailo.inbox.e15.row",
  },
  {
    id: "e16", tab: "primary", from: "Google", subject: "Security alert: New sign-in to your account",
    preview: "Your Google Account was signed in on a new Windows device in Busan, KR. If this was not you...",
    time: "May 7", read: true, starred: false, labels: ["urgent"],
    rowIggId: "mailo.inbox.e16.row",
  },
  {
    id: "e17", tab: "primary", from: "Slack", subject: "New message in #design-feedback",
    preview: "Yoona Choi posted: 'Can someone check the spacing on the new button component? Looks off in...'",
    time: "May 6", read: false, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e17.row",
  },
  {
    id: "e18", tab: "primary", from: "Daisy Park", subject: "Re: Birthday dinner plans",
    preview: "7pm works! Should we book in advance? Last time they were fully booked on a Friday night...",
    time: "May 6", read: true, starred: false, labels: ["personal"],
    rowIggId: "mailo.inbox.e18.row",
  },
  {
    id: "e19", tab: "primary", from: "Naver Pay", subject: "Payment confirmation: ₩72,000",
    preview: "Your Naver Pay payment of ₩72,000 to 'Starbucks Korea' was processed successfully on May 5...",
    time: "May 5", read: true, starred: false, labels: ["finance"],
    rowIggId: "mailo.inbox.e19.row",
  },
  {
    id: "e20", tab: "primary", from: "Hyunwoo Jang", subject: "Design sprint kickoff tomorrow",
    preview: "Just confirming — design sprint starts at 9am tomorrow in Meeting Room B. Please bring printed...",
    time: "May 5", read: true, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e20.row",
  },
  {
    id: "e21", tab: "primary", from: "Kakao Pay", subject: "Your Kakao Pay statement for April",
    preview: "Your monthly statement is now ready. View your full payment history and spending trends...",
    time: "May 4", read: true, starred: false, labels: ["finance"],
    rowIggId: "mailo.inbox.e21.row",
  },
  {
    id: "e22", tab: "primary", from: "Marcus Park", subject: "Re: Component library naming convention",
    preview: "I think the BEM approach makes sense for now. We can revisit once the team grows past 8 members...",
    time: "May 3", read: true, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e22.row",
  },
  {
    id: "e23", tab: "primary", from: "Ella Roberts", subject: "Sprint #23 planning — agenda draft",
    preview: "Sharing the agenda for Thursday's planning session. Main items: roadmap priorities, Q3 OKRs...",
    time: "May 2", read: true, starred: false, labels: ["work"],
    rowIggId: "mailo.inbox.e23.row",
  },
  {
    id: "e24", tab: "primary", from: "Jisu Kim", subject: "Concert tickets — are you in?",
    preview: "Oasis reunion tour is coming to Seoul in July! I grabbed two tickets. Want the other one?...",
    time: "May 1", read: false, starred: true, labels: ["personal"],
    rowIggId: "mailo.inbox.e24.row",
  },
  {
    id: "e25", tab: "primary", from: "GitHub", subject: "Action required: Verify your email address",
    preview: "Please verify your email address to keep your GitHub account secure. This link expires in 7 days...",
    time: "Apr 30", read: false, starred: false, labels: [],
    rowIggId: "mailo.inbox.e25.row",
  },
  // SOCIAL
  {
    id: "s1", tab: "social", from: "LinkedIn", subject: "Ella Roberts commented on your post",
    preview: "Ella Roberts and 12 others liked your post about design systems...",
    time: "10:01 AM", read: false, starred: false, labels: [],
    rowIggId: "mailo.social.s1.row",
  },
  {
    id: "s2", tab: "social", from: "Instagram", subject: "Sarah Chen started following you",
    preview: "Sarah Chen (@sarahchen_design) is now following you on Instagram...",
    time: "Yesterday", read: true, starred: false, labels: [],
    rowIggId: "mailo.social.s2.row",
  },
  {
    id: "s3", tab: "social", from: "Twitter / X", subject: "Your post got 42 impressions",
    preview: "Your recent post about UI animation tips received 42 impressions and 7 engagements...",
    time: "Mon", read: true, starred: false, labels: [],
    rowIggId: "mailo.social.s3.row",
  },
  {
    id: "s4", tab: "social", from: "Behance", subject: "Marcus Park appreciated your project",
    preview: "Marcus Park appreciated your project 'Mailo Redesign Concept' on Behance...",
    time: "Sat", read: true, starred: false, labels: [],
    rowIggId: "mailo.social.s4.row",
  },
  {
    id: "s5", tab: "social", from: "Notion", subject: "Daisy Park invited you to a workspace",
    preview: "Daisy Park has invited you to join the 'Design Collab' workspace on Notion...",
    time: "May 8", read: false, starred: false, labels: [],
    rowIggId: "mailo.social.s5.row",
  },
  // PROMOTIONS
  {
    id: "p1", tab: "promotions", from: "Figma", subject: "Your Figma plan renews in 3 days",
    preview: "Your Professional plan renews on May 13, 2026. You'll be charged $15/month unless you cancel...",
    time: "10:30 AM", read: false, starred: false, labels: [],
    rowIggId: "mailo.promotions.p1.row",
  },
  {
    id: "p2", tab: "promotions", from: "Airbnb", subject: "Prices dropped for your saved trip to Jeju",
    preview: "Good news! Prices for 'Jeju Ocean Front Villa' have dropped by ₩42,000 per night...",
    time: "Yesterday", read: true, starred: false, labels: [],
    rowIggId: "mailo.promotions.p2.row",
  },
  {
    id: "p3", tab: "promotions", from: "Netflix", subject: "Your subscription renews May 12",
    preview: "Your Netflix Standard plan renews on May 12, 2026. Monthly charge: ₩13,500...",
    time: "Mon", read: true, starred: false, labels: [],
    rowIggId: "mailo.promotions.p3.row",
  },
  {
    id: "p4", tab: "promotions", from: "Apple", subject: "Your receipt from App Store",
    preview: "A purchase was made with your Apple ID for Notchmeister Pro — ₩4,900...",
    time: "Sun", read: false, starred: false, labels: [],
    rowIggId: "mailo.promotions.p4.row",
  },
  {
    id: "p5", tab: "promotions", from: "Coupang Rocket", subject: "Flash sale ends tonight: Up to 60% off",
    preview: "Don't miss tonight's flash sale! Top picks: ErgoMouse Pro (62% off), USB-C Hub 9-in-1...",
    time: "Sat", read: true, starred: false, labels: [],
    rowIggId: "mailo.promotions.p5.row",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#ff6d00", "#46bdc6", "#7986cb", "#f06292", "#a142f4", "#00897b"];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function avatarInitial(name: string) { return name.charAt(0).toUpperCase(); }

const LABEL_STYLE: Record<string, { bg: string; text: string }> = {
  work:     { bg: "#e8f0fe", text: "#1a73e8" },
  personal: { bg: "#fce8e6", text: "#d93025" },
  travel:   { bg: "#e6f4ea", text: "#137333" },
  finance:  { bg: "#fef7e0", text: "#b05b00" },
  urgent:   { bg: "#fce8e6", text: "#d93025" },
};

const INCOMING_MAILS = [
  { from: "Alice Kim",  initial: "A", subject: "Re: Q3 Budget Review",        preview: "Looks good to me — let's sync tomorrow." },
  { from: "James Park", initial: "J", subject: "Project Atlas — Milestone 2", preview: "Milestone 2 is complete. Ready for your review." },
  { from: "Eunji Oh",   initial: "E", subject: "Deadline: Report due Friday",  preview: "Just a reminder — the report is due by Friday EOD." },
  { from: "Brian Choi", initial: "B", subject: "Invoice #2847 attached",       preview: "Please review and approve at your earliest convenience." },
];

const SIDEBAR_FOLDERS: Array<{ id: string; label: string; icon: IconName; iggId: string; count?: number }> = [
  { id: "inbox",   label: "Inbox",   icon: "inbox", iggId: "mailo.sidebar.inbox",   count: 4 },
  { id: "starred", label: "Starred", icon: "star", iggId: "mailo.sidebar.starred"  },
  { id: "snoozed", label: "Snoozed", icon: "clock", iggId: "mailo.sidebar.snoozed"  },
  { id: "sent",    label: "Sent",    icon: "send", iggId: "mailo.sidebar.sent"      },
  { id: "drafts",  label: "Drafts",  icon: "draft", iggId: "mailo.sidebar.drafts",  count: 2 },
  { id: "spam",    label: "Spam",    icon: "spam", iggId: "mailo.sidebar.spam",    count: 1 },
  { id: "trash",   label: "Trash",   icon: "trash", iggId: "mailo.sidebar.trash"    },
];

const SIDEBAR_LABELS = [
  { id: "work",     label: "Work",     color: "#1a73e8", iggId: "mailo.sidebar.label.work"     },
  { id: "personal", label: "Personal", color: "#d93025", iggId: "mailo.sidebar.label.personal" },
  { id: "travel",   label: "Travel",   color: "#137333", iggId: "mailo.sidebar.label.travel"   },
  { id: "finance",  label: "Finance",  color: "#b05b00", iggId: "mailo.sidebar.label.finance"  },
  { id: "urgent",   label: "Urgent",   color: "#d93025", iggId: "mailo.sidebar.label.urgent"   },
];

const ANNOUNCEMENT_BANNERS: Array<{ icon: IconName; title: string; body: string; ctaLabel: string; ctaIggId: string }> = [
  {
    icon: "calendar",
    title: "Try Mailo Meet",
    body: "Start a free video call from your inbox in one click.",
    ctaLabel: "Start a call",
    ctaIggId: "mailo.banner.meet.cta",
  },
  {
    icon: "pro",
    title: "Upgrade to Mailo Pro",
    body: "More storage, priority inbox AI, and advanced filters.",
    ctaLabel: "Learn more",
    ctaIggId: "mailo.banner.pro.cta",
  },
  {
    icon: "drive",
    title: "Mailo Drive update",
    body: "3 new files were shared with you since your last visit.",
    ctaLabel: "View files",
    ctaIggId: "mailo.banner.drive.cta",
  },
];

const RECENT_SEARCHES = [
  "invoice #1042",
  "flight confirmation",
  "design sprint",
  "workspace invitation",
  "app store receipt",
];

// ─── EmailRow ─────────────────────────────────────────────────────────────────

function EmailRow({
  email,
  openMoreId,
  onMoreToggle,
}: {
  email: Email;
  openMoreId: string | null;
  onMoreToggle: (id: string) => void;
}) {
  const moreOpen = openMoreId === email.id;

  return (
    <div
      data-igg-id={email.rowIggId}
      className={`group relative flex items-center gap-3 px-4 border-b border-[#e0e0e0] cursor-pointer select-none transition-colors ${
        email.read ? "bg-white hover:bg-[#f1f3f4]" : "bg-[#eaf0fb] font-semibold hover:bg-[#dce6f9]"
      } ${moreOpen ? "z-20" : ""}`}
      style={{ height: 42 }}
    >
      {/* Checkbox (hover reveal) */}
      <div className="w-5 h-5 rounded border-2 border-[#bdc1c6] opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />

      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
        style={{ background: avatarColor(email.from) }}
      >
        {avatarInitial(email.from)}
      </div>

      {/* Attachment icon — fixed slot so sender stays aligned */}
      <div className="w-4 flex-shrink-0 flex items-center justify-center">
        {email.hasAttachment && <Icon name="attachment" className="h-4 w-4 text-[#5f6368]" />}
      </div>

      {/* Sender */}
      <div className={`w-[160px] flex-shrink-0 text-[13px] truncate ${email.read ? "font-normal text-[#202124]" : "font-bold text-[#202124]"}`}>
        {email.from}
      </div>

      {/* Subject + preview */}
      <div className="flex-1 min-w-0 flex items-baseline gap-2 overflow-hidden">
        <span className={`text-[13px] truncate flex-shrink-0 max-w-[45%] ${email.read ? "font-normal text-[#202124]" : "font-bold text-[#202124]"}`}>
          {email.subject}
        </span>
        <span className="text-[12px] text-[#5f6368] font-normal truncate">— {email.preview}</span>
      </div>

      {/* Labels — fixed-width slot so time column stays aligned */}
      <div className="hidden lg:flex items-center gap-1 flex-shrink-0 w-[120px] justify-end">
        {email.labels.slice(0, 2).map(l => (
          <span key={l} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: LABEL_STYLE[l]?.bg, color: LABEL_STYLE[l]?.text }}>
            {l}
          </span>
        ))}
      </div>

      {/* Time */}
      <div className={`text-[12px] w-[68px] text-right flex-shrink-0 group-hover:invisible ${email.read ? "text-[#5f6368] font-normal" : "text-[#202124] font-bold"}`}>
        {email.time}
      </div>

      {/* Hover action buttons */}
      {(() => {
        const pre = email.tab === "primary" ? `mailo.inbox.${email.id}` : `mailo.${email.tab}.${email.id}`;
        return (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white rounded-lg shadow-sm px-1 transition-opacity z-10 ${moreOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <button data-igg-id={`${pre}.archive`} onClick={e => e.stopPropagation()} title="Archive"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e8eaed] text-[#5f6368]"><Icon name="archive" className="h-4 w-4" /></button>
            <button data-igg-id={`${pre}.delete`} onClick={e => e.stopPropagation()} title="Delete"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e8eaed] text-[#5f6368]"><Icon name="trash" className="h-4 w-4" /></button>
            <button data-igg-id={`${pre}.snooze`} onClick={e => e.stopPropagation()} title="Snooze"
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e8eaed] text-[#5f6368]"><Icon name="clock" className="h-4 w-4" /></button>
            <div className="relative">
              <button
                data-igg-id={`${pre}.more`}
                onClick={e => { e.stopPropagation(); onMoreToggle(email.id); }}
                title="More"
                className="w-7 h-7 flex items-center justify-center rounded-full text-[15px] hover:bg-[#e8eaed] text-[#5f6368]"
              >⋮</button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-xl shadow-xl border border-[#e0e0e0] py-1 z-50">
                  <button data-igg-id={`${pre}.more.mark-important`} onClick={e => e.stopPropagation()} className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                    <Icon name="star" className="h-4 w-4 text-[#5f6368]" /> Mark as important
                  </button>
                  <button onClick={e => e.stopPropagation()} className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                    <Icon name="label" className="h-4 w-4 text-[#5f6368]" /> Add label
                  </button>
                  <button onClick={e => e.stopPropagation()} className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                    <Icon name="folder" className="h-4 w-4 text-[#5f6368]" /> Move to folder
                  </button>
                  <button data-igg-id={`${pre}.more.report-spam`} onClick={e => e.stopPropagation()} className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                    <Icon name="spam" className="h-4 w-4 text-[#5f6368]" /> Report as spam
                  </button>
                  <button onClick={e => e.stopPropagation()} className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                    <Icon name="bell" className="h-4 w-4 text-[#5f6368]" /> Mute
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── ComposeWindow ────────────────────────────────────────────────────────────

function ComposeWindow({
  countdown,
  filePending,
  onClose,
  to,
  subject,
  attachmentLabel,
}: {
  countdown: number;
  filePending?: boolean;
  onClose: () => void;
  to: string | null;
  subject: string | null;
  attachmentLabel: string | null;
}) {
  const sendDisabled = countdown > 0 || filePending === true;
  return (
    <div className="fixed bottom-0 right-6 w-[520px] bg-white rounded-t-2xl shadow-2xl border border-[#e0e0e0] z-50 flex flex-col" style={{ height: 440 }}>
      <div className="flex items-center justify-between px-4 py-3 bg-[#404040] rounded-t-2xl cursor-default">
        <span className="text-[14px] font-medium text-white">New Message</span>
        <div className="flex items-center gap-2">
          <button className="text-[#c5c5c5] hover:text-white text-[18px] leading-none">—</button>
          <button className="text-[#c5c5c5] hover:text-white text-[18px] leading-none">⤢</button>
          <button onClick={onClose} data-igg-id="mailo.compose.close" className="text-[#c5c5c5] hover:text-white text-[18px] leading-none">✕</button>
        </div>
      </div>
      <div className="flex flex-col gap-0 flex-1 overflow-hidden">
        <input value={to ?? ""} readOnly placeholder="To" className="px-4 py-2.5 text-[14px] text-[#202124] border-b border-[#e0e0e0] outline-none" />
        <input value={subject ?? ""} readOnly placeholder="Subject" className="px-4 py-2.5 text-[14px] text-[#202124] border-b border-[#e0e0e0] outline-none" />
        <textarea placeholder="Compose email" className="flex-1 px-4 py-3 text-[14px] text-[#202124] resize-none outline-none" />
      </div>
      {filePending !== undefined && (
        <div className="flex items-center gap-2.5 border-t border-[#e0e0e0] px-4 py-2">
          <Icon name="attachment" className="h-4 w-4 flex-shrink-0 text-[#5f6368]" />
          <span className="flex-1 truncate text-[13px] text-[#202124]">{attachmentLabel ?? "Q3_Report.pdf"}</span>
          {filePending ? (
            <>
              <span className="text-[12px] text-[#5f6368]">Uploading…</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e0e0e0]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-[#1a73e8]" />
              </div>
            </>
          ) : (
            <span className="text-[12px] font-medium text-[#137333]">✓ Ready</span>
          )}
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-[#e0e0e0]">
        <button
          data-igg-id="mailo.compose.send"
          data-igg-type={filePending !== undefined ? "async_wait" : undefined}
          aria-disabled={sendDisabled ? "true" : undefined}
          className={`px-5 py-2 rounded-full text-[14px] font-medium transition-all ${
            sendDisabled
              ? "bg-[#e8f0fe] text-[#9aa0a6] cursor-not-allowed"
              : "bg-[#1a73e8] text-white hover:bg-[#1765cc] cursor-pointer"
          }`}
        >
          {countdown > 0 ? `Sending in ${countdown}s…` : "Send"}
        </button>
        <button className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#444746]" aria-label="Attach file"><Icon name="attachment" className="h-4.5 w-4.5" /></button>
        <button className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#444746]" aria-label="Insert link"><Icon name="link" className="h-4.5 w-4.5" /></button>
        <button className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#444746]" aria-label="Insert emoji"><Icon name="mood" className="h-4.5 w-4.5" /></button>
        <div className="flex-1" />
        <button className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]" aria-label="Discard draft"><Icon name="trash" className="h-4.5 w-4.5" /></button>
      </div>
    </div>
  );
}

// ─── UpgradeModal ─────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8]"><Icon name="pro" className="h-5 w-5" /></div>
              <span className="text-[18px] font-bold text-[#202124]">Upgrade to Mailo Pro</span>
            </div>
            <button
              data-igg-id="mailo.modal.upgrade.close"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-[#5f6368] text-[18px]"
            >✕</button>
          </div>
          <p className="text-[14px] text-[#5f6368] leading-relaxed mb-6">
            You&apos;re using 12.4 GB of 15 GB. Upgrade for 100 GB storage, AI Priority Inbox, scheduled send, and read receipts.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: "drive" as IconName, label: "100 GB storage" },
              { icon: "inbox" as IconName, label: "AI Priority Inbox" },
              { icon: "clock" as IconName, label: "Schedule send" },
              { icon: "eye" as IconName, label: "Read receipts" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 text-[13px] text-[#202124]">
                <Icon name={f.icon} className="h-4 w-4 text-[#5f6368]" /><span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button className="flex-1 py-2.5 rounded-full bg-[#1a73e8] text-white text-[14px] font-medium hover:bg-[#1765cc]">
            Upgrade — ₩5,900/mo
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[#dadce0] text-[#444746] text-[14px] hover:bg-[#f1f3f4]">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#f6f8fc]" />}>
      <MailoPage />
    </Suspense>
  );
}

function MailoPage() {
  const searchParams = useSearchParams();
  const reviewMode = searchParams.get("review") === "1";
  const reviewTarget = searchParams.get("target") ?? "";
  const stateId = searchParams.get("stateId") ?? searchParams.get("state") ?? "1";
  const benchState = useMemo(() => getMailoBenchmarkState(stateId), [stateId]);

  const [sidebarWidth, setSidebarWidth] = useState(benchState.sidebarWidth);
  const [activeTab, setActiveTab] = useState<MailoTab>(benchState.activeTab);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(benchState.upgradeModalOpen);
  const [composeOpen, setComposeOpen] = useState(benchState.composeOpen);
  const [sendCountdown, setSendCountdown] = useState(benchState.sendCountdown);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [openMoreId, setOpenMoreId] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(benchState.autoBannerStartIndex);
  const [bannerTimerReset, setBannerTimerReset] = useState(0);
  const [searchPanelOpen, setSearchPanelOpen] = useState(benchState.searchPanelOpen);
  const [asyncReady, setAsyncReady] = useState(benchState.asyncDelayMs === null);
  const listRef = useRef<HTMLDivElement>(null);

  // init list scroll position for state 2
  useEffect(() => {
    if (benchState.listScrollTop > 0 && listRef.current) {
      listRef.current.scrollTop = benchState.listScrollTop;
    }
  }, [benchState.listScrollTop]);

  useEffect(() => {
    setSearchPanelOpen(benchState.searchPanelOpen);
    setBannerIndex(benchState.autoBannerStartIndex);
    setBannerTimerReset(0);
  }, [benchState.autoBannerStartIndex, benchState.searchPanelOpen]);

  // send countdown ticker
  useEffect(() => {
    if (sendCountdown <= 0) return;
    const t = window.setInterval(() => setSendCountdown(p => Math.max(0, p - 1)), 1000);
    return () => window.clearInterval(t);
  }, [sendCountdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // banner rotation / one-shot auto-advance
  useEffect(() => {
    if (benchState.autoBannerDelayMs !== null) {
      const t = window.setTimeout(() => setBannerIndex(p => (p + 1) % ANNOUNCEMENT_BANNERS.length), benchState.autoBannerDelayMs);
      return () => window.clearTimeout(t);
    }
    const t = window.setInterval(() => setBannerIndex(p => (p + 1) % ANNOUNCEMENT_BANNERS.length), 5000);
    return () => window.clearInterval(t);
  }, [bannerIndex, bannerTimerReset, benchState.autoBannerDelayMs]);

  function selectBannerIndex(index: number) {
    setBannerIndex(index);
    setBannerTimerReset((value) => value + 1);
  }

  // incoming mail async timer
  useEffect(() => {
    setAsyncReady(benchState.asyncDelayMs === null);
    if (benchState.asyncDelayMs === null) return;
    const t = window.setTimeout(() => setAsyncReady(true), benchState.asyncDelayMs);
    return () => window.clearTimeout(t);
  }, [benchState.asyncDelayMs]);

  // close menus on outside click (deferred so the opening click doesn't immediately re-close)
  useEffect(() => {
    if (!sortMenuOpen && !openMoreId) return;
    let handler: (() => void) | null = null;
    const id = window.setTimeout(() => {
      handler = () => { setSortMenuOpen(false); setOpenMoreId(null); };
      document.addEventListener("click", handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      if (handler) document.removeEventListener("click", handler);
    };
  }, [sortMenuOpen, openMoreId]);

  // review runtime install
  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState = (window as Window & { __MAILO_BENCHMARK_STATE__?: Record<string, unknown> }).__MAILO_BENCHMARK_STATE__ ?? null;
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

  // expose runtime state
  useEffect(() => {
    (window as Window & { __MAILO_BENCHMARK_STATE__?: Record<string, unknown> }).__MAILO_BENCHMARK_STATE__ = {
      stateId: benchState.id,
      activeTab,
      sidebarWidth,
      composeOpen,
      upgradeModalOpen,
      sendCountdown,
      bannerIndex,
      searchPanelOpen,
      listScrollTop: listRef.current?.scrollTop ?? 0,
    };
  }, [benchState.id, activeTab, sidebarWidth, composeOpen, upgradeModalOpen, sendCountdown, bannerIndex, searchPanelOpen]);

  void reviewTarget;

  const visibleEmails = useMemo(() => EMAILS.filter(e => e.tab === activeTab), [activeTab]);
  const banner = ANNOUNCEMENT_BANNERS[bannerIndex];
  const asyncPending = benchState.asyncDelayMs !== null && !asyncReady;
  const incomingMail = benchState.incomingMailIndex !== null ? INCOMING_MAILS[benchState.incomingMailIndex] : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fc]">
      {reviewMode && (
        <div className="fixed right-5 top-5 z-[100] rounded-xl bg-[#202124] px-4 py-3 text-xs font-semibold text-white shadow-xl">
          IGG target: {reviewTarget || "none"}
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="relative flex-shrink-0 bg-[#f6f8fc] flex flex-col h-full overflow-hidden transition-none"
        style={{ width: sidebarWidth }}
      >
        {/* Compose button */}
        <div className="px-2 pt-4 pb-2">
          <button
            data-igg-id="mailo.sidebar.compose"
            className="flex items-center rounded-2xl bg-white shadow-md hover:shadow-lg px-4 py-3.5 text-[14px] font-medium text-[#202124] transition-shadow w-full overflow-hidden"
            style={{ minWidth: 0, justifyContent: sidebarWidth < 120 ? "center" : "flex-start" }}
          >
            <Icon name="compose" className="h-5 w-5 flex-shrink-0 text-[#444746]" />
            <span
              className="overflow-hidden whitespace-nowrap"
              style={{ maxWidth: sidebarWidth >= 120 ? 200 : 0, opacity: sidebarWidth >= 120 ? 1 : 0, marginLeft: sidebarWidth >= 120 ? 12 : 0, transition: "opacity 0.15s, max-width 0.15s" }}
            >Compose</span>
          </button>
        </div>

        {/* Folder nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          {SIDEBAR_FOLDERS.map(folder => (
            <button
              key={folder.id}
              data-igg-id={folder.iggId}
              className="flex items-center w-full px-3 py-2 rounded-r-full hover:bg-[#e8eaed] text-[14px] text-[#202124] transition-colors overflow-hidden"
              style={{ justifyContent: sidebarWidth < 120 ? "center" : "flex-start" }}
            >
              <Icon name={folder.icon} className="h-5 w-5 flex-shrink-0 text-[#5f6368]" filled={folder.id === "starred"} />
              <span
                className="flex items-center overflow-hidden whitespace-nowrap"
                style={{ maxWidth: sidebarWidth >= 120 ? 200 : 0, opacity: sidebarWidth >= 120 ? 1 : 0, marginLeft: sidebarWidth >= 120 ? 12 : 0, transition: "opacity 0.15s, max-width 0.15s" }}
              >
                <span className="flex-1 truncate">{folder.label}</span>
                {folder.count && <span className="text-[12px] font-medium text-[#202124] ml-2 flex-shrink-0">{folder.count}</span>}
              </span>
            </button>
          ))}

          {/* Labels section — header cross-fades icon↔text; text fades in with width */}
          <div className="mt-3 mb-1">
            <div className="relative h-6 flex items-center overflow-hidden">
              <Icon
                name="label"
                className="h-4 w-4 text-[#5f6368] absolute left-1/2 -translate-x-1/2"
                style={{ opacity: sidebarWidth < 100 ? 1 : 0, transition: "opacity 0.15s" }}
              />
              <span
                className="px-4 text-[11px] font-bold uppercase tracking-wider text-[#5f6368] whitespace-nowrap"
                style={{ opacity: sidebarWidth >= 180 ? 1 : 0, transition: "opacity 0.15s" }}
              >Labels</span>
            </div>
            {SIDEBAR_LABELS.map(label => (
              <button
                key={label.id}
                data-igg-id={label.iggId}
                className="flex items-center w-full px-3 py-1.5 rounded-r-full hover:bg-[#e8eaed] text-[14px] text-[#202124] transition-colors overflow-hidden"
                style={{ pointerEvents: sidebarWidth >= 120 ? "auto" : "none", justifyContent: sidebarWidth < 120 ? "center" : "flex-start" }}
              >
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <span className="w-3 h-3 rounded-full" style={{ background: label.color }} />
                </span>
                <span
                  className="truncate whitespace-nowrap overflow-hidden"
                  style={{ maxWidth: sidebarWidth >= 120 ? 200 : 0, opacity: sidebarWidth >= 160 ? 1 : 0, marginLeft: sidebarWidth >= 120 ? 8 : 0, transition: "opacity 0.15s, max-width 0.15s, margin-left 0.15s" }}
                >{label.label}</span>
              </button>
            ))}
            <button
              data-igg-id="mailo.sidebar.manage-labels"
              className="flex items-center w-full px-3 py-1.5 rounded-r-full hover:bg-[#e8eaed] text-[13px] text-[#5f6368] transition-colors overflow-hidden"
              style={{ pointerEvents: sidebarWidth >= 160 ? "auto" : "none" }}
            >
              <span
                className="truncate whitespace-nowrap overflow-hidden"
                style={{ maxWidth: sidebarWidth >= 160 ? 200 : 0, opacity: sidebarWidth >= 160 ? 1 : 0, transition: "opacity 0.15s, max-width 0.15s" }}
              >Manage labels</span>
            </button>
          </div>
        </nav>

        {/* Storage indicator */}
        {sidebarWidth >= 200 && (
          <div className="px-4 py-3 border-t border-[#e0e0e0]">
            <div className="text-[12px] text-[#5f6368] mb-1.5">12.4 GB of 15 GB used</div>
            <div className="h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
              <div className="h-full bg-[#ea4335] rounded-full" style={{ width: "83%" }} />
            </div>
          </div>
        )}

        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-[#1a73e8]/20 transition-colors z-10"
          onMouseDown={e => {
            e.preventDefault();
            const onMove = (mv: MouseEvent) => setSidebarWidth(Math.max(64, Math.min(320, mv.clientX)));
            const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        />
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 py-2 bg-[#f6f8fc] border-b border-[#e0e0e0] flex-shrink-0" style={{ height: 64 }}>
          <button data-igg-id="mailo.topbar.hamburger" className="p-2 rounded-full hover:bg-[#e8eaed] text-[#5f6368]" aria-label="Main menu"><Icon name="menu" className="h-5 w-5" /></button>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-[16px] font-bold">M</div>
            <span className="text-[22px] font-light text-[#5f6368] tracking-tight">Mailo</span>
          </div>
          <div className="min-w-0 flex-1 mx-2 lg:mx-6">
            <div className="relative flex items-center gap-2 bg-[#eaf1fb] hover:bg-[#e4eefa] rounded-2xl px-4 py-2.5 max-w-[640px] cursor-text">
              <Icon name="search" className="h-5 w-5 text-[#5f6368]" />
              <input
                data-igg-id="mailo.topbar.search"
                placeholder="Search mail"
                onFocus={() => setSearchPanelOpen(true)}
                className="flex-1 bg-transparent text-[16px] text-[#202124] outline-none placeholder:text-[#5f6368]"
              />
              <button className="text-[#5f6368] hover:text-[#1a73e8]" aria-label="Advanced search"><Icon name="settings" className="h-4 w-4" /></button>
              {searchPanelOpen && (
                <div
                  data-igg-id="mailo.search.recent-panel"
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-2.5">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5f6368]">Recent searches</span>
                    <button
                      data-igg-id="mailo.search.recent.close"
                      onClick={() => setSearchPanelOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
                      aria-label="Close recent searches"
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  </div>
                  {RECENT_SEARCHES.map((term) => (
                    <button key={term} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-[#202124] hover:bg-[#f1f3f4]">
                      <Icon name="clock" className="h-4 w-4 text-[#5f6368]" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button data-igg-id="mailo.topbar.help" className="hidden sm:flex p-2 rounded-full hover:bg-[#e8eaed] text-[#5f6368]" aria-label="Help"><Icon name="help" className="h-5 w-5" /></button>
            <button data-igg-id="mailo.topbar.settings" className="p-2 rounded-full hover:bg-[#e8eaed] text-[#5f6368]" aria-label="Settings"><Icon name="settings" className="h-5 w-5" /></button>
            <button data-igg-id="mailo.topbar.apps" className="hidden md:flex p-2 rounded-full hover:bg-[#e8eaed] text-[#5f6368]" aria-label="Apps"><Icon name="apps" className="h-5 w-5" /></button>
            <button data-igg-id="mailo.topbar.account" className="w-9 h-9 rounded-full bg-[#ea4335] flex items-center justify-center text-white text-[14px] font-bold ml-1">J</button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center border-b border-[#e0e0e0] bg-white flex-shrink-0">
          {(["primary", "social", "promotions"] as MailoTab[]).map(tab => (
            <button
              key={tab}
              data-igg-id={`mailo.tab.${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-3 text-[13px] font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-[#444746] hover:text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              <Icon name={tab === "primary" ? "inbox" : tab === "social" ? "mail" : "label"} className="h-4 w-4" />
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e0e0e0] bg-white flex-shrink-0">
          <div className="w-5 h-5 rounded border-2 border-[#bdc1c6] cursor-pointer" data-igg-id="mailo.toolbar.select-all" />
          <div className="relative ml-1">
            <button
              data-igg-id="mailo.toolbar.sort-btn"
              onClick={e => { e.stopPropagation(); setSortMenuOpen(v => !v); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[#f1f3f4] text-[13px] text-[#444746]"
            >
              Sort ▾
            </button>
            {sortMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-[200px] bg-white rounded-xl shadow-xl border border-[#e0e0e0] py-1 z-50">
                <button data-igg-id="mailo.toolbar.sort.newest" className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                  <Icon name="clock" className="h-4 w-4 text-[#5f6368]" /> Newest first
                </button>
                <button data-igg-id="mailo.toolbar.sort.oldest" className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                  <Icon name="clock" className="h-4 w-4 text-[#5f6368]" /> Oldest first
                </button>
                <button data-igg-id="mailo.toolbar.sort.unread" className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-[#202124] hover:bg-[#f1f3f4]">
                  <Icon name="mail" className="h-4 w-4 text-[#5f6368]" /> Unread first
                </button>
              </div>
            )}
          </div>
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[#f1f3f4] text-[13px] text-[#444746]">Filter ▾</button>
          <div className="flex-1" />
          <span className="text-[12px] text-[#5f6368]">1–{visibleEmails.length} of {visibleEmails.length}</span>
          <button className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[16px] text-[#5f6368]">‹</button>
          <button className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[16px] text-[#5f6368]">›</button>
          <button className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]" aria-label="Display settings"><Icon name="settings" className="h-4 w-4" /></button>
        </div>

        {/* Announcement banner */}
        <div className="flex items-center gap-3 px-5 py-2.5 bg-[#e8f0fe] border-b border-[#c5d8f8] flex-shrink-0">
          <Icon name={banner.icon} className="h-5 w-5 text-[#1a73e8]" />
          <span className="text-[13px] font-semibold text-[#1a73e8]">{banner.title}</span>
          <span className="text-[13px] text-[#5f6368]">{banner.body}</span>
          <div className="flex-1" />
          <button
            data-igg-id={banner.ctaIggId}
            className="px-3.5 py-1.5 rounded-full bg-[#1a73e8] text-white text-[12px] font-medium hover:bg-[#1765cc] transition-colors"
          >
            {banner.ctaLabel}
          </button>
          <button
            data-igg-id="mailo.banner.arrow-next"
            onClick={() => selectBannerIndex((bannerIndex + 1) % ANNOUNCEMENT_BANNERS.length)}
            className="p-1 rounded-full hover:bg-[#c5d8f8] text-[#1a73e8]"
            aria-label="Next announcement"
          ><Icon name="chevronRight" className="h-4 w-4" /></button>
          <button
            className="p-1 rounded-full hover:bg-[#c5d8f8] text-[#5f6368] text-[14px]"
            aria-label="Dismiss"
          >✕</button>
        </div>

        {/* Email list */}
        <div
          ref={listRef}
          data-igg-id="mailo.inbox.scroll-region"
          className="flex-1 overflow-y-auto bg-white"
        >
          {visibleEmails.map(email => (
            <EmailRow
              key={email.id}
              email={email}
              openMoreId={openMoreId}
              onMoreToggle={id => setOpenMoreId(prev => prev === id ? null : id)}
            />
          ))}
        </div>
      </div>

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      {composeOpen && (
        <ComposeWindow
          countdown={sendCountdown}
          filePending={asyncPending ? true : asyncReady && benchState.asyncDelayMs !== null ? false : undefined}
          onClose={() => setComposeOpen(false)}
          to={benchState.composeTo}
          subject={benchState.composeSubject}
          attachmentLabel={benchState.composeAttachment}
        />
      )}
      {upgradeModalOpen && <UpgradeModal onClose={() => setUpgradeModalOpen(false)} />}

      {/* ── Incoming mail notification ────────────────────────────────────── */}
      {asyncPending && benchState.incomingMailIndex !== null && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 py-2.5 text-[13px] text-[#5f6368] shadow-md">
          <svg className="h-3.5 w-3.5 animate-spin text-[#1a73e8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Syncing mail...
        </div>
      )}
      {asyncReady && incomingMail && (
        <div className="fixed bottom-4 right-4 z-50 w-[340px] overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-xl">
          <div className="flex items-start gap-3 px-4 pb-2.5 pt-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-semibold text-white">
              {incomingMail.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-[13px] font-semibold text-[#202124]">{incomingMail.from}</span>
                <span className="ml-2 flex-shrink-0 text-[11px] text-[#5f6368]">just now</span>
              </div>
              <div className="truncate text-[12px] text-[#202124]">{incomingMail.subject}</div>
              <div className="truncate text-[12px] text-[#5f6368]">{incomingMail.preview}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 border-t border-[#f1f3f4] px-3 py-2">
            <button data-igg-id="mailo.notification.reply" data-igg-type="async_wait" className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe]">Reply</button>
            <button data-igg-id="mailo.notification.forward" data-igg-type="async_wait" className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe]">Forward</button>
            <button data-igg-id="mailo.notification.archive" data-igg-type="async_wait" className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe]">Archive</button>
          </div>
        </div>
      )}
    </div>
  );
}
