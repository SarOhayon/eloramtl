"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/admin";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="w-full rounded-sm bg-white px-4 py-3 ring-1 ring-brown/15 focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </label>
      {state.error && <p className="text-sm text-red-800">Wrong password.</p>}
      <button disabled={pending} className="w-full rounded-sm bg-action px-6 py-3 text-sm uppercase tracking-[0.16em] text-white transition hover:bg-action-deep disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
