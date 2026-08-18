import { CapsuleDashboard } from "@/components/capsule-dashboard";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  path: "/",
});

export default function Home() {
  return <CapsuleDashboard />;
}
