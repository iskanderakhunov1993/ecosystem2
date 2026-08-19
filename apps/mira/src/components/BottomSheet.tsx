import { useEffect, type ReactNode } from "react";
import { Icon } from "@/data/icons";

interface BottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Единственный паттерн ввода данных во всём продукте. */
export function BottomSheet({ open, title, subtitle, onClose, children, footer }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 animate-fadeIn bg-[rgba(6,7,10,0.66)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88vh] w-full max-w-[520px] animate-sheetIn flex-col rounded-t-sheet border border-border bg-surface"
      >
        <div className="flex items-start gap-3 border-b border-border-soft px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[19px] font-semibold leading-tight text-text">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] leading-snug text-text-dim">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 -mt-1 rounded-full p-2 text-text-faint transition hover:text-text"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="border-t border-border-soft px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
