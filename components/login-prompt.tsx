"use client";

import { useEffect } from "react";
import { GoogleMark, useGoogleSignIn } from "@/components/google-auth";

export function LoginPrompt({
  open,
  title,
  description,
  eyebrow = "거의 다 왔어요",
  actionLabel = "Google로 계속하기",
  cancelLabel = "닫기",
  onClose,
  onSignedIn,
}: {
  open: boolean;
  title: string;
  description: string;
  eyebrow?: string | null;
  actionLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onSignedIn?: () => void;
}) {
  const { pending, error, signIn, setError } = useGoogleSignIn();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open, setError]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-stone-900/40"
        disabled={pending}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="relative w-full max-w-sm rounded-3xl bg-white px-7 py-8 text-center shadow-xl"
      >
        {eyebrow ? (
          <p className="text-xs font-medium tracking-wide text-amber-800">{eyebrow}</p>
        ) : null}
        <h2
          id="login-prompt-title"
          className={`text-2xl font-semibold tracking-tight text-stone-800 ${eyebrow ? "mt-3" : ""}`}
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">{description}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void (async () => {
              const ok = await signIn();
              if (ok) {
                onSignedIn?.();
              }
            })();
          }}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60"
        >
          <GoogleMark />
          {pending ? "로그인 중..." : actionLabel}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className="mt-4 text-sm text-stone-400 transition hover:text-stone-600 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
