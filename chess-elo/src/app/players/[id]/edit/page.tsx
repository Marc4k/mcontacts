import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerForm } from "@/components/player-form";
import { PageHeader } from "@/components/ui";
import { getRatings } from "@/lib/store";

export const metadata: Metadata = { title: "Edit player" };

export default async function EditPlayerPage({ params }: PageProps<"/players/[id]/edit">) {
  const { id } = await params;
  const { standings } = await getRatings();
  const standing = standings.find((s) => s.player.id === id);
  if (!standing) notFound();

  return (
    <>
      <PageHeader title="Edit player" back={`/players/${id}`} />
      <PlayerForm player={standing.player} canDelete={standing.games === 0} />
    </>
  );
}
