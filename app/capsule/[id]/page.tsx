import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CapsuleDetail } from "@/components/capsule-detail";
import { getCapsule } from "@/lib/capsules";

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
