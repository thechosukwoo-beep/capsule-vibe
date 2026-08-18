"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { LoginPrompt } from "@/components/login-prompt";
import { useAuth } from "@/components/use-auth";

function signOutErrorMessage(): string {
  return "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export function SiteHeader() {
  const { user, ready } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  async function handleSignOut() {
    setError(null);
    setPending(true);

    try {
      await signOut(getFirebaseAuth());
    } catch {
      setError(signOutErrorMessage());
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/25 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-800">
          캡슐 바이브
        </Link>
        <div className="flex items-center gap-3">
          {ready && user ? (
            <>
              <Link
                href="/new"
                className="rounded-full bg-amber-800 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-900"
              >
                캡슐 묻기
              </Link>
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border border-amber-100 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={pending}
                className="text-sm text-stone-400 transition hover:text-stone-600 disabled:opacity-60"
              >
                로그아웃
              </button>
            </>
          ) : ready ? (
            <>
              <Link
                href="/#bury"
                className="rounded-full bg-amber-800 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-900"
              >
                캡슐 묻기
              </Link>
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="text-sm text-stone-400 transition hover:text-stone-600"
              >
                로그인
              </button>
            </>
          ) : (
            <div className="h-9 w-28" aria-hidden="true" />
          )}
        </div>
      </div>
      {error ? (
        <p className="pb-3 text-center text-sm text-red-600">{error}</p>
      ) : null}
      <LoginPrompt
        open={loginOpen}
        eyebrow={null}
        title="다시 오신 것을 환영해요"
        description="내가 묻은 캡슐을 보려면 Google로 로그인해 주세요."
        cancelLabel="닫기"
        onClose={() => setLoginOpen(false)}
        onSignedIn={() => setLoginOpen(false)}
      />
    </header>
  );
}
