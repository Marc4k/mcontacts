"use client";

/* eslint-disable @next/next/no-img-element -- local preview of a data URL */
import { useActionState, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { savePlayer, deletePlayer, type FormState } from "@/app/actions";
import type { Player } from "@/lib/elo";
import { Avatar, photoUrl } from "./avatar";

const SIZE = 320;

/** Center-crops to a square and re-encodes as a small JPEG so uploads stay tiny. */
async function resize(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function PlayerForm({ player, canDelete }: { player?: Player; canDelete?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePlayer, {});
  const [photo, setPhoto] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [name, setName] = useState(player?.name ?? "");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const existing = player && !removed ? photoUrl(player) : null;
  const preview = photo ?? existing;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    try {
      setPhoto(await resize(file));
      setRemoved(false);
    } catch {
      setPhotoError("That image couldn't be opened. Try a JPEG or PNG.");
    }
  }

  async function onDelete() {
    if (!player || !confirm(`Remove ${player.name} from the club?`)) return;
    const result = await deletePlayer(player.id);
    if (result?.error) setDeleteError(result.error);
  }

  return (
    <form action={action} className="px-5">
      {player && <input type="hidden" name="id" value={player.id} />}
      {photo && <input type="hidden" name="photo" value={photo} />}
      {removed && <input type="hidden" name="removePhoto" value="1" />}

      <div className="card flex flex-col items-center px-5 pt-8 pb-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative rounded-full active:scale-95"
          aria-label="Choose photo"
        >
          {preview ? (
            <img src={preview} alt="" className="h-32 w-32 rounded-full object-cover" />
          ) : (
            <Avatar player={{ id: player?.id ?? name, name: name || "?" }} size={128} />
          )}
          <span className="absolute right-0 bottom-0 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white ring-4 ring-white">
            <Camera className="h-5 w-5" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <div className="mt-3 flex gap-4 text-sm">
          <button type="button" onClick={() => fileRef.current?.click()} className="font-medium text-ink-2">
            {preview ? "Change photo" : "Add photo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setRemoved(true);
              }}
              className="font-medium text-loss"
            >
              Remove
            </button>
          )}
        </div>
        {photoError && <p className="mt-2 text-sm text-loss">{photoError}</p>}

        <label className="mt-6 w-full">
          <span className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase">Name</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={30}
            autoComplete="off"
            autoFocus={!player}
            placeholder="e.g. Magnus"
            className="h-13 w-full rounded-2xl border border-line bg-bg px-4 text-[17px] outline-none focus:border-ink"
          />
        </label>
      </div>

      {state.error && <p className="mt-3 px-1 text-sm text-loss">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="mt-5 h-14 w-full rounded-full bg-ink text-[17px] font-semibold text-white active:scale-[0.99] disabled:opacity-40"
      >
        {pending ? "Saving…" : player ? "Save changes" : "Add to club"}
      </button>

      {player && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-loss disabled:text-muted"
          >
            <Trash2 className="h-4 w-4" /> Remove player
          </button>
          {!canDelete && <p className="mt-1 text-xs text-muted">Players with games on record can&apos;t be removed.</p>}
          {deleteError && <p className="mt-1 text-sm text-loss">{deleteError}</p>}
        </div>
      )}
    </form>
  );
}
