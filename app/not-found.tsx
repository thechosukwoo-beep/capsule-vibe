import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "페이지를 찾을 수 없어요",
  description: "주소가 바뀌었거나, 아직 묻히지 않은 캡슐이에요.",
  path: "/",
  robots: {
    index: false,
    follow: false,
  },
});

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <main className="w-full max-w-md rounded-3xl border border-amber-100 bg-white/80 px-8 py-12 text-center shadow-xl shadow-amber-900/10">
        <h1 className="text-2xl font-semibold text-stone-800">캡슐을 찾지 못했어요</h1>
        <p className="mt-3 text-sm text-stone-500">주소가 바뀌었거나, 아직 묻히지 않은 캡슐이에요.</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-amber-800 px-6 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-900"
        >
          대시보드로
        </Link>
      </main>
    </div>
  );
}
