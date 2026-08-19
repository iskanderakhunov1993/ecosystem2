import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Icon } from "@/data/icons";
import { pluralRu } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import { stageOf } from "@/lib/types";
import { RANGE_LABELS, buildReport, reportToText, type RangeKey, type ShareKey } from "./buildReport";

/**
 * Отчёт врачу — третий уровень «Моего цикла», а не отдельная вкладка:
 * его открывают раз в несколько месяцев, но собирается он постоянно.
 */
export function DoctorReport({ onBack }: { onBack: () => void }) {
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile[state.mode]);
  const events = useAppStore((state) => state.logEvents[state.mode]);
  const sessions = useAppStore((state) => state.sessions[state.mode]);
  const stage = stageOf(profile);

  const [range, setRange] = useState<RangeKey>("3m");
  const report = useMemo(
    () => buildReport(mode, stage, profile, events, sessions, range),
    [mode, stage, profile, events, sessions, range]
  );

  // Чувствительные категории сняты по умолчанию: женщина решает это до того,
  // как файл создан, а не обнаруживает их в готовом документе у врача.
  const [selected, setSelected] = useState<Set<ShareKey>>(
    () => new Set(report.shareOptions.filter((option) => !option.sensitive).map((option) => option.key))
  );

  const toggle = (key: ShareKey) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const download = () => {
    const blob = new Blob([reportToText(report, selected)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `livi-otchet-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="mb-1 flex items-center gap-1.5 text-text-dim">
        <span className="rotate-180">
          <Icon name="chevron" size={16} />
        </span>
        <span className="text-[13px]">Мой цикл</span>
      </button>

      <Card title="Готово к приёму">
        <p className="font-display text-[20px] font-semibold leading-none text-text">
          {report.activeDays} {pluralRu(report.activeDays, "день", "дня", "дней")} с записями
        </p>
        <p className="mt-2 text-[13px] leading-snug text-text-dim">{report.periodLabel}</p>
        <div className="mt-3 flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
          {RANGE_LABELS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
              className={`flex-1 rounded-lg py-2 text-[11.5px] transition ${
                range === item.key ? "bg-accent font-semibold text-[#12141A]" : "text-text-dim"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Блок появляется, только если есть что показать. Пустым не бывает. */}
      {report.worthShowing.length > 0 && (
        <Card title="Стоит обсудить">
          <ul className="space-y-3">
            {report.worthShowing.map((item) => (
              <li key={item.title} className="border-l-2 border-danger pl-3">
                <p className="text-[13.5px] font-medium leading-snug text-text">{item.title}</p>
                <p className="mt-1 text-[12px] leading-snug text-text-dim">{item.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Главное">
        <ul>
          {report.facts.map((fact, index) => (
            <li
              key={fact.label}
              className={`flex items-baseline justify-between gap-3 py-2 ${
                index < report.facts.length - 1 ? "border-b border-border-soft" : ""
              }`}
            >
              <span className="text-[13px] text-text-dim">{fact.label}</span>
              <span
                className={`mono-label text-right ${fact.flagged ? "text-warn" : "text-text"}`}
                style={{ fontSize: 11 }}
              >
                {fact.value}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Спросить на приёме">
        <ul className="space-y-2">
          {report.questions.map((question) => (
            <li key={question} className="text-[13px] leading-snug text-text-dim">
              — {question}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Что включить в файл">
        <ul>
          {report.shareOptions.map((option, index) => {
            const on = selected.has(option.key);
            return (
              <li
                key={option.key}
                className={index < report.shareOptions.length - 1 ? "border-b border-border-soft" : ""}
              >
                <button
                  type="button"
                  onClick={() => toggle(option.key)}
                  aria-pressed={on}
                  className="flex w-full items-center gap-3 py-2.5 text-left"
                >
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border ${
                      on ? "border-accent bg-accent text-[#12141A]" : "border-border"
                    }`}
                  >
                    {on && <Icon name="check" size={11} strokeWidth={2.4} />}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] text-text">{option.label}</span>
                  <span className="mono-label shrink-0 text-text-faint">
                    {option.sensitive ? "личное" : option.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11.5px] leading-snug text-text-faint">
          Снятые галочки не попадут в файл. Ты решаешь, что видит врач.
        </p>
      </Card>

      <Button onClick={download}>Скачать файл</Button>

      <p className="px-1 text-[11.5px] leading-snug text-text-faint">
        Отчёт показывает твои наблюдения и не ставит диагноз. Данные могут быть неполными, если дни
        не заполнялись.
      </p>
    </div>
  );
}
