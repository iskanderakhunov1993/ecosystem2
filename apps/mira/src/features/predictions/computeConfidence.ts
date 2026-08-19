import type { ConfidenceTier } from "@/lib/types";
import { pluralRu } from "@/lib/derive";

export interface ConfidenceResult {
  tier: ConfidenceTier;
  note: string;
}

/** Уверенность зависит от реального количества логов, а не от карточки. */
export function computeConfidence(logCount: number): ConfidenceResult {
  const records = `${logCount} ${pluralRu(logCount, "запись", "записи", "записей")}`;

  if (logCount === 0) {
    return {
      tier: "LOW",
      note: "Прогноз построен по введённым при регистрации данным — пока без истории логов",
    };
  }
  if (logCount < 5) {
    return { tier: "LOW", note: `Собрано ${records} — прогноз пока приблизительный` };
  }
  if (logCount < 12) {
    return { tier: "MEDIUM", note: `Собрано ${records} — прогноз стал точнее` };
  }
  return { tier: "HIGH", note: `Достаточно данных (${records}) для уверенного прогноза` };
}
