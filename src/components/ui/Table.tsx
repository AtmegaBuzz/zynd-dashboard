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
          <tr className="border-b border-white/10">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#f6f6f6]/40"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-white/5 [&>tr:last-child]:border-0 [&_td]:px-4 [&_td]:py-3 [&_td]:text-[#f6f6f6]">
          {children}
        </tbody>
      </table>
    </div>
  );
}
