import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AgentDetailPage } from "@/components/AgentDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RegistryDetail({ params }: PageProps) {
  const { id } = await params;

  // card:* IDs are synthetic — send user straight to the profile page
  if (id.startsWith("card:")) {
    const handle = id.slice("card:".length);
    redirect(`/p/${handle}`);
  }

  return (
    <Suspense>
      <AgentDetailPage params={params} />
    </Suspense>
  );
}
