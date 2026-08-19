import type { MiraLocalData, IslamicEntry, FastingStatus } from "./types";
import { dateKey, getCycleDay, getCyclePhase } from "./store";

// ── Madhab rules ──

export type Madhab = "hanafi" | "shafii" | "maliki" | "hanbali";

type MadhabRules = {
  name: string;
  nameAr: string;
  haydMin: number;
  haydMax: number;
  tuhrMin: number;
  nifasMax: number;
  notes: string;
};

export const madhabs: Record<Madhab, MadhabRules> = {
  hanafi: {
    name: "Ханафи",
    nameAr: "حنفي",
    haydMin: 3,
    haydMax: 10,
    tuhrMin: 15,
    nifasMax: 40,
    notes: "Минимум хайда — 3 дня (72 часа). Если кровотечение < 3 дней, считается истихадой.",
  },
  shafii: {
    name: "Шафии",
    nameAr: "شافعي",
    haydMin: 1,
    haydMax: 15,
    tuhrMin: 15,
    nifasMax: 60,
    notes: "Минимум хайда — 1 день. Обычный срок — 6-7 дней.",
  },
  maliki: {
    name: "Малики",
    nameAr: "مالكي",
    haydMin: 0,
    haydMax: 15,
    tuhrMin: 15,
    nifasMax: 60,
    notes: "Нет строгого минимума. Максимум — 15 дней для начинающей, для имеющей привычку — её обычный срок + 3 дня.",
  },
  hanbali: {
    name: "Ханбали",
    nameAr: "حنبلي",
    haydMin: 1,
    haydMax: 15,
    tuhrMin: 13,
    nifasMax: 40,
    notes: "Минимум хайда — 1 день (24 часа). Минимум чистоты — 13 дней.",
  },
};

// ── Day status ──

export type DayStatus = "hayd" | "istihada" | "nifas" | "purity" | "unknown";

export function getDayStatus(data: MiraLocalData, madhab: Madhab, date?: string): {
  status: DayStatus;
  explanation: string;
  shouldPray: boolean;
  shouldFast: boolean;
} {
  const key = date ?? dateKey();
  const entry = data.islamicEntries?.[key];
  const rules = madhabs[madhab];

  if (entry?.nifas) {
    return {
      status: "nifas",
      explanation: `Нифас (послеродовое кровотечение). Намаз и пост не обязательны. Максимум ${rules.nifasMax} дней по ${rules.name}.`,
      shouldPray: false,
      shouldFast: false,
    };
  }

  if (entry?.hayd) {
    const consecutiveHaydDays = countConsecutiveHayd(data, key);
    if (consecutiveHaydDays > rules.haydMax) {
      return {
        status: "istihada",
        explanation: `Кровотечение > ${rules.haydMax} дней (максимум хайда по ${rules.name}). Это истихада — нужно молиться и поститься, делая вуду перед каждым намазом.`,
        shouldPray: true,
        shouldFast: true,
      };
    }
    return {
      status: "hayd",
      explanation: `Хайд (менструация), день ${consecutiveHaydDays}. Намаз и пост не обязательны. Пропущенные посты нужно возместить (каза).`,
      shouldPray: false,
      shouldFast: false,
    };
  }

  if (entry?.istihadha) {
    return {
      status: "istihada",
      explanation: "Истихада (аномальное кровотечение). Намаз и пост обязательны. Делай вуду перед каждым намазом.",
      shouldPray: true,
      shouldFast: true,
    };
  }

  if (entry?.purity) {
    return {
      status: "purity",
      explanation: "Чистота (тухр). Все ибады выполняются обычным образом.",
      shouldPray: true,
      shouldFast: true,
    };
  }

  return {
    status: "unknown",
    explanation: "Статус не отмечен. Отметь состояние, чтобы получить рекомендации.",
    shouldPray: true,
    shouldFast: true,
  };
}

function countConsecutiveHayd(data: MiraLocalData, fromDate: string): number {
  let count = 0;
  const d = new Date(fromDate);
  for (let i = 0; i < 20; i++) {
    const key = d.toISOString().slice(0, 10);
    if (data.islamicEntries?.[key]?.hayd) {
      count++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

// ── Smart hayd/istihada detector ──

export type BleedingAdvice = {
  type: "hayd" | "istihada" | "uncertain";
  title: string;
  explanation: string;
  action: string;
};

export function getBleedingAdvice(data: MiraLocalData, madhab: Madhab, bleedingDays: number): BleedingAdvice {
  const rules = madhabs[madhab];

  if (bleedingDays < rules.haydMin && rules.haydMin > 0) {
    return {
      type: "istihada",
      title: "Скорее всего истихада",
      explanation: `По ${rules.name} мазхабу минимум хайда — ${rules.haydMin} дн. Кровотечение ${bleedingDays} дн. — это истихада.`,
      action: "Намаз и пост обязательны. Делай вуду перед каждым намазом.",
    };
  }

  if (bleedingDays > rules.haydMax) {
    return {
      type: "istihada",
      title: "Это уже истихада",
      explanation: `Кровотечение ${bleedingDays} дн. > максимум хайда ${rules.haydMax} дн. по ${rules.name}. Начинай молиться.`,
      action: "Прими гусль и начинай молиться. Делай вуду перед каждым намазом.",
    };
  }

  if (bleedingDays >= rules.haydMin && bleedingDays <= rules.haydMax) {
    return {
      type: "hayd",
      title: "Это хайд",
      explanation: `Кровотечение ${bleedingDays} дн. — в пределах хайда по ${rules.name} (${rules.haydMin}–${rules.haydMax} дн.).`,
      action: "Намаз и пост не обязательны. Пропущенные посты — каза.",
    };
  }

  return {
    type: "uncertain",
    title: "Требуется уточнение",
    explanation: "Обратись к знающему учёному для разъяснения своей ситуации.",
    action: "Если сомневаешься — молись, это безопаснее.",
  };
}

// ── Qada counter ──

export type QadaStats = {
  totalMissed: number;
  totalMadeUp: number;
  remaining: number;
  byYear: { year: number; missed: number; madeUp: number; remaining: number }[];
};

export function getQadaStats(data: MiraLocalData): QadaStats {
  const entries = data.islamicEntries ?? {};
  const byYear: Record<number, { missed: number; madeUp: number }> = {};
  let totalMissed = 0;
  let totalMadeUp = 0;

  for (const [date, entry] of Object.entries(entries)) {
    if (!entry.fasting) continue;
    const year = new Date(date).getFullYear();
    if (!byYear[year]) byYear[year] = { missed: 0, madeUp: 0 };

    if (entry.fasting === "missed" || entry.fasting === "exempt") {
      byYear[year].missed++;
      totalMissed++;
    }
    if (entry.fasting === "makeup") {
      byYear[year].madeUp++;
      totalMadeUp++;
    }
  }

  const years = Object.entries(byYear)
    .map(([y, v]) => ({
      year: +y,
      missed: v.missed,
      madeUp: v.madeUp,
      remaining: Math.max(0, v.missed - v.madeUp),
    }))
    .sort((a, b) => b.year - a.year);

  return {
    totalMissed,
    totalMadeUp,
    remaining: Math.max(0, totalMissed - totalMadeUp),
    byYear: years,
  };
}

// ── Ghusl reminder ──

export function needsGhusl(data: MiraLocalData): boolean {
  const today = dateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = dateKey(yesterday);

  const todayEntry = data.islamicEntries?.[today];
  const yesterdayEntry = data.islamicEntries?.[yKey];

  return !!(yesterdayEntry?.hayd && (!todayEntry?.hayd) && todayEntry?.purity);
}

// ── Duas for hayd days ──

export type Dua = {
  arabic: string;
  transliteration: string;
  translation: string;
  context: string;
};

export const haydDuas: Dua[] = [
  {
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ",
    transliteration: "Субхана-Ллахи ва бихамдих, Субхана-Ллахил-Азым",
    translation: "Пречист Аллах и хвала Ему, Пречист Аллах Великий",
    context: "Можно произносить в любом состоянии. Пророк ﷺ сказал: два слова, лёгких на языке, тяжёлых на весах.",
  },
  {
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Ля иляха илля-Ллаху вахдаху ля шарика лях",
    translation: "Нет божества, кроме Аллаха, Единого, нет у Него сотоварища",
    context: "Зикр, который можно делать во время хайда.",
  },
  {
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Астагфиру-Ллахаль-Азыма ва атубу иляйх",
    translation: "Прошу прощения у Аллаха Великого и каюсь перед Ним",
    context: "Истигфар разрешён в любом состоянии.",
  },
  {
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
    transliteration: "Аллахумма салли 'аля Мухаммад ва 'аля али Мухаммад",
    translation: "О Аллах, благослови Мухаммада и семью Мухаммада",
    context: "Салават на Пророка ﷺ — разрешён и награждаем во время хайда.",
  },
  {
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Ля хауля ва ля куввата илля би-Ллях",
    translation: "Нет мощи и силы, кроме как от Аллаха",
    context: "Сокровище из сокровищ Рая. Можно произносить всегда.",
  },
];

// ── Ramadan mode ──

export type RamadanInfo = {
  isRamadanApprox: boolean;
  missedThisRamadan: number;
  planAfterRamadan: string;
};

export function getRamadanInfo(data: MiraLocalData): RamadanInfo {
  const entries = data.islamicEntries ?? {};
  const now = new Date();
  const year = now.getFullYear();

  let missedThisYear = 0;
  for (const [date, entry] of Object.entries(entries)) {
    if (new Date(date).getFullYear() === year && (entry.fasting === "missed" || entry.fasting === "exempt")) {
      missedThisYear++;
    }
  }

  return {
    isRamadanApprox: false,
    missedThisRamadan: missedThisYear,
    planAfterRamadan: missedThisYear > 0
      ? `${missedThisYear} дн. каза. Можно возместить по 1 дню в понедельник и четверг — это ещё и сунна.`
      : "Нет пропущенных дней.",
  };
}

// ── Education content ──

export const educationCards = [
  {
    title: "Ты не отрезана от Аллаха",
    body: "Хайд — не наказание и не нечистота. Пророк ﷺ сказал Аише (р.а.): «Это то, что Аллах предписал дочерям Адама». Ты можешь делать зикр, дуа, слушать Коран и просить Аллаха обо всём.",
  },
  {
    title: "Что можно во время хайда",
    body: "Зикр (субхана-Ллах, альхамду ли-Ллях), дуа своими словами, салават на Пророка ﷺ, истигфар, слушать Коран, читать исламскую литературу, делать садаку, учить детей.",
  },
  {
    title: "Что нельзя во время хайда",
    body: "Намаз (не нужно возмещать), пост (нужно каза), тават вокруг Каабы, половой акт. По вопросу чтения Корана — мнения мазхабов различаются.",
  },
  {
    title: "Как определить конец хайда",
    body: "Белые выделения (аль-куссату аль-байда) или полное прекращение выделений. Если сомневаешься — подожди и проверь через несколько часов.",
  },
  {
    title: "Гусль после хайда",
    body: "Обязательное полное омовение: намерение, мытьё всего тела с водой, включая корни волос. После гусля — возобновляй намаз и пост.",
  },
];
