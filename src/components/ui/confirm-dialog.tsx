"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

type Props = {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Modal confirmation built on the native <dialog> element (focus trap and Escape for free). */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel = "ביטול", destructive, loading, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      className="m-auto w-[min(92vw,420px)] rounded-[var(--radius-panel)] bg-white p-0 text-ganache shadow-2xl backdrop:bg-ganache/40"
      aria-labelledby="confirm-title"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-[20px] font-bold">
          {title}
        </h2>
        {body && <div className="mt-2 text-muted">{body}</div>}
        <div className="mt-6 flex flex-row-reverse gap-3">
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading} className="flex-1">
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} className="flex-1" autoFocus>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
