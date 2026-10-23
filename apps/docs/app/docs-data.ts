export type LibraryTab = "recent" | "owned" | "shared" | "starred";
export type EditorMode = "editing" | "suggesting" | "viewing";
export type RightPanel = "comments" | "activity" | "outline";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type Section =
  | {
      id: string;
      type: "heading";
      text: string;
      level?: 1 | 2 | 3;
    }
  | {
      id: string;
      type: "paragraph";
      text: string;
    }
  | {
      id: string;
      type: "bullet";
      items: string[];
    }
  | {
      id: string;
      type: "checklist";
      items: ChecklistItem[];
    }
  | {
      id: string;
      type: "callout";
      title: string;
      text: string;
    };

export type DocumentRecord = {
  id: string;
  title: string;
  folder: string;
  owner: string;
  badge: string;
  status: "Draft" | "Review" | "Ready";
  lastEdited: string;
  lastEditedSort: number;
  shared: boolean;
  starred: boolean;
  color: string;
  summary: string;
  displayDate: string;
  outline: string[];
  collaborators: string[];
  sections: Section[];
};

export type HomeTemplateRecord = {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
  preview: "blank" | "resume" | "report" | "letter" | "proposal" | "brochure" | "memo";
};

export type HomeRecentDocumentRecord = {
  id: string;
  title: string;
  owner: string;
  displayDate: string;
  summary: string;
  accent: string;
  previewTone: "lavender" | "blue" | "amber" | "mint" | "rose" | "slate";
};

export const templates = [
  { id: "blank", name: "Blank document", accent: "#1a73e8", description: "Start editing a blank document" },
  { id: "brief", name: "Research brief", accent: "#0b8043", description: "Organize benchmark goals and metrics" },
  { id: "review", name: "Experiment review", accent: "#b06000", description: "Analyze results and capture issues" },
  { id: "checklist", name: "Task checklist", accent: "#9334e6", description: "Organize GUI grounding tasks by level" },
] as const;

export const initialDocs: DocumentRecord[] = [
  {
    id: "doc-benchmark",
    title: "Product Research Weekly Brief",
    folder: "Shared drives / Benchmark",
    owner: "Ella",
    badge: "Brief",
    status: "Review",
    lastEdited: "9 minutes ago",
    lastEditedSort: 1,
    shared: true,
    starred: true,
    color: "#e8f0fe",
    summary: "Internal research brief summarizing user interviews, key insights, and upcoming experiment plans.",
    displayDate: "Apr 11, 2026",
    outline: [
      "Weekly Research Snapshot",
      "Participant Profiles",
      "Interview Setup",
      "Context Notes",
      "Interview Themes",
      "Raw Quotes",
      "Pain Point Clusters",
      "Observed Friction Points",
      "Screenshots to Review",
      "Opportunity Areas",
      "Open Threads",
      "Experiment Ideas",
      "Experiment Risks",
      "Follow-up Questions",
      "Open Questions",
      "Next Week Agenda",
      "Evaluation Notes",
    ],
    collaborators: ["Ella", "Jiyoon", "Daisy", "Research TA"],
    sections: [
      { id: "h1", type: "heading", text: "Weekly Research Snapshot", level: 1 },
      { id: "p1", type: "paragraph", text: "This brief summarizes user interviews, product observations, and follow-up actions gathered during this week’s research cycle. The goal is to capture practical signals that can inform navigation, onboarding, and editing flow improvements without overfitting to any one participant request." },
      { id: "p2", type: "paragraph", text: "Across interviews, participants responded positively to clear structure, predictable controls, and documents that felt easy to scan at a glance. Friction appeared when actions were visually available but their impact was unclear, especially in dense workspaces with multiple side panels and floating controls." },
      { id: "c1", type: "callout", title: "Research scope", text: "This document is intentionally lightweight. It is not a formal study report; instead, it collects practical observations, recurring themes, and next-step proposals that can be reviewed quickly by design, product, and engineering partners." },
      { id: "h2", type: "heading", text: "Interview Themes", level: 2 },
      { id: "h3", type: "heading", text: "Patterns We Heard Repeatedly", level: 3 },
      { id: "b1", type: "bullet", items: [
        "Participants want the first screen to communicate status quickly: what is recent, what is shared, and what needs attention.",
        "People prefer familiar language over system terminology, especially for mode switching, comments, and sharing controls.",
        "Dense interfaces are acceptable when visual grouping is strong; clutter becomes a problem when hierarchy is weak.",
        "Users expect navigation aids such as outline, comments, and activity to stay available while reading long documents.",
      ]},
      { id: "p4", type: "paragraph", text: "A recurring note from participants was that they felt more confident when the interface preserved context during transitions. For example, jumping between the main document area and supporting panels felt easier when panel labels remained visible and the current state was easy to recover after interruptions." },
      { id: "p5", type: "paragraph", text: "Several people also mentioned that they interpret visual density differently depending on purpose. A dashboard-like home view can support many items at once, but editing views should prioritize stability and reading comfort over sheer information volume." },
      { id: "h3b", type: "heading", text: "Observed Friction Points", level: 3 },
      { id: "b1b", type: "bullet", items: [
        "Mode selection is not always self-explanatory; some users are unsure whether a change affects editing behavior or only review workflow.",
        "Secondary actions hidden behind small buttons can feel risky when users are not sure what menu will appear.",
        "Right-side panels compete with the main document if labels are cramped or if states are not visually distinct.",
        "Top toolbars are useful, but only when the most common actions are easy to spot without reading every icon.",
      ]},
      { id: "p6", type: "paragraph", text: "The strongest negative reactions came from moments where participants hesitated before acting. In most cases the issue was not lack of available functionality, but uncertainty about consequence: they could see the control, but not its role in the flow." },
      { id: "h4", type: "heading", text: "Opportunity Areas", level: 2 },
      { id: "b2", type: "bullet", items: [
        "Make view switching and sorting options more explicit through clearer labels and stronger hover feedback.",
        "Treat side panels as persistent companions rather than temporary overlays when users are reading long documents.",
        "Use section anchors and document outline affordances to reduce the feeling of getting lost in longer reports.",
        "Reserve floating overlays for genuinely urgent information; otherwise, keep the reading surface stable.",
      ]},
      { id: "p6b", type: "paragraph", text: "An especially promising direction is to improve orientation rather than raw discoverability. Participants usually found the relevant area eventually, but they benefited from cues that confirmed where they were and what state the document was in." },
      { id: "h4b", type: "heading", text: "Experiment Ideas", level: 2 },
      { id: "b3", type: "bullet", items: [
        "Test whether a slightly smaller menu bar with clearer dropdown behavior reduces hesitation in first-time users.",
        "Compare icon-only versus icon-plus-label treatments for editing controls that are commonly confused.",
        "Prototype a compact right panel header with stronger active-state emphasis to reduce tab ambiguity.",
        "Explore whether a richer document outline encourages scrolling confidence in long-form reading tasks.",
      ]},
      { id: "p6c", type: "paragraph", text: "These experiments should be lightweight and observable. The objective is not to prove a final system, but to quickly learn which interface changes make users feel more certain and more oriented while they work." },
      { id: "h4c", type: "heading", text: "Open Questions", level: 2 },
      { id: "p6d", type: "paragraph", text: "How much density is useful on the home screen before scanning becomes tiring? Participants differ here, and the answer may depend on whether they are browsing, searching, or returning to a known document." },
      { id: "p6e", type: "paragraph", text: "Should persistent side panels be optimized for quick glanceability or for richer detail? The current pattern tries to do both, which may be why labels and states feel cramped at smaller widths." },
      { id: "b4", type: "bullet", items: [
        "What is the minimum set of visible cues needed to make document state obvious?",
        "Which controls truly deserve toolbar prominence versus dropdown placement?",
        "How should long documents balance reading comfort with persistent navigation support?",
      ]},
      { id: "h5", type: "heading", text: "Evaluation Notes", level: 2 },
      { id: "cl1", type: "checklist", items: [
        { id: "cl1-1", label: "Organize this week's interview notes", done: true },
        { id: "cl1-2", label: "Prepare top bar A/B design options", done: false },
        { id: "cl1-3", label: "Share side panel label improvements", done: false },
        { id: "cl1-4", label: "Incorporate home screen density feedback", done: true },
        { id: "cl1-5", label: "Switch to Suggesting mode", done: false },
      ]},
      { id: "p7", type: "paragraph", text: "Current take: people value clarity over novelty in document tools. A familiar structure is fine, but each area should communicate purpose more strongly so users do not pause to interpret controls that should feel routine." },
      { id: "p8", type: "paragraph", text: "Next revision should translate these observations into a concrete design checklist: home view hierarchy, editing toolbar readability, persistent navigation support, and lightweight panel behavior for comments and collaborators." },
    ],
  },
];

export const homeTemplateGallery: HomeTemplateRecord[] = [
  { id: "blank", name: "Blank document", subtitle: "", accent: "#1a73e8", preview: "blank" },
  { id: "research-brief", name: "Research brief", subtitle: "Research", accent: "#0b8043", preview: "report" },
  { id: "resume", name: "Resume", subtitle: "Serif", accent: "#9c6b4f", preview: "resume" },
  { id: "resume-modern", name: "Resume", subtitle: "Coral", accent: "#e76f51", preview: "report" },
  { id: "letter", name: "Letter", subtitle: "Mint", accent: "#54b38a", preview: "letter" },
  { id: "project-proposal", name: "Project proposal", subtitle: "Walker", accent: "#c9a06a", preview: "proposal" },
  { id: "brochure", name: "Brochure", subtitle: "Geo", accent: "#8a5cf6", preview: "brochure" },
  { id: "report", name: "Report", subtitle: "Luxury", accent: "#795548", preview: "memo" },
  { id: "meeting-notes", name: "Meeting notes", subtitle: "Simple", accent: "#0f766e", preview: "letter" },
  { id: "weekly-plan", name: "Weekly plan", subtitle: "Light", accent: "#2563eb", preview: "report" },
  { id: "product-brief", name: "Product brief", subtitle: "Modern", accent: "#db2777", preview: "brochure" },
  { id: "research-log", name: "Research log", subtitle: "Notes", accent: "#d97706", preview: "memo" },
  { id: "team-update", name: "Team update", subtitle: "Clean", accent: "#4f46e5", preview: "proposal" },
  { id: "case-study", name: "Case study", subtitle: "Editorial", accent: "#059669", preview: "resume" },
];

export const homeRecentDocuments: HomeRecentDocumentRecord[] = [
  {
    id: "mock-annotation-guide",
    title: "Shared Annotation Guide",
    owner: "Daisy",
    displayDate: "Apr 10, 2026",
    summary: "Guide for annotation workflow and shared comment rules",
    accent: "#06b6d4",
    previewTone: "blue",
  },
  {
    id: "mock-kaist",
    title: "Monthly Partnership Check-in",
    owner: "Daisy",
    displayDate: "11:46 AM",
    summary: "Meeting document with pink highlights and many comments",
    accent: "#f472b6",
    previewTone: "lavender",
  },
  {
    id: "mock-survey",
    title: "Northern Region Operations Minutes",
    owner: "Ella",
    displayDate: "Apr 9, 2026",
    summary: "Agent benchmark overview and section outline",
    accent: "#4f46e5",
    previewTone: "blue",
  },
  {
    id: "mock-rebuttal",
    title: "Studio Alpha QA Notes",
    owner: "Daisy",
    displayDate: "Mar 23, 2026",
    summary: "Long-form document with rebuttal points and tables",
    accent: "#a16207",
    previewTone: "amber",
  },
  {
    id: "mock-review-skill",
    title: "New Onboarding Draft v2",
    owner: "Ella",
    displayDate: "Feb 21, 2026",
    summary: "Draft focused on short sections and summary boxes",
    accent: "#0f766e",
    previewTone: "mint",
  },
  {
    id: "mock-cvpr",
    title: "Brand Campaign Review Notes",
    owner: "Daisy",
    displayDate: "Feb 21, 2026",
    summary: "Comments and metric summary blocks",
    accent: "#2563eb",
    previewTone: "blue",
  },
  {
    id: "mock-profit",
    title: "Quarterly Operations Retrospective",
    owner: "Ella",
    displayDate: "Jan 28, 2026",
    summary: "Dense review items organized by category",
    accent: "#7c3aed",
    previewTone: "slate",
  },
  {
    id: "mock-arch-1",
    title: "Team Hub Overview",
    owner: "Daisy",
    displayDate: "Dec 23, 2025",
    summary: "System design document with tables and boxes",
    accent: "#64748b",
    previewTone: "slate",
  },
  {
    id: "mock-beat-boxer",
    title: "Pilot Project Overview",
    owner: "Ella",
    displayDate: "Dec 18, 2025",
    summary: "Project structure and schedule tables",
    accent: "#ef4444",
    previewTone: "rose",
  },
  {
    id: "mock-arch-2",
    title: "Client Meeting Agenda",
    owner: "Daisy",
    displayDate: "Oct 18, 2025",
    summary: "Detailed notes and tables per component",
    accent: "#f97316",
    previewTone: "amber",
  },
  {
    id: "mock-qlib",
    title: "Research Task Backlog",
    owner: "Ella",
    displayDate: "Sep 22, 2025",
    summary: "Long-form proposal in single-column draft format",
    accent: "#0ea5e9",
    previewTone: "mint",
  },
  {
    id: "mock-orbit",
    title: "Operations Snapshot",
    owner: "Daisy",
    displayDate: "Sep 18, 2025",
    summary: "Short notes and approval items",
    accent: "#14b8a6",
    previewTone: "mint",
  },
  {
    id: "mock-canvas",
    title: "Campus Renewal Ideas",
    owner: "Ella",
    displayDate: "Sep 10, 2025",
    summary: "Brainstorming document for collecting ideas",
    accent: "#8b5cf6",
    previewTone: "lavender",
  },
  {
    id: "mock-summit",
    title: "Summit Presentation Draft",
    owner: "Daisy",
    displayDate: "Aug 28, 2025",
    summary: "Slide notes and presentation flow",
    accent: "#f59e0b",
    previewTone: "amber",
  },
  {
    id: "mock-harbor",
    title: "Harbor Team Operations Checklist",
    owner: "Ella",
    displayDate: "Aug 11, 2025",
    summary: "Operations items and owner progress",
    accent: "#0284c7",
    previewTone: "blue",
  },
  {
    id: "mock-mintlab",
    title: "MintLab Interview Log",
    owner: "Daisy",
    displayDate: "Jul 30, 2025",
    summary: "User quotes and tag organization",
    accent: "#22c55e",
    previewTone: "mint",
  },
  {
    id: "mock-april",
    title: "April Client Feedback",
    owner: "Ella",
    displayDate: "Jul 22, 2025",
    summary: "Revision requests and priority notes",
    accent: "#fb7185",
    previewTone: "rose",
  },
  {
    id: "mock-echo",
    title: "Echo Project Meeting Archive",
    owner: "Daisy",
    displayDate: "Jul 14, 2025",
    summary: "Meeting agenda and follow-up actions",
    accent: "#6366f1",
    previewTone: "slate",
  },
  {
    id: "mock-sunrise",
    title: "Sunrise Team Kickoff",
    owner: "Ella",
    displayDate: "Jun 29, 2025",
    summary: "Kickoff agenda and role assignments",
    accent: "#f97316",
    previewTone: "amber",
  },
  {
    id: "mock-metro",
    title: "Metro Pilot Results Summary",
    owner: "Daisy",
    displayDate: "Jun 18, 2025",
    summary: "Experiment results and conclusion notes",
    accent: "#3b82f6",
    previewTone: "blue",
  },
  {
    id: "mock-olive",
    title: "Olive Studio Requests",
    owner: "Ella",
    displayDate: "Jun 10, 2025",
    summary: "Design revision request list",
    accent: "#84cc16",
    previewTone: "mint",
  },
  {
    id: "mock-grid",
    title: "Grid System Experiment",
    owner: "Daisy",
    displayDate: "May 27, 2025",
    summary: "Layout comparison and feedback",
    accent: "#64748b",
    previewTone: "slate",
  },
  {
    id: "mock-lumen",
    title: "Lumen Research Capture",
    owner: "Ella",
    displayDate: "May 19, 2025",
    summary: "Research links and one-line comments",
    accent: "#a855f7",
    previewTone: "lavender",
  },
  {
    id: "mock-corner",
    title: "Edge Case Notes",
    owner: "Daisy",
    displayDate: "May 2, 2025",
    summary: "Exception scenarios and QA checkpoints",
    accent: "#ef4444",
    previewTone: "rose",
  },
  {
    id: "mock-forge",
    title: "Forge Roadmap Sketch",
    owner: "Ella",
    displayDate: "Apr 18, 2025",
    summary: "Quarterly roadmap draft and schedule",
    accent: "#0f766e",
    previewTone: "mint",
  },
  {
    id: "mock-river",
    title: "River Test Log",
    owner: "Daisy",
    displayDate: "Apr 2, 2025",
    summary: "Execution results and brief notes",
    accent: "#2563eb",
    previewTone: "blue",
  },
];

export const toolbarFonts = ["Arial", "Google Sans", "Times New Roman", "Courier Prime"];

export const commentThreads = [
  ["Jiyoon", "Could we make Level 3 include a modal-based interaction?", "2 min ago"],
  ["Daisy", "Home screen search flow looks good. Need one more shared-doc example.", "18 min ago"],
  ["Ella", "Checklist blocks now make state transitions visible.", "35 min ago"],
] as const;

export const activityItems = [
  "Ella renamed the document title.",
  "Suggestion mode was toggled during QA.",
  "Checklist block updated to reflect Level 4 tasks.",
  "Share dialog permissions changed from Viewer to Commenter.",
];

export function getDocumentById(id: string) {
  return initialDocs.find((doc) => doc.id === id);
}

export function createDraftDocument(templateId: string): DocumentRecord {
  const templateName = templates.find((item) => item.id === templateId)?.name ?? "Blank document";
  const title = templateId === "blank" ? "Untitled document" : `${templateName} Copy`;

  return {
    id: "doc-new",
    title,
    folder: "My Drive / Docs Mock",
    owner: "Ella",
    badge: "New",
    status: "Draft",
    lastEdited: "Just now",
    lastEditedSort: 0,
    shared: false,
    starred: false,
    color: "#e8f0fe",
    summary: "Newly created document. Start editing right away.",
    displayDate: "Apr 11, 2026",
    outline: ["Intro", "Tasks", "Notes"],
    collaborators: ["Ella"],
    sections: [
      { id: "doc-new-h1", type: "heading", text: title, level: 1 },
      { id: "doc-new-p1", type: "paragraph", text: "A new document has been created. Try editing the title or using the toolbar, share, comments, and find/replace." },
      { id: "doc-new-cl1", type: "checklist", items: [
        { id: "doc-new-cl1-1", label: "Edit document title", done: false },
        { id: "doc-new-cl1-2", label: "Switch to Suggesting mode", done: false },
        { id: "doc-new-cl1-3", label: "Open the share modal", done: false },
      ]},
    ],
  };
}
