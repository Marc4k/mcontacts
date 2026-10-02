"use client";

import { formatDate } from "./ui";

/** Formats on the viewer's device so "Today" uses their timezone. */
export function When({ iso, time }: { iso: string; time?: boolean }) {
  const d = new Date(iso);
  const text = time
    ? `${formatDate(iso)}, ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    : formatDate(iso);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
