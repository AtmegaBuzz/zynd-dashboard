import { DeveloperGate } from "@/components/dashboard/developer-gate";

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperGate>{children}</DeveloperGate>;
}
