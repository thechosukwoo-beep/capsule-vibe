import { getFirebaseAuth } from "@/lib/firebase";

export async function deleteCapsule(id: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("not signed in");
  }

  const token = await user.getIdToken();
  const response = await fetch(`/api/capsules/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`delete failed: ${response.status}`);
  }
}
