import type { JSX } from "react";

/**
 * Единый icon language: stroke-based, viewBox 24, скруглённые концы.
 * Никаких иконочных библиотек — только этот набор.
 */
export type IconName =
  | "today"
  | "history"
  | "analytics"
  | "patterns"
  | "predictions"
  | "mood"
  | "flow"
  | "symptom"
  | "sleep"
  | "more"
  | "bbt"
  | "opk"
  | "mucus"
  | "movement"
  | "weight"
  | "feeding"
  | "diaper"
  | "hotflash"
  | "workout"
  | "meditation"
  | "street"
  | "home"
  | "gym"
  | "mat"
  | "note"
  | "play"
  | "pause"
  | "restart"
  | "gear"
  | "shield"
  | "trash"
  | "download"
  | "check"
  | "close"
  | "chevron"
  | "back"
  | "plus"
  | "minus"
  | "spark";

const PATHS: Record<IconName, JSX.Element> = {
  today: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  history: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <path d="M8 14h.01M12 14h.01M16 14h.01" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20V10M10 20V5M16 20v-7M22 20H2" />
    </>
  ),
  patterns: (
    <>
      <path d="M3 16c3 0 3-8 6-8s3 8 6 8 3-8 6-8" />
      <circle cx="9" cy="8" r="1.2" />
      <circle cx="15" cy="16" r="1.2" />
    </>
  ),
  predictions: (
    <>
      <path d="M3.5 15.5 9 10l3.5 3.5L20.5 6" />
      <path d="M15.5 6h5v5" />
      <path d="M3.5 19.5h17" />
    </>
  ),
  mood: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  flow: (
    <>
      <path d="M12 3.5c3.5 4.2 5.5 7 5.5 9.6A5.5 5.5 0 0 1 12 18.6a5.5 5.5 0 0 1-5.5-5.5C6.5 10.5 8.5 7.7 12 3.5Z" />
    </>
  ),
  symptom: (
    <>
      <path d="M12 20.5s-7.5-4.6-7.5-9.8A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 3.1c0 5.2-7.5 9.8-7.5 9.8Z" />
    </>
  ),
  sleep: (
    <>
      <path d="M19.5 14.2A7.6 7.6 0 0 1 9.8 4.5 7.8 7.8 0 1 0 19.5 14.2Z" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="18.5" cy="12" r="1.3" />
    </>
  ),
  bbt: (
    <>
      <path d="M10 13.8V5.5a2 2 0 1 1 4 0v8.3a4 4 0 1 1-4 0Z" />
      <path d="M12 9.5v5" />
    </>
  ),
  opk: (
    <>
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" />
      <path d="M9 10.5v3M12.5 10.5v3" />
    </>
  ),
  mucus: (
    <>
      <path d="M12 4c2.6 3.2 4 5.4 4 7.4a4 4 0 0 1-8 0C8 9.4 9.4 7.2 12 4Z" />
      <path d="M17.5 15.5c1 1.2 1.6 2.2 1.6 3a1.7 1.7 0 1 1-3.3 0c0-.8.6-1.8 1.7-3Z" />
    </>
  ),
  movement: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5c1.2-2 2.2-2 3.5 0s2.3 2 3.5 0" />
    </>
  ),
  weight: (
    <>
      <path d="M5.5 8.5h13l1.8 11.5H3.7L5.5 8.5Z" />
      <path d="M9.5 8.5a2.5 2.5 0 1 1 5 0" />
    </>
  ),
  feeding: (
    <>
      <path d="M9 9h6l1 11.5H8L9 9Z" />
      <path d="M10.5 9V6.5h3V9M12 3.5v3" />
    </>
  ),
  diaper: (
    <>
      <path d="M4.5 6.5h15v4.5c0 5-3.4 8.5-7.5 8.5S4.5 16 4.5 11V6.5Z" />
      <path d="M9 12.5h6" />
    </>
  ),
  hotflash: (
    <>
      <path d="M12 3.5c1 2.6.2 3.9-.9 5.2-1.3 1.6-2.6 3-2.6 5.3a3.5 3.5 0 0 0 7 0c0-1.4-.5-2.4-1.2-3.3" />
      <path d="M12 20.5v-2" />
    </>
  ),
  workout: (
    <>
      <path d="M3.5 12h2M18.5 12h2" />
      <rect x="5.5" y="8.5" width="3" height="7" rx="1.2" />
      <rect x="15.5" y="8.5" width="3" height="7" rx="1.2" />
      <path d="M8.5 12h7" />
    </>
  ),
  meditation: (
    <>
      <circle cx="12" cy="6" r="2.2" />
      <path d="M12 8.5v4M12 12.5 7 16.5M12 12.5l5 4M6 20.5h12" />
    </>
  ),
  street: (
    <>
      <path d="M3 18.5h18" />
      <path d="M6 18.5 10 7l4 6 2-3 2 8.5" />
    </>
  ),
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  gym: (
    <>
      <rect x="4" y="9" width="16" height="6" rx="2" />
      <path d="M8 6.5v11M16 6.5v11" />
    </>
  ),
  mat: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="3" />
      <path d="M7.5 7v10M16.5 7v10" />
    </>
  ),
  note: (
    <>
      <path d="M5 4.5h9L19 9v10.5H5V4.5Z" />
      <path d="M14 4.5V9h5M8.5 13h7M8.5 16h4" />
    </>
  ),
  play: (
    <>
      <path d="M8 5.5 18 12 8 18.5V5.5Z" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5.5v13M15 5.5v13" />
    </>
  ),
  restart: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v6c0 4.2-3 7.2-7 8.5-4-1.3-7-4.3-7-8.5V6l7-2.5Z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.6" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.7h9.2L17.5 7" />
      <path d="M10.5 10.5v6M13.5 10.5v6" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10.5M8 11l4 4 4-4" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  check: (
    <>
      <path d="M5 12.5 10 17.5 19 6.5" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  chevron: (
    <>
      <path d="M9 5.5 15.5 12 9 18.5" />
    </>
  ),
  back: (
    <>
      <path d="M15 5.5 8.5 12 15 18.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.5v13M5.5 12h13" />
    </>
  ),
  minus: (
    <>
      <path d="M5.5 12h13" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9 12 3.5Z" />
    </>
  ),
};

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
