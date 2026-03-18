"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: TabsProps): React.ReactNode {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex gap-0 overflow-x-auto border-b border-white/[0.08]" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative cursor-pointer whitespace-nowrap px-4 py-2.5 min-h-[44px] text-sm transition-colors",
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-[var(--color-accent)]" />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}
