"use client";

import { useAuth } from "@/hooks/useAuth";
import { Key, Shield, User } from "lucide-react";

export default function DashboardPage() {
  const { user, developer, authenticated } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Developer Identity
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Your developer PKI and registration status
        </p>
      </div>

      {authenticated && !developer && (
        <div className="border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[var(--color-accent)]" />
          <p className="text-sm text-white/50">Generating developer identity...</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-px sm:grid-cols-3 border border-white/10 bg-white/10">
        <StatCard
          icon={<User className="h-4 w-4 text-[var(--color-accent)]" />}
          label="Email"
          value={user?.email ?? "—"}
        />
        <StatCard
          icon={<Shield className="h-4 w-4 text-[var(--color-accent)]" />}
          label="Status"
          value={developer ? "Registered" : "Pending"}
        />
        <StatCard
          icon={<Key className="h-4 w-4 text-[var(--color-accent)]" />}
          label="Developer ID"
          value={developer?.developer_id ? `${developer.developer_id.slice(0, 20)}...` : "—"}
        />
      </div>

      {developer && (
        <div className="rounded border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-white/50">
              PKI Details
            </h3>
          </div>
          <div className="divide-y divide-white/[0.05] px-5">
            {developer.username && (
              <DetailRow label="Username" value={developer.username} />
            )}
            <DetailRow label="Developer ID" value={developer.developer_id} />
            <DetailRow label="Public Key" value={developer.public_key} />
            <DetailRow label="Name" value={developer.name} />
            {developer.role && (
              <DetailRow label="Role" value={developer.role} />
            )}
            {developer.country && (
              <DetailRow label="Country" value={developer.country} />
            )}
          </div>
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
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#0a0a0a] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</div>
        <div className="truncate text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-1 sm:gap-0 py-4">
      <dt className="sm:col-span-3 text-sm text-white/40">{label}</dt>
      <dd className="sm:col-span-9 break-all border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white">
        {value}
      </dd>
    </div>
  );
}
