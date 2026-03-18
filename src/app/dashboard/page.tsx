"use client";

import { useAtomValue } from "jotai";
import { userCredsAtom } from "@/store/global.store";
import { CredentialCard } from "@/components/dashboard/credential-card";
import { Bot, CheckCircle2, XCircle } from "lucide-react";

export default function DashboardPage() {
  const credentials = useAtomValue(userCredsAtom);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Credentials
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your issued credentials
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px sm:grid-cols-3 border border-white/10 bg-white/10">
        <StatCard
          icon={<Bot className="h-4 w-4 text-[var(--color-accent)]" />}
          label="Total"
          value={credentials.length}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />}
          label="Active"
          value={credentials.filter((c) => !c.revoked).length}
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-400" />}
          label="Revoked"
          value={credentials.filter((c) => c.revoked).length}
        />
      </div>

      {credentials.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.02] py-16 text-center text-white/30">
          No credentials found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
    <div className="flex items-center gap-3 bg-[#0a0a0a] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5">
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</div>
        <div className="text-xl font-bold text-white">{value}</div>
      </div>
    </div>
  );
}
