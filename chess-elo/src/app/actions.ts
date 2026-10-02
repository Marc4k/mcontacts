"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RatedGame } from "@/lib/elo";
import * as store from "@/lib/store";

export type FormState = { error?: string };

function message(err: unknown) {
  if (err instanceof store.ValidationError) return err.message;
  console.error(err);
  return "Something went wrong. Please try again.";
}

export async function savePlayer(_prev: FormState, formData: FormData): Promise<FormState> {
  let id: string;
  try {
    const player = await store.savePlayer({
      id: (formData.get("id") as string) || undefined,
      name: String(formData.get("name") ?? ""),
      photo: (formData.get("photo") as string) || undefined,
      removePhoto: formData.get("removePhoto") === "1",
    });
    id = player.id;
  } catch (err) {
    return { error: message(err) };
  }
  revalidatePath("/", "layout");
  redirect(`/players/${id}`);
}

export async function deletePlayer(id: string): Promise<FormState> {
  try {
    await store.deletePlayer(id);
  } catch (err) {
    return { error: message(err) };
  }
  revalidatePath("/", "layout");
  redirect("/players");
}

export async function recordGame(
  input: store.NewGame,
): Promise<{ game: RatedGame; error?: undefined } | { error: string; game?: undefined }> {
  try {
    const game = await store.addGame(input);
    revalidatePath("/", "layout");
    return { game };
  } catch (err) {
    return { error: message(err) };
  }
}

export async function deleteGame(id: string): Promise<FormState> {
  try {
    await store.deleteGame(id);
  } catch (err) {
    return { error: message(err) };
  }
  revalidatePath("/", "layout");
  return {};
}
