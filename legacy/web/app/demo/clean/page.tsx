"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, Zap, Moon as MoonIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readData, getCycleDay, getCyclePhase, getPhaseLabel, getDaysUntilPeriod, getWaterEntry } from "@/lib/store";
import type { CyclePhase } from "@/lib/types";

const phaseConfig: Record<CyclePhase, {
  emoji: string; gradient: string; title: string; subtitle: string;
  energyLevel: number; moodEmoji: string;
  tip: string; clothing: string; vitamin: string;
  article: { title: string; body: string };
}> = {
  menstruation: {
    emoji: "🌺", gradient: "from-[#F5D0D8] via-[#F0C0D0] to-[#E8B0C0]",
    title: "Время заботы о себе", subtitle: "Энергия ниже — это нормально",
    energyLevel: 30, moodEmoji: "😌",
    tip: "Тёплый чай, грелка, лёгкая прогулка", clothing: "Тёмное удобное бельё, свободная одежда",
    vitamin: "💊 Магний 300мг — с водой перед сном",
    article: { title: "Почему болит живот?", body: "Простагландины сокращают матку. Магний и тепло помогут." },
  },
  follicular: {
    emoji: "🌱", gradient: "from-[#E0D4F5] via-[#D8CCF0] to-[#D0C4E8]",
    title: "Энергия растёт", subtitle: "Хорошее время для начинаний",
    energyLevel: 65, moodEmoji: "😊",
    tip: "Силовая тренировка, белок на завтрак", clothing: "Носи что хочешь — лучшие дни",
    vitamin: "☀️ Витамин D 2000МЕ — с жирной едой",
    article: { title: "Почему после месячных так хорошо?", body: "Эстроген растёт — улучшает настроение и память." },
  },
  ovulation: {
    emoji: "✨", gradient: "from-[#E8D0F5] via-[#E0C8F0] to-[#D8C0E8]",
    title: "Лучшие дни цикла", subtitle: "Максимум энергии",
    energyLevel: 90, moodEmoji: "🤩",
    tip: "Интенсивная тренировка, важные дела", clothing: "Всё что нравится — ты сияешь",
    vitamin: "✨ Цинк 15мг — с едой",
    article: { title: "Что такое овуляция?", body: "Яйцеклетка выходит из яичника. Пик энергии и уверенности." },
  },
  luteal: {
    emoji: "🌙", gradient: "from-[#E8E0F0] via-[#E0D8E8] to-[#D8D0E0]",
    title: "Замедление", subtitle: "Будь мягче к себе",
    energyLevel: 45, moodEmoji: "😐",
    tip: "Магний, йога, ранний сон", clothing: "Удобное, свободный крой — живот может быть вздут",
    vitamin: "🌙 Магний + B6 — перед сном",
    article: { title: "Почему тянет на сладкое?", body: "Прогестерон повышает аппетит. Финики и шоколад помогут." },
  },
};

function CycleTimeline({ cycleDay, cycleLength, periodLength }: {
  cycleDay: number; cycleLength: number; periodLength: number;
}) {
  const remaining = cycleLength - periodLength;
  const segments = [
    { label: "Менструация", days: periodLength, color: "bg-[#E8A0B8]" },
    { label: "Рост", days: Math.round(remaining * 0.4), color: "bg-[#B8A5D8]" },
    { label: "Пик", days: Math.round(remaining * 0.12), color: "bg-[#D4A0C8]" },
    { label: "Подготовка", days: remaining - Math.round(remaining * 0.4) - Math.round(remaining * 0.12), color: "bg-[#D4CCE6]" },
  ];
  const position = ((cycleDay - 1) / (cycleLength - 1)) * 100;
  return (
    <div className="relative">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px]">
        {segments.map((seg, i) => (
          <motion.div key={i} className={`${seg.color} rounded-full`} style={{ flex: seg.days }}
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: i * 0.1 }} />
        ))}
      </div>
      <motion.div className="absolute top-[-3px] h-4 w-4 rounded-full bg-white border-[2.5px] border-mira-primary shadow-glow"
        style={{ left: `${Math.min(Math.max(position, 3), 97)}%`, transform: "translateX(-50%)" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} />
      <div className="flex justify-between mt-1.5">
        {segments.map((seg, i) => (
          <span key={i} className="text-[8px] text-mira-muted" style={{ flex: seg.days, textAlign: "center" }}>{seg.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function CleanDemo() {
  const [variant, setVariant] = useState<1 | 2 | 3>(1);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [cycleDay, setCycleDay] = useState(15);
  const [phase, setPhase] = useState<CyclePhase>("ovulation");
  const [daysUntil, setDaysUntil] = useState(13);
  const [name, setName] = useState("Айсель");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [water, setWater] = useState(0);

  useEffect(() => {
    const data = readData();
    if (data.profile) {
      const cd = getCycleDay(data.profile);
      setCycleDay(cd);
      setPhase(getCyclePhase(cd, data.profile.cycleConfig.periodLength, data.profile.cycleConfig.cycleLength));
      setDaysUntil(getDaysUntilPeriod(data.profile));
      setName(data.profile.name);
      setCycleLength(data.profile.cycleConfig.cycleLength);
      setPeriodLength(data.profile.cycleConfig.periodLength);
      setWater(getWaterEntry(data).glasses);
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  const config = phaseConfig[phase];
  const daysRange = daysUntil > 2 ? `${daysUntil - 2}–${daysUntil + 2} дней` : daysUntil > 0 ? `${daysUntil} дн.` : "сегодня";

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Switcher */}
        <div className="mb-6 flex gap-2 rounded-2xl bg-white p-1.5 shadow-card">
          {[1, 2, 3].map(v => (
            <button key={v} onClick={() => { setVariant(v as 1 | 2 | 3); setExpanded(false); }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${variant === v ? "bg-mira-primary text-white shadow-glow" : "text-mira-muted"}`}>
              Вариант {v}
            </button>
          ))}
        </div>

        {/* ═══════ ВАРИАНТ 1: Минимум — 3 блока ═══════ */}
        {variant === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* 1. Где ты */}
            <div>
              <p className="text-sm text-mira-muted mb-1">Привет, {name}</p>
              <Card className={`p-5 bg-gradient-to-br ${config.gradient} border-0`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{config.emoji}</span>
                  <div>
                    <p className="text-xl font-bold text-mira-text">{config.title}</p>
                    <p className="text-sm text-mira-text/60">День {cycleDay} · Месячные через {daysRange}</p>
                  </div>
                </div>
                <CycleTimeline cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} />
              </Card>
            </div>

            {/* 2. Что делать */}
            <Card className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-primary mb-2">💡 Сегодня</p>
              <p className="text-sm text-mira-text">{config.tip}</p>
            </Card>

            {/* 3. CTA */}
            <Button className="w-full" size="lg" onClick={() => {}}>
              + Отметить состояние
            </Button>

            {/* Раскрыть детали */}
            <button onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-xs text-mira-muted py-2 transition hover:text-mira-primary">
              {expanded ? "Свернуть" : "Показать больше"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>

            {expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Card className="p-3 text-center">
                    <span className="text-xl">{config.moodEmoji}</span>
                    <p className="text-[9px] text-mira-muted mt-1">настроение</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <span className="text-xl">🍶</span>
                    <p className="text-[9px] text-mira-muted mt-1">{water * 250} мл воды</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <span className="text-xl">😴</span>
                    <p className="text-[9px] text-mira-muted mt-1">сон</p>
                  </Card>
                </div>
                <Card className="p-3.5">
                  <p className="text-xs text-mira-text">{config.vitamin}</p>
                </Card>
                <Card className="p-3.5">
                  <p className="text-xs text-mira-text">👗 {config.clothing}</p>
                </Card>
                <Card className="p-3.5 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
                  <p className="text-xs font-bold text-mira-text mb-0.5">📖 {config.article.title}</p>
                  <p className="text-[11px] text-mira-muted">{config.article.body}</p>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ═══════ ВАРИАНТ 2: Одна карточка — всё внутри ═══════ */}
        {variant === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-mira-muted">Привет, {name}</p>

            <div className={`rounded-[2rem] bg-gradient-to-br ${config.gradient} p-6 shadow-[0_8px_40px_rgba(155,142,196,0.15)]`}>
              {/* Top */}
              <div className="flex items-center justify-between mb-5">
                <Badge className="bg-white/30 border-white/20 text-mira-text text-xs">День {cycleDay}</Badge>
                <span className="text-2xl">{config.emoji}</span>
              </div>

              {/* Title */}
              <p className="text-2xl font-bold text-mira-text mb-1">{config.title}</p>
              <p className="text-sm text-mira-text/60 mb-5">{config.subtitle}</p>

              {/* Timeline inside */}
              <div className="mb-5">
                <CycleTimeline cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} />
              </div>

              {/* Key info */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 bg-white/25 rounded-xl px-3 py-2">
                  <span className="text-sm">💡</span>
                  <p className="text-xs text-mira-text flex-1">{config.tip}</p>
                </div>
                <div className="flex items-center gap-2 bg-white/25 rounded-xl px-3 py-2">
                  <span className="text-sm">👗</span>
                  <p className="text-xs text-mira-text flex-1">{config.clothing.split(".")[0]}</p>
                </div>
                <div className="flex items-center gap-2 bg-white/25 rounded-xl px-3 py-2">
                  <span className="text-sm">{config.vitamin.slice(0, 2)}</span>
                  <p className="text-xs text-mira-text flex-1">{config.vitamin.slice(2)}</p>
                </div>
              </div>

              {/* Bottom */}
              <p className="text-[10px] text-mira-text/40">Месячные через {daysRange}</p>
            </div>

            <Button className="w-full" size="lg" onClick={() => {}}>
              + Отметить состояние
            </Button>

            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { emoji: "🍶", label: `${water * 250}мл` },
                { emoji: "🍽️", label: "Еда" },
                { emoji: "🏋️", label: "Тренировка" },
                { emoji: "📊", label: "Норма" },
              ].map(s => (
                <Card key={s.label} className="p-2.5 flex flex-col items-center gap-1 cursor-pointer hover:shadow-card-hover transition-all active:scale-95">
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-[9px] font-semibold text-mira-text">{s.label}</span>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════ ВАРИАНТ 3: Чат-стиль — как сообщения ═══════ */}
        {variant === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-sm text-mira-muted mb-2">Привет, {name} 👋</p>

            {/* Message 1: Where you are */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex gap-2">
              <span className="text-lg mt-1">{config.emoji}</span>
              <Card className={`p-4 flex-1 bg-gradient-to-br ${config.gradient} border-0`}>
                <p className="text-base font-bold text-mira-text">Ты на {cycleDay} дне цикла</p>
                <p className="text-sm text-mira-text/70">{config.title}. {config.subtitle}.</p>
                <div className="mt-3">
                  <CycleTimeline cycleDay={cycleDay} cycleLength={cycleLength} periodLength={periodLength} />
                </div>
              </Card>
            </motion.div>

            {/* Message 2: What to do */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex gap-2">
              <span className="text-lg mt-1">💡</span>
              <Card className="p-3.5 flex-1">
                <p className="text-sm text-mira-text">{config.tip}</p>
              </Card>
            </motion.div>

            {/* Message 3: Clothing */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="flex gap-2">
              <span className="text-lg mt-1">👗</span>
              <Card className="p-3.5 flex-1">
                <p className="text-xs text-mira-text">{config.clothing}</p>
              </Card>
            </motion.div>

            {/* Message 4: Vitamin */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="flex gap-2">
              <span className="text-lg mt-1">{config.vitamin.slice(0, 2)}</span>
              <Card className="p-3.5 flex-1">
                <p className="text-xs text-mira-text">{config.vitamin.slice(2)}</p>
              </Card>
            </motion.div>

            {/* Message 5: Article */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
              className="flex gap-2">
              <span className="text-lg mt-1">📖</span>
              <Card className="p-3.5 flex-1 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
                <p className="text-xs font-bold text-mira-text mb-0.5">{config.article.title}</p>
                <p className="text-[11px] text-mira-muted">{config.article.body}</p>
              </Card>
            </motion.div>

            {/* Message 6: Period prediction */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="flex gap-2">
              <span className="text-lg mt-1">🔔</span>
              <Card className="p-3.5 flex-1">
                <p className="text-xs text-mira-text">Месячные ожидаются через {daysRange}</p>
              </Card>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
              <Button className="w-full mt-2" size="lg" onClick={() => {}}>
                + Отметить состояние
              </Button>
            </motion.div>

            {/* Quick row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="flex gap-2 justify-center">
              {["✅ Всё ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-mira-text shadow-card active:scale-95">
                  {b}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
