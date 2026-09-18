import { DeveloperGate } from "@/components/dashboard/developer-gate";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperGate>{children}</DeveloperGate>;
}
