import type { Metadata } from "next";
import { PlayerForm } from "@/components/player-form";
import { PageHeader } from "@/components/ui";
import { INITIAL_RATING } from "@/lib/elo";

export const metadata: Metadata = { title: "New player" };

export default function NewPlayerPage() {
  return (
    <>
      <PageHeader title="New player" subtitle={`Starts at ${INITIAL_RATING} Elo`} back="/players" />
      <PlayerForm />
    </>
  );
}
