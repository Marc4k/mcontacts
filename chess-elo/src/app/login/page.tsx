import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/auth";
import { isConfigured } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  if (await isSignedIn()) redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/");

  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center px-5">
      <div className="card flex w-full flex-col items-center px-6 pt-8 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG icon */}
        <img src="/icon.svg" alt="" width={64} height={64} className="rounded-2xl" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Checkmate Club</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Enter the password to continue.</p>
        {isConfigured() ? (
          <LoginForm next={typeof next === "string" ? next : undefined} />
        ) : (
          <p className="rounded-2xl bg-loss-soft px-4 py-3 text-center text-sm text-loss">
            No password is set up yet. Set <code className="font-mono">APP_PASSWORD</code> on the server and restart
            the app.
          </p>
        )}
      </div>
    </main>
  );
}
