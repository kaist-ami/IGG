import { YouTubeHomePage, YouTubeWatchPage } from "./youtube-client";
import { getYouTubeBenchmarkState } from "./youtube-states";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ stateId?: string; stateid?: string }>;
}) {
  const { stateId: stateIdCamel, stateid: stateIdLower } = await searchParams;
  const stateId = stateIdCamel ?? stateIdLower ?? "1";
  const benchmarkState = getYouTubeBenchmarkState(stateId);
  const videoId = benchmarkState.selectedVideoId;

  if (benchmarkState.viewMode === "watch") {
    return <YouTubeWatchPage videoId={videoId} initialStateId={stateId} />;
  }

  return <YouTubeHomePage initialStateId={stateId} />;
}
