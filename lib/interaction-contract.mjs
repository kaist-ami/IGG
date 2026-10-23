export const ACTION_TYPES = Object.freeze(["scroll", "move", "drag", "wait", "click", "hover"]);

export const DEFAULT_VIEWPORT = Object.freeze({ width: 1440, height: 900 });

export const APP_CONFIGS = Object.freeze({
  discord: {
    app: "discord",
    baseUrl: "http://localhost:3205",
    datasetPath: "dataset/main/discord-dataset.json",
    outputDir: "results/discord",
    runtimeStateKey: "__DISCORD_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:discord:port3205"]],
    envBaseUrl: "DISCORD_POC_BASE_URL",
  },
  docs: {
    app: "docs",
    baseUrl: "http://localhost:3204",
    datasetPath: "dataset/main/docs-dataset.json",
    outputDir: "results/docs",
    runtimeStateKey: "__DOCS_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:docs:port3204"]],
    envBaseUrl: "DOCS_POC_BASE_URL",
  },
  dayplan: {
    app: "dayplan",
    baseUrl: "http://localhost:3209",
    datasetPath: "dataset/main/dayplan-dataset.json",
    outputDir: "results/dayplan",
    runtimeStateKey: "__DAYPLAN_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:dayplan:port3209"]],
    envBaseUrl: "DAYPLAN_POC_BASE_URL",
  },
  devhub: {
    app: "devhub",
    baseUrl: "http://localhost:3208",
    datasetPath: "dataset/main/devhub-dataset.json",
    outputDir: "results/devhub",
    runtimeStateKey: "__DEVHUB_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:devhub:port3208"]],
    envBaseUrl: "DEVHUB_POC_BASE_URL",
  },
  devpad: {
    app: "devpad",
    baseUrl: "http://localhost:3213",
    datasetPath: "dataset/main/devpad-dataset.json",
    outputDir: "results/devpad",
    runtimeStateKey: "__DEVPAD_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:devpad:port3213"]],
    envBaseUrl: "DEVPAD_POC_BASE_URL",
  },
  figma: {
    app: "figma",
    baseUrl: "http://localhost:3202",
    datasetPath: "dataset/main/figma-dataset.json",
    outputDir: "results/figma",
    runtimeStateKey: "__FIGMA_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:figma:port3202"]],
    envBaseUrl: "FIGMA_POC_BASE_URL",
  },
  gridly: {
    app: "gridly",
    baseUrl: "http://localhost:3211",
    datasetPath: "dataset/main/gridly-dataset.json",
    outputDir: "results/gridly",
    runtimeStateKey: "__GRIDLY_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:gridly:port3211"]],
    envBaseUrl: "GRIDLY_POC_BASE_URL",
  },
  never: {
    app: "never",
    baseUrl: "http://localhost:3201",
    datasetPath: "dataset/main/never-dataset.json",
    outputDir: "results/never",
    runtimeStateKey: "__NEVER_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:never:port3201"]],
    envBaseUrl: "NEVER_POC_BASE_URL",
  },
  shopping: {
    app: "shopping",
    baseUrl: "http://localhost:3100",
    datasetPath: "dataset/main/shopping-dataset.json",
    outputDir: "results/shopping",
    runtimeStateKey: "__SHOPPING_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:shopping:port3100"]],
    envBaseUrl: "SHOPPING_POC_BASE_URL",
  },
  wayfind: {
    app: "wayfind",
    baseUrl: "http://localhost:3212",
    datasetPath: "dataset/main/wayfind-dataset.json",
    outputDir: "results/wayfind",
    runtimeStateKey: "__WAYFIND_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:wayfind:port3212"]],
    envBaseUrl: "WAYFIND_POC_BASE_URL",
  },
  youtube: {
    app: "youtube",
    baseUrl: "http://localhost:3203",
    datasetPath: "dataset/main/youtube-dataset.json",
    outputDir: "results/youtube",
    runtimeStateKey: "__YOUTUBE_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:youtube:port3203"]],
    envBaseUrl: "YOUTUBE_POC_BASE_URL",
  },
  mailo: {
    app: "mailo",
    baseUrl: "http://localhost:3207",
    datasetPath: "dataset/main/mailo-dataset.json",
    outputDir: "results/mailo",
    runtimeStateKey: "__MAILO_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:mailo:port3207"]],
    envBaseUrl: "MAILO_POC_BASE_URL",
  },
  chirp: {
    app: "chirp",
    baseUrl: "http://localhost:3215",
    datasetPath: "dataset/main/chirp-dataset.json",
    outputDir: "results/chirp",
    runtimeStateKey: "__CHIRP_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:chirp:port3215"]],
    envBaseUrl: "CHIRP_POC_BASE_URL",
  },
  pagely: {
    app: "pagely",
    baseUrl: "http://localhost:3214",
    datasetPath: "dataset/main/pagely-dataset.json",
    outputDir: "results/pagely",
    runtimeStateKey: "__PAGELY_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:pagely:port3214"]],
    envBaseUrl: "PAGELY_POC_BASE_URL",
  },
  wavr: {
    app: "wavr",
    baseUrl: "http://localhost:3216",
    datasetPath: "dataset/main/wavr-dataset.json",
    outputDir: "results/wavr",
    runtimeStateKey: "__WAVR_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:wavr:port3216"]],
    envBaseUrl: "WAVR_POC_BASE_URL",
  },
  reelify: {
    app: "reelify",
    baseUrl: "http://localhost:3217",
    datasetPath: "dataset/main/reelify-dataset.json",
    outputDir: "results/reelify",
    runtimeStateKey: "__REELIFY_BENCHMARK_STATE__",
    devCommand: ["npm", ["run", "dev:reelify:port3217"]],
    envBaseUrl: "REELIFY_POC_BASE_URL",
  },
});

export function normalizeActionType(type) {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (normalized === "mouseover") return "move";
  if (normalized === "hover") return "move";
  return normalized;
}

export function isCoordinateAction(action) {
  return Number.isFinite(action?.x) && Number.isFinite(action?.y);
}

export function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeRuntimeAction(rawAction) {
  const type = normalizeActionType(rawAction?.type);
  if (!ACTION_TYPES.includes(type) && type !== "hover") {
    throw new Error(`Unsupported action type: ${String(rawAction?.type ?? "")}`);
  }

  const action = { type: type === "hover" ? "move" : type };
  if (typeof rawAction.selector === "string" && rawAction.selector.trim()) {
    action.selector = rawAction.selector.trim();
  }
  if (typeof rawAction.label === "string") action.label = rawAction.label;

  for (const key of ["x", "y", "startX", "startY", "endX", "endY", "dy", "ms"]) {
    const number = toFiniteNumber(rawAction[key]);
    if (number !== null) action[key] = number;
  }

  return action;
}

export function actionForTrace(rawAction) {
  const action = normalizeRuntimeAction(rawAction);
  return Object.fromEntries(
    Object.entries(action).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function buildTaskUrl(baseUrl, task, dataset = {}) {
  const baseRoute = task.base_route ?? dataset.base_route ?? "/";
  const url = new URL(baseRoute, baseUrl);
  if (task.state_id !== undefined && task.state_id !== null) {
    url.searchParams.set("stateId", String(task.state_id));
  }
  return url.toString();
}
