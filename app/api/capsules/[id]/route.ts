import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getFirebaseUidFromIdToken } from "@/lib/verify-firebase-user";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const header = request.headers.get("authorization");
  const token = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";

  if (!id || !token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const uid = await getFirebaseUidFromIdToken(token);
  if (!uid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: capsule, error: capsuleError } = await supabase
      .from("capsules")
      .select("id, sender_uid")
      .eq("id", id)
      .maybeSingle();

    if (capsuleError) {
      console.error(capsuleError);
      return NextResponse.json({ error: "failed" }, { status: 500 });
    }

    if (!capsule) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (capsule.sender_uid !== uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { data: images, error: imagesError } = await supabase
      .from("capsule_images")
      .select("storage_path")
      .eq("capsule_id", id);

    if (imagesError) {
      console.error(imagesError);
      return NextResponse.json({ error: "failed" }, { status: 500 });
    }

    const paths = (images ?? [])
      .map((image) => image.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0);

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from("capsules").remove(paths);
      if (storageError) {
        console.error(storageError);
        return NextResponse.json({ error: "failed" }, { status: 500 });
      }
    }

    const { error: deleteError } = await supabase
      .from("capsules")
      .delete()
      .eq("id", id)
      .eq("sender_uid", uid);

    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json({ error: "failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    console.error(cause);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
