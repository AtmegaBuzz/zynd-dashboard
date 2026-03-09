"use client";

import { useAtomValue } from "jotai";
import { userCredsAtom } from "@/store/global.store";
import { VCResponse } from "@/apis/registry/types";
import { CredentialCard } from "@/components/dashboard/credential-card";
import { Bot, Zap, CheckCircle2, XCircle } from "lucide-react";

export default function DashboardPage() {
  const credentials = useAtomValue(userCredsAtom);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-[#f6f6f6]">
          Issued Credentials
        </h1>
        <p className="mt-1 text-sm text-[#f6f6f6]/50">
          Discover and manage your professional credentials
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Bot className="h-5 w-5 text-[#BF40FF]" />}
          label="Total Credentials"
          value={credentials.length}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-[#BF40FF]" />}
          label="Active Credentials"
          value={credentials.filter((c) => !c.revoked).length}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          label="Revoked Credentials"
          value={credentials.filter((c) => c.revoked).length}
        />
      </div>

      {credentials.length === 0 ? (
        <div className="py-16 text-center text-[#f6f6f6]/40">
          No credentials found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential, index) => (
            <CredentialCard
              key={credential.id ?? index}
              credential={credential}
              index={index}
              isDID={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#ffffff0d] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium text-[#f6f6f6]/50">{label}</div>
        <div className="text-lg sm:text-2xl font-bold text-[#f6f6f6]">{value}</div>
      </div>
    </div>
  );
}
