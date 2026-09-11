"use client";
import { useAuth } from "@/hooks/useAuth";

export function EditCardButton({ handle }: { handle: string }) {
  const { authenticated } = useAuth();
  if (!authenticated) return null;
  return (
    <a
      href={`/create?edit=${encodeURIComponent(handle)}`}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#7B72E9]/30 bg-[#7B72E9]/10 font-mono text-[11px] font-semibold text-[#7B72E9] hover:bg-[#7B72E9]/20 transition-colors"
    >
      Edit my card →
    </a>
  );
}
