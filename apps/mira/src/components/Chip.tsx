import { Icon, type IconName } from "@/data/icons";

interface ChipProps {
  icon: IconName;
  label: string;
  logged?: boolean;
  onClick?: () => void;
}

/** Единственный способ инициировать логирование с Today. */
export function Chip({ icon, label, logged = false, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={logged}
      className={[
        "relative flex min-w-0 flex-col items-center justify-start gap-1.5 min-h-[74px] rounded-chip border px-1 py-2.5 transition active:scale-[0.97]",
        logged
          ? "border-accent bg-accent-soft text-accent-text"
          : "border-border bg-surface-2 text-text-dim hover:text-text",
      ].join(" ")}
    >
      <Icon name={icon} size={22} />
      {/* Переносы по слогам вместо разрыва посреди слова: «Настрое/ние» читалось как опечатка.
          Работает благодаря lang="ru" на <html>. */}
      <span className="w-full text-center text-[10px] font-medium leading-[1.2] [hyphens:auto] [overflow-wrap:break-word]">
        {label}
      </span>
      {logged && (
        <span className="absolute right-1.5 top-1.5 text-accent">
          <Icon name="check" size={13} strokeWidth={2.2} />
        </span>
      )}
    </button>
  );
}
