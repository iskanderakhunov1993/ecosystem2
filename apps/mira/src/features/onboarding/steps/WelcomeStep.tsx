export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-border bg-surface-2">
        <span className="font-display text-[30px] font-semibold text-accent-text">M</span>
      </div>
      <h1 className="mt-7 font-display text-[30px] font-semibold leading-tight text-text">Mira</h1>
      <p className="mt-3 max-w-[320px] text-[15px] leading-relaxed text-text-dim">
        Трекер, который подстраивается под твой этап: цикл, планирование, беременность,
        восстановление, перименопауза, менопауза.
      </p>
      <p className="mono-label mt-6 text-text-faint">Данные остаются на устройстве</p>
    </div>
  );
}
