"use client";

import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const { user, developer } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Settings</h2>
        <p className="mt-1 text-sm text-white/40">Account settings</p>
      </div>

      <div className="rounded border border-white/10 bg-white/[0.02]">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-white/50">
            Account
          </h3>
        </div>
        <div className="divide-y divide-white/[0.05] px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-4">
            <span className="text-sm text-white/40">Email</span>
            <code className="border border-white/10 bg-white/5 px-3 py-1 font-mono text-sm text-white truncate">
              {user?.email ?? "—"}
            </code>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-4">
            <span className="text-sm text-white/40">Developer ID</span>
            <code className="max-w-full sm:max-w-xs truncate border border-white/10 bg-white/5 px-3 py-1 font-mono text-sm text-white">
              {developer?.developer_id ?? "Not registered"}
            </code>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-4">
            <span className="text-sm text-white/40">Status</span>
            <Badge variant={developer ? "active" : "inactive"}>
              {developer ? "Registered" : "Pending"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
