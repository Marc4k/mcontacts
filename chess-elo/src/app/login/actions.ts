"use server";

import { redirect } from "next/navigation";
import { clearFailures, clientKey, endSession, isThrottled, recordFailure, startSession } from "@/lib/auth";
import { checkPassword, isConfigured } from "@/lib/session";

export type LoginState = { error?: string };

/** Only allow same-site paths, so ?next= can't send you to another site. */
function safeNext(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isConfigured()) return { error: "No password is set up on the server. Set APP_PASSWORD and restart." };

  const key = await clientKey();
  if (isThrottled(key)) return { error: "Too many attempts. Try again in 15 minutes." };

  if (!checkPassword(String(formData.get("password") ?? ""))) {
    recordFailure(key);
    await new Promise((r) => setTimeout(r, 400));
    return { error: "Wrong password." };
  }

  clearFailures(key);
  await startSession();
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/login");
}
