import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PlayFlow } from "@/components/play/play-flow";
import { EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { getRatings } from "@/lib/store";

export const metadata: Metadata = { title: "New match" };

export default async function PlayPage() {
  const { standings } = await getRatings();
  const players = standings
    .map((s) => ({
      id: s.player.id,
      name: s.player.name,
      photoVersion: s.player.photoVersion,
      rating: s.rating,
      games: s.games,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (players.length >= 2) return <PlayFlow players={players} />;

  return (
    <>
      <PageHeader title="New match" back="/" />
      <EmptyState
        title="You need two players"
        body="Add at least two friends to start a match."
        action={
          <PrimaryLink href="/players/new">
            <Plus className="h-5 w-5" /> Add player
          </PrimaryLink>
        }
      />
    </>
  );
}
