"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatOpenAt } from "@/lib/capsules";
import { getFirebaseAuth } from "@/lib/firebase";
import { getSupabase } from "@/lib/supabase";

type CapsuleResult = {
  id: string;
  recipient: string;
  letter: string;
  openAt: string;
  imageUrls: string[];
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

export default function NewCapsulePage() {
  const [recipient, setRecipient] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [burying, setBurying] = useState(false);
  const [result, setResult] = useState<CapsuleResult | null>(null);

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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (burying) {
      return;
    }

    const user = getFirebaseAuth().currentUser;
    if (!user) {
      alert("로그인 먼저!");
      return;
    }

    if (!recipient.trim() || !letter.trim() || !openAt) {
      alert("받는 사람, 편지, 열람일을 모두 입력해 주세요.");
      return;
    }

    const openAtDate = new Date(openAt);
    if (Number.isNaN(openAtDate.getTime())) {
      alert("열람일이 올바르지 않아요.");
      return;
    }

    setBurying(true);

    try {
      const supabase = getSupabase();
      const { data: capsule, error: capsuleError } = await supabase
        .from("capsules")
        .insert({
          sender_uid: user.uid,
          recipient: recipient.trim(),
          letter: letter.trim(),
          open_at: openAtDate.toISOString(),
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
      });
    } catch (error) {
      console.error(error);
      alert("캡슐을 묻지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBurying(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 justify-center bg-amber-50 px-6 py-16">
      {burying ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40">
          <div className="rounded-3xl bg-white px-10 py-8 text-center shadow-xl">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-amber-100 border-t-amber-800" />
            <p className="mt-4 text-sm font-medium text-stone-700">업로드 되는 중..</p>
          </div>
        </div>
      ) : null}

      <main className="w-full max-w-lg rounded-3xl border border-amber-100 bg-white/80 px-8 py-12 shadow-xl shadow-amber-900/10">
        <Link
          href="/"
          className="text-sm text-stone-400 transition hover:text-stone-600"
        >
          ← 대시보드
        </Link>

        {result ? (
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
              캡슐을 묻었어요
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              {formatOpenAt(result.openAt)}에 열 수 있어요
            </p>

            <div className="mt-8 rounded-2xl bg-amber-50/80 px-5 py-6 text-left">
              <p className="text-xs font-medium tracking-wide text-stone-400">
                받는 사람
              </p>
              <p className="mt-1 text-stone-800">{result.recipient}</p>
              <p className="mt-5 text-xs font-medium tracking-wide text-stone-400">
                편지
              </p>
              <p className="mt-1 whitespace-pre-wrap text-stone-700">{result.letter}</p>
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
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-800">
              캡슐 묻기
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              사진과 편지를 묻고, 열람일에 함께 열어요
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
                  className="mt-2 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none ring-amber-800/20 focus:ring-2 disabled:opacity-60"
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
                  className="mt-2 w-full resize-y rounded-2xl border border-amber-100 bg-white px-4 py-3 text-stone-800 outline-none ring-amber-800/20 focus:ring-2 disabled:opacity-60"
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
                {burying ? "업로드 되는 중.." : "캡슐 묻기"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
