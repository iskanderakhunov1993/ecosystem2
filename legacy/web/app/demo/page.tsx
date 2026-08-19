"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { writeData } from "@/lib/store";
import type { MiraLocalData, DailyCheckIn, UserProfile } from "@/lib/types";

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function makeCheckIn(daysAgo: number, partial: Partial<DailyCheckIn>): [string, DailyCheckIn] {
  const date = dateStr(daysAgo);
  return [date, { date, savedAt: new Date().toISOString(), ...partial }];
}

function daysRange(startDaysAgo: number, count: number, fn: (index: number) => Partial<DailyCheckIn>): [string, DailyCheckIn][] {
  return Array.from({ length: count }, (_, i) => makeCheckIn(startDaysAgo - i, fn(i)));
}

function makeData(
  name: string, periodStartDaysAgo: number, cycleLength: number, periodLength: number,
  checkIns: [string, DailyCheckIn][],
  opts?: { age?: number; islam?: boolean; madhab?: "hanafi" | "shafii" | "maliki" | "hanbali" },
): MiraLocalData {
  // История реальных стартов месячных: 4 прошлых цикла с лёгким разбросом ±1-2 дня
  const periodStarts: string[] = [];
  let anchor = periodStartDaysAgo;
  for (let i = 0; i < 4; i++) {
    periodStarts.unshift(dateStr(anchor));
    const variance = (i % 2 === 0 ? 1 : -1) * (i + 1); // небольшой реалистичный разброс
    anchor += cycleLength + variance;
  }

  const profile: UserProfile = {
    name,
    age: opts?.age,
    showCalories: false,
    cycleConfig: { periodStart: dateStr(periodStartDaysAgo), cycleLength, periodLength, periodStarts },
    trackingPreferences: ["cycle", "pain", "mood", "energy", "sleep"],
    additionalMode: opts?.islam ? "islam" : "none",
    madhab: opts?.madhab,
    pinEnabled: false,
    hiddenNotifications: false,
    privateMarks: true,
  };
  const checkInMap: Record<string, DailyCheckIn> = {};
  for (const [key, val] of checkIns) checkInMap[key] = val;
  const data: MiraLocalData = { version: 2, profile, checkIns: checkInMap, workouts: [], onboardingCompleted: true };
  if (opts?.islam) {
    data.islamicEntries = {};
    for (let i = 0; i < 5; i++) {
      data.islamicEntries[dateStr(60 - i)] = { hayd: true, fasting: "missed" };
      data.islamicEntries[dateStr(30 - i)] = { hayd: true, fasting: "missed" };
    }
    data.islamicEntries[dateStr(15)] = { fasting: "makeup" };
    data.islamicEntries[dateStr(8)] = { fasting: "makeup" };
  }
  return data;
}

type DemoUser = { name: string; desc: string; emoji: string; tags: string[]; build: () => MiraLocalData };

const users: DemoUser[] = [
  {
    name: "Айсель", desc: "Новая пользовательница, 3 дня данных", emoji: "🌱", tags: ["новичок", "3 дня"],
    build: () => makeData("Айсель", 14, 28, 5, [
      makeCheckIn(2, { mood: { value: "normal" }, energy: { value: "normal" }, sleep: { quality: "good" } }),
      makeCheckIn(1, { mood: { value: "normal" }, energy: { value: "high" } }),
      makeCheckIn(0, { mood: { value: "joy" }, energy: { value: "high" }, sleep: { quality: "good", hours: 8 } }),
    ]),
  },
  {
    name: "Диана", desc: "Менструация сейчас, сильная боль, тяжёлый день", emoji: "🩸", tags: ["менструация", "сильная боль", "тяжёлый день"],
    build: () => makeData("Диана", 2, 28, 5, [
      ...daysRange(30, 5, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const, "lower_abdomen" as const], level: "strong" as const }, mood: { value: "sadness" as const }, energy: { value: "exhausted" as const }, sleep: { quality: "bad" as const, hours: 5 } })),
      ...daysRange(25, 8, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(17, 5, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const } })),
      ...daysRange(12, 5, () => ({ pms: { symptoms: ["Раздражительность", "Тяга к еде", "Вздутие"] }, mood: { value: "swings" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const, hours: 6 } })),
      makeCheckIn(1, { period: { intensity: "heavy" }, pain: { kinds: ["cramps", "lower_abdomen"], level: "strong" }, energy: { value: "exhausted" }, sleep: { quality: "bad", hours: 4 } }),
      makeCheckIn(0, { period: { intensity: "very_heavy" }, pain: { kinds: ["cramps", "lower_abdomen"], level: "strong" }, mood: { value: "sadness" }, energy: { value: "exhausted" }, sleep: { quality: "insomnia" } }),
    ]),
  },
  {
    name: "Камилла", desc: "Лютеиновая фаза, выраженный ПМС", emoji: "😤", tags: ["ПМС", "лютеиновая", "раздражительность"],
    build: () => makeData("Камилла", 7, 30, 5, [
      ...daysRange(60, 5, () => ({ period: { intensity: "moderate" as const }, pain: { kinds: ["cramps" as const], level: "medium" as const } })),
      ...daysRange(55, 10, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(45, 7, () => ({ pms: { symptoms: ["Раздражительность", "Тяга к еде", "Болезненность груди", "Акне"] }, mood: { value: "anger" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const } })),
      ...daysRange(5, 5, () => ({ pms: { symptoms: ["Раздражительность", "Тяга к еде", "Усталость", "Тревожность"] }, mood: { value: "swings" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const, hours: 5 } })),
      makeCheckIn(0, { pms: { symptoms: ["Раздражительность", "Тяга к еде", "Вздутие"] }, mood: { value: "anger" }, energy: { value: "low" } }),
    ]),
  },
  {
    name: "Лейла", desc: "Фолликулярная фаза, максимум энергии", emoji: "⚡", tags: ["фолликулярная", "высокая энергия"],
    build: () => makeData("Лейла", 10, 28, 4, [
      ...daysRange(40, 4, () => ({ period: { intensity: "light" as const } })),
      ...daysRange(36, 14, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const }, sleep: { quality: "good" as const, hours: 8 } })),
      ...daysRange(10, 4, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(6, 6, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const }, sleep: { quality: "good" as const, hours: 7 } })),
      makeCheckIn(0, { mood: { value: "joy" }, energy: { value: "high" }, sleep: { quality: "good", hours: 8 } }),
    ]),
  },
  {
    name: "Амина", desc: "Нерегулярный цикл 36 дней, задержка", emoji: "📅", tags: ["нерегулярный", "длинный цикл", "задержка"],
    build: () => makeData("Амина", 38, 36, 6, [
      ...daysRange(70, 6, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const], level: "medium" as const } })),
      ...daysRange(64, 20, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(23, 7, () => ({ pms: { symptoms: ["Усталость", "Вздутие"] }, mood: { value: "anxiety" as const }, energy: { value: "low" as const } })),
      makeCheckIn(0, { mood: { value: "anxiety" }, energy: { value: "low" } }),
    ]),
  },
  {
    name: "София", desc: "Обильные месячные + низкая энергия → проверить железо", emoji: "🫠", tags: ["обильные", "железо", "усталость"],
    build: () => makeData("София", 3, 27, 6, [
      ...daysRange(55, 6, () => ({ period: { intensity: "very_heavy" as const }, pain: { kinds: ["cramps" as const], level: "strong" as const }, energy: { value: "exhausted" as const } })),
      ...daysRange(49, 10, () => ({ energy: { value: "low" as const } })),
      ...daysRange(29, 6, () => ({ period: { intensity: "very_heavy" as const }, pain: { kinds: ["cramps" as const, "back" as const], level: "strong" as const }, energy: { value: "exhausted" as const } })),
      ...daysRange(23, 10, () => ({ energy: { value: "low" as const }, mood: { value: "sadness" as const } })),
      ...daysRange(3, 3, () => ({ period: { intensity: "heavy" }, energy: { value: "exhausted" }, pain: { kinds: ["cramps"], level: "strong" } })),
      makeCheckIn(0, { period: { intensity: "very_heavy" }, energy: { value: "exhausted" }, pain: { kinds: ["cramps", "back"], level: "strong" } }),
    ]),
  },
  {
    name: "Мария", desc: "Овуляция, пик энергии и либидо", emoji: "✨", tags: ["овуляция", "пик", "отлично"],
    build: () => makeData("Мария", 14, 28, 5, [
      ...daysRange(28, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(23, 9, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const }, sleep: { quality: "good" as const, hours: 8 } })),
      makeCheckIn(0, { mood: { value: "joy" }, energy: { value: "high" }, sleep: { quality: "good", hours: 8 } }),
    ]),
  },
  {
    name: "Зарина", desc: "90 дней данных, стабильная норма", emoji: "📊", tags: ["90 дней", "стабильная норма"],
    build: () => makeData("Зарина", 18, 29, 5, [
      ...daysRange(90, 90, (i) => {
        const cd = (i % 29) + 1;
        if (cd <= 5) return { period: { intensity: "moderate" as const }, pain: cd <= 2 ? { kinds: ["cramps" as const], level: "light" as const } : undefined, mood: { value: "normal" as const }, energy: { value: "low" as const }, sleep: { quality: "normal" as const, hours: 7 } };
        if (cd <= 16) return { mood: { value: "joy" as const }, energy: { value: "high" as const }, sleep: { quality: "good" as const, hours: 8 } };
        if (cd <= 23) return { mood: { value: "normal" as const }, energy: { value: "normal" as const }, sleep: { quality: "normal" as const, hours: 7 } };
        return { pms: { symptoms: ["Раздражительность", "Усталость"] }, mood: { value: "swings" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const, hours: 6 } };
      }),
    ]),
  },
  {
    name: "Алия", desc: "Бессонница в лютеиновой фазе", emoji: "🌙", tags: ["бессонница", "лютеиновая"],
    build: () => makeData("Алия", 5, 28, 5, [
      ...daysRange(56, 5, () => ({ period: { intensity: "moderate" as const }, sleep: { quality: "normal" as const, hours: 7 } })),
      ...daysRange(51, 8, () => ({ sleep: { quality: "good" as const, hours: 8 }, energy: { value: "high" as const } })),
      ...daysRange(43, 10, () => ({ sleep: { quality: "insomnia" as const, hours: 4 }, energy: { value: "low" as const }, mood: { value: "anxiety" as const } })),
      ...daysRange(28, 8, () => ({ sleep: { quality: "good" as const, hours: 8 }, energy: { value: "high" as const } })),
      ...daysRange(5, 5, () => ({ sleep: { quality: "insomnia" as const, hours: 4 }, energy: { value: "low" as const }, mood: { value: "anxiety" as const } })),
      makeCheckIn(0, { sleep: { quality: "insomnia", hours: 3 }, energy: { value: "exhausted" }, mood: { value: "anxiety" } }),
    ]),
  },
  {
    name: "Нурия", desc: "Много красных флагов, нужен врач", emoji: "🩺", tags: ["врач", "красные флаги", "боль"],
    build: () => makeData("Нурия", 4, 38, 8, [
      ...daysRange(80, 8, () => ({ period: { intensity: "very_heavy" as const }, pain: { kinds: ["cramps" as const, "lower_abdomen" as const, "back" as const], level: "strong" as const } })),
      ...daysRange(72, 15, () => ({ energy: { value: "low" as const }, mood: { value: "sadness" as const }, sleep: { quality: "bad" as const } })),
      ...daysRange(34, 8, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const], level: "strong" as const } })),
      ...daysRange(26, 10, () => ({ mood: { value: "sadness" as const }, energy: { value: "low" as const } })),
      makeCheckIn(0, { pain: { kinds: ["cramps", "lower_abdomen"], level: "strong" }, energy: { value: "exhausted" } }),
    ]),
  },
  {
    name: "Ясмин", desc: "Тревожность в лютеиновой фазе", emoji: "😰", tags: ["тревога", "лютеиновая"],
    build: () => makeData("Ясмин", 6, 28, 5, [
      ...daysRange(56, 5, () => ({ period: { intensity: "moderate" as const }, mood: { value: "normal" as const } })),
      ...daysRange(51, 9, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const } })),
      ...daysRange(42, 8, () => ({ mood: { value: "anxiety" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const } })),
      ...daysRange(6, 6, () => ({ mood: { value: "anxiety" as const }, energy: { value: "low" as const }, pms: { symptoms: ["Тревожность", "Раздражительность"] } })),
      makeCheckIn(0, { mood: { value: "anxiety" }, energy: { value: "low" }, pms: { symptoms: ["Тревожность", "Раздражительность", "Головная боль"] } }),
    ]),
  },
  {
    name: "Дарья", desc: "Месячные через 2 дня — напоминание", emoji: "🔔", tags: ["напоминание", "подготовься"],
    build: () => makeData("Дарья", 26, 28, 5, [
      ...daysRange(28, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(23, 20, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      makeCheckIn(0, { mood: { value: "normal" }, energy: { value: "normal" } }),
    ]),
  },
  {
    name: "Эмилия", desc: "Короткий цикл 21 день — красный флаг", emoji: "⏱️", tags: ["короткий цикл", "красный флаг"],
    build: () => makeData("Эмилия", 10, 21, 4, [
      ...daysRange(42, 4, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(38, 7, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(21, 4, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(17, 7, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const } })),
      makeCheckIn(0, { mood: { value: "normal" }, energy: { value: "normal" } }),
    ]),
  },
  {
    name: "Фатима", desc: "Водный трекер — 6 из 8 стаканов", emoji: "💧", tags: ["вода", "забота"],
    build: () => {
      const d = makeData("Фатима", 12, 28, 5, [
        ...daysRange(14, 14, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
        makeCheckIn(0, { mood: { value: "normal" }, energy: { value: "normal" }, sleep: { quality: "good", hours: 7 } }),
      ]);
      const today = dateStr(0);
      d.waterLog = { [today]: { date: today, glasses: 6, goal: 8 } };
      return d;
    },
  },
  {
    name: "Рената", desc: "Грусть повторяется в менструальной фазе", emoji: "😢", tags: ["грусть", "менструация", "паттерн"],
    build: () => makeData("Рената", 3, 28, 5, [
      ...daysRange(56, 5, () => ({ period: { intensity: "moderate" as const }, mood: { value: "sadness" as const }, energy: { value: "low" as const } })),
      ...daysRange(51, 10, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(28, 5, () => ({ period: { intensity: "moderate" as const }, mood: { value: "sadness" as const }, energy: { value: "low" as const } })),
      ...daysRange(23, 10, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const } })),
      ...daysRange(3, 3, () => ({ period: { intensity: "moderate" }, mood: { value: "sadness" }, energy: { value: "low" } })),
      makeCheckIn(0, { period: { intensity: "moderate" }, mood: { value: "sadness" }, energy: { value: "exhausted" } }),
    ]),
  },
  {
    name: "Лина", desc: "Всё хорошо, стабильный здоровый цикл", emoji: "😊", tags: ["здоровый", "стабильный"],
    build: () => makeData("Лина", 15, 28, 4, [
      ...daysRange(60, 60, (i) => {
        const cd = (i % 28) + 1;
        if (cd <= 4) return { period: { intensity: "light" as const }, mood: { value: "normal" as const }, energy: { value: "normal" as const }, sleep: { quality: "good" as const, hours: 8 } };
        return { mood: { value: "joy" as const }, energy: { value: "high" as const }, sleep: { quality: "good" as const, hours: 8 } };
      }),
    ]),
  },
  {
    name: "Влада", desc: "Овуляторная боль в середине цикла", emoji: "🥚", tags: ["овуляторная боль"],
    build: () => makeData("Влада", 14, 28, 5, [
      ...daysRange(42, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(37, 9, () => ({ mood: { value: "normal" as const }, energy: { value: "high" as const } })),
      ...daysRange(28, 2, () => ({ pain: { kinds: ["ovulatory" as const], level: "medium" as const } })),
      ...daysRange(14, 5, () => ({ period: { intensity: "moderate" as const } })),
      makeCheckIn(0, { pain: { kinds: ["ovulatory"], level: "medium" }, energy: { value: "high" } }),
    ]),
  },
  {
    name: "Карина", desc: "Головные боли и ПМС каждый цикл", emoji: "🤕", tags: ["головная боль", "ПМС"],
    build: () => makeData("Карина", 5, 28, 5, [
      ...daysRange(50, 10, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(40, 7, () => ({ pain: { kinds: ["headache" as const], level: "medium" as const }, pms: { symptoms: ["Головная боль", "Раздражительность", "Акне"] }, mood: { value: "anger" as const } })),
      ...daysRange(33, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(5, 5, () => ({ pain: { kinds: ["headache"], level: "medium" }, pms: { symptoms: ["Головная боль", "Раздражительность"] }, mood: { value: "anger" } })),
      makeCheckIn(0, { pain: { kinds: ["headache"], level: "strong" }, pms: { symptoms: ["Головная боль", "Раздражительность", "Тревожность"] } }),
    ]),
  },
  {
    name: "Элина", desc: "Первый день месячных — только начались", emoji: "🔴", tags: ["первый день", "месячные"],
    build: () => makeData("Элина", 1, 29, 5, [
      ...daysRange(30, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(25, 15, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(10, 7, () => ({ pms: { symptoms: ["Усталость", "Вздутие"] }, mood: { value: "swings" as const } })),
      makeCheckIn(0, { period: { intensity: "moderate" }, pain: { kinds: ["cramps", "lower_abdomen"], level: "medium" }, energy: { value: "low" } }),
    ]),
  },
  {
    name: "Ника", desc: "Пустой профиль, только онбординг пройден", emoji: "👋", tags: ["пустой", "нет данных"],
    build: () => makeData("Ника", 8, 28, 5, []),
  },

  // ── Возрастные категории ──
  {
    name: "Алиса", desc: "12 лет, первые месячные, всё новое", emoji: "🌸", tags: ["подросток", "12 лет", "без секса"],
    build: () => makeData("Алиса", 5, 32, 5, [
      ...daysRange(32, 5, () => ({ period: { intensity: "light" as const } })),
      ...daysRange(27, 10, () => ({ mood: { value: "normal" as const } })),
      ...daysRange(5, 5, () => ({ period: { intensity: "moderate" as const }, pain: { kinds: ["cramps" as const], level: "light" as const }, mood: { value: "sadness" as const } })),
      makeCheckIn(0, { period: { intensity: "moderate" }, mood: { value: "sadness" }, energy: { value: "low" } }),
    ], { age: 12 }),
  },
  {
    name: "Настя", desc: "16 лет, нерегулярный цикл, тревога", emoji: "🌷", tags: ["подросток", "16 лет", "нерегулярный"],
    build: () => makeData("Настя", 40, 35, 6, [
      ...daysRange(70, 6, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(40, 6, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const], level: "medium" as const } })),
      ...daysRange(34, 15, () => ({ mood: { value: "anxiety" as const }, energy: { value: "low" as const } })),
      makeCheckIn(0, { mood: { value: "anxiety" }, energy: { value: "low" } }),
    ], { age: 16 }),
  },
  {
    name: "Анна", desc: "22 года, активная, полный функционал", emoji: "🌹", tags: ["молодая", "22 года", "полный UI"],
    build: () => makeData("Анна", 14, 28, 5, [
      ...daysRange(56, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(51, 10, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const }, sleep: { quality: "good" as const, hours: 8 } })),
      ...daysRange(41, 7, () => ({ pms: { symptoms: ["Раздражительность", "Тяга к еде"] }, mood: { value: "swings" as const } })),
      ...daysRange(28, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(23, 9, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const } })),
      makeCheckIn(0, { mood: { value: "joy" }, energy: { value: "high" }, sleep: { quality: "good", hours: 8 } }),
    ], { age: 22 }),
  },
  {
    name: "Ольга", desc: "38 лет, изменения в цикле, зрелая", emoji: "🌻", tags: ["зрелая", "38 лет", "изменения"],
    build: () => makeData("Ольга", 10, 26, 5, [
      ...daysRange(52, 5, () => ({ period: { intensity: "heavy" as const } })),
      ...daysRange(47, 10, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
      ...daysRange(26, 5, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const, "back" as const], level: "medium" as const } })),
      ...daysRange(21, 8, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const }, sleep: { quality: "normal" as const, hours: 7 } })),
      makeCheckIn(0, { mood: { value: "normal" }, energy: { value: "normal" } }),
    ], { age: 38 }),
  },
  {
    name: "Татьяна", desc: "48 лет, перименопауза, приливы", emoji: "🌼", tags: ["перименопауза", "48 лет", "приливы"],
    build: () => makeData("Татьяна", 45, 35, 4, [
      ...daysRange(70, 4, () => ({ period: { intensity: "light" as const } })),
      ...daysRange(66, 20, () => ({ mood: { value: "swings" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const, hours: 5 } })),
      ...daysRange(35, 4, () => ({ period: { intensity: "light" as const } })),
      ...daysRange(31, 15, () => ({ mood: { value: "anxiety" as const }, energy: { value: "low" as const }, sleep: { quality: "insomnia" as const, hours: 4 } })),
      makeCheckIn(0, { mood: { value: "swings" }, energy: { value: "low" }, sleep: { quality: "bad", hours: 5 } }),
    ], { age: 48 }),
  },

  // ── Мусульманки ──
  {
    name: "Марьям", desc: "Мусульманка, ханафи, хайд сейчас, 8 каза", emoji: "🕌", tags: ["мусульманка", "ханафи", "хайд"],
    build: () => {
      const d = makeData("Марьям", 2, 28, 5, [
        ...daysRange(30, 5, () => ({ period: { intensity: "moderate" as const }, pain: { kinds: ["cramps" as const], level: "medium" as const } })),
        ...daysRange(25, 10, () => ({ mood: { value: "normal" as const }, energy: { value: "normal" as const } })),
        ...daysRange(15, 7, () => ({ pms: { symptoms: ["Усталость", "Раздражительность"] }, mood: { value: "swings" as const } })),
        makeCheckIn(1, { period: { intensity: "moderate" }, pain: { kinds: ["cramps"], level: "medium" } }),
        makeCheckIn(0, { period: { intensity: "moderate" }, mood: { value: "normal" }, energy: { value: "low" } }),
      ], { age: 25, islam: true, madhab: "hanafi" });
      d.islamicEntries = d.islamicEntries ?? {};
      d.islamicEntries[dateStr(0)] = { hayd: true, fasting: "exempt" };
      d.islamicEntries[dateStr(1)] = { hayd: true, fasting: "exempt" };
      return d;
    },
  },
  {
    name: "Аиша", desc: "Мусульманка, шафии, чистота, 3 каза", emoji: "🌙", tags: ["мусульманка", "шафии", "чистота"],
    build: () => {
      const d = makeData("Аиша", 12, 29, 5, [
        ...daysRange(29, 5, () => ({ period: { intensity: "moderate" as const } })),
        ...daysRange(24, 12, () => ({ mood: { value: "joy" as const }, energy: { value: "high" as const } })),
        makeCheckIn(0, { mood: { value: "joy" }, energy: { value: "high" }, sleep: { quality: "good", hours: 8 } }),
      ], { age: 23, islam: true, madhab: "shafii" });
      d.islamicEntries = d.islamicEntries ?? {};
      d.islamicEntries[dateStr(0)] = { purity: true };
      return d;
    },
  },
  {
    name: "Хадиджа", desc: "Мусульманка, малики, подросток 15 лет", emoji: "🧕", tags: ["мусульманка", "малики", "подросток"],
    build: () => makeData("Хадиджа", 8, 30, 6, [
      ...daysRange(30, 6, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(24, 10, () => ({ mood: { value: "normal" as const } })),
      ...daysRange(8, 6, () => ({ period: { intensity: "moderate" as const }, pain: { kinds: ["cramps" as const], level: "light" as const } })),
      makeCheckIn(0, { mood: { value: "normal" }, energy: { value: "normal" } }),
    ], { age: 15, islam: true, madhab: "maliki" }),
  },
  {
    name: "Елена", desc: "52 года, чекап 45+, гормоны и отчёт врачу", emoji: "🧬", tags: ["45+", "чекап", "гормоны", "врач"],
    build: () => {
      const d = makeData("Елена", 50, 34, 5, [
        ...daysRange(100, 5, () => ({ period: { intensity: "heavy" as const }, energy: { value: "low" as const } })),
        ...daysRange(95, 18, () => ({ sleep: { quality: "insomnia" as const, hours: 4 }, mood: { value: "swings" as const }, energy: { value: "low" as const } })),
        ...daysRange(55, 5, () => ({ period: { intensity: "very_heavy" as const }, energy: { value: "exhausted" as const } })),
        ...daysRange(50, 12, () => ({ sleep: { quality: "bad" as const, hours: 5 }, mood: { value: "anxiety" as const }, energy: { value: "low" as const } })),
        makeCheckIn(0, { sleep: { quality: "insomnia", hours: 4 }, mood: { value: "swings" }, energy: { value: "low" } }),
      ], { age: 52 });
      d.labs = [
        { id: "lab-demo-estradiol", testId: "estradiol", value: 18, unit: "пг/мл", date: dateStr(3) },
        { id: "lab-demo-progesterone", testId: "progesterone", value: 1.1, unit: "нг/мл", date: dateStr(3) },
        { id: "lab-demo-ferritin", testId: "ferritin", value: 12, unit: "нг/мл", date: dateStr(3) },
      ];
      return d;
    },
  },
  {
    name: "Полина", desc: "Приватность: PIN, скрытый режим, без облака для интимного", emoji: "🔐", tags: ["приватность", "PIN", "облако"],
    build: () => {
      const d = makeData("Полина", 17, 28, 5, [
        ...daysRange(28, 5, () => ({ period: { intensity: "moderate" as const } })),
        makeCheckIn(4, { intimacy: { happened: true, protection: "protected", feeling: "normal", showInCalendar: false }, mood: { value: "normal" } }),
        makeCheckIn(0, { mood: { value: "normal" }, energy: { value: "normal" }, note: { text: "Хочу проверить скрытый режим и приватные отметки." } }),
      ], { age: 29 });
      d.profile = {
        ...d.profile!,
        pinEnabled: true,
        hiddenMode: true,
        hiddenNotifications: true,
        deviceUnlockEnabled: true,
        cloudSyncExclude: ["intimacy", "notes", "labs", "delayChecks"],
      };
      return d;
    },
  },
  {
    name: "Виктория", desc: "Незащищённый секс, напоминание о тесте и задержка", emoji: "🧪", tags: ["секс", "тест", "задержка"],
    build: () => makeData("Виктория", 34, 28, 5, [
      ...daysRange(60, 5, () => ({ period: { intensity: "moderate" as const } })),
      makeCheckIn(18, { intimacy: { happened: true, protection: "unprotected", feeling: "normal", showInCalendar: true }, mood: { value: "normal" } }),
      makeCheckIn(4, { mood: { value: "anxiety" }, energy: { value: "low" } }),
      makeCheckIn(0, { mood: { value: "anxiety" }, energy: { value: "low" } }),
    ], { age: 31 }),
  },
  {
    name: "Инга", desc: "Работа и продуктивность: низкая энергия, нужно снизить нагрузку", emoji: "💼", tags: ["работа", "продуктивность", "паузы"],
    build: () => makeData("Инга", 24, 28, 5, [
      ...daysRange(28, 5, () => ({ period: { intensity: "moderate" as const } })),
      ...daysRange(8, 6, () => ({ pms: { symptoms: ["Усталость", "Раздражительность"] }, mood: { value: "anxiety" as const }, energy: { value: "low" as const }, sleep: { quality: "bad" as const, hours: 5 } })),
      makeCheckIn(0, { mood: { value: "anxiety" }, energy: { value: "exhausted" }, sleep: { quality: "bad", hours: 4 }, pms: { symptoms: ["Усталость", "Тревожность"] } }),
    ], { age: 33 }),
  },
  {
    name: "Юля", desc: "Врачебный отчёт: боль, лекарства, дневник, интимность скрыта", emoji: "📄", tags: ["отчёт", "лекарства", "дневник"],
    build: () => makeData("Юля", 2, 27, 6, [
      ...daysRange(56, 6, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const, "back" as const], level: "strong" as const }, symptomLog: { medications: ["ибупрофен"] } })),
      ...daysRange(28, 6, () => ({ period: { intensity: "heavy" as const }, pain: { kinds: ["cramps" as const], level: "strong" as const }, symptomLog: { medications: ["дротаверин"] } })),
      makeCheckIn(1, { period: { intensity: "heavy" }, pain: { kinds: ["cramps", "lower_abdomen"], level: "strong" }, symptomLog: { medications: ["ибупрофен"] }, note: { text: "Боль мешала работать, помогло тепло." } }),
      makeCheckIn(0, { period: { intensity: "very_heavy" }, pain: { kinds: ["cramps", "back"], level: "strong" }, energy: { value: "exhausted" }, symptomLog: { medications: ["ибупрофен"] } }),
    ], { age: 36 }),
  },
];

export default function DemoPage() {
  const [loaded, setLoaded] = useState<string | null>(null);

  function loadUser(user: DemoUser) {
    const data = user.build();
    writeData(data);
    setLoaded(user.name);
    setTimeout(() => { window.location.href = "/"; }, 600);
  }

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-mira-text mb-2">{users.length} тестовых профилей</h1>
        <p className="text-sm text-mira-muted mb-6">Нажми на карточку — данные загрузятся, откроется главная</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((user) => (
            <button key={user.name} onClick={() => loadUser(user)} className="text-left transition active:scale-[0.98]">
              <Card className={`p-4 h-full transition hover:shadow-soft ${loaded === user.name ? "border-mira-success bg-[#E0F5E8]/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{user.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-mira-text">{user.name}</p>
                    <p className="text-xs text-mira-muted mt-0.5">{user.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-mira-lavender-light px-2 py-0.5 text-[10px] font-semibold text-mira-primary">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>

        {loaded && (
          <p className="mt-4 text-center text-sm text-mira-success font-semibold">✓ {loaded} загружена — переход...</p>
        )}
      </div>
    </div>
  );
}
