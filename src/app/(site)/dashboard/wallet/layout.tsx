import { DeveloperGate } from "@/components/dashboard/developer-gate";

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperGate>{children}</DeveloperGate>;
}
