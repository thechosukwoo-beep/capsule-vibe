"use client";

import { useState } from "react";
import { deleteCapsule } from "@/lib/delete-capsule";
import { useAuth } from "@/components/use-auth";

export function DeleteCapsuleButton({
  capsuleId,
  senderUid,
  compact = false,
  onDeleted,
}: {
  capsuleId: string;
  senderUid: string;
  compact?: boolean;
  onDeleted?: () => void;
}) {
  const { user, ready } = useAuth();
  const [pending, setPending] = useState(false);

  if (!ready || !user || user.uid !== senderUid) {
    return null;
  }

  async function handleClick() {
    if (pending) {
      return;
    }

    if (!confirm("이 캡슐을 삭제할까요? 편지와 사진이 함께 지워져요.")) {
      return;
    }

    setPending(true);

    try {
      await deleteCapsule(capsuleId);
      onDeleted?.();
    } catch (cause) {
      console.error(cause);
      alert("캡슐을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      className={
        compact
          ? "rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-600 shadow-sm ring-1 ring-amber-100 transition hover:bg-white hover:text-red-700 disabled:opacity-60"
          : "text-sm text-stone-400 transition hover:text-red-700 disabled:opacity-60"
      }
    >
      {pending ? "삭제 중..." : compact ? "삭제" : "캡슐 삭제"}
    </button>
  );
}
