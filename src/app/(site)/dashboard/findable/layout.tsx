import { DeveloperGate } from "@/components/dashboard/developer-gate";

export default function FindableLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperGate>{children}</DeveloperGate>;
}
