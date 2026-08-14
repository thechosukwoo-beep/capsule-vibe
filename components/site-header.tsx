"use client";

import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/components/use-auth";

function authErrorMessage(error: unknown): string | null {
  if (!(error instanceof FirebaseError)) {
    return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  }

  switch (error.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.";
    case "auth/unauthorized-domain":
      return "이 도메인은 아직 허용되지 않았습니다.";
    default:
      return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function SiteHeader() {
  const { user, ready } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);

    try {
      const auth = getFirebaseAuth();
      auth.useDeviceLanguage();
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    setError(null);
    setPending(true);

    try {
      await signOut(getFirebaseAuth());
    } catch {
      setError("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-amber-100/80 bg-amber-50/90 backdrop-blur">
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
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60"
            >
              <GoogleMark />
              {pending ? "로그인 중..." : "Google로 계속하기"}
            </button>
          ) : (
            <div className="h-9 w-28" aria-hidden="true" />
          )}
        </div>
      </div>
      {error ? (
        <p className="pb-3 text-center text-sm text-red-600">{error}</p>
      ) : null}
    </header>
  );
}
