"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="w-full">
      {next && <input type="hidden" name="next" value={next} />}
      {/* Lets password managers file the password under a name. */}
      <input type="text" name="username" value="Checkmate Club" autoComplete="username" readOnly hidden />
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase">Password</span>
        <div className="relative">
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            autoFocus
            autoComplete="current-password"
            className="h-13 w-full rounded-2xl border border-line bg-bg pr-12 pl-4 text-[17px] outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted active:bg-surface-2"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </label>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-loss">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-14 w-full rounded-full bg-ink text-[17px] font-semibold text-white active:scale-[0.99] disabled:opacity-40"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
