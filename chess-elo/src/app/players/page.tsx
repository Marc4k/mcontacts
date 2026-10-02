import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LogOut, Plus } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { getRatings } from "@/lib/store";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage() {
  const { standings } = await getRatings();
  const players = [...standings].sort((a, b) => a.player.name.localeCompare(b.player.name));

  return (
    <>
      <PageHeader
        title="Players"
        subtitle={players.length ? `${players.length} in the club` : undefined}
        action={
          players.length > 0 && (
            <Link
              href="/players/new"
              aria-label="Add player"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </Link>
          )
        }
      />
      {players.length === 0 ? (
        <EmptyState
          title="No players yet"
          body="Add each friend with a name and a photo."
          action={
            <PrimaryLink href="/players/new">
              <Plus className="h-5 w-5" /> Add player
            </PrimaryLink>
          }
        />
      ) : (
        <ul className="card mx-5 divide-y divide-line overflow-hidden">
          {players.map((s) => (
            <li key={s.player.id}>
              <Link href={`/players/${s.player.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
                <Avatar player={s.player} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{s.player.name}</div>
                  <div className="tabular text-xs text-muted">
                    {s.rating} Elo · {s.games} {s.games === 1 ? "game" : "games"}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <form action={logout} className="mt-8 text-center">
        <button type="submit" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </form>
    </>
  );
}
