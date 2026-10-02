import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import { requireSession } from "./auth";
import { computeRatings, type Game, type Player, type Result, type TimeControl } from "./elo";

interface Data {
  players: Player[];
  games: Game[];
}

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PHOTO_DIR = path.join(DATA_DIR, "photos");
const MAX_PHOTO_BYTES = 400_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function load(): Promise<Data> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { players: [], games: [] };
    throw err;
  }
}

async function writeAtomic(file: string, contents: string | Buffer) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, contents);
  await fs.rename(tmp, file);
}

// Serialize writes so concurrent actions can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (data: Data) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const data = await load();
    const result = await fn(data);
    await writeAtomic(DB_FILE, JSON.stringify(data, null, 2));
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export class ValidationError extends Error {}

export async function getRatings() {
  await connection();
  await requireSession();
  const { players, games } = await load();
  return computeRatings(players, games);
}

export async function readPhoto(id: string): Promise<Buffer | null> {
  if (!UUID.test(id)) return null;
  try {
    return await fs.readFile(path.join(PHOTO_DIR, `${id}.jpg`));
  } catch {
    return null;
  }
}

function cleanName(data: Data, name: string, selfId?: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) throw new ValidationError("Enter a name.");
  if (clean.length > 30) throw new ValidationError("Keep the name under 30 characters.");
  if (data.players.some((p) => p.id !== selfId && p.name.toLowerCase() === clean.toLowerCase())) {
    throw new ValidationError(`There's already a player called ${clean}.`);
  }
  return clean;
}

/** Accepts a `data:image/jpeg;base64,...` URL produced by the client-side resizer. */
function decodePhoto(dataUrl: string): Buffer {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new ValidationError("That photo couldn't be read.");
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.length > MAX_PHOTO_BYTES) throw new ValidationError("That photo is too large.");
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new ValidationError("That photo couldn't be read.");
  return bytes;
}

export function savePlayer(input: { id?: string; name: string; photo?: string; removePhoto?: boolean }) {
  return mutate(async (data) => {
    const existing = input.id ? data.players.find((p) => p.id === input.id) : undefined;
    if (input.id && !existing) throw new ValidationError("Player not found.");
    const name = cleanName(data, input.name, existing?.id);
    const photo = input.photo ? decodePhoto(input.photo) : null;

    const player: Player = existing ?? { id: randomUUID(), name, createdAt: new Date().toISOString() };
    player.name = name;
    if (photo) {
      await writeAtomic(path.join(PHOTO_DIR, `${player.id}.jpg`), photo);
      player.photoVersion = Date.now();
    } else if (input.removePhoto && player.photoVersion) {
      await fs.rm(path.join(PHOTO_DIR, `${player.id}.jpg`), { force: true });
      delete player.photoVersion;
    }
    if (!existing) data.players.push(player);
    return player;
  });
}

export function deletePlayer(id: string) {
  return mutate(async (data) => {
    if (data.games.some((g) => g.whiteId === id || g.blackId === id)) {
      throw new ValidationError("Players with games on record can't be removed. Delete their games first.");
    }
    data.players = data.players.filter((p) => p.id !== id);
    if (UUID.test(id)) await fs.rm(path.join(PHOTO_DIR, `${id}.jpg`), { force: true });
  });
}

const RESULTS: Result[] = ["1-0", "0-1", "1/2-1/2"];

export interface NewGame {
  whiteId: string;
  blackId: string;
  result: Result;
  timeControl?: TimeControl;
  endReason?: "board" | "timeout";
}

export function addGame(input: NewGame) {
  return mutate((data) => {
    const ids = new Set(data.players.map((p) => p.id));
    if (!ids.has(input.whiteId) || !ids.has(input.blackId)) throw new ValidationError("Pick both players.");
    if (input.whiteId === input.blackId) throw new ValidationError("A player can't play themselves.");
    if (!RESULTS.includes(input.result)) throw new ValidationError("Pick a result.");
    const tc = input.timeControl;
    if (tc && !(isFinite(tc.base) && isFinite(tc.inc) && tc.base > 0 && tc.base <= 10_800 && tc.inc >= 0 && tc.inc <= 180)) {
      throw new ValidationError("Invalid time control.");
    }

    const game: Game = {
      id: randomUUID(),
      whiteId: input.whiteId,
      blackId: input.blackId,
      result: input.result,
      playedAt: new Date().toISOString(),
      ...(tc && { timeControl: { base: tc.base, inc: tc.inc } }),
      endReason: input.endReason === "timeout" ? "timeout" : "board",
    };
    data.games.push(game);
    return computeRatings(data.players, data.games).games.find((g) => g.id === game.id)!;
  });
}

export function deleteGame(id: string) {
  return mutate((data) => {
    data.games = data.games.filter((g) => g.id !== id);
  });
}
