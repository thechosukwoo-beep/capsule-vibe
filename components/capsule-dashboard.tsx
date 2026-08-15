"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatCountdown,
  formatOpenAt,
  isCapsuleOpen,
  listCapsules,
  type Capsule,
} from "@/lib/capsules";
import { DeleteCapsuleButton } from "@/components/delete-capsule-button";
import { useAuth, useNow } from "@/components/use-auth";

type Filter = "all" | "locked" | "open" | "mine";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "locked", label: "잠긴 캡슐" },
  { id: "open", label: "열린 캡슐" },
  { id: "mine", label: "내가 묻은 것" },
];

export function CapsuleDashboard() {
  const { user } = useAuth();
  const now = useNow();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

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
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-800">
            묻힌 캡슐
          </h1>
          <p className="mt-2 text-stone-500">
            열람일까지 카운트다운을 보고, 열린 캡슐은 바로 꺼내 보세요
          </p>
        </div>
        <div className="flex gap-4 text-sm text-stone-500">
          <span>전체 {capsules.length}</span>
          <span>잠김 {lockedCount}</span>
          <span>열림 {openCount}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === item.id
                ? "bg-amber-800 text-amber-50"
                : "bg-white text-stone-600 ring-1 ring-amber-100 hover:bg-amber-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-3xl bg-white/70 ring-1 ring-amber-100"
            />
          ))}
        </div>
      ) : error ? (
        <p className="mt-10 text-sm text-red-600">{error}</p>
      ) : visible.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-amber-200 bg-white/70 px-8 py-16 text-center">
          <p className="text-stone-600">
            {filter === "mine" && !user
              ? "내 캡슐을 보려면 먼저 로그인해 주세요."
              : "아직 보여 줄 캡슐이 없어요."}
          </p>
          <Link
            href="/new"
            className="mt-6 inline-flex rounded-full bg-amber-800 px-6 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-900"
          >
            첫 캡슐 묻기
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((capsule) => {
            const open = isCapsuleOpen(capsule.open_at, now);
            const cover = open ? capsule.images[0]?.public_url : undefined;

            return (
              <li key={capsule.id} className="relative">
                <div className="absolute right-3 top-3 z-10">
                  <DeleteCapsuleButton
                    capsuleId={capsule.id}
                    senderUid={capsule.sender_uid}
                    compact
                    onDeleted={() =>
                      setCapsules((rows) => rows.filter((row) => row.id !== capsule.id))
                    }
                  />
                </div>
                <Link
                  href={`/capsule/${capsule.id}`}
                  className="block h-full overflow-hidden rounded-3xl bg-white/80 shadow-sm ring-1 ring-amber-100 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-36 bg-amber-100">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-amber-800/70">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium">
                          {open ? "사진 없음" : "봉인됨"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium tracking-wide text-stone-400">
                      {open ? "열림" : "잠김"} · {formatOpenAt(capsule.open_at)}
                    </p>
                    <h2 className="mt-1 truncate text-lg font-semibold text-stone-800">
                      {capsule.recipient}에게
                    </h2>
                    <p className="mt-2 text-sm text-amber-900">
                      {open
                        ? "지금 열 수 있어요"
                        : formatCountdown(capsule.open_at, now)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
