import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function Table({
  headers,
  children,
  className,
}: TableProps): React.ReactNode {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {headers.map((header) => (
              <th
                key={header}
                className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/35"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-white/[0.04] [&>tr:last-child]:border-0 [&_td]:px-5 [&_td]:py-3 [&_td]:text-white">
          {children}
        </tbody>
      </table>
    </div>
  );
}
