import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CapsuleDetail } from "@/components/capsule-detail";
import { formatOpenAt, getCapsule, isCapsuleOpen } from "@/lib/capsules";
import { createPageMetadata } from "@/lib/site";

const privateRobots = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const capsule = await getCapsule(id);

    if (!capsule) {
      return createPageMetadata({
        title: "캡슐을 찾지 못했어요",
        path: `/capsule/${id}`,
        robots: privateRobots,
      });
    }

    const open = isCapsuleOpen(capsule.open_at);
    const title = open
      ? `${capsule.recipient}에게 온 캡슐`
      : `${capsule.recipient}에게 보내는 봉인된 캡슐`;
    const description = open
      ? `${formatOpenAt(capsule.open_at)}에 열린 타임캡슐이에요.`
      : `${formatOpenAt(capsule.open_at)}에 열리는 타임캡슐이에요. 열람일 전에는 편지와 사진을 볼 수 없어요.`;

    return createPageMetadata({
      title,
      description,
      path: `/capsule/${id}`,
      type: "article",
      robots: privateRobots,
    });
  } catch {
    return createPageMetadata({
      title: "캡슐",
      path: `/capsule/${id}`,
      robots: privateRobots,
    });
  }
}

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const capsule = await getCapsule(id);

  if (!capsule) {
    notFound();
  }

  return <CapsuleDetail capsule={capsule} />;
}
