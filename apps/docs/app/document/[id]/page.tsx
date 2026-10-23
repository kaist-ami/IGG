import { notFound } from "next/navigation";

import { DocsEditorPage } from "../../docs-client";
import { getDocumentById } from "../../docs-data";

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string; stateId?: string; stateid?: string }>;
}) {
  const { id } = await params;
  const { template, stateId: stateIdCamel, stateid: stateIdLower } = await searchParams;
  const stateId = stateIdCamel ?? stateIdLower;

  if (id !== "new" && !getDocumentById(id)) {
    notFound();
  }

  return <DocsEditorPage initialDocId={id} initialTemplateId={template} initialStateId={stateId} />;
}
