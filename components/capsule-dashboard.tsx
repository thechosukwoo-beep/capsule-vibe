"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  isCapsuleOpen,
  listCapsules,
  type Capsule,
} from "@/lib/capsules";
import { CapsuleBuryForm } from "@/components/capsule-bury-form";
import { FloatingCapsuleField } from "@/components/floating-capsule-field";
import { GuestHero } from "@/components/guest-hero";
import { LoginPrompt } from "@/components/login-prompt";
import { NowWeather } from "@/components/now-weather";
import { useAuth, useNow } from "@/components/use-auth";

type Filter = "all" | "locked" | "open" | "mine";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "locked", label: "잠긴 캡슐" },
  { id: "open", label: "열린 캡슐" },
  { id: "mine", label: "내가 묻은 것" },
];

export function CapsuleDashboard() {
  const { user, ready } = useAuth();
  const now = useNow();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [keepGuestExperience, setKeepGuestExperience] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const showGuestLanding = keepGuestExperience || (ready && !user);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await listCapsules();
        if (!cancelled) {
          setCapsules(rows);
        }
      } catch (cause) {
        console.error(cause);
        if (!cancelled) {
          setError("캡슐 목록을 불러오지 못했어요.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const lockedCount = capsules.filter((capsule) => !isCapsuleOpen(capsule.open_at, now)).length;
  const openCount = capsules.length - lockedCount;

  const visible = useMemo(() => {
    return capsules.filter((capsule) => {
      const open = isCapsuleOpen(capsule.open_at, now);
      if (filter === "locked") return !open;
      if (filter === "open") return open;
      if (filter === "mine") return user ? capsule.sender_uid === user.uid : false;
      return true;
    });
  }, [capsules, filter, now, user]);

  return (
    <div className="relative pb-16">
      <div className="mx-auto w-full max-w-5xl px-6 pt-10">
      {!ready ? (
        <div
          className="h-64 animate-pulse rounded-3xl bg-white/40 ring-1 ring-white/40"
          aria-hidden="true"
        />
      ) : showGuestLanding ? (
        <>
          <GuestHero />
          <div className="mt-6">
            <NowWeather />
          </div>
          <div id="bury" className="mt-10 flex scroll-mt-24 justify-center">
            <CapsuleBuryForm
              embedded
              onLoginIntent={() => setKeepGuestExperience(true)}
              onBuried={() => {
                void listCapsules()
                  .then(setCapsules)
                  .catch((cause) => {
                    console.error(cause);
                  });
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-800">
                떠 있는 캡슐
              </h1>
              <p className="mt-2 text-stone-600">
                디데이가 가까운 캡슐일수록 수면 가까이 떠올라요
              </p>
            </div>
            <NowWeather />
          </div>
        </>
      )}

      {!ready ? null : showGuestLanding ? (
        <div className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-800">
            지금 떠 있는 캡슐
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            열람일이 가까워질수록 더 위로 떠오릅니다
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "mine" && !user) {
                  setLoginOpen(true);
                  return;
                }
                setFilter(item.id);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md transition ${
                filter === item.id
                  ? "bg-amber-800 text-amber-50"
                  : "bg-white/45 text-stone-700 ring-1 ring-white/50 hover:bg-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-stone-600">
            전체 {capsules.length} · 잠김 {lockedCount} · 열림 {openCount}
          </span>
        </div>
      )}
      </div>

      <div className="mx-auto w-full max-w-6xl px-4">
      {loading ? (
        <div className="relative mt-8 min-h-[420px] overflow-hidden rounded-[2.5rem] bg-white/20 ring-1 ring-white/30">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="absolute h-32 w-24 animate-pulse rounded-full bg-white/40"
              style={{ left: `${18 + index * 20}%`, bottom: `${20 + (index % 3) * 18}%` }}
            />
          ))}
        </div>
      ) : error ? (
        <p className="mt-10 text-sm text-red-600">{error}</p>
      ) : visible.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-white/40 px-8 py-16 text-center ring-1 ring-white/50 backdrop-blur-md">
          <p className="text-stone-700">
            {filter === "mine" && !user
              ? "내 캡슐을 보려면 먼저 로그인해 주세요."
              : "아직 보여 줄 캡슐이 없어요."}
          </p>
          {filter === "mine" && !user ? (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="mt-6 inline-flex rounded-full bg-amber-800 px-6 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-900"
            >
              로그인
            </button>
          ) : (
            <Link
              href={showGuestLanding ? "/#bury" : "/new"}
              className="mt-6 inline-flex rounded-full bg-amber-800 px-6 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-900"
            >
              첫 캡슐 묻기
            </Link>
          )}
        </div>
      ) : (
        <FloatingCapsuleField
          capsules={visible}
          now={now}
          onDeleted={(id) =>
            setCapsules((rows) => rows.filter((row) => row.id !== id))
          }
        />
      )}
      </div>
      <LoginPrompt
        open={loginOpen}
        eyebrow={null}
        title="내 캡슐을 보려면 로그인해 주세요"
        description="Google로 로그인하면 내가 묻은 캡슐만 모아 볼 수 있어요."
        cancelLabel="닫기"
        onClose={() => setLoginOpen(false)}
        onSignedIn={() => {
          setLoginOpen(false);
          setFilter("mine");
        }}
      />
    </div>
  );
}
