import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { FieldLabel, OptionChips, Scale5, Stepper } from "@/components/inputs";
import { MOOD_SCALE_LABELS, getChipConfig, type LogGroup } from "@/data/modes.config";
import { dateKey, formatDate, startOfDay } from "@/lib/derive";
import { useAppStore } from "@/store/appStore";
import type { Mode, Stage } from "@/lib/types";

type GroupValue = { selected: string[]; scale: number | null; numeric: number | null };

function emptyValue(group: LogGroup): GroupValue {
  return {
    selected: [],
    scale: null,
    numeric: group.type === "temp" || group.type === "counter" ? (group.default ?? group.min ?? 0) : null,
  };
}

function groupSummary(group: LogGroup, value: GroupValue): string | null {
  switch (group.type) {
    case "single":
    case "multi":
      return value.selected.length ? value.selected.join(", ") : null;
    case "scale5":
      return value.scale ? MOOD_SCALE_LABELS[value.scale - 1] : null;
    case "temp":
    case "counter":
      return value.numeric === null ? null : `${value.numeric}${group.unit ? ` ${group.unit}` : ""}`;
    default:
      return null;
  }
}

interface LogSheetProps {
  mode: Mode;
  stage?: Stage;
  chipId: string;
  /** Дата записи. Без неё — сегодня; с ней — дозаполнение прошлого дня из календаря. */
  date?: number;
  onClose: () => void;
}

/**
 * Bottom sheet поверх Today. Сохранение пушит событие в append-only лог
 * и возвращает пользователя на Today — промежуточных экранов нет.
 */
export function LogSheet({ mode, stage, chipId, date, onClose }: LogSheetProps) {
  const addLogEvent = useAppStore((state) => state.addLogEvent);
  const chip = getChipConfig(mode, stage, chipId);

  const [values, setValues] = useState<Record<string, GroupValue>>(() => {
    const initial: Record<string, GroupValue> = {};
    for (const group of chip?.groups ?? []) initial[group.id] = emptyValue(group);
    return initial;
  });

  const parts = useMemo(() => {
    if (!chip) return [];
    return chip.groups
      .map((group) => groupSummary(group, values[group.id] ?? emptyValue(group)))
      .filter((part): part is string => Boolean(part));
  }, [chip, values]);

  if (!chip) return null;

  const isBackfill = date !== undefined && dateKey(date) !== dateKey(Date.now());
  const backfillNoon = date === undefined ? undefined : startOfDay(date) + 12 * 60 * 60 * 1000;

  const save = () => {
    const multiGroup = chip.groups.find((group) => group.type === "multi");
    const scaleGroup = chip.groups.find((group) => group.type === "scale5");
    const numericGroup = chip.groups.find((group) => group.type === "temp" || group.type === "counter");

    addLogEvent({
      mode,
      chipId: chip.id,
      summary: parts.join(" · "),
      multiLabels: multiGroup ? values[multiGroup.id]?.selected : undefined,
      scaleVal: scaleGroup ? values[scaleGroup.id]?.scale ?? undefined : undefined,
      numericVal: numericGroup ? values[numericGroup.id]?.numeric ?? undefined : undefined,
      // Запись за прошлый день ставится на полдень, чтобы не зависеть от часового пояса.
      timestamp: isBackfill ? backfillNoon : undefined,
    });
    onClose();
  };

  const update = (groupId: string, patch: Partial<GroupValue>) =>
    setValues((prev) => ({
      ...prev,
      [groupId]: { ...{ selected: [], scale: null, numeric: null }, ...prev[groupId], ...patch },
    }));

  return (
    <BottomSheet
      open
      title={chip.label}
      subtitle={
        isBackfill && date !== undefined
          ? `Запись сохранится в ${formatDate(date)} — можно дозаполнить пропущенный день`
          : "Запись сохранится в сегодняшний день"
      }
      onClose={onClose}
    >
      <div className="space-y-6">
        {chip.groups.map((group) => (
          <div key={group.id}>
            <FieldLabel>{group.label}</FieldLabel>
            {(group.type === "single" || group.type === "multi") && (
              <OptionChips
                options={group.options ?? []}
                value={values[group.id]?.selected ?? []}
                multi={group.type === "multi"}
                onChange={(selected) => update(group.id, { selected })}
              />
            )}
            {group.type === "scale5" && (
              <Scale5 value={values[group.id]?.scale ?? null} onChange={(scale) => update(group.id, { scale })} />
            )}
            {(group.type === "temp" || group.type === "counter") && (
              <Stepper
                value={values[group.id]?.numeric ?? group.default ?? group.min ?? 0}
                min={group.min ?? 0}
                max={group.max ?? 100}
                step={group.step ?? 1}
                unit={group.unit ?? ""}
                onChange={(numeric) => update(group.id, { numeric })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button disabled={parts.length === 0} onClick={save}>
          Сохранить
        </Button>
      </div>
    </BottomSheet>
  );
}
