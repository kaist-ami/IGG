"use client";

import { Children, cloneElement, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createReviewRuntime } from "../../../lib/review-runtime";

function resolveReviewElement(selector?: string | null) {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
}

function buildReviewSelector(element: HTMLElement | null) {
  if (!element) return null;
  const iggId = element.closest("[data-igg-id]") as HTMLElement | null;
  if (iggId?.getAttribute("data-igg-id")) return `[data-igg-id='${iggId.getAttribute("data-igg-id")}']`;
  return null;
}

const { installReviewCapture, executeReviewAction } = createReviewRuntime({
  runtimeStateKey: "__DISCORD_BENCHMARK_STATE__",
  resolveReviewElement,
  buildReviewSelector,
  captureClickTargetSelector: "button,a,input,textarea,select,[role='button'],[role='tab'],[data-igg-id]",
  captureHoverTargetSelector: "button,a,input,textarea,select,[role='button'],[role='tab']",
  captureHoverType: "move",
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "online" | "idle" | "dnd" | "invisible";
type ChanType = "text" | "voice" | "announce" | "forum";
type View = "dm" | "server";
type ServerOverlay = "threads" | "pins" | null;
type UploadDemoPhase = "idle" | "uploading" | "ready" | "sent";
type InboxToast = { from: string; message: string } | null;

interface User {
  id: string; name: string; display: string;
  avatar: string; color: string; status: Status;
  about?: string; pronouns?: string; joinedAt?: string;
}
interface Msg {
  id: number; uid: string; time: string; content: string;
  replyTo?: { uid: string; snippet: string };
  reactions?: { emoji: string; count: number; mine: boolean }[];
  pinned?: boolean; edited?: boolean;
  thread?: { title: string; count: number };
}
interface DM { id: string; uid?: string; group?: boolean; gname?: string; gmembers?: string[]; }
interface Chan { id: string; name: string; type: ChanType; cat: string; topic?: string; unread?: boolean; mention?: number; }
interface Cat  { id: string; name: string; }
interface Thread { id: string; title: string; chan: string; ago: string; count: number; pids: string[]; }

// ─── Data ─────────────────────────────────────────────────────────────────────
const ME: User = { id:"me", name:"jordan_park", display:"Jordan", avatar:"JP", color:"#3b82f6", status:"online", about:"Always building 🛠️", pronouns:"they/them", joinedAt:"Mar 5, 2022" };

const USERS: Record<string,User> = {
  alice:   { id:"alice",   name:"alice_chen",    display:"Alice",   avatar:"✦",   color:"#7c3aed", status:"online",    about:"Coffee ≥ Sleep ☕",          pronouns:"she/her",  joinedAt:"Nov 12, 2021" },
  ryan:    { id:"ryan",    name:"ryan_k",         display:"Ryan",    avatar:"RK",  color:"#FAA61A", status:"idle",      about:"🎮 gaming rn",                                     joinedAt:"Jan 20, 2022"  },
  david:   { id:"david",   name:"david_lee",      display:"David",   avatar:"●",   color:"#2563eb", status:"dnd",       about:"do not disturb thx",                               joinedAt:"Jul 8, 2021"   },
  yuna:    { id:"yuna",    name:"yuna_oh",         display:"Yuna",    avatar:"YO",  color:"#9B59B6", status:"online",    about:"✨ vibes only",              pronouns:"she/her",  joinedAt:"Feb 14, 2023"  },
  sam:     { id:"sam",     name:"sam_w",           display:"Sam",     avatar:"SW",  color:"#1ABC9C", status:"invisible", about:"",                                                  joinedAt:"Sep 3, 2022"   },
  mia:     { id:"mia",     name:"mia_j",           display:"Mia",     avatar:"MJ",  color:"#E91E63", status:"online",    about:"研究中 📖",                 pronouns:"she/her",  joinedAt:"May 30, 2023"  },
  kai:     { id:"kai",     name:"kai_m",           display:"Kai",     avatar:"◆",   color:"#ef4444", status:"idle",      about:"always late to standup 🙃",                        joinedAt:"Aug 1, 2023"   },
  minho:   { id:"minho",   name:"minho_park",      display:"Minho",   avatar:"MP",  color:"#2ECC71", status:"online",    about:"Backend Developer 🖥️",           pronouns:"he/him",   joinedAt:"Jun 17, 2022"  },
  sora:    { id:"sora",    name:"sora_kim",        display:"Sora",    avatar:"✺",   color:"#f97316", status:"idle",      about:"Designer & Coffee Addict ☕", pronouns:"she/her",  joinedAt:"Jan 9, 2023"   },
  jake:    { id:"jake",    name:"jake_l",          display:"Jake",    avatar:"JL",  color:"#8E44AD", status:"dnd",       about:"Deep focus... 🎧",                                     joinedAt:"Apr 22, 2021"  },
  jenny:   { id:"jenny",   name:"jenny_h",         display:"Jenny",   avatar:"JH2", color:"#16A085", status:"online",    about:"PM who also codes 💻",    pronouns:"she/her",  joinedAt:"Oct 3, 2022"  },
  nari:    { id:"nari",    name:"nari_jung",       display:"Nari",    avatar:"NJ",  color:"#C0392B", status:"online",    about:"UX Researcher 🔍",              pronouns:"she/her",  joinedAt:"Mar 28, 2023"  },
  lucas:   { id:"lucas",   name:"lucas_b",         display:"Lucas",   avatar:"LB",  color:"#2980B9", status:"idle",      about:"",                                                  joinedAt:"Jul 11, 2022"  },
  hana:    { id:"hana",    name:"hana_shin",       display:"Hana",    avatar:"HS",  color:"#D35400", status:"online",    about:"Data Scientist 📊",     pronouns:"she/her",  joinedAt:"Sep 5, 2023"   },
  taeho:   { id:"taeho",   name:"taeho_yoon",      display:"Taeho",   avatar:"TY",  color:"#27AE60", status:"idle",      about:"MLOps Engineer 🚀",                                joinedAt:"Dec 1, 2021"  },
  jisu:    { id:"jisu",    name:"jisu_han",        display:"Jisu",    avatar:"JI",  color:"#00B894", status:"online",    about:"Frontend Developer 🎨",       pronouns:"she/her",  joinedAt:"Apr 15, 2022"  },
  wonjun:  { id:"wonjun",  name:"wonjun_choi",     display:"Wonjun",  avatar:"WC",  color:"#6C5CE7", status:"idle",      about:"Algorithm Enthusiast 🧩",                               joinedAt:"Sep 3, 2021"   },
  minji:   { id:"minji",   name:"minji_lee",       display:"Minji",   avatar:"✧",   color:"#ec4899", status:"online",    about:"Research Engineer 🔬",        pronouns:"she/her",  joinedAt:"Jan 22, 2023"  },
  eunha:   { id:"eunha",   name:"eunha_park",      display:"Eunha",   avatar:"EP",  color:"#55EFC4", status:"online",    about:"QA Engineer 🛡️",            pronouns:"she/her",  joinedAt:"Nov 5, 2022"  },
  yujin:   { id:"yujin",   name:"yujin_kang",      display:"Yujin",   avatar:"YJ",  color:"#A29BFE", status:"online",    about:"Full-stack Developer 💻",           pronouns:"she/her",  joinedAt:"Jun 1, 2023"   },
  jihoon:  { id:"jihoon",  name:"jihoon_bae",      display:"Jihoon",  avatar:"JB",  color:"#E17055", status:"idle",      about:"DevOps Engineer ⚙️",                              joinedAt:"Aug 7, 2022"   },
  boram:   { id:"boram",   name:"boram_cho",       display:"Boram",   avatar:"BC",  color:"#00CEC9", status:"online",    about:"Product Designer 🎨",       pronouns:"she/her",  joinedAt:"Apr 11, 2023"  },
  seoyeon: { id:"seoyeon", name:"seoyeon_lim",     display:"Seoyeon", avatar:"SL",  color:"#FF7675", status:"online",    about:"NLP Researcher 📝",             pronouns:"she/her",  joinedAt:"Dec 19, 2022" },
  rina:    { id:"rina",    name:"rina_kwon",       display:"Rina",    avatar:"RN",  color:"#81ECEC", status:"online",    about:"UX Writer ✍️",              pronouns:"she/her",  joinedAt:"Jul 20, 2023"  },
};

const DMS: DM[] = [
  { id:"dm-alice",   uid:"alice"   },
  { id:"dm-g1",  group:true, gname:"Lunch Squad 🍜",      gmembers:["alice","ryan","yuna","sam"]           },
  { id:"dm-yuna",    uid:"yuna"    },
  { id:"dm-minho",   uid:"minho"   },
  { id:"dm-g2",  group:true, gname:"Project Alpha 🚀",    gmembers:["minho","sora","jake","alice"]         },
  { id:"dm-ryan",    uid:"ryan"    },
  { id:"dm-jisu",    uid:"jisu"    },
  { id:"dm-g3",  group:true, gname:"Weekend Plans 🎉",    gmembers:["ryan","yuna","mia","nari"]            },
  { id:"dm-jenny",   uid:"jenny"   },
  { id:"dm-boram",   uid:"boram"   },
  { id:"dm-g4",  group:true, gname:"ML Study Group 📊",   gmembers:["david","mia","seoyeon","lucas","hana"]},
  { id:"dm-sora",    uid:"sora"    },
  { id:"dm-nari",    uid:"nari"    },
  { id:"dm-g5",  group:true, gname:"Dev Team 🛠️",        gmembers:["kai","jake","minho","taeho","jihoon"] },
  { id:"dm-david",   uid:"david"   },
  { id:"dm-minji",   uid:"minji"   },
  { id:"dm-g6",  group:true, gname:"Design Sprint 🎨",    gmembers:["boram","sora","rina","jisu"]          },
  { id:"dm-kai",     uid:"kai"     },
  { id:"dm-seoyeon", uid:"seoyeon" },
  { id:"dm-g7",  group:true, gname:"Research Circle 🔬",  gmembers:["seoyeon","minji","david","mia","hana"]},
  { id:"dm-jake",    uid:"jake"    },
  { id:"dm-hana",    uid:"hana"    },
  { id:"dm-wonjun",  uid:"wonjun"  },
  { id:"dm-rina",    uid:"rina"    },
  { id:"dm-eunha",   uid:"eunha"   },
  { id:"dm-sam",     uid:"sam"     },
  { id:"dm-taeho",   uid:"taeho"   },
  { id:"dm-yujin",   uid:"yujin"   },
  { id:"dm-jihoon",  uid:"jihoon"  },
  { id:"dm-lucas",   uid:"lucas"   },
];

const CATS: Cat[] = [
  { id:"c-info",   name:"INFORMATION"   },
  { id:"c-general",name:"GENERAL"       },
  { id:"c-project",name:"PROJECTS"      },
  { id:"c-dev",    name:"DEVELOPMENT"   },
  { id:"c-creative",name:"CREATIVE"     },
  { id:"c-social", name:"SOCIAL"        },
  { id:"c-ops",    name:"OPS & SUPPORT" },
  { id:"c-voice",  name:"VOICE CHANNELS"},
];

const CHANS: Chan[] = [
  { id:"ch-rules",   name:"rules",          type:"announce", cat:"c-info",    topic:"Server rules" },
  { id:"ch-annc",    name:"announcements",  type:"announce", cat:"c-info" },
  { id:"ch-intro",   name:"introductions",  type:"text",     cat:"c-info",    topic:"Introductions 👋" },
  { id:"ch-start",   name:"start-here",     type:"text",     cat:"c-info",    topic:"Guide for new members" },
  { id:"ch-links",   name:"resource-links", type:"text",     cat:"c-info",    topic:"Frequently used links" },
  { id:"ch-faq",     name:"faq",            type:"forum",    cat:"c-info",    topic:"FAQ collection" },
  { id:"ch-roles",   name:"roles",          type:"text",     cat:"c-info",    topic:"Role guide by interest" },
  { id:"ch-general", name:"general",        type:"text",     cat:"c-general", topic:"General chat 💬" },
  { id:"ch-random",  name:"random",         type:"text",     cat:"c-general" },
  { id:"ch-memes",   name:"memes",          type:"text",     cat:"c-general" },
  { id:"ch-news",    name:"news",           type:"text",     cat:"c-general", topic:"IT news sharing" },
  { id:"ch-win",     name:"small-wins",     type:"text",     cat:"c-general", topic:"Celebrate small wins together" },
  { id:"ch-help",    name:"help-desk",      type:"forum",    cat:"c-general", topic:"Stuck? Ask here" },
  { id:"ch-daily",   name:"daily-chat",     type:"text",     cat:"c-general", topic:"Casual daily chat" },
  { id:"ch-questions",name:"quick-questions",type:"text",    cat:"c-general", topic:"Quick questions here" },
  { id:"ch-roadmap", name:"roadmap",        type:"text",     cat:"c-project", topic:"Roadmap & priorities" },
  { id:"ch-standup", name:"daily-standup",  type:"text",     cat:"c-project", topic:"Today's tasks & progress" },
  { id:"ch-launch",  name:"launch-plan",    type:"text",     cat:"c-project", topic:"Release prep checklist" },
  { id:"ch-retro",   name:"retro",          type:"forum",    cat:"c-project", topic:"Retros & improvement ideas" },
  { id:"ch-sprint",  name:"sprint-board",   type:"text",     cat:"c-project", topic:"This sprint's focus" },
  { id:"ch-meetings",name:"meeting-notes",  type:"text",     cat:"c-project", topic:"Meeting notes & action items" },
  { id:"ch-decisions",name:"decisions",     type:"text",     cat:"c-project", topic:"Key decisions log" },
  { id:"ch-research",name:"research",       type:"text",     cat:"c-dev",     topic:"Papers & experiments", unread:true },
  { id:"ch-mocks",   name:"mock-review",    type:"text",     cat:"c-dev",     topic:"Mock review" },
  { id:"ch-code",    name:"code-review",    type:"text",     cat:"c-dev" },
  { id:"ch-bugs",    name:"bug-tracker",    type:"text",     cat:"c-dev" },
  { id:"ch-feedback",name:"feedback",       type:"forum",    cat:"c-dev",     topic:"Forum feedback" },
  { id:"ch-api",     name:"api-lab",        type:"text",     cat:"c-dev",     topic:"API design & integration" },
  { id:"ch-devops",  name:"devops",         type:"text",     cat:"c-dev",     topic:"Deploy, infra, monitoring" },
  { id:"ch-frontend",name:"frontend",       type:"text",     cat:"c-dev",     topic:"UI implementation & interactions" },
  { id:"ch-backend", name:"backend",        type:"text",     cat:"c-dev",     topic:"Server logic & data models" },
  { id:"ch-testing", name:"testing",        type:"text",     cat:"c-dev",     topic:"QA, regression checks, test strategy" },
  { id:"ch-ai",      name:"ai-agents",      type:"text",     cat:"c-dev",     topic:"Prompts, agents, automation experiments" },
  { id:"ch-figma",   name:"figma-drops",    type:"text",     cat:"c-creative",topic:"Share drafts, concepts & experiments" },
  { id:"ch-copy",    name:"copy-feedback",  type:"text",     cat:"c-creative",topic:"Copywriting & message tone" },
  { id:"ch-showcase",name:"showcase",       type:"text",     cat:"c-creative",topic:"Show off finished work" },
  { id:"ch-inspo",   name:"ui-inspiration", type:"text",     cat:"c-creative",topic:"Reference & inspiration collection" },
  { id:"ch-assets",  name:"assets",         type:"text",     cat:"c-creative",topic:"Icons, images, asset organization" },
  { id:"ch-ux",      name:"ux-research",    type:"text",     cat:"c-creative",topic:"Interviews, insights & hypotheses" },
  { id:"ch-photo",   name:"photos",         type:"text",     cat:"c-social",  topic:"Photos, daily life, cats welcome" },
  { id:"ch-food",    name:"food-talk",      type:"text",     cat:"c-social",  topic:"What to eat today" },
  { id:"ch-weekend", name:"weekend-plans",  type:"text",     cat:"c-social",  topic:"Weekend plans" },
  { id:"ch-music",   name:"music-share",    type:"text",     cat:"c-social",  topic:"What you're listening to" },
  { id:"ch-desk",    name:"desk-setup",     type:"text",     cat:"c-social",  topic:"Show off your setup" },
  { id:"ch-pets",    name:"pet-pics",       type:"text",     cat:"c-social",  topic:"Dogs, cats, all animals welcome" },
  { id:"ch-status",  name:"server-status",  type:"text",     cat:"c-ops",     topic:"Service status & issue announcements" },
  { id:"ch-mod",     name:"mod-log",        type:"text",     cat:"c-ops",     topic:"Operations log" },
  { id:"ch-requests",name:"feature-requests",type:"forum",   cat:"c-ops",     topic:"Feature requests & voting" },
  { id:"ch-vc1",     name:"Voice Chat",     type:"voice",    cat:"c-voice" },
  { id:"ch-vc2",     name:"Study Room",     type:"voice",    cat:"c-voice" },
  { id:"ch-vc3",     name:"Chill Zone",     type:"voice",    cat:"c-voice" },
  { id:"ch-vc4",     name:"Focus Room",     type:"voice",    cat:"c-voice" },
  { id:"ch-vc5",     name:"Town Hall",      type:"voice",    cat:"c-voice" },
  { id:"ch-vc6",     name:"Pair Coding",    type:"voice",    cat:"c-voice" },
];

const THREADS: Thread[] = [
  { id:"t1",  title:"Let's actually pick lunch",            chan:"ch-general",  ago:"2 min ago",   count:9,  pids:["sam","alice","me"] },
  { id:"t2",  title:"How many coffees are you on?",              chan:"ch-general",  ago:"18 min ago",  count:6,  pids:["ryan","yuna","me"] },
  { id:"t3",  title:"Taking after-work suggestions",        chan:"ch-general",  ago:"44 min ago",  count:7,  pids:["alice","boram","me"] },
  { id:"t4",  title:"Anyone down for Han River this weekend?",          chan:"ch-general",  ago:"1 hr ago", count:5,  pids:["nari","ryan","alice"] },
  { id:"t5",  title:"Polishing the experiments section",            chan:"ch-research", ago:"just now",     count:11, pids:["david","mia","me"] },
  { id:"t6",  title:"Standardize metric notation?",          chan:"ch-research", ago:"22 min ago",  count:8,  pids:["mia","hana","seoyeon"] },
  { id:"t7",  title:"Revisit ablation table order",      chan:"ch-research", ago:"1 hr ago", count:6,  pids:["david","minji","me"] },
  { id:"t8",  title:"Header card spacing fix",            chan:"ch-mocks",    ago:"5 min ago",   count:7,  pids:["yuna","alice","boram"] },
  { id:"t9",  title:"Is mobile top margin too large?",      chan:"ch-mocks",    ago:"31 min ago",  count:5,  pids:["me","sora","yuna"] },
  { id:"t10", title:"Button color version A vs B",           chan:"ch-mocks",    ago:"1 hr ago", count:9,  pids:["boram","alice","me"] },
  { id:"t11", title:"Let's just review PR #42 naming first",       chan:"ch-code",     ago:"11 min ago",  count:6,  pids:["kai","alice","me"] },
  { id:"t12", title:"Should we split error handling?",             chan:"ch-code",     ago:"36 min ago",  count:8,  pids:["kai","minho","me"] },
  { id:"t13", title:"How many test cases to add?", chan:"ch-code",     ago:"1 hr ago", count:4,  pids:["eunha","kai","me"] },
];

const VOICE_USERS: Record<string,string[]> = { "ch-vc1":["alice","ryan"], "ch-vc2":["david"], "ch-vc3":[], "ch-vc4":["yuna","minho"], "ch-vc5":["jenny","kai","boram"], "ch-vc6":["me","jisu"] };

const THREAD_MSGS: Record<string, { uid:string; time:string; content:string }[]> = {
  "t1": [],
  "t2": [],
  "t3": [],
  "t4": [],
  "t5": [],
  "t6": [],
  "t7": [],
  "t8": [],
  "t9": [],
  "t10": [],
  "t11": [],
  "t12": [],
  "t13": [],
};

function getLatestThreadForChannel(chanId: string) {
  return THREADS.find(thread => thread.chan === chanId) ?? null;
}

type MsgStore = Record<string, Msg[]>;
const INIT_MSGS: MsgStore = {
  // ── DMs ──────────────────────────────────────────────────────────────────
  "dm-alice": [
    { id:1,  uid:"alice", time:"Yesterday at 9:14 PM",  content:"hey, you're still up aren't you" },
    { id:2,  uid:"me",    time:"Yesterday at 9:15 PM",  content:"how'd you know lol" },
    { id:3,  uid:"alice", time:"Yesterday at 9:15 PM",  content:"you have a green dot on accord" },
    { id:4,  uid:"alice", time:"Yesterday at 9:15 PM",  content:"and you never sleep at this hour" },
    { id:5,  uid:"me",    time:"Yesterday at 9:16 PM",  content:"rude but accurate" },
    { id:6,  uid:"alice", time:"Yesterday at 9:16 PM",  content:"debating whether to just sleep through the hunger" },
    { id:7,  uid:"alice", time:"Yesterday at 9:16 PM",  content:"or make ramen right now" },
    { id:8,  uid:"me",    time:"Yesterday at 9:17 PM",  content:"sounds like you've already decided on the ramen" },
    { id:9,  uid:"alice", time:"Yesterday at 9:17 PM",  content:"caught lol 😂", reactions:[{emoji:"😂",count:2,mine:true}] },
    { id:10, uid:"alice", time:"Yesterday at 9:18 PM",  content:"hey what was that ramen you recommended" },
    { id:11, uid:"alice", time:"Yesterday at 9:18 PM",  content:"the one you said was good with an egg" },
    { id:12, uid:"me",    time:"Yesterday at 9:19 PM",  content:"the seafood flavor one!" },
    { id:13, uid:"me",    time:"Yesterday at 9:19 PM",  content:"you have to get the packet not the cup" },
    { id:14, uid:"alice", time:"Yesterday at 9:19 PM",  content:"oh right that one" },
    { id:15, uid:"alice", time:"Yesterday at 9:19 PM",  content:"i always forget the name" },
    { id:16, uid:"alice", time:"Yesterday at 9:20 PM",  content:"hold on" },
    { id:17, uid:"alice", time:"Yesterday at 9:20 PM",  content:"i'm actually going to the kitchen" },
    { id:18, uid:"me",    time:"Yesterday at 9:20 PM",  content:"why are you so dramatic about it lol" },
    { id:19, uid:"alice", time:"Yesterday at 9:24 PM",  content:"water's on" },
    { id:20, uid:"me",    time:"Yesterday at 9:24 PM",  content:"the execution is unmatched" },
    { id:21, uid:"alice", time:"Yesterday at 9:25 PM",  content:"random question" },
    { id:22, uid:"alice", time:"Yesterday at 9:25 PM",  content:"what did you have for lunch today" },
    { id:23, uid:"me",    time:"Yesterday at 9:25 PM",  content:"had kimchi fried rice" },
    { id:24, uid:"me",    time:"Yesterday at 9:25 PM",  content:"it was just okay enough to be sad about it" },
    { id:25, uid:"alice", time:"Yesterday at 9:26 PM",  content:"oh i know exactly what you mean" },
    { id:26, uid:"alice", time:"Yesterday at 9:26 PM",  content:"not bad but not worth the money either" },
    { id:27, uid:"me",    time:"Yesterday at 9:26 PM",  content:"exactly that" },
    { id:28, uid:"me",    time:"Yesterday at 9:26 PM",  content:"one bite and you go '...hm'" },
    { id:29, uid:"alice", time:"Yesterday at 9:27 PM",  content:"lmaoo i can picture the face 😭", reactions:[{emoji:"😭",count:1,mine:true}] },
    { id:30, uid:"alice", time:"Yesterday at 9:28 PM",  content:"oh the ramen smells so good" },
    { id:31, uid:"alice", time:"Yesterday at 9:28 PM",  content:"this is the happiest i've been all day" },
    { id:32, uid:"me",    time:"Yesterday at 9:28 PM",  content:"now i'm hungry because of you" },
    { id:33, uid:"alice", time:"Yesterday at 9:29 PM",  content:"i'll pretend we're eating together" },
    { id:34, uid:"alice", time:"Yesterday at 9:29 PM",  content:"want me to send you a bite" },
    { id:35, uid:"me",    time:"Yesterday at 9:29 PM",  content:"send the ramen like an accord file attachment" },
    { id:36, uid:"alice", time:"Yesterday at 9:30 PM",  content:"uploading..." },
    { id:37, uid:"alice", time:"Yesterday at 9:30 PM",  content:"98%" },
    { id:38, uid:"alice", time:"Yesterday at 9:30 PM",  content:"error: failed because you live too far away" },
    { id:39, uid:"me",    time:"Yesterday at 9:30 PM",  content:"lmaooo 🤣", reactions:[{emoji:"🤣",count:2,mine:false}] },
    { id:40, uid:"alice", time:"Yesterday at 9:32 PM",  content:"hey did you finish that thing" },
    { id:41, uid:"alice", time:"Yesterday at 9:32 PM",  content:"the page edits you were working on" },
    { id:42, uid:"me",    time:"Yesterday at 9:33 PM",  content:"halfway?" },
    { id:43, uid:"me",    time:"Yesterday at 9:33 PM",  content:"almost done but the last 10% is eating all my time" },
    { id:44, uid:"alice", time:"Yesterday at 9:33 PM",  content:"ugh that stretch is the worst" },
    { id:45, uid:"alice", time:"Yesterday at 9:34 PM",  content:"the first 90% you feel unstoppable" },
    { id:46, uid:"alice", time:"Yesterday at 9:34 PM",  content:"then the last 10% becomes your whole life" },
    { id:47, uid:"me",    time:"Yesterday at 9:34 PM",  content:"exactly" },
    { id:48, uid:"me",    time:"Yesterday at 9:34 PM",  content:"said 'this'll be quick' again and here we are" },
    { id:49, uid:"alice", time:"Yesterday at 9:35 PM",  content:"but you always get it done in the end" },
    { id:50, uid:"me",    time:"Yesterday at 9:35 PM",  content:"you say that and suddenly i feel like i can do it" },
    { id:51, uid:"alice", time:"Yesterday at 9:36 PM",  content:"i mean it though" },
    { id:52, uid:"alice", time:"Yesterday at 9:36 PM",  content:"even if you complain the whole way through" },
    { id:53, uid:"me",    time:"Yesterday at 9:36 PM",  content:"HEY lol" },
    { id:54, uid:"me",    time:"Yesterday at 9:36 PM",  content:"did you have to add that part" },
    { id:55, uid:"alice", time:"Yesterday at 9:37 PM",  content:"it's called being a good friend" },
    { id:56, uid:"alice", time:"Yesterday at 9:38 PM",  content:"anyway don't stay up too late" },
    { id:57, uid:"alice", time:"Yesterday at 9:38 PM",  content:"seriously get some sleep" },
    { id:58, uid:"me",    time:"Yesterday at 9:39 PM",  content:"yes mom" },
    { id:59, uid:"alice", time:"Yesterday at 9:39 PM",  content:"and don't sleep in tomorrow" },
    { id:60, uid:"me",    time:"Yesterday at 9:40 PM",  content:"can't promise that" },
    { id:61, uid:"alice", time:"Yesterday at 9:40 PM",  content:"consistently dependable in the worst way" },
    { id:62, uid:"alice", time:"Today at 8:12 AM",  content:"you up" },
    { id:63, uid:"me",    time:"Today at 8:23 AM",  content:"just woke up..." },
    { id:64, uid:"alice", time:"Today at 8:23 AM",  content:"LMAO" },
    { id:65, uid:"alice", time:"Today at 8:23 AM",  content:"called it" },
    { id:66, uid:"me",    time:"Today at 8:24 AM",  content:"you're so annoying about it" },
    { id:67, uid:"alice", time:"Today at 8:25 AM",  content:"the weather's actually nice today though" },
    { id:68, uid:"alice", time:"Today at 8:25 AM",  content:"might wake me up if i step outside for a bit" },
    { id:69, uid:"me",    time:"Today at 8:26 AM",  content:"okay i'll grab a coffee on the way back" },
    { id:70, uid:"alice", time:"Today at 8:26 AM",  content:"nice" },
    { id:71, uid:"alice", time:"Today at 8:26 AM",  content:"iced or hot?" },
    { id:72, uid:"me",    time:"Today at 8:27 AM",  content:"iced no matter what" },
    { id:73, uid:"alice", time:"Today at 8:27 AM",  content:"people who drink iced coffee in the cold are wild to me" },
    { id:74, uid:"me",    time:"Today at 8:28 AM",  content:"that's literally me" },
    { id:75, uid:"alice", time:"Today at 8:29 AM",  content:"ok good luck today and" },
    { id:76, uid:"alice", time:"Today at 8:29 AM",  content:"text me if you're still alive at lunch" },
    { id:77, uid:"me",    time:"Today at 8:29 AM",  content:"lol i will prove my survival" },
  ],
  "dm-yuna": [],
  "dm-ryan": [],
  "dm-david": [],
  "dm-sam": [],
  "dm-kai": [],
  "dm-g1": [],
  "dm-minho": [],
  "dm-jenny": [],
  "dm-sora": [],
  "dm-nari": [],
  "dm-jake": [],
  "dm-hana": [],
  "dm-taeho": [],
  "dm-lucas": [],
  "dm-g2": [],
  "dm-g3": [],
  "dm-g4": [],
  "dm-g5": [],
  "dm-jisu": [
    { id:1, uid:"jisu",  time:"11:00 AM", content:"Hey Jordan, can you share the component specs? Need to check the button variants." },
    { id:2, uid:"me",    time:"11:05 AM", content:"Sending the Figma link now!" },
    { id:3, uid:"jisu",  time:"11:06 AM", content:"Thanks ✨ I'll get on it right away", reactions:[{emoji:"💯",count:1,mine:false}] },
  ],
  "dm-boram": [],
  "dm-minji": [],
  "dm-seoyeon": [],
  "dm-wonjun": [],
  "dm-rina": [],
  "dm-eunha": [],
  "dm-yujin": [],
  "dm-jihoon": [],
  "dm-g6": [],
  "dm-g7": [],
  // ── Channels ─────────────────────────────────────────────────────────────
  "ch-rules": [],
  "ch-annc": [],
  "ch-intro": [],
  "ch-start": [],
  "ch-links": [],
  "ch-general": [
    { id:1,  uid:"alice", time:"8:42 AM",  content:"Good morning everyone ☀️ let's survive another day" },
    { id:2,  uid:"ryan",  time:"8:44 AM",  content:"Already on my second coffee and still not awake", thread:{title:"How many coffees are you on?",count:6}, reactions:[{emoji:"☕",count:4,mine:true}] },
    { id:3,  uid:"yuna",  time:"8:45 AM",  content:"The weather's nice today at least" },
    { id:4,  uid:"me",    time:"8:47 AM",  content:"Just woke up, systems still booting" },
    { id:5,  uid:"alice", time:"8:48 AM",  content:"Saw that coming lol" },
    { id:6,  uid:"jenny", time:"9:01 AM",  content:"Don't forget standup at 2pm today!" },
    { id:7,  uid:"minho", time:"9:05 AM",  content:"I'll wrap up the API integration and share before noon" },
    { id:8,  uid:"boram", time:"9:07 AM",  content:"Working on header mockups. Will drop the Figma link around 11" },
    { id:9,  uid:"kai",   time:"9:11 AM",  content:"Staging cache seems off — anyone else seeing this?" },
    { id:10, uid:"jihoon",time:"9:13 AM",  content:"Just checked the logs — might be the CDN config" },
    { id:11, uid:"me",    time:"9:18 AM",  content:"Would be good to sync and look at it together before noon" },
    { id:12, uid:"sora",  time:"9:26 AM",  content:"Oh right, thanks everyone who gave feedback on yesterday's mockup 🙏" },
    { id:13, uid:"alice", time:"9:30 AM",  content:"The colors were great. Let's just tweak the card spacing a bit!" },
    { id:14, uid:"yuna",  time:"9:34 AM",  content:"I thought the nav margin just needs a small adjustment too" },
    { id:15, uid:"sam",   time:"9:40 AM",  content:"Anyone want to go out for lunch today?", thread:{title:"Let's actually pick lunch",count:9} },
    { id:16, uid:"me",    time:"9:41 AM",  content:"I'm in. Not picky but feeling something with broth" },
    { id:17, uid:"alice", time:"9:44 AM",  content:"Anything spicy and hot works for me" },
    { id:18, uid:"mia",   time:"9:45 AM",  content:"I just want to exist quietly until lunch..." },
    { id:19, uid:"jisu",  time:"9:58 AM",  content:"I'll be doing layout polish on the frontend this morning" },
    { id:20, uid:"me",    time:"10:02 AM", content:"Also tidying up the channel interactions" },
    { id:21, uid:"alice", time:"10:05 AM", content:"Nice. Could you also look at the server menu" },
    { id:22, uid:"nari",  time:"10:08 AM", content:"Weather like this on a weekend is perfect for the river", thread:{title:"Anyone down for Han River this weekend?",count:5} },
    { id:23, uid:"ryan",  time:"10:09 AM", content:"Suddenly excited lol — who has a picnic mat?" },
    { id:24, uid:"me",    time:"10:10 AM", content:"I can handle snacks" },
    { id:25, uid:"alice", time:"10:12 AM", content:"Everyone don't forget standup today! Starting at 2pm 📣" },
    { id:26, uid:"ryan",  time:"10:15 AM", content:"On it! Almost done", reactions:[{emoji:"👍",count:3,mine:true}] },
    { id:27, uid:"yuna",  time:"10:16 AM", content:"Same here 😄" },
    { id:28, uid:"boram", time:"10:18 AM", content:"Still haven't figured out what I'm doing after work", thread:{title:"Taking after-work suggestions",count:7} },
    { id:29, uid:"alice", time:"10:22 AM", content:"My recommendation: go home and lie down" },
    { id:30, uid:"hana",  time:"10:27 AM", content:"It really is perfect walking weather today though" },
    { id:31, uid:"me",    time:"10:32 AM", content:"Anyone free for a quick QA session before the afternoon?" },
    { id:32, uid:"eunha", time:"10:35 AM", content:"I'm free! Anytime after 11 works" },
    { id:33, uid:"me",    time:"10:36 AM", content:"Great, let's do a quick sync at 11 then" },
    { id:34, uid:"alice", time:"10:40 AM", content:"Almost done with the mock edits! Will push them this afternoon", edited:true },
    { id:35, uid:"kai",   time:"10:46 AM", content:"I'll be a bit late... sorry 😅" },
    { id:36, uid:"boram", time:"10:52 AM", content:"No worries, we're still figuring things out too" },
    { id:37, uid:"me",    time:"10:55 AM", content:"I can't believe the morning went by this fast" },
    { id:38, uid:"alice", time:"10:56 AM", content:"That's just how it goes 😭", reactions:[{emoji:"😭",count:2,mine:false}] },
    { id:39, uid:"jenny", time:"11:00 AM", content:"Please be back by 1:50 after lunch 🙌" },
    { id:40, uid:"me",    time:"11:02 AM", content:"Got it!" },
  ],
  "ch-random": [],
  "ch-memes": [],
  "ch-news": [],
  "ch-win": [],
  "ch-help": [],
  "ch-roadmap": [],
  "ch-standup": [],
  "ch-launch": [],
  "ch-retro": [],
  "ch-research": [
    { id:1, uid:"david", time:"Yesterday at 3:40 PM", content:"Dropped the paper draft — feedback welcome 🙏", pinned:true },
    { id:2, uid:"mia",   time:"Yesterday at 4:01 PM", content:"I'll read it! The related work section might need more coverage" },
    { id:3, uid:"me",    time:"9:30 AM",      content:"The first paragraph of section 3 feels a bit stiff — should we add an interpretation sentence?", thread:{title:"Polishing the experiments section",count:11} },
    { id:4, uid:"david", time:"9:35 AM",      content:"Agreed. Also feels like we need more samples", reactions:[{emoji:"👀",count:2,mine:false}] },
    { id:5, uid:"mia",   time:"9:40 AM",      content:"The evaluation metrics need to be cleaned up too", thread:{title:"Standardize metric notation?",count:8} },
    { id:6, uid:"minji", time:"9:46 AM",      content:"Moving the ablation table back a bit would help readability", thread:{title:"Revisit ablation table order",count:6} },
  ],
  "ch-mocks": [],
  "ch-code": [],
  "ch-bugs": [],
  "ch-feedback": [],
  "ch-api": [],
  "ch-devops": [],
  "ch-figma": [],
  "ch-copy": [],
  "ch-showcase": [],
  "ch-photo": [],
  "ch-food": [],
  "ch-weekend": [],
};

const STATUS_CFG: Record<Status, {color:string; label:string}> = {
  online:    { color:"#23a55a", label:"Online"          },
  idle:      { color:"#f0b232", label:"Away"        },
  dnd:       { color:"#f23f43", label:"Do Not Disturb"        },
  invisible: { color:"#80848e", label:"Appear Offline" },
};

// ─── Server folder data ───────────────────────────────────────────────────────
const SERVERS = [
  { id:"s1",  label:"Project Moshiki",      text:"🧪", bg:"#1b1f3b", fg:"#c7d2fe", folder:false },
  { id:"s2",  label:"Orbit UI",             text:"⚛️", bg:"#102a43", fg:"#7dd3fc", folder:false },
  { id:"s3",  label:"Prompt Forge",         text:"📝", bg:"#2d1b2e", fg:"#f9a8d4", folder:false },
  { id:"s4",  label:"Pixel Harbor",         bg:"#1f2937", fg:"#f9fafb", folder:false, image:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=160&q=80" },
  { id:"s5",  label:"Shipyard",             text:"🚀", bg:"#112e21", fg:"#86efac", folder:false },
  { id:"s6",  label:"Moonbase",             text:"🌙", bg:"#1f2340", fg:"#c4b5fd", folder:false },
  { id:"s7",  label:"Brightside",           text:"💡", bg:"#3a1d12", fg:"#fdba74", folder:false },
  { id:"s8",  label:"Creator Dock",         bg:"#1a2430", fg:"#e2e8f0", folder:false, image:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=160&q=80" },
  { id:"f1",  label:"Data Guild",           text:"📊", bg:"#162032", fg:"#60a5fa", folder:true  },
  { id:"f2",  label:"Research Notes",       text:"🔬", bg:"#1f2d1f", fg:"#bbf7d0", folder:true  },
  { id:"f3",  label:"Design Crit",          text:"🎨", bg:"#2a1530", fg:"#f0abfc", folder:true  },
  { id:"f4",  label:"Sound Booth",          bg:"#15152a", fg:"#c4b5fd", folder:true, image:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=160&q=80" },
  { id:"f5",  label:"Watchparty",           text:"🍿", bg:"#2a2510", fg:"#fde68a", folder:true  },
  { id:"f6",  label:"Launch Crew",          bg:"#243447", fg:"#dbeafe", folder:true, image:"https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=160&q=80" },
  { id:"f7",  label:"API Garage",           text:"🛠️", bg:"#1d2731", fg:"#93c5fd", folder:true  },
  { id:"f8",  label:"Bug Hunters",          text:"🐞", bg:"#311b1b", fg:"#fca5a5", folder:true  },
  { id:"f9",  label:"Book & Brew",          text:"📚", bg:"#2b2117", fg:"#fed7aa", folder:true  },
  { id:"f10", label:"Photo Dump",           bg:"#2a3342", fg:"#f8fafc", folder:true, image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=160&q=80" },
  { id:"f11", label:"Game Night",           text:"🎮", bg:"#241826", fg:"#f5b4fc", folder:true  },
  { id:"f12", label:"Study Hall",           text:"📖", bg:"#1d2b1f", fg:"#d9f99d", folder:true  },
];

function ServerGlyph({
  server,
  size,
  rounded,
}: {
  server: (typeof SERVERS)[number];
  size: number;
  rounded: number;
}) {
  const shellColor = server.image ? "#313338" : server.bg;
  if (server.image) {
    return (
      <div style={{ width:size, height:size, borderRadius:rounded, backgroundColor:shellColor, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        <img
          src={server.image}
          alt={server.label}
          style={{ width:size, height:size, borderRadius:rounded, objectFit:"cover", display:"block" }}
        />
      </div>
    );
  }

  return (
    <div style={{ width:size, height:size, borderRadius:rounded, backgroundColor:shellColor, display:"flex", alignItems:"center", justifyContent:"center", color:server.fg, fontWeight:700, fontSize:size >= 48 ? 14 : 12, lineHeight:1 }}>
      {server.text}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  Discord:   ()=><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>,
  Hash:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Speaker:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,

  Search:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Phone:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Video:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  Pin:       ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>,
  Members:   ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Thread:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></svg>,
  Inbox:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Help:      ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Mic:       ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Headset:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  Settings:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Bell:      ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Shield:    ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  CalendarP: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
  Sparkles:  ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/><path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>,
  Logout:    ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Square:    ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>,
  Emoji:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Gif:       ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M8 12H6a2 2 0 1 1 0-4h2"/><line x1="12" y1="8" x2="12" y2="16"/><path d="M16 8h2v4h-2v4"/></svg>,
  Plus:      ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Gift:      ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Reply:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
  Star:      ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  React:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Dot3:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>,
  ChevD:     ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Close:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Edit:      ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

// ─── Chan icon ────────────────────────────────────────────────────────────────

function LockBadge() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="#80848e">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  );
}
function ChanIcon({ type }: { type: ChanType }) {
  if (type === "voice") return <I.Speaker />;
  if (type === "announce" || type === "forum") {
    return (
      <div style={{ position:"relative", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <I.Hash />
        <div style={{ position:"absolute", bottom:-2, right:-3, lineHeight:0 }}><LockBadge /></div>
      </div>
    );
  }
  return <I.Hash />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ user, size=32, dot=false, dotBg="#2b2d31" }: { user:User; size?:number; dot?:boolean; dotBg?:string }) {
  const ds = Math.round(size * 0.36);
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:"50%", backgroundColor:user.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32, fontWeight:700, color:"#fff", userSelect:"none" }}>
        {user.avatar}
      </div>
      {dot && <div style={{ position:"absolute", bottom:-1, right:-1, width:ds, height:ds, borderRadius:"50%", backgroundColor:STATUS_CFG[user.status].color, border:`2px solid ${dotBg}` }}/>}
    </div>
  );
}

// ─── Tooltip (portal-based, no layout side-effects) ───────────────────────────
function Tip({ label, children, side="top" }: { label:string; children:React.ReactNode; side?:"top"|"bottom"|"left"|"right" }) {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  const show = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const G = 6;
    const base: React.CSSProperties = { position:"fixed", zIndex:9999, pointerEvents:"none", backgroundColor:"#111214", color:"#dbdee1", fontSize:13, fontWeight:600, padding:"5px 10px", borderRadius:5, whiteSpace:"nowrap", boxShadow:"0 8px 16px rgba(0,0,0,.7)" };
    if (side === "top")    setStyle({ ...base, left:r.left+r.width/2, top:r.top-G,    transform:"translate(-50%,-100%)" });
    if (side === "bottom") setStyle({ ...base, left:r.left+r.width/2, top:r.bottom+G, transform:"translateX(-50%)" });
    if (side === "right")  setStyle({ ...base, left:r.right+G,        top:r.top+r.height/2, transform:"translateY(-50%)" });
    if (side === "left")   setStyle({ ...base, left:r.left-G,         top:r.top+r.height/2, transform:"translate(-100%,-50%)" });
  }, [side]);

  const hide = useCallback(() => setStyle(null), []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const child = Children.only(children) as React.ReactElement<any>;
  return (
    <>
      {cloneElement(child, {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { show(e); child.props.onMouseEnter?.(e); },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { hide(); child.props.onMouseLeave?.(e); },
      })}
      {style && typeof document !== "undefined" && createPortal(<div style={style}>{label}</div>, document.body)}
    </>
  );
}

// ─── Emoji picker (portal, fixed position) ────────────────────────────────────
const EMOJIS = ["👍","❤️","😂","😮","😢","😡","🎉","🔥","✅","👀","💯","🙏","😍","🤔","👏","🥲","💀","🫡","🤣","😭","💪","🚀","⭐","🫶","✨","👋","🤩","😎","🫠","👎","❓","‼️"];

function EmojiPicker({ anchor, onPick, onClose }: { anchor: DOMRect; onPick:(e:string)=>void; onClose:()=>void }) {
  const top  = anchor.top - 220 > 0 ? anchor.top - 220 : anchor.bottom + 8;
  const left = Math.min(anchor.left, window.innerWidth - 260);

  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [onClose]);

  return createPortal(
    <div onMouseDown={e => e.stopPropagation()} style={{ position:"fixed", top, left, width:252, backgroundColor:"#111214", border:"1px solid #2e2e34", borderRadius:10, padding:10, zIndex:10000, boxShadow:"0 16px 40px rgba(0,0,0,.8)" }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#80848e", textTransform:"uppercase", letterSpacing:".6px", marginBottom:8 }}>Add Reaction</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:2 }}>
        {EMOJIS.map(e => (
          <button key={e} onMouseDown={ev=>{ev.stopPropagation();onPick(e);onClose();}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, padding:3, borderRadius:4, lineHeight:1, textAlign:"center" }}>{e}</button>
        ))}
      </div>
    </div>,
    document.body
  );
}

// ─── Status picker (portal) ───────────────────────────────────────────────────
function StatusPicker({ anchor, current, onSelect, onClose }: { anchor:DOMRect; current:Status; onSelect:(s:Status)=>void; onClose:()=>void }) {
  const top  = anchor.top - 220;
  const left = anchor.left;
  const opts: Status[] = ["online","idle","dnd","invisible"];

  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [onClose]);

  return createPortal(
    <div onMouseDown={e=>e.stopPropagation()} style={{ position:"fixed", top, left, minWidth:220, backgroundColor:"#111214", border:"1px solid #2e2e34", borderRadius:8, padding:6, zIndex:10000, boxShadow:"0 16px 40px rgba(0,0,0,.8)" }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#80848e", textTransform:"uppercase", letterSpacing:".6px", padding:"4px 8px 6px" }}>Set Status</div>
      {opts.map(s => {
        const c = STATUS_CFG[s];
        return (
          <button data-igg-id={{ online:"discord.profile.status.online", idle:"discord.profile.status.idle", dnd:"discord.profile.status.dnd", invisible:"discord.profile.status.invisible" }[s]} key={s} onMouseDown={ev=>{ev.stopPropagation();onSelect(s);onClose();}} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:current===s?"#313338":"none", border:"none", cursor:"pointer", borderRadius:4 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", backgroundColor:c.color, flexShrink:0 }}/>
            <span style={{ fontSize:14, color:"#dbdee1" }}>{c.label}</span>
            {current===s && <span style={{ marginLeft:"auto", color:"#3b82f6" }}>✓</span>}
          </button>
        );
      })}
      <div style={{ height:1, backgroundColor:"#3f4147", margin:"6px 0" }}/>
      <button style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"none", border:"none", cursor:"pointer", borderRadius:4, color:"#b5bac1", fontSize:14 }}>✏️ Set Custom Status</button>
    </div>,
    document.body
  );
}

// ─── My profile popup (portal) ────────────────────────────────────────────────
function MyProfileCard({ user, anchor, onStatusChange }: { user:User; anchor:DOMRect; onStatusChange:(s:Status)=>void }) {
  const [statusAnchor, setStatusAnchor] = useState<DOMRect|null>(null);
  const cfg = STATUS_CFG[user.status];

  return createPortal(
    <div onMouseDown={e=>e.stopPropagation()} style={{ position:"fixed", bottom: window.innerHeight - anchor.top + 8, left:anchor.left, width:300, backgroundColor:"#111214", borderRadius:10, overflow:"hidden", zIndex:9000, boxShadow:"0 16px 40px rgba(0,0,0,.85)" }}>
      <div style={{ height:70, background:`linear-gradient(135deg,${user.color}88,${user.color}22)` }}/>
        <div style={{ position:"relative", padding:"0 16px" }}>
          <div style={{ position:"absolute", top:-36, left:16, padding:4, backgroundColor:"#111214", borderRadius:"50%" }}>
            <Av user={user} size={72}/>
            <div style={{ position:"absolute", bottom:6, right:6, width:16, height:16, borderRadius:"50%", backgroundColor:cfg.color, border:"3px solid #111214" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:8 }}>
            <button data-igg-id="discord.profile.status-dropdown" onMouseDown={e=>{e.stopPropagation();setStatusAnchor(e.currentTarget.getBoundingClientRect());}} style={{ display:"flex", alignItems:"center", gap:6, background:"#1e1f22", border:"none", cursor:"pointer", borderRadius:4, padding:"5px 10px" }}>
              <div style={{ width:10, height:10, borderRadius:"50%", backgroundColor:cfg.color }}/>
              <span style={{ fontSize:12, color:"#b5bac1" }}>{cfg.label}</span>
              <span style={{ display:"flex", color:"#87898c" }}><I.ChevD/></span>
            </button>
          </div>
        </div>
      <div style={{ padding:"48px 16px 16px" }}>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{user.display}</div>
        <div style={{ fontSize:13, color:"#b5bac1", marginBottom:10 }}>@{user.name}</div>
        {user.pronouns && <div style={{ fontSize:12, color:"#80848e", marginBottom:8 }}>{user.pronouns}</div>}
        {user.about && <div style={{ backgroundColor:"#1e1f22", borderRadius:6, padding:10, marginBottom:10, fontSize:13, color:"#dbdee1" }}>{user.about}</div>}
        <div style={{ backgroundColor:"#1e1f22", borderRadius:6, padding:10, fontSize:12, color:"#b5bac1" }}>Member Since: <span style={{ color:"#dbdee1" }}>{user.joinedAt}</span></div>
        <button style={{ marginTop:12, width:"100%", backgroundColor:"#3b82f6", border:"none", cursor:"pointer", borderRadius:4, padding:"8px 0", fontSize:13, fontWeight:600, color:"#fff" }}>Edit Profile</button>
      </div>
      {statusAnchor && <StatusPicker anchor={statusAnchor} current={user.status} onSelect={s=>{onStatusChange(s);setStatusAnchor(null);}} onClose={()=>setStatusAnchor(null)}/>}
    </div>,
    document.body
  );
}

// ─── User profile right panel ─────────────────────────────────────────────────
function ProfilePanel({ user, onClose }: { user:User; onClose:()=>void }) {
  const cfg = STATUS_CFG[user.status];
  return (
    <div style={{ width:340, backgroundColor:"#232428", display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
      <div style={{ position:"relative" }}>
        <div style={{ height:120, background:`linear-gradient(135deg,${user.color}55,${user.color}11)` }}/>
        <button onClick={onClose} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.5)", border:"none", cursor:"pointer", color:"#fff", borderRadius:4, padding:4, display:"flex" }}><I.Dot3/></button>
        <div style={{ position:"absolute", bottom:-40, left:16 }}>
          <div style={{ padding:4, backgroundColor:"#232428", borderRadius:"50%" }}><Av user={user} size={72}/></div>
          <div style={{ position:"absolute", bottom:6, right:6, width:16, height:16, borderRadius:"50%", backgroundColor:cfg.color, border:"3px solid #232428" }}/>
        </div>
      </div>
      <div style={{ marginTop:50, padding:"0 16px 16px" }}>
        <div style={{ backgroundColor:"#111214", borderRadius:8, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{user.display}</div>
          <div style={{ fontSize:13, color:"#b5bac1", marginBottom:4 }}>@{user.name}</div>
          {user.pronouns && <div style={{ fontSize:12, color:"#80848e" }}>{user.pronouns}</div>}
        </div>
        {user.about && <div style={{ backgroundColor:"#111214", borderRadius:8, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#b5bac1", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>About Me</div>
          <div style={{ fontSize:13, color:"#dbdee1" }}>{user.about}</div>
        </div>}
        <div style={{ backgroundColor:"#111214", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#b5bac1", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Member Since</div>
          <div style={{ fontSize:13, color:"#dbdee1", marginBottom:8 }}>{user.joinedAt}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", backgroundColor:cfg.color }}/>
            <span style={{ fontSize:13, color:"#dbdee1" }}>{cfg.label}</span>
          </div>
        </div>
        <button style={{ marginTop:12, width:"100%", backgroundColor:"#3b82f6", border:"none", cursor:"pointer", borderRadius:4, padding:"8px 0", fontSize:13, fontWeight:600, color:"#fff" }}>Message</button>
      </div>
    </div>
  );
}

function ChannelThreadPreview({
  chanId,
  anchor,
  onMouseEnter,
  onMouseLeave,
}: {
  chanId: string;
  anchor: DOMRect;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}) {
  const threads = THREADS.filter((thread) => thread.chan === chanId);
  const [pressedThreadId, setPressedThreadId] = useState<string | null>(null);
  const [isShowAllPressed, setIsShowAllPressed] = useState(false);
  if (threads.length === 0) return null;

  const left = anchor.right + 18;
  const top = Math.min(anchor.top - 8, window.innerHeight - 260);

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        position:"fixed",
        top:Math.max(56, top),
        left,
        width:380,
        backgroundColor:"#ffffff",
        border:"1px solid #d8dbe2",
        borderRadius:18,
        overflow:"hidden",
        zIndex:9500,
        boxShadow:"0 22px 54px rgba(15, 23, 42, 0.18)",
        pointerEvents:"auto",
        cursor:"default",
        userSelect:"none",
      }}
    >
      <div style={{ padding:"18px 22px 8px" }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#6b7280", letterSpacing:"-.02em" }}>More active threads</div>
      </div>
      <div style={{ padding:"2px 14px 10px" }}>
        {threads.slice(0, 3).map((thread) => {
          const msgs = THREAD_MSGS[thread.id] ?? [];
          const latest = msgs.at(-1);
          const latestUser = latest ? (latest.uid === "me" ? ME : USERS[latest.uid]) : null;
          const previewUser = latestUser ?? (thread.pids[0] === "me" ? ME : USERS[thread.pids[0]]);
          const isPressed = pressedThreadId === thread.id;

          return (
            <div
              key={thread.id}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPressedThreadId(thread.id);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPressedThreadId(current => current === thread.id ? null : current);
              }}
              onMouseLeave={() => {
                setPressedThreadId(current => current === thread.id ? null : current);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPressedThreadId(null);
              }}
              style={{
                display:"flex",
                alignItems:"center",
                gap:12,
                padding:"12px 8px",
                borderRadius:12,
                cursor:"default",
                backgroundColor:isPressed ? "#f3f4f6" : "transparent",
                transform:isPressed ? "scale(0.992)" : "scale(1)",
                transition:"background-color .08s ease, transform .08s ease",
              }}
            >
              {previewUser ? (
                <Av user={previewUser} size={28}/>
              ) : (
                <div style={{ width:28, height:28, borderRadius:"50%", backgroundColor:"#e5e7eb", flexShrink:0 }}/>
              )}
              <div style={{ minWidth:0, display:"flex", alignItems:"baseline", gap:10, flex:1 }}>
                <span
                  style={{
                    fontSize:17,
                    fontWeight:500,
                    color:"#2f3136",
                    overflow:"hidden",
                    textOverflow:"ellipsis",
                    whiteSpace:"nowrap",
                    flex:1,
                  }}
                >
                  {thread.title}
                </span>
                <span style={{ fontSize:14, color:"#6b7280", flexShrink:0 }}>•</span>
                <span style={{ fontSize:14, color:"#6b7280", flexShrink:0 }}>{thread.ago}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:"6px 14px 18px" }}>
        <button
          data-igg-id={chanId === "ch-research" ? "discord.channel.research.thread-preview.show-all" : "discord.thread-preview.show-all"}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsShowAllPressed(true);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsShowAllPressed(false);
          }}
          onMouseLeave={() => {
            setIsShowAllPressed(false);
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsShowAllPressed(false);
          }}
          style={{
            width:"100%",
            display:"flex",
            alignItems:"center",
            gap:10,
            padding:"12px 8px",
            backgroundColor:isShowAllPressed ? "#f3f4f6" : "transparent",
            color:"#4b5563",
            border:"none",
            borderRadius:12,
            cursor:"default",
            transform:isShowAllPressed ? "scale(0.992)" : "scale(1)",
            transition:"background-color .08s ease, transform .08s ease",
          }}
        >
          <I.Thread/>
          <span style={{ fontSize:16, fontWeight:600 }}>View All</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── Thread list content ──────────────────────────────────────────────────────
function ThreadList({ chanId }: { chanId:string }) {
  const threads = THREADS.filter(t => t.chan === chanId);

  return (
    <>
      {threads.length === 0 && <div style={{ padding:16, textAlign:"center", color:"#87898c", fontSize:13 }}>No active threads</div>}
      {threads.map(t => {
        const parts = t.pids.slice(0,3).map(pid => pid==="me" ? ME : USERS[pid]).filter(Boolean) as User[];
        return (
          <button
            key={t.id}
            style={{ width:"100%", background:"#232428", border:"1px solid #3f4147", cursor:"pointer", borderRadius:8, padding:10, textAlign:"left", marginBottom:8, display:"block", transition:"background .1s" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#dbdee1", marginBottom:6, lineHeight:1.3 }}>{t.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <div style={{ display:"flex", paddingLeft:4 }}>
                {parts.map(u => <div key={u.id} style={{ width:18, height:18, borderRadius:"50%", backgroundColor:u.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:"#fff", marginLeft:-4, border:"2px solid #232428" }}>{u.avatar.slice(0,1)}</div>)}
              </div>
              <span style={{ fontSize:11, color:"#87898c" }}>{t.count} messages</span>
            </div>
            <div style={{ fontSize:11, color:"#87898c" }}>Latest: {t.ago}</div>
          </button>
        );
      })}
      <button style={{ width:"100%", background:"none", border:"1px dashed #3f4147", cursor:"pointer", borderRadius:8, padding:10, textAlign:"center", color:"#87898c", fontSize:13 }}>+ New Thread</button>
    </>
  );
}

function PinnedList({ chanId, msgs }: { chanId:string; msgs: MsgStore }) {
  const pinned = (msgs[chanId] ?? []).filter(msg => msg.pinned);

  if (pinned.length === 0) {
    return <div style={{ padding:16, textAlign:"center", color:"#87898c", fontSize:13 }}>No pinned messages</div>;
  }

  return (
    <>
      {pinned.map(msg => {
        const author = msg.uid === "me" ? ME : USERS[msg.uid];
        if (!author) return null;

        return (
          <div key={msg.id} style={{ backgroundColor:"#232428", border:"1px solid #3f4147", borderRadius:8, padding:12, marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <Av user={author} size={28}/>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{author.display}</div>
                <div style={{ fontSize:11, color:"#87898c" }}>{msg.time}</div>
              </div>
            </div>
            <div style={{ fontSize:13, color:"#dbdee1", whiteSpace:"pre-wrap", lineHeight:1.45 }}>{msg.content}</div>
          </div>
        );
      })}
    </>
  );
}

function ServerIconDropdown({
  mode,
  anchor,
  chanId,
  msgs,
  onClose,
}: {
  mode: Exclude<ServerOverlay, null>;
  anchor: DOMRect;
  chanId: string;
  msgs: MsgStore;
  onClose: () => void;
}) {
  const meta = mode === "threads"
    ? { title:"Threads", subtitle:"Active threads in this channel", icon:<I.Thread/> }
    : { title:"Pinned Messages", subtitle:"Important messages saved in this channel", icon:<I.Pin/> };
  const width = 340;
  const left = Math.min(anchor.right - width, window.innerWidth - width - 12);
  const top = Math.min(anchor.bottom + 8, window.innerHeight - 372);

  return createPortal(
    <div style={{ position:"fixed", left:Math.max(12, left), top:Math.max(56, top), width, maxHeight:360, backgroundColor:"#1e1f22", border:"1px solid #2e2e34", borderRadius:12, boxShadow:"0 18px 48px rgba(0,0,0,.45)", overflow:"hidden", zIndex:9600 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"12px 14px", borderBottom:"1px solid #2e2e34", background:"linear-gradient(180deg, rgba(88,101,242,.14), rgba(88,101,242,0))" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <div style={{ width:32, height:32, borderRadius:10, backgroundColor:"#2b2d31", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {meta.icon}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{meta.title}</div>
            <div style={{ fontSize:11, color:"#949ba4", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{meta.subtitle}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#87898c", display:"flex", padding:4, borderRadius:6, flexShrink:0 }}>
          <I.Close/>
        </button>
      </div>
      <div style={{ padding:10, overflowY:"auto", maxHeight:300 }}>
        {mode === "threads" ? <ThreadList chanId={chanId}/> : <PinnedList chanId={chanId} msgs={msgs}/>}
      </div>
    </div>,
    document.body
  );
}

function ServerMenu({ onClose }: { onClose: ()=>void }) {
  const [hideMuted, setHideMuted] = useState(false);
  type ServerMenuItem = {
    label: string;
    icon?: React.ReactNode;
    control?: "checkbox";
    danger?: boolean;
  };

  const sections: ServerMenuItem[][] = [
    [
      { label:"Server Boost", icon:<I.Star/> },
      { label:"Invite People", icon:<I.Members/> },
      { label:"Server Settings", icon:<I.Settings/> },
      { label:"Create Channel", icon:<I.Plus/> },
      { label:"Create Category", icon:<I.Square/> },
      { label:"Create Event", icon:<I.CalendarP/> },
      { label:"Active Threads", icon:<I.Thread/> },
      { label:"App Directory", icon:<I.Sparkles/> },
    ],
    [
      { label:"Notification Settings", icon:<I.Bell/> },
      { label:"Privacy Settings", icon:<I.Shield/> },
    ],
    [
      { label:"Edit Server Profile", icon:<I.Edit/> },
      { label:"Hide Muted Channels", control:"checkbox" as const },
    ],
    [
      { label:"Leave Server", icon:<I.Logout/>, danger:true },
    ],
  ];

  function MenuButton({
    item,
    checked,
    onPress,
  }: {
    item: ServerMenuItem;
    checked: boolean;
    onPress: () => void;
  }) {
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const textColor = item.danger ? "#d83c3e" : hovered || pressed ? "#111214" : "#2f3136";
    const backgroundColor = pressed ? "#dce2ec" : hovered ? "#eceff5" : "transparent";

    return (
      <button
        data-igg-id={
          item.label === "Edit Server Profile" ? "discord.server.edit-profile" :
          item.label === "Invite People" ? "discord.server.menu.invite" :
          item.label === "Server Settings" ? "discord.server.menu.settings" :
          item.label === "Notification Settings" ? "discord.server.menu.notifications" :
          item.label === "Leave Server" ? "discord.server.menu.leave" :
          undefined
        }
        onClick={onPress}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={{
          width:"100%",
          background:backgroundColor,
          border:"none",
          cursor:"pointer",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          gap:12,
          padding:"12px 16px",
          color:textColor,
          textAlign:"left",
          borderRadius:10,
          transform:pressed ? "scale(0.992)" : "scale(1)",
          transition:"background-color .08s ease, transform .08s ease, color .08s ease",
        }}
      >
        <span style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
          {item.icon ? (
            <span style={{ display:"flex", color:textColor, flexShrink:0 }}>
              {item.icon}
            </span>
          ) : null}
          <span style={{ fontSize:14, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {item.label}
          </span>
        </span>
        {item.control === "checkbox" ? (
          <span style={{ width:18, height:18, borderRadius:5, border:"1.5px solid #b4bac6", backgroundColor:checked ? "#3b82f6" : "#fff", boxShadow:checked ? "inset 0 0 0 4px #fff" : "none", flexShrink:0 }}/>
        ) : null}
      </button>
    );
  }

  return (
    <div style={{ position:"absolute", top:56, left:8, right:8, zIndex:70, backgroundColor:"#f7f8fa", border:"1px solid #d9dce3", borderRadius:14, boxShadow:"0 16px 36px rgba(0,0,0,.22)", padding:"10px 0" }}>
      <div style={{ position:"absolute", top:-8, right:18, width:14, height:14, backgroundColor:"#f7f8fa", borderLeft:"1px solid #d9dce3", borderTop:"1px solid #d9dce3", transform:"rotate(45deg)" }}/>
      {sections.map((group, groupIndex) => (
        <div key={groupIndex}>
          {group.map(item => (
            <MenuButton
              key={item.label}
              item={item}
              checked={hideMuted}
              onPress={() => {
                if (item.control === "checkbox") {
                  setHideMuted(v => !v);
                  return;
                }
                onClose();
              }}
            />
          ))}
          {groupIndex < sections.length - 1 && <div style={{ height:1, backgroundColor:"#e3e5e8", margin:"8px 16px" }}/>}
        </div>
      ))}
    </div>
  );
}

// ─── Message row ──────────────────────────────────────────────────────────────
function MsgRow({ msg, hovered, onHover, onReact, iggId }: {
  msg:Msg; hovered:boolean;
  onHover:(id:number|null)=>void;
  onReact:(msgId:number, emoji:string)=>void;
  iggId?:string;
}) {
  const [pickerAnchor, setPickerAnchor] = useState<DOMRect|null>(null);
  const author = msg.uid === "me" ? ME : USERS[msg.uid];
  const replyUser = msg.replyTo ? (msg.replyTo.uid === "me" ? ME : USERS[msg.replyTo.uid]) : null;
  const linkedThread = msg.thread ? THREADS.find(thread => thread.title === msg.thread?.title) : null;
  const linkedThreadMsgs = linkedThread ? (THREAD_MSGS[linkedThread.id] ?? []) : [];
  const latestThreadMsg = linkedThreadMsgs.at(-1);
  const latestThreadUser = latestThreadMsg ? (latestThreadMsg.uid === "me" ? ME : USERS[latestThreadMsg.uid]) : null;
  if (!author) return null;

  function openPicker(e: React.MouseEvent) {
    e.stopPropagation();
    setPickerAnchor(e.currentTarget.getBoundingClientRect());
  }

  return (
    <div
      onMouseEnter={() => onHover(msg.id)}
      onMouseLeave={() => onHover(null)}
      style={{ position:"relative", padding:"4px 16px", backgroundColor: hovered ? "#2e3035" : "transparent" }}
    >
      {/* Reply bar */}
      {msg.replyTo && replyUser && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2, paddingLeft:20, fontSize:12, color:"#949ba4" }}>
          <div style={{ width:32, height:8, borderTop:"2px solid #4e5058", borderLeft:"2px solid #4e5058", borderRadius:"4px 0 0 0", marginRight:4 }}/>
          <div style={{ width:16, height:16, borderRadius:"50%", backgroundColor:replyUser.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, fontWeight:700, color:"#fff" }}>{replyUser.avatar.slice(0,1)}</div>
          <span style={{ color:"#c9cdfb", fontWeight:600 }}>{replyUser.display}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:280 }}>{msg.replyTo.snippet}</span>
        </div>
      )}

      <div data-igg-id={iggId} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <Av user={author} size={40}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:2 }}>
            <span style={{ fontSize:15, fontWeight:600, color: msg.uid==="me" ? "#57F287" : "#f2f3f5" }}>{author.display}</span>
            <span style={{ fontSize:11, color:"#87898c" }}>{msg.time}</span>
            {msg.pinned && <span style={{ fontSize:10, color:"#faa61a", background:"#faa61a22", padding:"0 4px", borderRadius:3 }}>📌 Pinned</span>}
          </div>
          <div style={{ fontSize:14, color:"#dbdee1", lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
            {msg.content}
            {msg.edited && <span style={{ fontSize:10, color:"#87898c", marginLeft:4 }}>(edited)</span>}
          </div>

          {/* Reactions */}
          {(msg.reactions ?? []).length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>
              {msg.reactions!.map((r,i) => (
                <button key={i} onClick={() => onReact(msg.id, r.emoji)} style={{ display:"flex", alignItems:"center", gap:4, backgroundColor: r.mine ? "#1e3a5f" : "#2e3035", border: r.mine ? "1px solid #3b82f6" : "1px solid #3f4147", borderRadius:6, padding:"2px 8px", cursor:"pointer", fontSize:14, lineHeight:1.4 }}>
                  <span>{r.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:600, color: r.mine ? "#a8b4ff" : "#b5bac1" }}>{r.count}</span>
                </button>
              ))}
              <button onClick={openPicker} style={{ display:"flex", alignItems:"center", backgroundColor:"#2e3035", border:"1px solid #3f4147", borderRadius:6, padding:"2px 8px", cursor:"pointer", color:"#87898c", fontSize:16, lineHeight:1 }}>＋</button>
            </div>
          )}

        </div>
      </div>

      {/* Thread preview */}
      {msg.thread && (
        <div style={{ display:"flex", gap:10, marginTop:10, alignItems:"stretch", paddingLeft:52 }}>
          <div style={{ width:28, flexShrink:0, display:"flex", justifyContent:"center" }}>
            <div style={{ width:18, borderLeft:"3px solid #4e5058", borderBottom:"3px solid #4e5058", borderBottomLeftRadius:16, marginTop:-2 }} />
          </div>
          <button
            data-igg-id={iggId ? `${iggId}.thread` : undefined}
            onClick={e=>e.stopPropagation()}
            style={{ flex:1, minWidth:0, backgroundColor:"#23262a", border:"1px solid #3a3d44", cursor:"pointer", borderRadius:10, padding:"10px 14px", textAlign:"left" }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#f2f3f5", lineHeight:1.3 }}>{msg.thread.title}</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#00a8fc" }}>{msg.thread.count} messages ›</span>
            </div>
            {latestThreadMsg && latestThreadUser ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                <Av user={latestThreadUser} size={22}/>
                <span style={{ fontSize:12, color:"#b5bac1", whiteSpace:"nowrap" }}>{latestThreadUser.display}</span>
                <span style={{ fontSize:12, color:"#00a8fc", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{latestThreadMsg.content}</span>
                <span style={{ fontSize:12, color:"#87898c", flexShrink:0 }}>{latestThreadMsg.time}</span>
              </div>
            ) : (
              <div style={{ fontSize:12, color:"#87898c" }}>This is a thread attached to this message.</div>
            )}
          </button>
        </div>
      )}

      {/* Hover action toolbar */}
      {hovered && (
        <div style={{ position:"absolute", top:-20, right:16, backgroundColor:"#111214", border:"1px solid #2e2e34", borderRadius:6, display:"flex", gap:1, padding:"4px 5px", zIndex:20, boxShadow:"0 4px 16px rgba(0,0,0,.6)" }}>
          <Tip label="Add Reaction" side="top">
            <button
              data-igg-id={iggId === "discord.message.alice.encouragement" ? "discord.message.alice.encouragement.react" : undefined}
              onClick={openPicker}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:"4px 5px", borderRadius:3 }}
            >
              <I.React/>
            </button>
          </Tip>
          {[
            { ico:<I.Reply/>, t:"Reply" },
            { ico:<I.Star/>,  t:"Bookmark" },
            { ico:<I.Edit/>,  t:"Edit" },
            { ico:<I.Dot3/>,  t:"More" },
          ].map((b,i) => (
            <Tip key={i} label={b.t} side="top">
              <button
                data-igg-id={iggId === "discord.channel.research.minji-message" && b.t === "Reply" ? "discord.channel.research.minji-message.reply" : undefined}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:"4px 5px", borderRadius:3 }}
              >
                {b.ico}
              </button>
            </Tip>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {pickerAnchor && <EmojiPicker anchor={pickerAnchor} onPick={e => onReact(msg.id, e)} onClose={() => setPickerAnchor(null)}/>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DiscordPage() {
  const [myStatus,      setMyStatus]      = useState<Status>("online");
  const [muted,         setMuted]         = useState(false);
  const [deafened,      setDeafened]      = useState(false);
  const [view,          setView]          = useState<View>("dm");
  const [activeSid,     setActiveSid]     = useState("s1");
  const [activeDMId,    setActiveDMId]    = useState("");
  const [activeChanId,  setActiveChanId]  = useState("ch-general");
  const [msgs,          setMsgs]          = useState<MsgStore>({ ...INIT_MSGS });
  const [draft,         setDraft]         = useState("");
  const [hoveredMsg,    setHoveredMsg]    = useState<number|null>(null);
  const [myProfileAnchor, setMyProfileAnchor] = useState<DOMRect|null>(null);
  const [statusAnchor,  setStatusAnchor]  = useState<DOMRect|null>(null);
  const [profileUser,   setProfileUser]   = useState<string|null>(null);
  const [serverOverlay, setServerOverlay] = useState<ServerOverlay>(null);
  const [serverOverlayAnchor, setServerOverlayAnchor] = useState<DOMRect|null>(null);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showMembers,   setShowMembers]   = useState(false);
  const [hoveredChannelThread, setHoveredChannelThread] = useState<{ chanId: string; rect: DOMRect } | null>(null);
  const [hoveredChanId, setHoveredChanId] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [folderOpen,    setFolderOpen]    = useState(false);
  const [search,        setSearch]        = useState("");
  const [sceneStateId,  setSceneStateId]  = useState<string | null>(null);
  const [memberListWidth, setMemberListWidth] = useState(240);
  const [uploadDemo,    setUploadDemo]    = useState<{ phase: UploadDemoPhase; progress: number }>({ phase:"idle", progress:0 });
  const [inboxToast,    setInboxToast]    = useState<InboxToast>(null);
  const [promoSlide,    setPromoSlide]    = useState(0);
  const [promoTimerKey, setPromoTimerKey] = useState(0);
  const [unreadState,   setUnreadState]   = useState<Record<string,{unread:boolean;mention?:number}>>(() =>
    Object.fromEntries(CHANS.map(c => [c.id, { unread: !!c.unread, mention: c.mention }]))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const channelButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hoveredThreadCloseTimerRef = useRef<number | null>(null);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    messageList.scrollTo({ top: messageList.scrollHeight, behavior });
  }, []);

  const clearHoveredThreadCloseTimer = () => {
    if (hoveredThreadCloseTimerRef.current !== null) {
      window.clearTimeout(hoveredThreadCloseTimerRef.current);
      hoveredThreadCloseTimerRef.current = null;
    }
  };

  const scheduleHoveredThreadClose = () => {
    clearHoveredThreadCloseTimer();
    hoveredThreadCloseTimerRef.current = window.setTimeout(() => {
      setHoveredChannelThread(null);
      hoveredThreadCloseTimerRef.current = null;
    }, 140);
  };

  useEffect(() => {
    const _sp = new URLSearchParams(window.location.search);
    const stateId = _sp.get("stateId") ?? _sp.get("stateid");
    setSceneStateId(stateId);
    if (stateId === "2") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-general");
      setShowMembers(true);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setActiveDMId("");
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    if (stateId === "3") {
      setView("dm");
      setActiveDMId("dm-alice");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    if (stateId === "4") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-research");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setActiveDMId("");
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      window.requestAnimationFrame(() => {
        channelButtonRefs.current["ch-research"]?.scrollIntoView({ block:"center" });
      });
      return;
    }

    if (stateId === "5") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-general");
      setShowMembers(false);
      setCollapsedCats(new Set(["c-info", "c-dev"]));
      setMyProfileAnchor(null);
      setActiveDMId("");
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    if (stateId === "6") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-general");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setActiveDMId("");
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      setMyProfileAnchor(new DOMRect(84, window.innerHeight - 60, 0, 0));
      window.requestAnimationFrame(() => {
        channelButtonRefs.current["ch-vc1"]?.scrollIntoView({ block:"end" });
      });
      return;
    }

    if (stateId === "7") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-research");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setActiveDMId("");
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(true);
      window.requestAnimationFrame(() => {
        channelButtonRefs.current["ch-research"]?.scrollIntoView({ block:"center" });
      });
      return;
    }

    if (stateId === "8") {
      setView("dm");
      setActiveDMId("dm-jisu");
      setDraft("");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    if (stateId === "9") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-general");
      setActiveDMId("");
      setDraft("");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    if (stateId === "10") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-rules");
      setShowMembers(true);
      setMemberListWidth(80);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setActiveDMId("");
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    if (stateId === "11") {
      setView("dm");
      setActiveDMId("");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      setPromoSlide(0);
      setPromoTimerKey(k => k + 1);
      return;
    }

    if (stateId === "12") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-general");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setActiveDMId("");
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      setPromoSlide(0);
      setPromoTimerKey(k => k + 1);
      return;
    }

    if (stateId === "13") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-general");
      setActiveDMId("");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    if (stateId === "14") {
      setView("server");
      setActiveSid("s1");
      setActiveChanId("ch-general");
      setActiveDMId("");
      setShowMembers(false);
      setCollapsedCats(new Set());
      setMyProfileAnchor(null);
      setProfileUser(null);
      setServerOverlay(null);
      setServerOverlayAnchor(null);
      setShowServerMenu(false);
      return;
    }

    setView("dm");
    setActiveDMId("");
    setShowMembers(false);
    setCollapsedCats(new Set());
    setMyProfileAnchor(null);
    setProfileUser(null);
    setServerOverlay(null);
    setServerOverlayAnchor(null);
    setShowServerMenu(false);
  }, []);

  useEffect(() => () => {
    clearHoveredThreadCloseTimer();
  }, []);

  useEffect(() => {
    installReviewCapture();
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== "igg-review-action") return;
      try {
        const result = await executeReviewAction(event.data.action ?? {});
        const runtimeState =
          (window as Window & { __DISCORD_BENCHMARK_STATE__?: Record<string, unknown> }).__DISCORD_BENCHMARK_STATE__ ?? null;
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
    (window as Window & { __DISCORD_BENCHMARK_STATE__?: Record<string, unknown> }).__DISCORD_BENCHMARK_STATE__ = {
      page: "discord",
      stateId: sceneStateId,
      view,
      activeServerId: activeSid,
      activeDMId,
      activeChannelId: activeChanId,
      showMembers,
      serverOverlay,
      showServerMenu,
      folderOpen,
      uploadDemoPhase: uploadDemo.phase,
      inboxToastFrom: inboxToast?.from ?? null,
    };
  }, [activeChanId, activeDMId, activeSid, folderOpen, inboxToast, sceneStateId, serverOverlay, showMembers, showServerMenu, uploadDemo.phase, view]);

  useEffect(() => {
    if (!(sceneStateId === "8" && view === "dm" && activeDMId === "dm-jisu")) {
      setUploadDemo({ phase:"idle", progress:0 });
      return;
    }

    const startedAt = Date.now();
    setUploadDemo({ phase:"uploading", progress:0 });

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, Math.round((elapsed / 5000) * 100));

      if (elapsed >= 5000) {
        setUploadDemo({ phase:"ready", progress:100 });
        window.clearInterval(intervalId);
        return;
      }

      setUploadDemo({ phase:"uploading", progress });
    }, 120);

    return () => window.clearInterval(intervalId);
  }, [sceneStateId, view, activeDMId]);

  useEffect(() => {
    setInboxToast(null);
    const toastCfg: Record<string, { from: string; message: string }> = {
      "9":  { from:"yuna", message:"see you later" },
      "13": { from:"kai",  message:"can you review this PR real quick?" },
      "14": { from:"mia",  message:"just dropped the new research notes 📖" },
    };
    const cfg = toastCfg[sceneStateId ?? ""];
    if (!cfg || view !== "server") return;

    const showTimer = window.setTimeout(() => {
      setInboxToast(cfg);
    }, 3000);

    const hideTimer = window.setTimeout(() => {
      setInboxToast(null);
    }, 8000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [sceneStateId, view]);

  useEffect(() => {
    if (sceneStateId !== "11" && sceneStateId !== "12") return;
    const timer = window.setInterval(() => {
      setPromoSlide(s => (s + 1) % 5);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [sceneStateId, promoTimerKey]);

  function setPromoSlideManually(next: number | ((current: number) => number)) {
    setPromoSlide(next);
    setPromoTimerKey(k => k + 1);
  }

  const me: User = { ...ME, status: myStatus };
  const key = view === "dm" ? activeDMId : activeChanId;
  const curMsgs = msgs[key] ?? [];
  const curChan = CHANS.find(c => c.id === activeChanId);
  const curDM   = DMS.find(d => d.id === activeDMId);
  const curDMUser = curDM && !curDM.group && curDM.uid ? USERS[curDM.uid] : null;
  const showState9UploadCard = sceneStateId === "8" && view === "dm" && activeDMId === "dm-jisu" && uploadDemo.phase !== "sent";
  const inboxToastUser = inboxToast ? USERS[inboxToast.from] : null;

  const soloServers   = SERVERS.filter(s => !s.folder);
  const folderServers = SERVERS.filter(s => s.folder);
  const folderSummary = `${folderServers.slice(0, 3).map(s => s.label).join(", ")}...`;

  const filteredDMs = DMS.filter(d => {
    const n = d.group ? (d.gname ?? "") : (d.uid ? USERS[d.uid]?.display ?? "" : "");
    return n.toLowerCase().includes(search.toLowerCase());
  });

  function send() {
    const text = draft.trim(); if (!text) return;
    const m: Msg = { id: Date.now(), uid:"me", time: new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}), content:text };
    setMsgs(p => ({ ...p, [key]: [...(p[key]??[]), m] }));
    setDraft("");
    setTimeout(() => scrollMessagesToBottom("smooth"), 0);
  }

  function sendUploadDemo() {
    if (uploadDemo.phase !== "ready" || activeDMId !== "dm-jisu") return;
    const fileMsg: Msg = {
      id: Date.now(),
      uid:"me",
      time: new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}),
      content:"mock-benchmark_review-v3.pptx",
    };
    setMsgs(p => ({ ...p, "dm-jisu": [...(p["dm-jisu"] ?? []), fileMsg] }));
    setUploadDemo({ phase:"sent", progress:100 });
    setTimeout(() => scrollMessagesToBottom("smooth"), 0);
  }

  function react(msgId: number, emoji: string) {
    setMsgs(p => {
      const list = p[key] ?? [];
      return {
        ...p,
        [key]: list.map(m => {
          if (m.id !== msgId) return m;
          const rs = m.reactions ? [...m.reactions] : [];
          const idx = rs.findIndex(r => r.emoji === emoji);
          if (idx === -1) return { ...m, reactions:[...rs,{emoji,count:1,mine:true}] };
          const r = rs[idx];
          if (r.mine) {
            const next = {...r, count:r.count-1, mine:false};
            return { ...m, reactions: next.count===0 ? rs.filter((_,i)=>i!==idx) : rs.map((x,i)=>i===idx?next:x) };
          }
          return { ...m, reactions: rs.map((x,i)=>i===idx?{...x,count:x.count+1,mine:true}:x) };
        }),
      };
    });
  }

  function toggleCat(id:string) {
    setCollapsedCats(p => {
      const s = new Set(p);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function toggleServerOverlay(next: Exclude<ServerOverlay, null>, rect: DOMRect) {
    setServerOverlay(current => current === next ? null : next);
    setServerOverlayAnchor(serverOverlay === next ? null : rect);
    setShowMembers(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      scrollMessagesToBottom("auto");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, scrollMessagesToBottom]);

  const serverMembers = [me, ...Object.values(USERS)];

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", fontFamily:"'gg sans','Noto Sans',system-ui,sans-serif" }}>

      {/* ── Server Rail ─────────────────────────────────────────────────────── */}
      <div data-igg-id="discord.server.list" style={{ width:72, backgroundColor:"#1e1f22", display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 0 8px", gap:4, flexShrink:0, overflowY:"auto" }}>
        <Tip label="Direct Messages" side="right">
          <button onClick={()=>setView("dm")} style={{ width:48, height:48, borderRadius:view==="dm"?16:24, backgroundColor:view==="dm"?"#3b82f6":"#36393f", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", transition:"border-radius .15s,background .15s" }}>
            <I.Discord/>
          </button>
        </Tip>
        <div style={{ width:32, height:2, backgroundColor:"#3f4147", margin:"4px 0" }}/>

        {/* Solo servers */}
        {soloServers.map(s => {
          const active = view==="server" && activeSid===s.id;
          return (
            <Tip key={s.id} label={s.label} side="right">
              <div style={{ position:"relative" }}>
                {active && <div style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)", width:4, height:36, backgroundColor:"#fff", borderRadius:"0 4px 4px 0" }}/>}
                <button data-igg-id={s.id==="s8" ? "discord.server.creator-dock" : s.id === "s1" ? "discord.server.project-moshiki" : undefined} onClick={()=>{setView("server");setActiveSid(s.id);setServerOverlay(null);setServerOverlayAnchor(null);setShowServerMenu(false);}} style={{ width:48, height:48, borderRadius:active?16:24, backgroundColor:s.image?"transparent":s.bg, border:"none", boxShadow:active?"0 0 0 2.5px #3b82f6":"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, overflow:"hidden", transition:"border-radius .15s" }}>
                  <ServerGlyph server={s} size={48} rounded={active?16:24}/>
                </button>
              </div>
            </Tip>
          );
        })}

        {/* Folder */}
        <div style={{ position:"relative" }}>
          {!folderOpen && view==="server" && folderServers.some(s=>s.id===activeSid) && (
            <div style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)", width:4, height:36, backgroundColor:"#fff", borderRadius:"0 4px 4px 0" }}/>
          )}
          <Tip label={folderOpen?"Close Folder":folderSummary} side="right">
            <button data-igg-id="discord.server.folder" onClick={()=>setFolderOpen(o=>!o)} style={{ width:48, height:48, borderRadius:folderOpen?10:24, backgroundColor:folderOpen?"#5b2a8c":"#5b2a8c88", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, transition:"border-radius .2s,background .2s", padding:4, overflow:"hidden" }}>
              {folderOpen
                ? <span style={{ fontSize:18 }}>📂</span>
                : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2 }}>
                    {folderServers.slice(0,4).map(s => (
                      <div key={s.id} style={{ width:18, height:18, borderRadius:4, overflow:"hidden", backgroundColor:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:s.fg }}>
                        {s.image
                          ? <img src={s.image} alt={s.label} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                          : s.text
                        }
                      </div>
                    ))}
                  </div>
              }
            </button>
          </Tip>

          {/* Expanded servers in folder */}
          {folderOpen && (
            <div style={{ marginTop:4, display:"flex", flexDirection:"column", alignItems:"center", gap:3, backgroundColor:"#5b2a8c33", borderRadius:10, padding:"4px 0" }}>
              {folderServers.map(s => {
                const active = view==="server" && activeSid===s.id;
                return (
                  <Tip key={s.id} label={s.label} side="right">
                    <div style={{ position:"relative" }}>
                      {active && <div style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)", width:4, height:36, backgroundColor:"#fff", borderRadius:"0 4px 4px 0" }}/>}
                      <button data-igg-id={s.id === "f11" ? "discord.server.game-night" : undefined} onClick={()=>{setView("server");setActiveSid(s.id);setServerOverlay(null);setServerOverlayAnchor(null);setShowServerMenu(false);}} style={{ width:48, height:48, borderRadius:active?16:24, backgroundColor:s.image?"transparent":s.bg, border:"none", boxShadow:active?"0 0 0 2.5px #3b82f6":"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, overflow:"hidden", transition:"border-radius .15s" }}>
                        <ServerGlyph server={s} size={48} rounded={active?16:24}/>
                      </button>
                    </div>
                  </Tip>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ height:1 }}/>
        <Tip label="Add a Server" side="right">
          <button style={{ width:48, height:48, borderRadius:24, backgroundColor:"#2b2d31", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#23a55a", marginTop:2 }}>
            <I.Plus/>
          </button>
        </Tip>
        <Tip label="Explore Public Servers" side="right">
          <button data-igg-id="discord.server.explore" style={{ width:48, height:48, borderRadius:24, backgroundColor:"#2b2d31", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🧭</button>
        </Tip>
      </div>

      {/* ── Left Sidebar ────────────────────────────────────────────────────── */}
      <div style={{ width:240, backgroundColor:"#2b2d31", display:"flex", flexDirection:"column", flexShrink:0, position:"relative" }}>

        {view === "dm" ? (
          <>
            {/* Search */}
            <div style={{ padding:"10px 10px 4px" }}>
              <div style={{ backgroundColor:"#1e1f22", borderRadius:4, display:"flex", alignItems:"center", padding:"0 8px", gap:6, height:28 }}>
                <span style={{ color:"#87898c", display:"flex", flexShrink:0 }}><I.Search/></span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find or start a conversation" style={{ flex:1, minWidth:0, background:"transparent", border:"none", outline:"none", color:"#dbdee1", fontSize:12 }}/>
              </div>
            </div>

            {/* Nav items */}
            <div style={{ padding:"6px 0" }}>
              {[{label:"Friends",icon:"👥"},{label:"Nitro",icon:"✨",badge:"Sale"},{label:"Shop",icon:"🛍️"},{label:"Quests",icon:"⚔️"}].map(item=>(
                <button key={item.label} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, padding:"5px 10px", borderRadius:4, color:"#b5bac1", fontSize:14, fontWeight:500, textAlign:"left" }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge && <span style={{ backgroundColor:"#f0b232", color:"#000", fontSize:9, fontWeight:800, borderRadius:3, padding:"1px 5px" }}>{item.badge}</span>}
                </button>
              ))}
            </div>

            {/* DM header */}
            <div style={{ padding:"4px 10px 4px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#949ba4", textTransform:"uppercase", letterSpacing:".6px" }}>Direct Messages</span>
              <Tip label="New DM" side="top">
                <button style={{ background:"none", border:"none", cursor:"pointer", color:"#949ba4", display:"flex" }}><I.Plus/></button>
              </Tip>
            </div>

            {/* DM list */}
            <div data-igg-id="discord.dm.list" style={{ flex:1, overflowY:"auto", padding:"0 6px 6px" }}>
              {filteredDMs.map(dm => {
                const u   = dm.group || !dm.uid ? null : USERS[dm.uid];
                const n   = dm.group ? (dm.gname ?? "Group") : (u?.display ?? "Unknown");
                const act = activeDMId === dm.id;
                return (
                  <button
                    key={dm.id}
                    data-igg-id={
                      dm.uid ? {
                        alice: "discord.dm.alice",
                        kai: "discord.dm.kai",
                        jisu: "discord.dm.jisu",
                        yuna: "discord.dm.yuna",
                        david: "discord.dm.david",
                        wonjun: "discord.dm.wonjun",
                        eunha: "discord.dm.eunha",
                        lucas: "discord.dm.lucas",
                      }[dm.uid] : undefined
                    }
                    onClick={()=>setActiveDMId(dm.id)}
                    style={{ width:"100%", background:act?"#35373c":"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, padding:"5px 8px", borderRadius:4, textAlign:"left", marginBottom:1 }}
                  >
                    <div style={{ position:"relative", flexShrink:0 }}>
                      {dm.group
                        ? <div style={{ width:32, height:32, borderRadius:"50%", backgroundColor:"#36393f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>👥</div>
                        : u ? <Av user={u} size={32} dot={true} dotBg="#2b2d31"/> : null
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:act?"#fff":"#b5bac1", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n}</div>
                      {dm.group && <div style={{ fontSize:11, color:"#87898c" }}>{dm.gmembers?.length} Members</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Server header */}
            <div style={{ height:48, borderBottom:"1px solid #1e1f22", display:"flex", alignItems:"center", padding:"0 12px", flexShrink:0 }}>
              <button data-igg-id="discord.server.project-moshiki.header" onClick={()=>setShowServerMenu(v=>!v)} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"6px 4px", borderRadius:8, textAlign:"left" }}>
                <span style={{ fontSize:15, fontWeight:700, color:"#fff", flex:1, minWidth:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{SERVERS.find(s=>s.id===activeSid)?.label}</span>
                <span style={{ color:"#b5bac1", display:"flex", transform:showServerMenu ? "rotate(180deg)" : "rotate(0deg)", transition:"transform .15s ease" }}>
                  <I.ChevD/>
                </span>
              </button>
            </div>
            {showServerMenu && <ServerMenu onClose={()=>setShowServerMenu(false)}/>}

            {/* Channels */}
            <div data-igg-id="discord.channel.list" style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
              {CATS.map(cat => {
                const collapsed = collapsedCats.has(cat.id);
                const catChans  = CHANS.filter(c => c.cat === cat.id);
                return (
                  <div key={cat.id} style={{ marginBottom:4 }}>
                    <button data-igg-id={{"c-dev":"discord.category.development","c-general":"discord.category.general","c-social":"discord.category.community"}[cat.id]} onClick={()=>toggleCat(cat.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:4, padding:"4px 6px 4px 8px", background:"none", border:"none", cursor:"pointer", color:"#949ba4" }}>
                      <span style={{ display:"flex", transform:collapsed?"rotate(-90deg)":"rotate(0)", transition:"transform .15s" }}><I.ChevD/></span>
                      <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".6px", flex:1, textAlign:"left" }}>{cat.name}</span>
                      <span style={{ display:"flex" }}><I.Plus/></span>
                    </button>
                    {!collapsed && catChans.map(ch => {
                      const act = activeChanId === ch.id;
                      const hover = hoveredChanId === ch.id;
                      const vu  = VOICE_USERS[ch.id] ?? [];
                      return (
                        <div
                          key={ch.id}
                          onMouseEnter={() => {
                            clearHoveredThreadCloseTimer();
                            setHoveredChanId(ch.id);
                          }}
                          onMouseLeave={() => {
                            setHoveredChanId(current => current === ch.id ? null : current);
                            scheduleHoveredThreadClose();
                          }}
                        >
                          <button
                            ref={(node) => {
                              channelButtonRefs.current[ch.id] = node;
                            }}
                            data-igg-id={{"ch-code":"discord.channel.code-review","ch-general":"discord.channel.general","ch-roles":"discord.channel.roles","ch-research":"discord.channel.research","ch-photo":"discord.channel.photos","ch-annc":"discord.channel.announcements","ch-random":"discord.channel.random"}[ch.id]}
                            onMouseEnter={e => {
                              clearHoveredThreadCloseTimer();
                              const latestThread = getLatestThreadForChannel(ch.id);
                              if (!latestThread) {
                                setHoveredChannelThread(null);
                                return;
                              }
                              setHoveredChannelThread({ chanId: ch.id, rect: e.currentTarget.getBoundingClientRect() });
                            }}
                            onClick={()=>{setActiveChanId(ch.id);setServerOverlay(null);setServerOverlayAnchor(null);setShowServerMenu(false);setUnreadState(p=>({...p,[ch.id]:{unread:false,mention:undefined}}));setHoveredChannelThread(null);}}
                            style={{ width:"100%", display:"flex", alignItems:"center", gap:6, padding:"5px 8px 5px 12px", background:act?"#35373c":hover?"#34363b":"none", border:"none", outline:"none", boxShadow:"none", cursor:"pointer", borderRadius:4, marginBottom:1, textAlign:"left", transform:hover&&!act?"translateX(1px)":"translateX(0)", transition:"background .12s ease, transform .12s ease", WebkitTapHighlightColor:"transparent" }}
                          >
                            <span style={{ color:"#80848e", display:"flex", flexShrink:0 }}><ChanIcon type={ch.type}/></span>
                            <span style={{ fontSize:14, color:act?"#fff":hover?"#dbdee1":unreadState[ch.id]?.unread?"#dbdee1":"#8e9297", fontWeight:ch.id==="ch-research" && unreadState[ch.id]?.unread ? 600 : 400, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", transition:"color .12s ease" }}>{ch.name}</span>
                          </button>
                          {vu.length > 0 && vu.map(uid => {
                            const u2 = USERS[uid]; if (!u2) return null;
                            return (
                              <div key={uid} style={{ display:"flex", alignItems:"center", gap:8, padding:"2px 8px 2px 28px", minWidth:0 }}>
                                <Av user={u2} size={20}/>
                                <span style={{ fontSize:12, color:"#87898c", minWidth:0, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u2.display}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Bottom user panel (always visible) ── */}
        <div style={{ height:52, backgroundColor:"#232428", display:"flex", alignItems:"center", padding:"0 6px", gap:2, flexShrink:0, borderTop:"1px solid #1e1f22" }}>
          {/* Avatar + name */}
          <button
            data-igg-id="discord.profile.jordan"
            onMouseDown={e=>{
              e.stopPropagation();
              const nextAnchor = e.currentTarget.getBoundingClientRect();
              setMyProfileAnchor(current => current ? null : nextAnchor);
            }}
            style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", padding:"4px 6px", borderRadius:4, flex:1, minWidth:0, textAlign:"left" }}
          >
            <div style={{ position:"relative", flexShrink:0 }}>
              <Av user={me} size={32}/>
              {/* Status dot — separate click area */}
              <div
                data-igg-id="discord.profile.jordan.status-dot"
                onMouseDown={e=>{e.stopPropagation();setStatusAnchor(e.currentTarget.getBoundingClientRect());}}
                style={{ position:"absolute", bottom:-1, right:-1, width:13, height:13, borderRadius:"50%", backgroundColor:STATUS_CFG[myStatus].color, border:"2.5px solid #232428", cursor:"pointer", zIndex:1 }}
              />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{me.display}</div>
              <div style={{ fontSize:11, color:"#b5bac1" }}>{STATUS_CFG[myStatus].label}</div>
            </div>
          </button>

          {/* Controls */}
          <Tip label={muted?"Unmute":"Mute"} side="top">
            <button onClick={()=>setMuted(m=>!m)} style={{ background:"none", border:"none", cursor:"pointer", color:muted?"#f23f43":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}>
              {muted ? <I.MicOff/> : <I.Mic/>}
            </button>
          </Tip>
          <Tip label={deafened?"Undeafen":"Deafen"} side="top">
            <button onClick={()=>setDeafened(d=>!d)} style={{ background:"none", border:"none", cursor:"pointer", color:deafened?"#f23f43":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}>
              {deafened ? <span style={{ display:"flex", position:"relative" }}><I.Headset/><div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}><div style={{ width:"130%", height:2, backgroundColor:"#f23f43", transform:"rotate(-45deg)" }}/></div></span> : <I.Headset/>}
            </button>
          </Tip>
          <Tip label="User Settings" side="top">
            <button style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:5, borderRadius:4 }}><I.Settings/></button>
          </Tip>
        </div>
      </div>

      {/* ── Chat area ────────────────────────────────────────────────────────  */}
      {view === "dm" && !activeDMId ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", backgroundColor:"#313338", minWidth:0, alignItems:"center", justifyContent:"center" }}>
          <div style={{ textAlign:"center", color:"#87898c" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>💬</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#dbdee1", marginBottom:8 }}>No conversations open</div>
            <div style={{ fontSize:14 }}>Open a conversation from the list on the left.</div>
          </div>
        </div>
      ) : (
      <div style={{ flex:1, display:"flex", flexDirection:"column", backgroundColor:"#313338", minWidth:0, position:"relative" }}>

        {/* Top bar */}
        <div style={{ height:48, borderBottom:"1px solid #1e1f22", display:"flex", alignItems:"center", padding:"0 16px", gap:8, flexShrink:0 }}>
          {view === "server" ? (
            <>
              <span style={{ color:"#80848e", display:"flex" }}><ChanIcon type={curChan?.type??"text"}/></span>
              <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{curChan?.name}</span>
              {curChan?.topic && <><div style={{ width:1, height:20, backgroundColor:"#3f4147" }}/><span style={{ fontSize:13, color:"#87898c", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180 }}>{curChan.topic}</span></>}
            </>
          ) : (
            <>
              {curDMUser
                ? <Av user={curDMUser} size={24} dot={true} dotBg="#313338"/>
                : <div style={{ width:24, height:24, borderRadius:"50%", backgroundColor:"#36393f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>👥</div>
              }
              <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{curDMUser?.display ?? curDM?.gname}</span>
            </>
          )}
          <div style={{ flex:1 }}/>
          {view==="dm" && [{ ico:<I.Phone/>, t:"Call" },{ ico:<I.Video/>, t:"Video" }].map((b,i)=>(
            <Tip key={i} label={b.t} side="bottom"><button style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:5, borderRadius:4 }}>{b.ico}</button></Tip>
          ))}
          {view==="server" && <>
            <Tip label="Threads" side="bottom"><button onClick={e=>toggleServerOverlay("threads", e.currentTarget.getBoundingClientRect())} style={{ background:serverOverlay==="threads"?"#35373c":"none", border:"none", cursor:"pointer", color:serverOverlay==="threads"?"#fff":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}><I.Thread/></button></Tip>
            <Tip label={showMembers ? "Hide Member List" : "Show Member List"} side="bottom"><button data-igg-id="discord.toggle.member-list" onClick={()=>{setShowMembers(m=>!m);setProfileUser(null);setServerOverlay(null);setServerOverlayAnchor(null);}} style={{ background:showMembers?"#35373c":"none", border:"none", cursor:"pointer", color:showMembers?"#fff":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}><I.Members/></button></Tip>
          </>}
          {(view==="server"
            ? [{ ico:<I.Pin/>, t:"Pinned Messages", onClick:(e: React.MouseEvent<HTMLButtonElement>)=>toggleServerOverlay("pins", e.currentTarget.getBoundingClientRect()), active:serverOverlay==="pins" }]
            : [{ ico:<I.Pin/>, t:"Pinned Messages", onClick:undefined, active:false }]
          ).map((b,i)=>(
            <Tip key={`${b.t}-${i}`} label={b.t} side="bottom"><button onClick={b.onClick} style={{ background:b.active?"#35373c":"none", border:"none", cursor:"pointer", color:b.active?"#fff":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}>{b.ico}</button></Tip>
          ))}
          {[{ ico:<I.Inbox/>, t:"Inbox" },{ ico:<I.Help/>, t:"Help" }].map((b,i)=>(
            <Tip key={i} label={b.t} side="bottom"><button data-igg-id={b.t === "Inbox" ? "discord.inbox" : b.t === "Help" ? "discord.topbar.help" : undefined} style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:5, borderRadius:4 }}>{b.ico}</button></Tip>
          ))}
          <div data-igg-id="discord.topbar.search" style={{ backgroundColor:"#1e1f22", borderRadius:4, display:"flex", alignItems:"center", padding:"0 8px", gap:4, height:24, width:130 }}>
            <input placeholder="Search" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#dbdee1", fontSize:12, minWidth:0 }}/>
            <span style={{ color:"#87898c", display:"flex", flexShrink:0 }}><I.Search/></span>
          </div>
        </div>

        {/* Messages */}
        <div ref={messageListRef} data-igg-id="discord.message.list" style={{ flex:1, overflowY:"auto", padding:"16px 0 4px" }}>
          {/* Channel intro */}
          <div style={{ padding:"0 16px 20px", borderBottom:"1px solid #3f4147", marginBottom:16 }}>
            {view==="server" ? (
              <>
                <div style={{ width:68, height:68, borderRadius:"50%", backgroundColor:"#36393f", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}><ChanIcon type={curChan?.type??"text"}/></div>
                <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginBottom:4 }}>#{curChan?.name} welcome!</div>
                <div style={{ fontSize:14, color:"#87898c" }}>{curChan?.topic ?? "This is the beginning of this channel."}</div>
              </>
            ) : curDMUser ? (
              <>
                <Av user={curDMUser} size={80}/>
                <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginTop:12, marginBottom:2 }}>{curDMUser.display}</div>
                <div style={{ fontSize:13, color:"#87898c" }}>@{curDMUser.name}</div>
                <div style={{ fontSize:13, color:"#b5bac1", marginTop:6 }}>This is the beginning of your direct message history with {curDMUser.display}.</div>
              </>
            ) : (
              <>
                <div style={{ width:68, height:68, borderRadius:"50%", backgroundColor:"#36393f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>👥</div>
                <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginTop:12 }}>{curDM?.gname}</div>
              </>
            )}
          </div>

          {false && (
            <div style={{ margin:"0 16px 20px", borderRadius:14, overflow:"hidden", border:"1px solid #5865f2", background:"linear-gradient(135deg,#1e1f22,#1a1b2e)" }}>
              {/* Boost carousel slides — moved to overlay */}
              {promoSlide === 0 && (
                <div style={{ padding:"32px 28px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:14 }}>
                  <div style={{ fontSize:44 }}>💎</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>Boost this Server</div>
                  <div style={{ fontSize:13, color:"#87898c", maxWidth:380, lineHeight:1.6 }}>Help unlock exclusive perks for everyone in the server. Currently at Level 0 — only 2 boosts needed!</div>
                  <div style={{ fontSize:12, color:"#5865f2", fontWeight:700 }}>Click ▶ to see all perks →</div>
                </div>
              )}
              {promoSlide === 1 && (
                <div style={{ padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".08em" }}>Level 1 Perk · Emoji & Branding</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>Express yourself more.</div>
                  <div style={{ display:"flex", gap:12 }}>
                    <div data-igg-id="discord.boost.banner.perk.emoji" style={{ flex:1, backgroundColor:"#2b2d31", borderRadius:10, padding:"14px 16px", cursor:"pointer", border:"1px solid #3f4147" }}>
                      <div style={{ fontSize:28, marginBottom:8 }}>😎</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f2f3f5", marginBottom:4 }}>More Emoji Slots</div>
                      <div style={{ fontSize:12, color:"#87898c" }}>+50 custom emoji slots for this server</div>
                    </div>
                    <div style={{ flex:1, backgroundColor:"#2b2d31", borderRadius:10, padding:"14px 16px", border:"1px solid #3f4147" }}>
                      <div style={{ fontSize:28, marginBottom:8 }}>🖼️</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f2f3f5", marginBottom:4 }}>Server Banner</div>
                      <div style={{ fontSize:12, color:"#87898c" }}>Custom animated banner at the top</div>
                    </div>
                  </div>
                </div>
              )}
              {promoSlide === 2 && (
                <div style={{ padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".08em" }}>Level 1 Perk · Audio & Video</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>Better sound, better streams.</div>
                  <div data-igg-id="discord.boost.banner.perk.audio" style={{ backgroundColor:"#2b2d31", borderRadius:10, padding:"16px 18px", cursor:"pointer", border:"1px solid #3f4147", display:"flex", gap:14, alignItems:"center" }}>
                    <span style={{ fontSize:36 }}>🎙️</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#f2f3f5", marginBottom:4 }}>128 kbps Audio Quality</div>
                      <div style={{ fontSize:13, color:"#87898c" }}>Crystal-clear voice in all voice channels — from the default 64 kbps to studio-quality 128 kbps.</div>
                    </div>
                  </div>
                </div>
              )}
              {promoSlide === 3 && (
                <div style={{ padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".08em" }}>Boost Levels & Rewards</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>Grow the server together.</div>
                  <div data-igg-id="discord.boost.banner.level" style={{ backgroundColor:"#2b2d31", borderRadius:10, padding:"16px 18px", cursor:"pointer", border:"1px solid #5865f2", display:"flex", flexDirection:"column", gap:10 }}>
                    {[{ lvl:"Level 1", boosts:"2 boosts", perk:"Emoji slots, server banner, 128kbps audio" },{ lvl:"Level 2", boosts:"7 boosts", perk:"Animated icon, 256kbps audio, 50 MB uploads" },{ lvl:"Level 3", boosts:"14 boosts", perk:"Custom URL, 100 MB uploads, 384kbps audio" }].map(l=>(
                      <div key={l.lvl} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <span style={{ fontSize:11, fontWeight:800, color:"#5865f2", backgroundColor:"#1a1b2e", borderRadius:999, padding:"2px 8px", whiteSpace:"nowrap", marginTop:2 }}>{l.lvl}</span>
                        <div>
                          <span style={{ fontSize:13, fontWeight:700, color:"#f2f3f5" }}>{l.boosts} · </span>
                          <span style={{ fontSize:13, color:"#87898c" }}>{l.perk}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {promoSlide === 4 && (
                <div style={{ padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#f0b232", textTransform:"uppercase", letterSpacing:".08em" }}>Boost with Nitro</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>Boost for free with Nitro.</div>
                  <div style={{ fontSize:13, color:"#87898c", lineHeight:1.6 }}>Every Nitro subscription includes 2 free Server Boosts — support your favorite community and get perks at the same time.</div>
                  <div style={{ display:"flex", gap:12, marginTop:4 }}>
                    <button data-igg-id="discord.boost.banner.nitro-link" style={{ backgroundColor:"#5865f2", color:"#fff", border:"none", borderRadius:999, padding:"9px 24px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Learn about Nitro</button>
                    <button data-igg-id="discord.boost.banner.nitro.subscribe" style={{ backgroundColor:"transparent", color:"#f0b232", border:"1px solid #f0b232", borderRadius:999, padding:"9px 24px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Subscribe & Boost</button>
                  </div>
                </div>
              )}
              {/* Controls */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, padding:"12px 0 16px" }}>
                <button data-igg-id="discord.boost.banner.prev" onClick={()=>setPromoSlideManually(s=>(s+4)%5)} style={{ width:32, height:32, borderRadius:"50%", backgroundColor:"#2b2d31", border:"1px solid #3f4147", color:"#b5bac1", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>◀</button>
                <div style={{ display:"flex", gap:5 }}>
                  {[0,1,2,3,4].map(i=>(
                    <div key={i} data-igg-id={`discord.boost.banner.dot.${i}`} onClick={()=>setPromoSlideManually(i)} style={{ width:i===promoSlide?18:7, height:7, borderRadius:999, backgroundColor:i===promoSlide?"#5865f2":"#4e5058", cursor:"pointer", transition:"all .2s ease" }}/>
                  ))}
                </div>
                <button data-igg-id="discord.boost.banner.next" onClick={()=>setPromoSlideManually(s=>(s+1)%5)} style={{ width:32, height:32, borderRadius:"50%", backgroundColor:"#2b2d31", border:"1px solid #3f4147", color:"#b5bac1", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>▶</button>
              </div>
            </div>
          )}

          {curMsgs.map((msg) => (
            <MsgRow
              key={msg.id}
              msg={msg}
              hovered={hoveredMsg===msg.id}
              onHover={setHoveredMsg}
              onReact={react}
              iggId={
                key === "dm-alice" && msg.id === 1
                  ? "discord.message.alice.late-night"
                  : key === "dm-alice" && msg.id === 75
                  ? "discord.message.alice.encouragement"
                  : key === "ch-research" && msg.id === 1
                    ? "discord.channel.research.pinned-message"
                    : key === "ch-research" && msg.id === 6
                      ? "discord.channel.research.minji-message"
                    : undefined
              }
            />
          ))}
          <div />
        </div>

        {/* Input */}
        <div style={{ padding:"0 16px 16px", flexShrink:0 }}>
          {(muted || deafened) && (
            <div style={{ background:"#f23f4322", border:"1px solid #f23f4355", borderRadius:6, padding:"5px 12px", marginBottom:8, fontSize:12, color:"#f23f43" }}>
              {deafened ? "🔇 You are deafened." : "🎙️ You are muted."}
            </div>
          )}
          <div style={{ backgroundColor:"#383a40", borderRadius:8, padding:"8px 8px 0" }}>
            {showState9UploadCard && (
              <div style={{ backgroundColor:"#2f3136", border:"1px solid #404249", borderRadius:10, padding:"10px 12px", marginBottom:8, boxShadow:"inset 0 1px 0 rgba(255,255,255,.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(180deg, #ff8a34, #ff6b2c)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:800, letterSpacing:".04em", flexShrink:0 }}>
                    PPTX
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#f2f3f5", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>mock-benchmark_review-v3.pptx</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4, flexWrap:"wrap" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:uploadDemo.phase === "ready" ? "#23a55a" : "#f0b232", fontWeight:700 }}>
                        {uploadDemo.phase === "uploading" && <span style={{ width:10, height:10, borderRadius:"50%", border:"2px solid rgba(240,178,50,.28)", borderTopColor:"#f0b232", animation:"spin 1s linear infinite" }}/>}
                        {uploadDemo.phase === "ready" ? "Upload complete" : "Uploading"}
                      </span>
                      <span style={{ fontSize:12, color:"#949ba4" }}>
                        {uploadDemo.phase === "ready" ? "Activates in 5s" : `${uploadDemo.progress}% processing`}
                      </span>
                      <span style={{ fontSize:11, color:uploadDemo.phase === "ready" ? "#c9cdfb" : "#b5bac1", backgroundColor:uploadDemo.phase === "ready" ? "#2b3d73" : "#3a3d44", borderRadius:999, padding:"2px 8px", fontWeight:700 }}>
                        {uploadDemo.phase === "ready" ? "Ready to send" : "Processing"}
                      </span>
                    </div>
                    <div style={{ marginTop:8, height:6, borderRadius:999, backgroundColor:"#232428", overflow:"hidden" }}>
                      <div style={{ width:`${uploadDemo.progress}%`, height:"100%", borderRadius:999, background:uploadDemo.phase === "ready" ? "linear-gradient(90deg, #23a55a, #3ba55d)" : "linear-gradient(90deg, #f0b232, #ffcc66)", transition:"width .12s linear, background .18s ease" }}/>
                    </div>
                  </div>
                  <button
                    data-igg-id="discord.dm.jisu.upload.send"
                    aria-disabled={uploadDemo.phase !== "ready"}
                    onClick={sendUploadDemo}
                    style={{
                      backgroundColor:uploadDemo.phase === "ready" ? "#3b82f6" : "#4e5058",
                      color:uploadDemo.phase === "ready" ? "#fff" : "#b5bac1",
                      border:"none",
                      borderRadius:8,
                      padding:"8px 12px",
                      fontSize:12,
                      fontWeight:700,
                      cursor:uploadDemo.phase === "ready" ? "pointer" : "not-allowed",
                      flexShrink:0,
                      opacity:uploadDemo.phase === "ready" ? 1 : 0.9,
                      transition:"background-color .15s ease, color .15s ease, opacity .15s ease",
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:2 }}>
              <Tip label="Attach File" side="top">
                <button style={{ background:"none", border:"none", cursor:"pointer", color:"#87898c", display:"flex", padding:8, borderRadius:4 }}><I.Plus/></button>
              </Tip>
              <input
                ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder={view==="server" ? `#${curChan?.name??""}` : `@${curDMUser?.display??curDM?.gname}`}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#dbdee1", fontSize:14, padding:"11px 4px", minWidth:0 }}
              />
              <div style={{ display:"flex", gap:1 }}>
                {[{ico:<I.Gift/>,t:"Gifts"},{ico:<I.Gif/>,t:"GIF"},{ico:<I.Emoji/>,t:"Emoji"}].map((b,i)=>(
                  <Tip key={i} label={b.t} side="top"><button data-igg-id={view === "server" && activeChanId === "ch-general" && b.t === "GIF" ? "discord.channel.general.gif" : undefined} style={{ background:"none", border:"none", cursor:"pointer", color:"#87898c", display:"flex", padding:5, borderRadius:4 }}>{b.ico}</button></Tip>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
      )}

      {/* ── Members panel ────────────────────────────────────────────────────── */}
      {view==="server" && showMembers && !profileUser && (
        <div style={{ position:"relative", width:memberListWidth, backgroundColor:"#2b2d31", display:"flex", flexDirection:"column", flexShrink:0, borderLeft:"1px solid #1e1f22" }}>
          {/* Resize handle */}
          <div
            style={{ position:"absolute", left:0, top:0, height:"100%", width:4, cursor:"col-resize", zIndex:1 }}
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = memberListWidth;
              function onMouseMove(ev: MouseEvent) {
                setMemberListWidth(Math.max(80, Math.min(400, startWidth + (startX - ev.clientX))));
              }
              function onMouseUp() {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              }
              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            }}
          />
          <div style={{ height:48, display:"flex", alignItems:"center", padding:"0 16px", fontSize:11, fontWeight:700, color:"#949ba4", textTransform:"uppercase", letterSpacing:".6px", borderBottom:"1px solid #1e1f22", flexShrink:0, overflow:"hidden" }}>
            {memberListWidth >= 120 ? `Members — ${serverMembers.length}` : "⋯"}
          </div>
          <div data-igg-id="discord.member.list" style={{ flex:1, overflowY:"auto", padding:8 }}>
            {["online","idle","dnd","invisible"].map(st => {
              const group = serverMembers.filter(u => u.status === st);
              if (group.length === 0) return null;
              const label = st==="invisible" ? "Offline" : STATUS_CFG[st as Status].label;
              return (
                <div key={st}>
                  {memberListWidth >= 120 && <div style={{ fontSize:11, fontWeight:700, color:"#949ba4", textTransform:"uppercase", letterSpacing:".6px", padding:"8px 4px 4px" }}>{label} — {group.length}</div>}
                  {group.map(u => {
                    const channelMemberIggId = {"sora":"discord.channel.member.sora","david":"discord.channel.member.david","me":"discord.channel.member.jordan","alice":"discord.channel.member.alice","kai":"discord.channel.member.kai","minji":"discord.channel.member.minji","sam":"discord.channel.member.sam"}[u.id];
                    const memberNameIggId = {"sora":"discord.member.name.sora","david":"discord.member.name.david","me":"discord.member.name.jordan","alice":"discord.member.name.alice","kai":"discord.member.name.kai","minji":"discord.member.name.minji","sam":"discord.member.name.sam"}[u.id];
                    const rowIggId = memberListWidth >= 160 ? memberNameIggId : channelMemberIggId;
                    return (
                      <button key={u.id} data-igg-id={rowIggId} onClick={()=>setProfileUser(u.id==="me"?null:u.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"6px 8px", background:"none", border:"none", cursor:"pointer", borderRadius:4, opacity:st==="invisible" ? 0.5 : 1, textAlign:"left" }}>
                        <Av user={u} size={32} dot={true} dotBg="#2b2d31"/>
                        {memberListWidth >= 160 && (
                          <span data-igg-id={memberNameIggId} style={{ fontSize:14, color:"#b5bac1" }}>{u.display}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile right panel */}
      {profileUser && USERS[profileUser] && <ProfilePanel user={USERS[profileUser]} onClose={()=>setProfileUser(null)}/>}
      {view==="dm" && curDMUser && <ProfilePanel user={curDMUser} onClose={()=>{}}/>}

      {/* ── Portals ──────────────────────────────────────────────────────────── */}
      {myProfileAnchor && (
        <MyProfileCard user={me} anchor={myProfileAnchor} onStatusChange={s=>{setMyStatus(s);}}/>
      )}
      {statusAnchor && (
        <StatusPicker anchor={statusAnchor} current={myStatus} onSelect={s=>{setMyStatus(s);setStatusAnchor(null);}} onClose={()=>setStatusAnchor(null)}/>
      )}
      {view==="server" && serverOverlay && serverOverlayAnchor && (
        <ServerIconDropdown mode={serverOverlay} anchor={serverOverlayAnchor} chanId={activeChanId} msgs={msgs} onClose={()=>{setServerOverlay(null);setServerOverlayAnchor(null);}}/>
      )}
      {view==="server" && hoveredChannelThread && (
        <ChannelThreadPreview
          chanId={hoveredChannelThread.chanId}
          anchor={hoveredChannelThread.rect}
          onMouseEnter={clearHoveredThreadCloseTimer}
          onMouseLeave={scheduleHoveredThreadClose}
        />
      )}
      {/* ── Nitro promo carousel overlay (state 11) ─────────────────────────── */}
      {sceneStateId === "11" && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,.6)", zIndex:9500, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:640, background:"linear-gradient(135deg,#23272a,#1a1b2e)", borderRadius:18, border:"1px solid #3f4147", boxShadow:"0 24px 60px rgba(0,0,0,.6)", overflow:"hidden" }}>
            <div style={{ minHeight:320 }}>
              {promoSlide === 0 && (
                <div style={{ padding:"48px 48px 40px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:16 }}>
                  <div style={{ fontSize:56 }}>🚀</div>
                  <div style={{ fontSize:26, fontWeight:800, color:"#fff" }}>Supercharge your Discord</div>
                  <div style={{ fontSize:14, color:"#87898c", maxWidth:400, lineHeight:1.6 }}>Unlock custom emoji, bigger uploads, HD streaming, and exclusive perks with Discord Nitro.</div>
                  <div style={{ fontSize:12, color:"#5865f2", fontWeight:700 }}>Click ▶ to explore plans →</div>
                </div>
              )}
              {promoSlide === 1 && (
                <div style={{ padding:"40px 48px", display:"flex", flexDirection:"column", gap:18 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".1em" }}>Nitro Basic · $2.99/mo</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff" }}>The essentials, affordable.</div>
                  <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:7 }}>
                    {["Custom emoji in any server","Animated profile avatar","2 free Server Boosts","Higher-quality video (480p)"].map(f=>(
                      <li key={f} style={{ fontSize:13, color:"#b5bac1", display:"flex", gap:8, alignItems:"center" }}><span style={{ color:"#23a55a" }}>✓</span>{f}</li>
                    ))}
                  </ul>
                  <div style={{ display:"flex", gap:10 }}>
                    <button data-igg-id="discord.nitro.banner.basic.subscribe" style={{ backgroundColor:"#5865f2", color:"#fff", border:"none", borderRadius:999, padding:"9px 26px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Subscribe</button>
                    <button data-igg-id="discord.nitro.banner.basic.compare" style={{ backgroundColor:"transparent", color:"#b5bac1", border:"1px solid #4e5058", borderRadius:999, padding:"9px 22px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Compare plans</button>
                  </div>
                </div>
              )}
              {promoSlide === 2 && (
                <div style={{ padding:"40px 48px", display:"flex", flexDirection:"column", gap:18 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".1em" }}>Nitro · $9.99/mo</div>
                    <span style={{ backgroundColor:"#5865f2", color:"#fff", fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:999 }}>MOST POPULAR</span>
                  </div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff" }}>The full Nitro experience.</div>
                  <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:7 }}>
                    {["Everything in Nitro Basic","500 MB file uploads","HD video streaming (1080p)","Custom profile banner & theme","2 free Server Boosts"].map(f=>(
                      <li key={f} style={{ fontSize:13, color:"#b5bac1", display:"flex", gap:8, alignItems:"center" }}><span style={{ color:"#23a55a" }}>✓</span>{f}</li>
                    ))}
                  </ul>
                  <button data-igg-id="discord.nitro.banner.full.subscribe" style={{ width:"fit-content", backgroundColor:"#5865f2", color:"#fff", border:"none", borderRadius:999, padding:"9px 30px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Subscribe to Nitro</button>
                </div>
              )}
              {promoSlide === 3 && (
                <div style={{ padding:"48px 48px 40px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:18 }}>
                  <div style={{ fontSize:52 }}>📁</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff" }}>Send anything, instantly.</div>
                  <div style={{ fontSize:13, color:"#87898c", maxWidth:380, lineHeight:1.6 }}>With Nitro, upload files up to 500 MB — share videos, projects, and full albums without compression.</div>
                  <button data-igg-id="discord.nitro.banner.perk.upload" style={{ backgroundColor:"#5865f2", color:"#fff", border:"none", borderRadius:999, padding:"9px 30px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Unlock larger uploads</button>
                </div>
              )}
              {promoSlide === 4 && (
                <div style={{ padding:"48px 48px 40px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:18 }}>
                  <div style={{ fontSize:52 }}>🎁</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff" }}>Give the gift of Nitro.</div>
                  <div style={{ fontSize:13, color:"#87898c", maxWidth:380, lineHeight:1.6 }}>Surprise a friend with a Nitro subscription — choose 1 month or 12 months, delivered instantly.</div>
                  <button data-igg-id="discord.nitro.banner.gift" style={{ backgroundColor:"#f0b232", color:"#000", border:"none", borderRadius:999, padding:"9px 30px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Gift Nitro</button>
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, padding:"14px 0 18px", borderTop:"1px solid #3f4147" }}>
              <button data-igg-id="discord.nitro.banner.prev" onClick={()=>setPromoSlideManually(s=>(s+4)%5)} style={{ width:34, height:34, borderRadius:"50%", backgroundColor:"#2b2d31", border:"1px solid #3f4147", color:"#b5bac1", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>◀</button>
              <div style={{ display:"flex", gap:6 }}>
                {[0,1,2,3,4].map(i=>(
                  <div key={i} data-igg-id={`discord.nitro.banner.dot.${i}`} onClick={()=>setPromoSlideManually(i)} style={{ width:i===promoSlide?20:8, height:8, borderRadius:999, backgroundColor:i===promoSlide?"#5865f2":"#4e5058", cursor:"pointer", transition:"all .2s ease" }}/>
                ))}
              </div>
              <button data-igg-id="discord.nitro.banner.next" onClick={()=>setPromoSlideManually(s=>(s+1)%5)} style={{ width:34, height:34, borderRadius:"50%", backgroundColor:"#2b2d31", border:"1px solid #3f4147", color:"#b5bac1", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>▶</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Boost promo carousel overlay (state 12) ─────────────────────────── */}
      {sceneStateId === "12" && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,.6)", zIndex:9500, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:640, background:"linear-gradient(135deg,#1e1f22,#1a1b2e)", borderRadius:18, border:"1px solid #5865f2", boxShadow:"0 24px 60px rgba(0,0,0,.6)", overflow:"hidden" }}>
            <div style={{ minHeight:300 }}>
              {promoSlide === 0 && (
                <div style={{ padding:"40px 48px 32px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:14 }}>
                  <div style={{ fontSize:48 }}>💎</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff" }}>Boost this Server</div>
                  <div style={{ fontSize:13, color:"#87898c", maxWidth:380, lineHeight:1.6 }}>Help unlock exclusive perks for everyone. Currently at Level 0 — only 2 boosts needed!</div>
                  <div style={{ fontSize:12, color:"#5865f2", fontWeight:700 }}>Click ▶ to see all perks →</div>
                </div>
              )}
              {promoSlide === 1 && (
                <div style={{ padding:"36px 48px 28px", display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".08em" }}>Level 1 · Emoji & Branding</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>Express yourself more.</div>
                  <div style={{ display:"flex", gap:12 }}>
                    <div data-igg-id="discord.boost.banner.perk.emoji" style={{ flex:1, backgroundColor:"#2b2d31", borderRadius:10, padding:"14px", cursor:"pointer", border:"1px solid #3f4147" }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>😎</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f2f3f5", marginBottom:3 }}>More Emoji Slots</div>
                      <div style={{ fontSize:12, color:"#87898c" }}>+50 custom emoji slots</div>
                    </div>
                    <div style={{ flex:1, backgroundColor:"#2b2d31", borderRadius:10, padding:"14px", border:"1px solid #3f4147" }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>🖼️</div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f2f3f5", marginBottom:3 }}>Server Banner</div>
                      <div style={{ fontSize:12, color:"#87898c" }}>Custom animated banner</div>
                    </div>
                  </div>
                </div>
              )}
              {promoSlide === 2 && (
                <div style={{ padding:"36px 48px 28px", display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".08em" }}>Level 1 · Audio & Video</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>Better sound, better streams.</div>
                  <div data-igg-id="discord.boost.banner.perk.audio" style={{ backgroundColor:"#2b2d31", borderRadius:10, padding:"16px 18px", cursor:"pointer", border:"1px solid #3f4147", display:"flex", gap:14, alignItems:"center" }}>
                    <span style={{ fontSize:34 }}>🎙️</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#f2f3f5", marginBottom:3 }}>128 kbps Audio Quality</div>
                      <div style={{ fontSize:12, color:"#87898c" }}>Crystal-clear voice — from default 64 kbps to studio-quality 128 kbps.</div>
                    </div>
                  </div>
                </div>
              )}
              {promoSlide === 3 && (
                <div style={{ padding:"36px 48px 28px", display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#5865f2", textTransform:"uppercase", letterSpacing:".08em" }}>Boost Levels & Rewards</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>Grow the server together.</div>
                  <div data-igg-id="discord.boost.banner.level" style={{ backgroundColor:"#2b2d31", borderRadius:10, padding:"16px 18px", cursor:"pointer", border:"1px solid #5865f2", display:"flex", flexDirection:"column", gap:10 }}>
                    {[{ lvl:"Level 1", b:"2 boosts", p:"Emoji slots, server banner, 128kbps audio" },{ lvl:"Level 2", b:"7 boosts", p:"Animated icon, 256kbps, 50 MB uploads" },{ lvl:"Level 3", b:"14 boosts", p:"Custom URL, 100 MB uploads, 384kbps audio" }].map(l=>(
                      <div key={l.lvl} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <span style={{ fontSize:10, fontWeight:800, color:"#5865f2", backgroundColor:"#1a1b2e", borderRadius:999, padding:"2px 7px", whiteSpace:"nowrap", marginTop:2 }}>{l.lvl}</span>
                        <div style={{ fontSize:12, color:"#87898c" }}><strong style={{ color:"#f2f3f5" }}>{l.b}</strong> · {l.p}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {promoSlide === 4 && (
                <div style={{ padding:"36px 48px 28px", display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#f0b232", textTransform:"uppercase", letterSpacing:".08em" }}>Boost with Nitro</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>Boost for free with Nitro.</div>
                  <div style={{ fontSize:13, color:"#87898c", lineHeight:1.6 }}>Every Nitro subscription includes 2 free Server Boosts — support your favorite community at the same time.</div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button data-igg-id="discord.boost.banner.nitro-link" style={{ backgroundColor:"#5865f2", color:"#fff", border:"none", borderRadius:999, padding:"9px 22px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Learn about Nitro</button>
                    <button data-igg-id="discord.boost.banner.nitro.subscribe" style={{ backgroundColor:"transparent", color:"#f0b232", border:"1px solid #f0b232", borderRadius:999, padding:"9px 22px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Subscribe & Boost</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, padding:"12px 0 16px", borderTop:"1px solid #3f4147" }}>
              <button data-igg-id="discord.boost.banner.prev" onClick={()=>setPromoSlideManually(s=>(s+4)%5)} style={{ width:34, height:34, borderRadius:"50%", backgroundColor:"#2b2d31", border:"1px solid #3f4147", color:"#b5bac1", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>◀</button>
              <div style={{ display:"flex", gap:6 }}>
                {[0,1,2,3,4].map(i=>(
                  <div key={i} data-igg-id={`discord.boost.banner.dot.${i}`} onClick={()=>setPromoSlideManually(i)} style={{ width:i===promoSlide?20:8, height:8, borderRadius:999, backgroundColor:i===promoSlide?"#5865f2":"#4e5058", cursor:"pointer", transition:"all .2s ease" }}/>
                ))}
              </div>
              <button data-igg-id="discord.boost.banner.next" onClick={()=>setPromoSlideManually(s=>(s+1)%5)} style={{ width:34, height:34, borderRadius:"50%", backgroundColor:"#2b2d31", border:"1px solid #3f4147", color:"#b5bac1", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>▶</button>
            </div>
          </div>
        </div>
      )}

      {inboxToast && inboxToastUser && (
        <div style={{ position:"fixed", top:64, right:20, width:320, backgroundColor:"#1f2124", border:"1px solid #3b82f6", borderRadius:14, boxShadow:"0 18px 40px rgba(0,0,0,.35)", zIndex:9700, overflow:"hidden" }}>
          <div style={{ padding:"12px 14px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <Av user={inboxToastUser} size={40} dot={true} dotBg="#1f2124"/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, minWidth:0 }}>
                  <span style={{ fontSize:13, fontWeight:800, color:"#f2f3f5", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{inboxToastUser.display}</span>
                  <span style={{ fontSize:11, color:"#949ba4", flexShrink:0 }}>now</span>
                </div>
                <div style={{ fontSize:14, color:"#dbdee1", lineHeight:1.45, marginBottom:8 }}>{inboxToast.message}</div>
                <div data-igg-id={`discord.inbox.${inboxToast.from}.view-message`} style={{ display:"inline-flex", alignItems:"center", gap:6, backgroundColor:"#2b2d31", border:"1px solid #3f4147", borderRadius:999, padding:"4px 10px", color:"#c9cdfb", fontSize:12, fontWeight:700 }}>
                  <I.Reply/>
                  <span>View message</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
