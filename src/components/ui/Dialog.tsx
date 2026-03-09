"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: DialogProps): React.ReactNode {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "max-w-lg w-full rounded-lg border border-white/10 bg-[#0a0a0a] p-0 text-[#f6f6f6] shadow-2xl backdrop:bg-black/70",
        className
      )}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <h2 className="text-lg font-medium">{title}</h2>
        <button
          onClick={onClose}
          className="cursor-pointer text-[#f6f6f6]/50 transition-colors hover:text-[#BF40FF]"
          aria-label="Close dialog"
        >
          &#x2715;
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
