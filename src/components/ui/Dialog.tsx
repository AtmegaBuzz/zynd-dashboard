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
        "max-w-lg w-full rounded border border-white/10 bg-[#111] p-0 text-white shadow-[0_16px_70px_rgba(0,0,0,0.7)] backdrop:bg-black/70",
        className
      )}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="cursor-pointer rounded p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close dialog"
        >
          &#x2715;
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
