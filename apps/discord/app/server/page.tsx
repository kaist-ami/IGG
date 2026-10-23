"use client";

import Link from "next/link";
import { Children, cloneElement, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "online" | "idle" | "dnd" | "invisible";
type ChanType = "text" | "voice" | "announce" | "forum";

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
interface Chan { id: string; name: string; type: ChanType; cat: string; topic?: string; unread?: boolean; mention?: number; locked?: boolean; }
interface Cat  { id: string; name: string; }
interface Thread { id: string; title: string; chan: string; ago: string; count: number; pids: string[]; }

// ─── Data ─────────────────────────────────────────────────────────────────────
const ME: User = { id:"me", name:"jordan_park", display:"Jordan", avatar:"JP", color:"#3b82f6", status:"online", about:"Always building 🛠️", pronouns:"they/them", joinedAt:"Mar 5, 2022" };

const USERS: Record<string,User> = {
  alice:   { id:"alice",   name:"alice_chen",    display:"Alice",   avatar:"AC",  color:"#ED4245", status:"online",    about:"Coffee ≥ Sleep ☕",          pronouns:"she/her",  joinedAt:"Nov 12, 2021" },
  ryan:    { id:"ryan",    name:"ryan_k",         display:"Ryan",    avatar:"RK",  color:"#FAA61A", status:"idle",      about:"🎮 gaming rn",                                     joinedAt:"Jan 20, 2022"  },
  david:   { id:"david",   name:"david_lee",      display:"David",   avatar:"DL",  color:"#3BA55C", status:"dnd",       about:"do not disturb thx",                               joinedAt:"Jul 8, 2021"   },
  yuna:    { id:"yuna",    name:"yuna_oh",         display:"Yuna",    avatar:"YO",  color:"#9B59B6", status:"online",    about:"✨ vibes only",              pronouns:"she/her",  joinedAt:"Feb 14, 2023"  },
  sam:     { id:"sam",     name:"sam_w",           display:"Sam",     avatar:"SW",  color:"#1ABC9C", status:"invisible", about:"",                                                  joinedAt:"Sep 3, 2022"   },
  mia:     { id:"mia",     name:"mia_j",           display:"Mia",     avatar:"MJ",  color:"#E91E63", status:"online",    about:"研究中 📖",                 pronouns:"she/her",  joinedAt:"May 30, 2023"  },
  kai:     { id:"kai",     name:"kai_m",           display:"Kai",     avatar:"KM",  color:"#FF6B6B", status:"idle",      about:"always late to standup 🙃",                        joinedAt:"Aug 1, 2023"   },
  minho:   { id:"minho",   name:"minho_park",      display:"Minho",   avatar:"MP",  color:"#2ECC71", status:"online",    about:"Backend Developer 🖥️",           pronouns:"he/him",   joinedAt:"Jun 17, 2022"  },
  sora:    { id:"sora",    name:"sora_kim",        display:"Sora",    avatar:"SK",  color:"#E67E22", status:"idle",      about:"Designer & Coffee Addict ☕", pronouns:"she/her",  joinedAt:"Jan 9, 2023"   },
  jake:    { id:"jake",    name:"jake_l",          display:"Jake",    avatar:"JL",  color:"#8E44AD", status:"dnd",       about:"Deep focus... 🎧",                                     joinedAt:"Apr 22, 2021"  },
  jenny:   { id:"jenny",   name:"jenny_h",         display:"Jenny",   avatar:"JH2", color:"#16A085", status:"online",    about:"PM who also codes 💻",    pronouns:"she/her",  joinedAt:"Oct 3, 2022"  },
  nari:    { id:"nari",    name:"nari_jung",       display:"Nari",    avatar:"NJ",  color:"#C0392B", status:"online",    about:"UX Researcher 🔍",              pronouns:"she/her",  joinedAt:"Mar 28, 2023"  },
  lucas:   { id:"lucas",   name:"lucas_b",         display:"Lucas",   avatar:"LB",  color:"#2980B9", status:"invisible", about:"",                                                  joinedAt:"Jul 11, 2022"  },
  hana:    { id:"hana",    name:"hana_shin",       display:"Hana",    avatar:"HS",  color:"#D35400", status:"online",    about:"Data Scientist 📊",     pronouns:"she/her",  joinedAt:"Sep 5, 2023"   },
  taeho:   { id:"taeho",   name:"taeho_yoon",      display:"Taeho",   avatar:"TY",  color:"#27AE60", status:"idle",      about:"MLOps Engineer 🚀",                                joinedAt:"Dec 1, 2021"  },
  jisu:    { id:"jisu",    name:"jisu_han",        display:"Jisu",    avatar:"JI",  color:"#00B894", status:"online",    about:"Frontend Developer 🎨",       pronouns:"she/her",  joinedAt:"Apr 15, 2022"  },
  wonjun:  { id:"wonjun",  name:"wonjun_choi",     display:"Wonjun",  avatar:"WC",  color:"#6C5CE7", status:"idle",      about:"Algorithm Enthusiast 🧩",                               joinedAt:"Sep 3, 2021"   },
  minji:   { id:"minji",   name:"minji_lee",       display:"Minji",   avatar:"MI",  color:"#FD79A8", status:"online",    about:"Research Engineer 🔬",        pronouns:"she/her",  joinedAt:"Jan 22, 2023"  },
  taesoo:  { id:"taesoo",  name:"taesoo_kim",      display:"Taesoo",  avatar:"TK",  color:"#FDCB6E", status:"dnd",       about:"Data Engineer 🏗️",                              joinedAt:"Jun 10, 2021"  },
  eunha:   { id:"eunha",   name:"eunha_park",      display:"Eunha",   avatar:"EP",  color:"#55EFC4", status:"online",    about:"QA Engineer 🛡️",            pronouns:"she/her",  joinedAt:"Nov 5, 2022"  },
  sangwon: { id:"sangwon", name:"sangwon_oh",      display:"Sangwon", avatar:"SO",  color:"#74B9FF", status:"invisible", about:"",                                                  joinedAt:"Mar 18, 2022"  },
  yujin:   { id:"yujin",   name:"yujin_kang",      display:"Yujin",   avatar:"YJ",  color:"#A29BFE", status:"online",    about:"Full-stack Developer 💻",           pronouns:"she/her",  joinedAt:"Jun 1, 2023"   },
  jihoon:  { id:"jihoon",  name:"jihoon_bae",      display:"Jihoon",  avatar:"JB",  color:"#E17055", status:"idle",      about:"DevOps Engineer ⚙️",                              joinedAt:"Aug 7, 2022"   },
  boram:   { id:"boram",   name:"boram_cho",       display:"Boram",   avatar:"BC",  color:"#00CEC9", status:"online",    about:"Product Designer 🎨",       pronouns:"she/her",  joinedAt:"Apr 11, 2023"  },
  seoyeon: { id:"seoyeon", name:"seoyeon_lim",     display:"Seoyeon", avatar:"SL",  color:"#FF7675", status:"online",    about:"NLP Researcher 📝",             pronouns:"she/her",  joinedAt:"Dec 19, 2022" },
  namhee:  { id:"namhee",  name:"namhee_song",     display:"Namhee",  avatar:"NS",  color:"#B2BEC3", status:"invisible", about:"",                           pronouns:"she/her",  joinedAt:"May 30, 2021"  },
  dongwoo: { id:"dongwoo", name:"dongwoo_shin",    display:"Dongwoo", avatar:"DO",  color:"#FFEAA7", status:"idle",      about:"Security Engineer 🔐",                                joinedAt:"Feb 14, 2022"  },
  rina:    { id:"rina",    name:"rina_kwon",       display:"Rina",    avatar:"RN",  color:"#81ECEC", status:"online",    about:"UX Writer ✍️",              pronouns:"she/her",  joinedAt:"Jul 20, 2023"  },
  chanhee: { id:"chanhee", name:"chanhee_im",      display:"Chanhee", avatar:"CH",  color:"#D63031", status:"dnd",       about:"Security review 🔒",                                  joinedAt:"Oct 8, 2021"  },
};

const CATS: Cat[] = [
  { id:"c-info",   name:"INFORMATION"        },
  { id:"c-general",name:"GENERAL"            },
  { id:"c-pm",     name:"PROJECT MANAGEMENT" },
  { id:"c-dev",    name:"DEVELOPMENT"        },
  { id:"c-design", name:"DESIGN & UX"        },
  { id:"c-voice",  name:"VOICE CHANNELS"     },
];

const CHANS: Chan[] = [
  // INFORMATION
  { id:"ch-rules",     name:"rules",          type:"text",     cat:"c-info",    topic:"Server rules" },
  { id:"ch-annc",      name:"announcements",  type:"text",     cat:"c-info" },
  { id:"ch-intro",     name:"introductions",  type:"text",     cat:"c-info",    topic:"Introductions 👋" },
  { id:"ch-resources", name:"resources",      type:"text",     cat:"c-info",    topic:"Useful resources 📚" },
  // GENERAL
  { id:"ch-general",   name:"general",        type:"text",     cat:"c-general", topic:"General chat 💬" },
  { id:"ch-random",    name:"random",         type:"text",     cat:"c-general" },
  { id:"ch-off-topic", name:"off-topic",      type:"text",     cat:"c-general" },
  { id:"ch-memes",     name:"memes",          type:"text",     cat:"c-general" },
  { id:"ch-kudos",     name:"kudos",          type:"text",     cat:"c-general", topic:"Team appreciation 🌟" },
  // PROJECT MANAGEMENT
  { id:"ch-planning",  name:"planning",       type:"text",     cat:"c-pm",      topic:"Roadmap & planning" },
  { id:"ch-milestones",name:"milestones",     type:"text",     cat:"c-pm" },
  { id:"ch-standup",   name:"standup",        type:"text",     cat:"c-pm",      topic:"Daily standup" },
  { id:"ch-meeting",   name:"meeting-notes",  type:"text",     cat:"c-pm" },
  { id:"ch-actions",   name:"action-items",   type:"text",     cat:"c-pm",      topic:"Action item tracking" },
  // DEVELOPMENT
  { id:"ch-research",  name:"research",       type:"text",     cat:"c-dev",     topic:"Papers & experiments", unread:true, mention:2, locked:true },
  { id:"ch-code",      name:"code-review",    type:"text",     cat:"c-dev",     locked:true },
  { id:"ch-bugs",      name:"bug-tracker",    type:"text",     cat:"c-dev",     locked:true },
  { id:"ch-deploy",    name:"deployment",     type:"text",     cat:"c-dev",     topic:"Deployment status 🚀", locked:true },
  { id:"ch-data",      name:"data-analysis",  type:"text",     cat:"c-dev",     topic:"Data analysis & EDA", locked:true },
  // DESIGN & UX
  { id:"ch-mocks",     name:"mock-review",    type:"text",     cat:"c-design",  topic:"Mock review" },
  { id:"ch-feedback",  name:"feedback",       type:"forum",    cat:"c-design",  topic:"Feedback forum" },
  { id:"ch-assets",    name:"assets",         type:"text",     cat:"c-design",  topic:"Design asset sharing" },
  { id:"ch-ux-research",name:"user-research", type:"text",     cat:"c-design",  topic:"User research & interviews" },
  // VOICE
  { id:"ch-vc1", name:"Voice Chat",   type:"voice", cat:"c-voice" },
  { id:"ch-vc2", name:"Study Room",   type:"voice", cat:"c-voice" },
  { id:"ch-vc3", name:"Team Meeting", type:"voice", cat:"c-voice" },
  { id:"ch-vc4", name:"Chill Zone",   type:"voice", cat:"c-voice" },
  { id:"ch-vc5", name:"Focus Mode",   type:"voice", cat:"c-voice" },
];

const THREADS: Thread[] = [
  { id:"t1", title:"How did the benchmark turn out?",   chan:"ch-research",  ago:"just now",     count:12, pids:["alice","david","me"]           },
  { id:"t2", title:"Figma mock v2 feedback",     chan:"ch-mocks",     ago:"5 min ago",   count:7,  pids:["yuna","alice","boram"]          },
  { id:"t3", title:"Next week meeting agenda",       chan:"ch-general",   ago:"1 hr ago", count:4,  pids:["ryan","sam","me"]               },
  { id:"t4", title:"Data preprocessing issue",        chan:"ch-research",  ago:"3 hr ago", count:21, pids:["david","mia","hana"]            },
  { id:"t5", title:"Code review request",           chan:"ch-code",      ago:"30 min ago",  count:5,  pids:["kai","me","jisu"]               },
  { id:"t6", title:"Q2 milestone check",         chan:"ch-milestones",ago:"2 hr ago", count:9,  pids:["jenny","minho","alice"]         },
  { id:"t7", title:"Deploy pipeline improvement",    chan:"ch-deploy",    ago:"4 hr ago", count:6,  pids:["taeho","jihoon","kai"]          },
  { id:"t8", title:"User interview analysis",         chan:"ch-ux-research",ago:"yesterday",    count:15, pids:["nari","boram","rina"]           },
];

const VOICE_USERS: Record<string,string[]> = {
  "ch-vc1":["alice","ryan","jisu"],
  "ch-vc2":["david","minji"],
  "ch-vc3":["jenny","wonjun","eunha","boram"],
  "ch-vc4":[],
  "ch-vc5":["seoyeon"],
};

const THREAD_MSGS: Record<string, { uid:string; time:string; content:string }[]> = {
  "t1": [
    { uid:"alice",  time:"just now",    content:"These results look great! What was the BLEU score?" },
    { uid:"david",  time:"just now",    content:"BLEU 42.3, ROUGE-L 0.61" },
    { uid:"me",     time:"just now",    content:"Amazing — that's +12% over baseline, right?" },
  ],
  "t2": [
    { uid:"yuna",   time:"5 min ago",  content:"The component alignment feels a bit off" },
    { uid:"alice",  time:"5 min ago",  content:"The spacing is good but I think bumping the font size a bit would help" },
    { uid:"me",     time:"3 min ago",  content:"Got it! I'll push v3 shortly" },
  ],
  "t3": [
    { uid:"ryan",   time:"1 hr ago", content:"Can someone put together the agenda for next week's meeting?" },
    { uid:"sam",    time:"1 hr ago", content:"1. Weekly progress 2. Q2 goals" },
    { uid:"me",     time:"50 min ago",  content:"3. Let's add benchmark results sharing too" },
  ],
  "t4": [
    { uid:"david",  time:"3 hr ago", content:"How are you all handling null values?" },
    { uid:"mia",    time:"3 hr ago", content:"I'm using median imputation" },
    { uid:"hana",   time:"2 hr ago", content:"Tried k-NN imputation and it worked pretty well" },
  ],
  "t5": [
    { uid:"kai",    time:"30 min ago",  content:"Refactored the auth middleware. Please take a look!" },
    { uid:"me",     time:"25 min ago",  content:"Logic looks good — adding error handling would make it perfect" },
    { uid:"jisu",   time:"20 min ago",  content:"I think we can narrow the types a bit more too!" },
  ],
  "t6": [
    { uid:"jenny",  time:"2 hr ago", content:"2 out of 3 Q2 milestones are done!" },
    { uid:"minho",  time:"2 hr ago", content:"The API integration is still pending but should be done this week" },
    { uid:"alice",  time:"1 hr ago", content:"Timeline looks fine 👍" },
  ],
  "t7": [
    { uid:"taeho",  time:"4 hr ago", content:"Switching to GitHub Actions could cut build time by 40%" },
    { uid:"jihoon", time:"4 hr ago", content:"Improving the caching strategy alongside would make it even faster" },
    { uid:"kai",    time:"3 hr ago", content:"I'll open a PR! Would appreciate a review 🙏" },
  ],
  "t8": [
    { uid:"nari",   time:"yesterday",     content:"Finished analyzing 10 interviews. Clear common patterns emerged" },
    { uid:"boram",  time:"yesterday",     content:"Drop-off is highest in the onboarding flow" },
    { uid:"rina",   time:"yesterday",     content:"I think improving the copy could fix that!" },
  ],
};

type MsgStore = Record<string, Msg[]>;
const INIT_MSGS: MsgStore = {
  "ch-rules": [],
  "ch-annc": [],
  "ch-intro": [],
  "ch-resources": [],
  "ch-general": [
    { id:1, uid:"alice",   time:"10:12 AM",       content:"Everyone don't forget standup today! Starting at 2pm 📣" },
    { id:2, uid:"ryan",    time:"10:15 AM",       content:"On it! Almost done", reactions:[{emoji:"👍",count:3,mine:true}] },
    { id:3, uid:"yuna",    time:"10:16 AM",       content:"Same here 😄" },
    { id:4, uid:"david",   time:"10:22 AM",       content:"I'll share the benchmark results today", thread:{title:"Benchmark results discussion",count:8} },
    { id:5, uid:"me",      time:"10:55 AM",       content:"Oh exciting!! What numbers did we get?" },
    { id:6, uid:"alice",   time:"11:00 AM",       content:"Almost done with the mock fixes!\nWill push later today", edited:true },
    { id:7, uid:"kai",     time:"11:10 AM",       content:"I'll be a bit late to standup.. sorry 😅" },
    { id:8, uid:"jenny",   time:"11:20 AM",       content:"Great work everyone! Keep it up 💪", reactions:[{emoji:"💪",count:7,mine:true}] },
  ],
  "ch-random": [],
  "ch-off-topic": [],
  "ch-memes": [],
  "ch-kudos": [],
  "ch-planning": [],
  "ch-milestones": [],
  "ch-standup": [],
  "ch-meeting": [],
  "ch-actions": [],
  "ch-research": [
    { id:1, uid:"david",   time:"Yesterday at 3:40 PM",   content:"Dropped the paper draft — feedback welcome 🙏", pinned:true },
    { id:2, uid:"mia",     time:"Yesterday at 4:01 PM",   content:"I'll read it! The related work section might need more coverage" },
    { id:3, uid:"me",      time:"9:30 AM",        content:"Looked at section 3 — the experiment design needs to be more specific" },
    { id:4, uid:"david",   time:"9:35 AM",        content:"Agreed. Also feels like we need more samples", reactions:[{emoji:"👀",count:2,mine:false}] },
    { id:5, uid:"mia",     time:"9:40 AM",        content:"The evaluation metrics need to be cleaned up too" },
    { id:6, uid:"seoyeon", time:"10:00 AM",       content:"Adding a comparison with recent NLP papers would really strengthen it!" },
  ],
  "ch-code": [],
  "ch-bugs": [],
  "ch-deploy": [],
  "ch-data": [],
  "ch-mocks": [],
  "ch-feedback": [],
  "ch-assets": [],
  "ch-ux-research": [],
};

const STATUS_CFG: Record<Status, {color:string; label:string}> = {
  online:    { color:"#23a55a", label:"Online"          },
  idle:      { color:"#f0b232", label:"Away"        },
  dnd:       { color:"#f23f43", label:"Do Not Disturb"        },
  invisible: { color:"#80848e", label:"Appear Offline" },
};

const SERVERS = [
  { id:"s1", label:"Project Atlas",  text:"🎯", bg:"#1a1a2e", fg:"#a78bfa", folder:false },
  { id:"s2", label:"Design Studio",  text:"🎨", bg:"#2d1020", fg:"#f472b6", folder:false },
  { id:"s3", label:"AI Research",    text:"🤖", bg:"#0d1f0d", fg:"#4ade80", folder:false },
  { id:"f1", label:"DS Team",       text:"📊", bg:"#162032", fg:"#60a5fa", folder:true  },
  { id:"f2", label:"Study Group",   text:"📚", bg:"#1f2d1f", fg:"#fff",    folder:true  },
  { id:"f3", label:"Game Night",    text:"🎮", bg:"#2a1515", fg:"#fca5a5", folder:true  },
  { id:"f4", label:"Music Box",     text:"🎵", bg:"#15152a", fg:"#c4b5fd", folder:true  },
  { id:"f5", label:"Book Club",     text:"📖", bg:"#2a2510", fg:"#fde68a", folder:true  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  Discord:   ()=><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>,
  Hash:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Speaker:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,

  Search:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Pin:       ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>,
  Members:   ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Thread:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></svg>,
  Inbox:     ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Help:      ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Mic:       ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Headset:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  Settings:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
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
function ChanIcon({ type, locked }: { type: ChanType; locked?: boolean }) {
  if (type === "voice") return <I.Speaker />;
  if (locked || type === "forum") {
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

// ─── Tooltip ─────────────────────────────────────────────────────────────────
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

// ─── Emoji picker ─────────────────────────────────────────────────────────────
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

// ─── Status picker ────────────────────────────────────────────────────────────
type StatusPickerProps = { anchor:DOMRect; current:Status; onSelect:(s:Status)=>void; onClose:()=>void };
function StatusPicker({ anchor, current, onSelect, onClose }: StatusPickerProps) {
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
          <button key={s} onMouseDown={ev=>{ev.stopPropagation();onSelect(s);onClose();}} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:current===s?"#313338":"none", border:"none", cursor:"pointer", borderRadius:4 }}>
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

// ─── My profile popup ─────────────────────────────────────────────────────────
function MyProfileCard({ user, anchor, onClose, onStatusChange }: { user:User; anchor:DOMRect; onClose:()=>void; onStatusChange:(s:Status)=>void }) {
  const [statusAnchor, setStatusAnchor] = useState<DOMRect|null>(null);
  const cfg = STATUS_CFG[user.status];

  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [onClose]);

  return createPortal(
    <div onMouseDown={e=>e.stopPropagation()} style={{ position:"fixed", bottom: window.innerHeight - anchor.top + 8, left:anchor.left, width:300, backgroundColor:"#111214", borderRadius:10, overflow:"hidden", zIndex:9000, boxShadow:"0 16px 40px rgba(0,0,0,.85)" }}>
      <div style={{ height:70, background:`linear-gradient(135deg,${user.color}88,${user.color}22)` }}/>
      <div style={{ position:"relative", padding:"0 16px" }}>
        <div style={{ position:"absolute", top:-36, left:16, padding:4, backgroundColor:"#111214", borderRadius:"50%" }}>
          <Av user={user} size={72}/>
          <div style={{ position:"absolute", bottom:6, right:6, width:16, height:16, borderRadius:"50%", backgroundColor:cfg.color, border:"3px solid #111214" }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:8 }}>
          <button onMouseDown={e=>{e.stopPropagation();setStatusAnchor(e.currentTarget.getBoundingClientRect());}} style={{ display:"flex", alignItems:"center", gap:6, background:"#1e1f22", border:"none", cursor:"pointer", borderRadius:4, padding:"5px 10px" }}>
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

// ─── Profile right panel ──────────────────────────────────────────────────────
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

// ─── Thread preview (portal) ─────────────────────────────────────────────────
function ThreadPreview({ thread, anchor }: { thread: Thread; anchor: DOMRect }) {
  const msgs = THREAD_MSGS[thread.id] ?? [];
  const left = anchor.right + 8;
  const top  = Math.min(anchor.top, window.innerHeight - 280);
  return createPortal(
    <div style={{ position:"fixed", top, left, width:300, backgroundColor:"#111214", border:"1px solid #2e2e34", borderRadius:10, overflow:"hidden", zIndex:9500, boxShadow:"0 16px 40px rgba(0,0,0,.8)", pointerEvents:"none" }}>
      <div style={{ padding:"10px 12px 8px", borderBottom:"1px solid #2e2e34" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#80848e", textTransform:"uppercase", letterSpacing:".6px", marginBottom:4 }}>Active Threads</div>
        <div style={{ fontSize:14, fontWeight:700, color:"#fff", lineHeight:1.3 }}>{thread.title}</div>
        <div style={{ fontSize:11, color:"#87898c", marginTop:2 }}>{thread.count} messages · Latest {thread.ago}</div>
      </div>
      <div style={{ padding:"8px 12px 12px" }}>
        {msgs.map((m, i) => {
          const u = m.uid === "me" ? ME : USERS[m.uid];
          if (!u) return null;
          return (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
              <div style={{ width:24, height:24, borderRadius:"50%", backgroundColor:u.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>{u.avatar}</div>
              <div>
                <span style={{ fontSize:12, fontWeight:700, color:u.color }}>{u.display} </span>
                <span style={{ fontSize:11, color:"#72767d" }}>{m.time}</span>
                <div style={{ fontSize:13, color:"#dbdee1", marginTop:2, lineHeight:1.4 }}>{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

// ─── Thread dropdown (portal) ─────────────────────────────────────────────────
function ThreadDropdown({ chanId, anchor, onClose }: { chanId:string; anchor:DOMRect; onClose:()=>void }) {
  const threads = THREADS.filter(t => t.chan === chanId);
  const [hovered, setHovered] = useState<{ thread: Thread; rect: DOMRect } | null>(null);

  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [onClose]);

  const left = Math.min(anchor.right - 300, window.innerWidth - 316);
  const top  = anchor.bottom + 6;

  return createPortal(
    <div onMouseDown={e=>e.stopPropagation()} style={{ position:"fixed", top, left: Math.max(8, left), width:300, maxHeight:400, backgroundColor:"#111214", border:"1px solid #2e2e34", borderRadius:10, overflow:"hidden", zIndex:10000, boxShadow:"0 16px 40px rgba(0,0,0,.85)", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"10px 12px 8px", borderBottom:"1px solid #2e2e34", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Threads</span>
        <button onMouseDown={e=>{e.stopPropagation();onClose();}} style={{ background:"none", border:"none", cursor:"pointer", color:"#87898c", display:"flex" }}><I.Close/></button>
      </div>
      <div style={{ overflowY:"auto", padding:8 }}>
        {threads.length === 0 && <div style={{ padding:16, textAlign:"center", color:"#87898c", fontSize:13 }}>No active threads</div>}
        {threads.map(t => {
          const parts = t.pids.slice(0,3).map(pid => pid==="me" ? ME : USERS[pid]).filter(Boolean) as User[];
          return (
            <button
              key={t.id}
              onMouseEnter={e => setHovered({ thread:t, rect:e.currentTarget.getBoundingClientRect() })}
              onMouseLeave={() => setHovered(null)}
              style={{ width:"100%", background:hovered?.thread.id===t.id?"#1e2124":"none", border:"1px solid #2e2e34", cursor:"pointer", borderRadius:6, padding:10, textAlign:"left", marginBottom:6, display:"block", transition:"background .1s" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#dbdee1", marginBottom:6, lineHeight:1.3 }}>{t.title}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <div style={{ display:"flex" }}>
                  {parts.map(u => <div key={u.id} style={{ width:18, height:18, borderRadius:"50%", backgroundColor:u.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:"#fff", marginLeft:-4, border:"2px solid #111214" }}>{u.avatar.slice(0,1)}</div>)}
                </div>
                <span style={{ fontSize:11, color:"#87898c" }}>{t.count} messages</span>
              </div>
              <div style={{ fontSize:11, color:"#87898c" }}>Latest: {t.ago}</div>
            </button>
          );
        })}
        <button style={{ width:"100%", background:"none", border:"1px dashed #3f4147", cursor:"pointer", borderRadius:6, padding:10, textAlign:"center", color:"#87898c", fontSize:13 }}>+ New Thread</button>
      </div>
      {hovered && <ThreadPreview thread={hovered.thread} anchor={hovered.rect} />}
    </div>,
    document.body
  );
}

// ─── Pinned messages dropdown (portal) ────────────────────────────────────────
function PinnedDropdown({ chanId, anchor, onClose }: { chanId:string; anchor:DOMRect; onClose:()=>void }) {
  const msgs = (INIT_MSGS[chanId] ?? []).filter(m => m.pinned);

  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [onClose]);

  const left = Math.min(anchor.right - 300, window.innerWidth - 316);
  const top  = anchor.bottom + 6;

  return createPortal(
    <div onMouseDown={e=>e.stopPropagation()} style={{ position:"fixed", top, left: Math.max(8, left), width:300, maxHeight:400, backgroundColor:"#111214", border:"1px solid #2e2e34", borderRadius:10, overflow:"hidden", zIndex:10000, boxShadow:"0 16px 40px rgba(0,0,0,.85)", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"10px 12px 8px", borderBottom:"1px solid #2e2e34", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>📌 Pinned Messages</span>
        <button onMouseDown={e=>{e.stopPropagation();onClose();}} style={{ background:"none", border:"none", cursor:"pointer", color:"#87898c", display:"flex" }}><I.Close/></button>
      </div>
      <div style={{ overflowY:"auto", padding:8 }}>
        {msgs.length === 0 && <div style={{ padding:16, textAlign:"center", color:"#87898c", fontSize:13 }}>No pinned messages</div>}
        {msgs.map(m => {
          const author = m.uid === "me" ? ME : USERS[m.uid];
          if (!author) return null;
          return (
            <div key={m.id} style={{ border:"1px solid #2e2e34", borderRadius:6, padding:10, marginBottom:6, backgroundColor:"#1a1b1e" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", backgroundColor:author.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:"#fff", flexShrink:0 }}>{author.avatar.slice(0,1)}</div>
                <span style={{ fontSize:12, fontWeight:700, color:author.color }}>{author.display}</span>
                <span style={{ fontSize:11, color:"#72767d" }}>{m.time}</span>
              </div>
              <div style={{ fontSize:13, color:"#dbdee1", lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word", overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>{m.content}</div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

// ─── Message row ──────────────────────────────────────────────────────────────
function MsgRow({ msg, prev, hovered, selected, onHover, onReact, onSelect }: {
  msg:Msg; prev?:Msg; hovered:boolean; selected:boolean;
  onHover:(id:number|null)=>void;
  onReact:(msgId:number, emoji:string)=>void;
  onSelect:(id:number)=>void;
}) {
  const [pickerAnchor, setPickerAnchor] = useState<DOMRect|null>(null);
  const author = msg.uid === "me" ? ME : USERS[msg.uid];
  const replyUser = msg.replyTo ? (msg.replyTo.uid === "me" ? ME : USERS[msg.replyTo.uid]) : null;
  if (!author) return null;
  const grouped = !msg.replyTo && prev?.uid === msg.uid;

  function openPicker(e: React.MouseEvent) {
    e.stopPropagation();
    setPickerAnchor(e.currentTarget.getBoundingClientRect());
  }

  const bgColor = selected ? "#2a2d5e" : hovered ? "#2e3035" : "transparent";

  return (
    <div
      onClick={() => onSelect(msg.id)}
      onMouseEnter={() => onHover(msg.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position:"relative",
        padding: grouped ? "1px 16px 1px 72px" : "4px 16px",
        backgroundColor: bgColor,
        borderLeft: selected ? "3px solid #3b82f6" : "3px solid transparent",
        cursor: "default",
        transition: "background-color .1s",
      }}
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

      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        {!grouped
          ? <Av user={author} size={40}/>
          : <div style={{ width:40, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {hovered && <span style={{ fontSize:10, color:"#87898c" }}>{msg.time.split(" ").pop()}</span>}
            </div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          {!grouped && (
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:2 }}>
              <span style={{ fontSize:15, fontWeight:600, color: msg.uid==="me" ? "#57F287" : "#f2f3f5" }}>{author.display}</span>
              <span style={{ fontSize:11, color:"#87898c" }}>{msg.time}</span>
              {msg.pinned && <span style={{ fontSize:10, color:"#faa61a", background:"#faa61a22", padding:"0 4px", borderRadius:3 }}>📌 Pinned</span>}
            </div>
          )}
          <div style={{ fontSize:14, color:"#dbdee1", lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
            {msg.content}
            {msg.edited && <span style={{ fontSize:10, color:"#87898c", marginLeft:4 }}>(edited)</span>}
          </div>

          {/* Reactions */}
          {(msg.reactions ?? []).length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>
              {msg.reactions!.map((r,i) => (
                <button key={i} onClick={e=>{e.stopPropagation();onReact(msg.id, r.emoji);}} style={{ display:"flex", alignItems:"center", gap:4, backgroundColor: r.mine ? "#3d4270" : "#2e3035", border: r.mine ? "1px solid #3b82f6" : "1px solid #3f4147", borderRadius:6, padding:"2px 8px", cursor:"pointer", fontSize:14, lineHeight:1.4 }}>
                  <span>{r.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:600, color: r.mine ? "#a8b4ff" : "#b5bac1" }}>{r.count}</span>
                </button>
              ))}
              <button onClick={e=>{e.stopPropagation();openPicker(e);}} style={{ display:"flex", alignItems:"center", backgroundColor:"#2e3035", border:"1px solid #3f4147", borderRadius:6, padding:"2px 8px", cursor:"pointer", color:"#87898c", fontSize:16, lineHeight:1 }}>＋</button>
            </div>
          )}

          {/* Thread preview */}
          {msg.thread && (
            <button onClick={e=>e.stopPropagation()} style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, background:"none", border:"none", cursor:"pointer", color:"#00a8fc", fontSize:12, padding:0 }}>
              <I.Thread/>
              <span>{msg.thread.count} replies</span>
              <span style={{ color:"#87898c" }}>— {msg.thread.title}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hover action toolbar */}
      {hovered && (
        <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", top:-20, right:16, backgroundColor:"#111214", border:"1px solid #2e2e34", borderRadius:6, display:"flex", gap:1, padding:"4px 5px", zIndex:20, boxShadow:"0 4px 16px rgba(0,0,0,.6)" }}>
          <Tip label="Add Reaction" side="top">
            <button onClick={openPicker} style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:"4px 5px", borderRadius:3 }}><I.React/></button>
          </Tip>
          {[
            { ico:<I.Reply/>, t:"Reply" },
            { ico:<I.Star/>,  t:"Bookmark" },
            { ico:<I.Edit/>,  t:"Edit" },
            { ico:<I.Dot3/>,  t:"More" },
          ].map((b,i) => (
            <Tip key={i} label={b.t} side="top">
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:"4px 5px", borderRadius:3 }}>{b.ico}</button>
            </Tip>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {pickerAnchor && <EmojiPicker anchor={pickerAnchor} onPick={e => onReact(msg.id, e)} onClose={() => setPickerAnchor(null)}/>}
    </div>
  );
}

// ─── Main page (Server view) ──────────────────────────────────────────────────
export default function DiscordServerPage() {
  const [myStatus,      setMyStatus]      = useState<Status>("online");
  const [muted,         setMuted]         = useState(false);
  const [deafened,      setDeafened]      = useState(false);
  const [activeSid,     setActiveSid]     = useState("s1");
  const [activeChanId,  setActiveChanId]  = useState("ch-general");
  const [msgs,          setMsgs]          = useState<MsgStore>({ ...INIT_MSGS });
  const [draft,         setDraft]         = useState("");
  const [hoveredMsg,    setHoveredMsg]    = useState<number|null>(null);
  const [selectedMsgId, setSelectedMsgId] = useState<number|null>(null);
  const [myProfileAnchor, setMyProfileAnchor] = useState<DOMRect|null>(null);
  const [statusAnchor,  setStatusAnchor]  = useState<DOMRect|null>(null);
  const [profileUser,   setProfileUser]   = useState<string|null>(null);
  const [threadAnchor,  setThreadAnchor]  = useState<DOMRect|null>(null);
  const [pinnedAnchor,  setPinnedAnchor]  = useState<DOMRect|null>(null);
  const [showMembers,   setShowMembers]   = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [folderOpen,    setFolderOpen]    = useState(false);
  const [unreadState,   setUnreadState]   = useState<Record<string,{unread:boolean;mention?:number}>>(() =>
    Object.fromEntries(CHANS.map(c => [c.id, { unread: !!c.unread, mention: c.mention }]))
  );
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const me: User = { ...ME, status: myStatus };
  const curMsgs = msgs[activeChanId] ?? [];
  const curChan = CHANS.find(c => c.id === activeChanId);

  const soloServers   = SERVERS.filter(s => !s.folder);
  const folderServers = SERVERS.filter(s => s.folder);
  const serverMembers = [me, ...Object.values(USERS)];

  function send() {
    const text = draft.trim(); if (!text) return;
    const m: Msg = { id: Date.now(), uid:"me", time: new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}), content:text };
    setMsgs(p => ({ ...p, [activeChanId]: [...(p[activeChanId]??[]), m] }));
    setDraft("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior:"smooth" }), 0);
  }

  function react(msgId: number, emoji: string) {
    setMsgs(p => {
      const list = p[activeChanId] ?? [];
      return {
        ...p,
        [activeChanId]: list.map(m => {
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

  function selectMsg(id: number) {
    setSelectedMsgId(prev => prev === id ? null : id);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"auto" });
  }, [activeChanId]);

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", fontFamily:"'gg sans','Noto Sans',system-ui,sans-serif" }}>

      {/* ── Server Rail ──────────────────────────────────────────────────────── */}
      <div data-igg-id="discord.server.list" style={{ width:72, backgroundColor:"#1e1f22", display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 0 8px", gap:4, flexShrink:0, overflowY:"auto" }}>
        <Tip label="Direct Messages" side="right">
          <Link href="/" style={{ width:48, height:48, borderRadius:24, backgroundColor:"#36393f", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", textDecoration:"none" }}>
            <I.Discord/>
          </Link>
        </Tip>
        <div style={{ width:32, height:2, backgroundColor:"#3f4147", margin:"4px 0" }}/>

        {soloServers.map(s => {
          const active = activeSid===s.id;
          return (
            <Tip key={s.id} label={s.label} side="right">
              <div style={{ position:"relative" }}>
                {active && <div style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)", width:4, height:36, backgroundColor:"#fff", borderRadius:"0 4px 4px 0" }}/>}
                <button onClick={()=>{setActiveSid(s.id);setSelectedMsgId(null);}} style={{ width:48, height:48, borderRadius:active?16:24, backgroundColor:s.bg, border:"none", boxShadow:active?"0 0 0 2.5px #3b82f6":"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:s.fg, fontWeight:700, fontSize:14, transition:"border-radius .15s" }}>
                  {s.text}
                </button>
              </div>
            </Tip>
          );
        })}

        {/* Folder */}
        <div style={{ position:"relative" }}>
          {!folderOpen && folderServers.some(s=>s.id===activeSid) && (
            <div style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)", width:4, height:36, backgroundColor:"#fff", borderRadius:"0 4px 4px 0" }}/>
          )}
          <Tip label={folderOpen?"Close Folder":`Community (${folderServers.length})`} side="right">
            <button onClick={()=>setFolderOpen(o=>!o)} style={{ width:48, height:48, borderRadius:folderOpen?10:24, backgroundColor:folderOpen?"#5b2a8c":"#5b2a8c88", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, transition:"border-radius .2s,background .2s", padding:4, overflow:"hidden" }}>
              {folderOpen
                ? <span style={{ fontSize:18 }}>📂</span>
                : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2 }}>
                    {folderServers.slice(0,4).map(s => <div key={s.id} style={{ width:18, height:18, borderRadius:4, backgroundColor:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{s.text}</div>)}
                  </div>
              }
            </button>
          </Tip>
          {folderOpen && (
            <div style={{ marginTop:4, display:"flex", flexDirection:"column", alignItems:"center", gap:3, backgroundColor:"#5b2a8c33", borderRadius:10, padding:"4px 0" }}>
              {folderServers.map(s => {
                const active = activeSid===s.id;
                return (
                  <Tip key={s.id} label={s.label} side="right">
                    <div style={{ position:"relative" }}>
                      {active && <div style={{ position:"absolute", left:-6, top:"50%", transform:"translateY(-50%)", width:4, height:28, backgroundColor:"#fff", borderRadius:"0 4px 4px 0" }}/>}
                      <button onClick={()=>{setActiveSid(s.id);setSelectedMsgId(null);}} style={{ width:40, height:40, borderRadius:active?12:20, backgroundColor:s.bg, border:"none", boxShadow:active?"0 0 0 2px #3b82f6":"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:s.fg, fontWeight:700, fontSize:12, transition:"border-radius .15s" }}>
                        {s.text}
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
          <button style={{ width:48, height:48, borderRadius:24, backgroundColor:"#2b2d31", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🧭</button>
        </Tip>
      </div>

      {/* ── Left Sidebar (channels) ───────────────────────────────────────────── */}
      <div style={{ width:240, backgroundColor:"#2b2d31", display:"flex", flexDirection:"column", flexShrink:0 }}>
        {/* Server header */}
        <div style={{ height:48, borderBottom:"1px solid #1e1f22", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", cursor:"pointer", flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{SERVERS.find(s=>s.id===activeSid)?.label}</span>
          <span style={{ color:"#b5bac1", display:"flex" }}><I.ChevD/></span>
        </div>

        {/* Channels */}
        <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
          {CATS.map(cat => {
            const collapsed = collapsedCats.has(cat.id);
            const catChans  = CHANS.filter(c => c.cat === cat.id);
            return (
              <div key={cat.id} style={{ marginBottom:4 }}>
                <button onClick={()=>toggleCat(cat.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:4, padding:"4px 6px 4px 8px", background:"none", border:"none", cursor:"pointer", color:"#949ba4" }}>
                  <span style={{ display:"flex", transform:collapsed?"rotate(-90deg)":"rotate(0)", transition:"transform .15s" }}><I.ChevD/></span>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".6px", flex:1, textAlign:"left" }}>{cat.name}</span>
                  <span style={{ display:"flex" }}><I.Plus/></span>
                </button>
                {!collapsed && catChans.map(ch => {
                  const act = activeChanId === ch.id;
                  const vu  = VOICE_USERS[ch.id] ?? [];
                  return (
                    <div key={ch.id}>
                      <button onClick={()=>{setActiveChanId(ch.id);setThreadAnchor(null);setPinnedAnchor(null);setSelectedMsgId(null);setUnreadState(p=>({...p,[ch.id]:{unread:false,mention:undefined}}));}} style={{ width:"100%", display:"flex", alignItems:"center", gap:6, padding:"5px 8px 5px 12px", background:act?"#35373c":"none", border:"none", cursor:"pointer", borderRadius:4, marginBottom:1, textAlign:"left" }}>
                        <span style={{ color:"#80848e", display:"flex", flexShrink:0 }}><ChanIcon type={ch.type} locked={ch.locked}/></span>
                        <span style={{ fontSize:14, color:act?"#fff":unreadState[ch.id]?.unread?"#dbdee1":"#8e9297", fontWeight:unreadState[ch.id]?.unread?600:400, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ch.name}</span>
                        {unreadState[ch.id]?.mention ? <span style={{ backgroundColor:"#f23f43", color:"#fff", fontSize:10, fontWeight:700, borderRadius:50, minWidth:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", flexShrink:0 }}>{unreadState[ch.id].mention}</span> : null}
                      </button>
                      {vu.length > 0 && vu.map(uid => {
                        const u2 = USERS[uid]; if (!u2) return null;
                        return (
                          <div key={uid} style={{ display:"flex", alignItems:"center", gap:8, padding:"2px 8px 2px 28px" }}>
                            <Av user={u2} size={20}/>
                            <span style={{ fontSize:12, color:"#87898c" }}>{u2.display}</span>
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

        {/* Bottom user panel */}
        <div style={{ height:52, backgroundColor:"#232428", display:"flex", alignItems:"center", padding:"0 6px", gap:2, flexShrink:0, borderTop:"1px solid #1e1f22" }}>
          <button
            onMouseDown={e=>{e.stopPropagation();setMyProfileAnchor(e.currentTarget.getBoundingClientRect());}}
            style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", padding:"4px 6px", borderRadius:4, flex:1, minWidth:0, textAlign:"left" }}
          >
            <div style={{ position:"relative", flexShrink:0 }}>
              <Av user={me} size={32}/>
              <div
                onMouseDown={e=>{e.stopPropagation();setStatusAnchor(e.currentTarget.getBoundingClientRect());}}
                style={{ position:"absolute", bottom:-1, right:-1, width:13, height:13, borderRadius:"50%", backgroundColor:STATUS_CFG[myStatus].color, border:"2.5px solid #232428", cursor:"pointer", zIndex:1 }}
              />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{me.display}</div>
              <div style={{ fontSize:11, color:"#b5bac1" }}>{STATUS_CFG[myStatus].label}</div>
            </div>
          </button>
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

      {/* ── Chat area ─────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", backgroundColor:"#313338", minWidth:0 }}>

        {/* Top bar */}
        <div style={{ height:48, borderBottom:"1px solid #1e1f22", display:"flex", alignItems:"center", padding:"0 16px", gap:8, flexShrink:0 }}>
          <span style={{ color:"#80848e", display:"flex" }}><ChanIcon type={curChan?.type??"text"} locked={curChan?.locked}/></span>
          <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{curChan?.name}</span>
          {curChan?.topic && <><div style={{ width:1, height:20, backgroundColor:"#3f4147" }}/><span style={{ fontSize:13, color:"#87898c", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180 }}>{curChan.topic}</span></>}
          <div style={{ flex:1 }}/>
          <Tip label="Threads" side="bottom"><button onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setThreadAnchor(a=>a?null:r);setPinnedAnchor(null);setShowMembers(false);}} style={{ background:threadAnchor?"#35373c":"none", border:"none", cursor:"pointer", color:threadAnchor?"#fff":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}><I.Thread/></button></Tip>
          <Tip label={showMembers ? "Hide Member List" : "Show Member List"} side="bottom"><button onClick={()=>{setShowMembers(m=>!m);setProfileUser(null);}} style={{ background:showMembers?"#35373c":"none", border:"none", cursor:"pointer", color:showMembers?"#fff":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}><I.Members/></button></Tip>
          <Tip label="Pinned Messages" side="bottom"><button onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setPinnedAnchor(a=>a?null:r);setThreadAnchor(null);}} style={{ background:pinnedAnchor?"#35373c":"none", border:"none", cursor:"pointer", color:pinnedAnchor?"#fff":"#b5bac1", display:"flex", padding:5, borderRadius:4 }}><I.Pin/></button></Tip>
          {[{ ico:<I.Inbox/>, t:"Inbox" },{ ico:<I.Help/>, t:"Help" }].map((b,i)=>(
            <Tip key={i} label={b.t} side="bottom"><button style={{ background:"none", border:"none", cursor:"pointer", color:"#b5bac1", display:"flex", padding:5, borderRadius:4 }}>{b.ico}</button></Tip>
          ))}
          <div style={{ backgroundColor:"#1e1f22", borderRadius:4, display:"flex", alignItems:"center", padding:"0 8px", gap:4, height:24, width:130 }}>
            <input placeholder="Search" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#dbdee1", fontSize:12, minWidth:0 }}/>
            <span style={{ color:"#87898c", display:"flex", flexShrink:0 }}><I.Search/></span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 0 4px" }}>
          <div style={{ padding:"0 16px 20px", borderBottom:"1px solid #3f4147", marginBottom:16 }}>
            <div style={{ width:68, height:68, borderRadius:"50%", backgroundColor:"#36393f", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}><ChanIcon type={curChan?.type??"text"} locked={curChan?.locked}/></div>
            <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginBottom:4 }}>#{curChan?.name} welcome!</div>
            <div style={{ fontSize:14, color:"#87898c" }}>{curChan?.topic ?? "This is the beginning of this channel."}</div>
          </div>

          {curMsgs.map((msg, idx) => (
            <MsgRow
              key={msg.id}
              msg={msg}
              prev={curMsgs[idx-1]}
              hovered={hoveredMsg===msg.id}
              selected={selectedMsgId===msg.id}
              onHover={setHoveredMsg}
              onReact={react}
              onSelect={selectMsg}
            />
          ))}
          <div ref={endRef}/>
        </div>

        {/* Input */}
        <div style={{ padding:"0 16px 16px", flexShrink:0 }}>
          {(muted || deafened) && (
            <div style={{ background:"#f23f4322", border:"1px solid #f23f4355", borderRadius:6, padding:"5px 12px", marginBottom:8, fontSize:12, color:"#f23f43" }}>
              {deafened ? "🔇 You are deafened." : "🎙️ You are muted."}
            </div>
          )}
          <div style={{ backgroundColor:"#383a40", borderRadius:8, display:"flex", alignItems:"center", gap:2, padding:"0 8px" }}>
            <Tip label="Attach File" side="top">
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#87898c", display:"flex", padding:8, borderRadius:4 }}><I.Plus/></button>
            </Tip>
            <input
              ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder={`#${curChan?.name??""}`}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#dbdee1", fontSize:14, padding:"11px 4px", minWidth:0 }}
            />
            <div style={{ display:"flex", gap:1 }}>
              {[{ico:<I.Gift/>,t:"Gifts"},{ico:<I.Gif/>,t:"GIF"},{ico:<I.Emoji/>,t:"Emoji"}].map((b,i)=>(
                <Tip key={i} label={b.t} side="top"><button style={{ background:"none", border:"none", cursor:"pointer", color:"#87898c", display:"flex", padding:5, borderRadius:4 }}>{b.ico}</button></Tip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Members panel ─────────────────────────────────────────────────────── */}
      {showMembers && !profileUser && (
        <div style={{ width:240, backgroundColor:"#2b2d31", display:"flex", flexDirection:"column", flexShrink:0, borderLeft:"1px solid #1e1f22" }}>
          <div style={{ height:48, display:"flex", alignItems:"center", padding:"0 16px", fontSize:11, fontWeight:700, color:"#949ba4", textTransform:"uppercase", letterSpacing:".6px", borderBottom:"1px solid #1e1f22", flexShrink:0 }}>
            Members — {serverMembers.length}
          </div>
          <div data-igg-id="discord.member.list" style={{ flex:1, overflowY:"auto", padding:8 }}>
            {["online","idle","dnd","invisible"].map(st => {
              const group = serverMembers.filter(u => u.status === st);
              if (group.length === 0) return null;
              const label = st==="invisible" ? "Offline" : STATUS_CFG[st as Status].label;
              return (
                <div key={st}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#949ba4", textTransform:"uppercase", letterSpacing:".6px", padding:"8px 4px 4px" }}>{label} — {group.length}</div>
                  {group.map(u => (
                    <button key={u.id} onClick={()=>setProfileUser(u.id==="me"?null:u.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"6px 8px", background:"none", border:"none", cursor:"pointer", borderRadius:4, opacity:st==="invisible"?.5:1, textAlign:"left" }}>
                      <Av user={u} size={32} dot={true} dotBg="#2b2d31"/>
                      <span style={{ fontSize:14, color:"#b5bac1" }}>{u.display}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile right panel */}
      {profileUser && USERS[profileUser] && <ProfilePanel user={USERS[profileUser]} onClose={()=>setProfileUser(null)}/>}

      {/* ── Portals ──────────────────────────────────────────────────────────── */}
      {myProfileAnchor && (
        <MyProfileCard user={me} anchor={myProfileAnchor} onClose={()=>setMyProfileAnchor(null)} onStatusChange={s=>{setMyStatus(s);}}/>
      )}
      {statusAnchor && (
        <StatusPicker anchor={statusAnchor} current={myStatus} onSelect={s=>{setMyStatus(s);setStatusAnchor(null);}} onClose={()=>setStatusAnchor(null)}/>
      )}
      {threadAnchor && (
        <ThreadDropdown chanId={activeChanId} anchor={threadAnchor} onClose={()=>setThreadAnchor(null)}/>
      )}
      {pinnedAnchor && (
        <PinnedDropdown chanId={activeChanId} anchor={pinnedAnchor} onClose={()=>setPinnedAnchor(null)}/>
      )}
    </div>
  );
}
