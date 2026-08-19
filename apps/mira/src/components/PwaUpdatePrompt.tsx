import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Icon } from "@/data/icons";

/**
 * Service worker меняется редко — баннер появляется только когда есть
 * действительно новая версия app shell'а, ждущая активации.
 */
export function PwaUpdatePrompt() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onOfflineReady: () => setOfflineReady(true),
  });

  useEffect(() => {
    if (!offlineReady) return;
    const timer = window.setTimeout(() => setOfflineReady(false), 3000);
    return () => window.clearTimeout(timer);
  }, [offlineReady]);

  // Баннер перекрывал карточки на каждом экране и не закрывался.
  // Обновление можно отложить — оно применится при следующем запуске.
  if (dismissed) return null;
  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[488px] items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-text-dim">
        {needRefresh ? "Доступна новая версия Mira." : "Mira готова работать офлайн."}
      </p>
      {needRefresh && (
        <>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 rounded-xl bg-accent px-3 py-2 text-[13px] font-semibold text-[#12141A]"
          >
            Обновить
          </button>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setDismissed(true)}
            className="shrink-0 text-text-faint"
          >
            <Icon name="close" size={16} />
          </button>
        </>
      )}
    </div>
  );
}
