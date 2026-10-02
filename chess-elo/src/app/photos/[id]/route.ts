import { readPhoto } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/photos/[id]">) {
  const { id } = await ctx.params;
  const photo = await readPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo), {
    headers: {
      "Content-Type": "image/jpeg",
      // URLs carry ?v=<photoVersion>, so a new upload gets a new URL.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
