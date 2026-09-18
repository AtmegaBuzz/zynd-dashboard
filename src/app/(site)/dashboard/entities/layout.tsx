import { DeveloperGate } from "@/components/dashboard/developer-gate";

export default function EntitiesLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperGate>{children}</DeveloperGate>;
}
