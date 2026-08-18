import { CapsuleBuryForm } from "@/components/capsule-bury-form";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "캡슐 묻기",
  description:
    "편지와 사진을 남기고 열람일을 정해 타임캡슐을 묻어요. 묻은 날의 날씨도 함께 저장됩니다.",
  path: "/new",
});

export default function NewCapsulePage() {
  return <CapsuleBuryForm />;
}
