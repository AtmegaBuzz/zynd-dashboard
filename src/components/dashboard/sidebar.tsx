"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, Settings, X } from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  onLinkClick?: () => void;
  mobile?: boolean;
}

export function Sidebar({ onLinkClick, mobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-64 flex-col border-r border-white/10 bg-[#0a0a0a]"
          : "hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0a0a0a]"
      }
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-[#BF40FF]">Zynd AI</span>
        </Link>
        {mobile && (
          <button
            onClick={onLinkClick}
            className="rounded p-1 text-[#f6f6f6]/60 transition-colors hover:text-[#f6f6f6]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-6 flex-1">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#BF40FF]/10 text-[#BF40FF]"
                      : "text-[#f6f6f6]/60 hover:bg-white/5 hover:text-[#f6f6f6]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
