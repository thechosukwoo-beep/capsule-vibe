"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { formatOpenAt } from "@/lib/capsules";
import { hasWeather, type CapsuleWeather } from "@/lib/capsule-weather";
import { fallbackVibe, type CapsuleVibe } from "@/lib/capsule-vibe";
import { CapsuleWeatherCard } from "@/components/capsule-weather";
import {
  CapsuleCover,
  CapsuleKeywords,
  CapsuleQuote,
} from "@/components/weather-capsule-art";
import { LoginPrompt } from "@/components/login-prompt";
import { getFirebaseAuth } from "@/lib/firebase";
import { getSupabase } from "@/lib/supabase";

type CapsuleResult = {
  id: string;
  recipient: string;
  letter: string;
  openAt: string;
  imageUrls: string[];
  weather: CapsuleWeather | null;
  vibe: CapsuleVibe;
};

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,8}$/.test(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  const fromMime = file.type.split("/")[1]?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,8}$/.test(fromMime)) {
    return fromMime === "jpeg" ? "jpg" : fromMime;
  }

  return "bin";
}

async function readBrowserPosition(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 5000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 4500 },
    );
  });
}

async function fetchBuriedWeather(): Promise<CapsuleWeather | null> {
  try {
    const position = await readBrowserPosition();
    const params = new URLSearchParams();
    if (position) {
      params.set("lat", String(position.lat));
      params.set("lng", String(position.lng));
    }

    const query = params.toString();
    const response = await fetch(query ? `/api/weather?${query}` : "/api/weather");
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { weather?: CapsuleWeather | null };
    return payload.weather ?? null;
  } catch (cause) {
    console.error(cause);
    return null;
  }
}

async function fetchCapsuleVibe(input: {
  weather: CapsuleWeather | null;
  recipient: string;
  letter: string;
}): Promise<CapsuleVibe> {
  try {
    const user = getFirebaseAuth().currentUser;
    const token = await user?.getIdToken();
    if (!token) {
      return fallbackVibe(input);
    }

    const response = await fetch("/api/capsule-vibe", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      return fallbackVibe(input);
    }

    const payload = (await response.json()) as { vibe?: CapsuleVibe };
    return payload.vibe ?? fallbackVibe(input);
  } catch (cause) {
    console.error(cause);
    return fallbackVibe(input);
  }
}

export function CapsuleBuryForm({
  embedded = false,
  onLoginIntent,
  onBuried,
}: {
  embedded?: boolean;
  onLoginIntent?: () => void;
  onBuried?: () => void;
}) {
  const [recipient, setRecipient] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [burying, setBurying] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [result, setResult] = useState<CapsuleResult | null>(null);
  const pendingBury = useRef(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function resetForm() {
    setRecipient("");
    setLetter("");
    setOpenAt("");
    setFiles([]);
    setPreviews([]);
    setResult(null);
    pendingBury.current = false;
  }

  function validate(): boolean {
    if (!recipient.trim() || !letter.trim() || !openAt) {
      alert("받는 사람, 편지, 열람일을 모두 입력해 주세요.");
      return false;
    }

    const openAtDate = new Date(openAt);
    if (Number.isNaN(openAtDate.getTime())) {
      alert("열람일이 올바르지 않아요.");
      return false;
    }

    return true;
  }

  async function buryCapsule() {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      return;
    }

    const openAtDate = new Date(openAt);
    setBurying(true);

    try {
      const weather = await fetchBuriedWeather();
      const vibe = await fetchCapsuleVibe({
        weather,
        recipient: recipient.trim(),
        letter: letter.trim(),
      });
      const supabase = getSupabase();
      const { data: capsule, error: capsuleError } = await supabase
        .from("capsules")
        .insert({
          sender_uid: user.uid,
          recipient: recipient.trim(),
          letter: letter.trim(),
          open_at: openAtDate.toISOString(),
          weather_condition: weather?.condition ?? null,
          weather_temp_c: weather?.tempC ?? null,
          weather_humidity: weather?.humidity ?? null,
          weather_observed_at: weather?.observedAt ?? null,
          vibe_quote: vibe.quote,
          vibe_keywords: vibe.keywords,
          capsule_shape: vibe.shape,
          capsule_color: vibe.color,
          capsule_accent: vibe.accent,
        })
        .select("id")
        .single();

      if (capsuleError || !capsule) {
        throw capsuleError ?? new Error("캡슐을 저장하지 못했어요.");
      }

      const timestamp = Date.now();
      const uploaded: { storage_path: string; public_url: string; sort_order: number }[] =
        [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const path = `${user.uid}/${capsule.id}/${timestamp}-${index}.${fileExtension(file)}`;
        const { error: uploadError } = await supabase.storage
          .from("capsules")
          .upload(path, file, {
            contentType: file.type || undefined,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from("capsules").getPublicUrl(path);
        uploaded.push({
          storage_path: path,
          public_url: data.publicUrl,
          sort_order: index,
        });
      }

      if (uploaded.length > 0) {
        const { error: imageError } = await supabase.from("capsule_images").insert(
          uploaded.map((image) => ({
            capsule_id: capsule.id,
            storage_path: image.storage_path,
            public_url: image.public_url,
            sort_order: image.sort_order,
          })),
        );

        if (imageError) {
          throw imageError;
        }
      }

      setResult({
        id: capsule.id,
        recipient: recipient.trim(),
        letter: letter.trim(),
        openAt: openAtDate.toISOString(),
        imageUrls: uploaded.map((image) => image.public_url),
        weather,
        vibe,
      });
      onBuried?.();
    } catch (error) {
      console.error(error);
      alert("캡슐을 묻지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      pendingBury.current = false;
      setBurying(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (burying) {
      return;
    }

    if (!validate()) {
      return;
    }

    const user = getFirebaseAuth().currentUser;
    if (!user) {
      pendingBury.current = true;
      onLoginIntent?.();
      setLoginOpen(true);
      return;
    }

    await buryCapsule();
  }

  async function handleSignedIn() {
    setLoginOpen(false);
    if (pendingBury.current) {
      await buryCapsule();
    }
  }

  return (
    <div className={embedded ? "" : "flex min-h-screen flex-1 justify-center px-6 py-16"}>
      {burying ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40">
          <div className="rounded-3xl bg-white px-10 py-8 text-center shadow-xl">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-amber-100 border-t-amber-800" />
            <p className="mt-4 text-sm font-medium text-stone-700">그날의 분위기를 담는 중..</p>
          </div>
        </div>
      ) : null}

      <main className="w-full max-w-lg rounded-3xl bg-white/55 px-8 py-12 shadow-xl shadow-stone-900/10 ring-1 ring-white/50 backdrop-blur-md">
        {embedded ? null : (
          <Link
            href="/"
            className="text-sm text-stone-400 transition hover:text-stone-600"
          >
            ← 대시보드
          </Link>
        )}

        {result ? (
          <div className={embedded ? "text-center" : "mt-6 text-center"}>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
              캡슐을 묻었어요
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              {formatOpenAt(result.openAt)}에 열 수 있어요
            </p>

            <div className="mt-8 overflow-hidden rounded-3xl bg-white/50 text-left ring-1 ring-white/40">
              {result.vibe.shape ? (
                <div className="h-40">
                  <CapsuleCover
                    vibe={result.vibe}
                    sealed={false}
                    seed={result.id}
                    weather={result.weather}
                  />
                </div>
              ) : null}
              <div className="px-5 py-6">
                <p className="text-xs font-medium tracking-wide text-stone-400">
                  받는 사람
                </p>
                <p className="mt-1 text-stone-800">{result.recipient}</p>
                <CapsuleQuote quote={result.vibe.quote} />
                <CapsuleKeywords
                  keywords={result.vibe.keywords}
                  color={result.vibe.color}
                  accent={result.vibe.accent}
                />
                <p className="mt-5 text-xs font-medium tracking-wide text-stone-400">
                  편지
                </p>
                <p className="mt-1 whitespace-pre-wrap text-stone-700">{result.letter}</p>
                {result.weather && hasWeather(result.weather) ? (
                  <CapsuleWeatherCard weather={result.weather} className="mt-5" />
                ) : null}
                {result.imageUrls.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {result.imageUrls.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href={`/capsule/${result.id}`}
                className="inline-flex rounded-full bg-amber-800 px-8 py-3 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-amber-900"
              >
                묻은 캡슐 보기
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-stone-400 transition hover:text-stone-600"
              >
                다른 캡슐 묻기
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className={`${embedded ? "" : "mt-6 "}text-3xl font-semibold tracking-tight text-stone-800`}>
              캡슐 묻기
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              사진과 편지를 묻고, 열람일에 함께 열어요. 묻은 날의 날씨도 함께 저장됩니다.
            </p>

            <form
              className="mt-8 flex flex-col gap-6"
              aria-busy={burying}
              onSubmit={(event) => void handleSubmit(event)}
            >
              <label className="block text-left text-sm font-medium text-stone-700">
                받는 사람
                <input
                  type="text"
                  name="recipient"
                  value={recipient}
                  disabled={burying}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="미래의 나에게, 친구에게"
                  className="mt-2 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none ring-amber-800/20 placeholder:text-stone-300 focus:ring-2 disabled:opacity-60"
                />
              </label>

              <label className="block text-left text-sm font-medium text-stone-700">
                편지
                <textarea
                  name="letter"
                  value={letter}
                  disabled={burying}
                  onChange={(event) => setLetter(event.target.value)}
                  rows={6}
                  placeholder="지금 전하고 싶은 말을 적어 보세요"
                  className="mt-2 w-full resize-y rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none ring-amber-800/20 placeholder:text-stone-300 focus:ring-2 disabled:opacity-60"
                />
              </label>

              <label className="block text-left text-sm font-medium text-stone-700">
                열람일
                <input
                  type="datetime-local"
                  name="openAt"
                  value={openAt}
                  disabled={burying}
                  onChange={(event) => setOpenAt(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none ring-amber-800/20 focus:ring-2 disabled:opacity-60"
                />
              </label>

              <div className="text-left text-sm font-medium text-stone-700">
                사진
                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-sm font-normal text-stone-500 transition hover:bg-amber-50">
                  사진을 여러 장 고를 수 있어요
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={burying}
                    className="sr-only"
                    onChange={(event) => {
                      setFiles(event.target.files ? Array.from(event.target.files) : []);
                    }}
                  />
                </label>
                {previews.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {previews.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={burying}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-amber-800 px-8 py-3 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {burying ? "캡슐을 묻는 중.." : "캡슐 묻기"}
              </button>
            </form>
          </>
        )}
      </main>

      <LoginPrompt
        open={loginOpen}
        title="이제 캡슐을 묻어요"
        description="적어 둔 편지와 사진은 그대로 남겨 둘게요. 땅에 묻으려면 Google 로그인이 필요해요."
        actionLabel="Google로 캡슐 묻기"
        cancelLabel="조금 더 적어 보기"
        onClose={() => {
          pendingBury.current = false;
          setLoginOpen(false);
        }}
        onSignedIn={() => void handleSignedIn()}
      />
    </div>
  );
}
