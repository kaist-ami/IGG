import { redirect } from "next/navigation";
import { DocsHomePage } from "./docs-client";
import { getDocsBenchmarkState } from "./docs-states";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ stateId?: string; stateid?: string }>;
}) {
  const { stateId: stateIdCamel, stateid: stateIdLower } = await searchParams;
  const stateId = stateIdCamel ?? stateIdLower;
  const benchmarkState = getDocsBenchmarkState(stateId);

  if (stateId && benchmarkState.screen === "editor") {
    redirect(`/document/doc-benchmark?stateId=${stateId}`);
  }

  return <DocsHomePage initialStateId={stateId} />;
}
