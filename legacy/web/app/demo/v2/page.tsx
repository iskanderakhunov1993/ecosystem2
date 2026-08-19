"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readData, getCycleDay, getCyclePhase, getPhaseLabel, getDaysUntilPeriod, getWaterEntry } from "@/lib/store";
import type { CyclePhase } from "@/lib/types";

// ── Phase data ──

type PhaseData = {
  emoji: string;
  gradient: string;
  periodName: string;
  description: string;
  duration: string;
  symptoms: string[];
  fertilityLevel: "high" | "medium" | "low" | "none";
  tip: string;
  vitamin: { icon: string; name: string; how: string };
  clothing: string;
  article: { title: string; preview: string };
};

const phases: Record<CyclePhase, PhaseData> = {
  menstruation: {
    emoji: "🩸", gradient: "from-[#F5D0D8] via-[#F0C0D0] to-[#E8B0C0]",
    periodName: "Менструация",
    description: "Тело обновляется. Матка сокращается, выходит старая слизистая. Энергия на минимуме — это нормально.",
    duration: "Обычно 3–7 дней",
    symptoms: ["Возможна боль внизу живота", "Усталость и сонливость", "Перепады настроения"],
    fertilityLevel: "none",
    tip: "Тёплый чай, грелка, лёгкая прогулка",
    vitamin: { icon: "💊", name: "Магний 300мг", how: "С водой перед сном — снимает спазмы" },
    clothing: "Тёмное бельё и свободная одежда — без давления на живот",
    article: { title: "Почему болит живот при месячных?", preview: "Простагландины сокращают матку — отсюда спазмы..." },
  },
  follicular: {
    emoji: "🌱", gradient: "from-[#E0D4F5] via-[#D8CCF0] to-[#D0C4E8]",
    periodName: "Фолликулярная фаза",
    description: "Эстроген растёт. Организм набирает силы после менструации. Настроение и энергия улучшаются.",
    duration: "Обычно 7–10 дней",
    symptoms: ["Энергия растёт каждый день", "Улучшается память и концентрация", "Кожа выглядит лучше"],
    fertilityLevel: "medium",
    tip: "Силовая тренировка, белок, новые начинания",
    vitamin: { icon: "☀️", name: "Витамин D 2000МЕ", how: "С жирной едой утром — для энергии и костей" },
    clothing: "Носи что хочешь — сейчас лучшие дни для любимых нарядов",
    article: { title: "Почему после месячных так хорошо?", preview: "Эстроген улучшает настроение, память и даже кожу..." },
  },
  ovulation: {
    emoji: "✨", gradient: "from-[#E8D0F5] via-[#E0C8F0] to-[#D8C0E8]",
    periodName: "Овуляция",
    description: "Яйцеклетка выходит из яичника. Пик гормонов — максимум энергии, уверенности и привлекательности.",
    duration: "2–3 дня",
    symptoms: ["Максимум энергии и уверенности", "Повышенное желание общаться", "Возможна лёгкая боль сбоку"],
    fertilityLevel: "high",
    tip: "Интенсивная тренировка, важные дела и встречи",
    vitamin: { icon: "✨", name: "Цинк 15мг", how: "С едой — на пустой желудок может быть тошнота" },
    clothing: "Всё что нравится — ты сейчас сияешь",
    article: { title: "Что такое овуляция простыми словами?", preview: "Яйцеклетка живёт 12–24 часа. Тестостерон даёт уверенность..." },
  },
  luteal: {
    emoji: "🌙", gradient: "from-[#E8E0F0] via-[#E0D8E8] to-[#D8D0E0]",
    periodName: "Лютеиновая фаза",
    description: "Прогестерон растёт, потом падает. Тело готовится к следующему циклу. Могут появиться ПМС-симптомы.",
    duration: "10–14 дней",
    symptoms: ["Тяга к сладкому — это гормоны", "Сон может ухудшиться", "Раздражительность — не характер, а прогестерон"],
    fertilityLevel: "low",
    tip: "Магний, йога, ранний сон. Не планируй сложных дел.",
    vitamin: { icon: "🌙", name: "Магний + B6", how: "Перед сном с водой — улучшает сон и снижает ПМС" },
    clothing: "Удобное и свободное — живот может быть вздут",
    article: { title: "Почему тянет на сладкое перед месячными?", preview: "Прогестерон повышает аппетит, серотонин падает..." },
  },
};

// ── Fertility icon ──

function FertilityIndicator({ level }: { level: PhaseData["fertilityLevel"] }) {
  if (level === "none") return null;
  const config = {
    high: { color: "bg-red-100 border-red-200", textColor: "text-red-600", icon: "🔴", label: "Высокий", desc: "Вероятность забеременеть максимальная" },
    medium: { color: "bg-amber-50 border-amber-200", textColor: "text-amber-600", icon: "🟡", label: "Средний", desc: "Фертильность растёт" },
    low: { color: "bg-green-50 border-green-200", textColor: "text-green-600", icon: "🟢", label: "Низкий", desc: "Фертильность снижается" },
  };
  const c = config[level];
  return (
    <div className={`rounded-2xl border ${c.color} p-3 flex items-center gap-3`}>
      <div className="flex flex-col items-center">
        <span className="text-lg">{c.icon}</span>
        <AlertTriangle className={`h-3 w-3 ${c.textColor} mt-0.5`} />
      </div>
      <div className="flex-1">
        <p className={`text-xs font-bold ${c.textColor}`}>Риск беременности: {c.label}</p>
        <p className="text-[10px] text-mira-muted">{c.desc}</p>
      </div>
    </div>
  );
}

// ── Mini chart ──

function MiniCycleChart({ cycleDay, cycleLength, phase }: { cycleDay: number; cycleLength: number; phase: CyclePhase }) {
  const points = Array.from({ length: cycleLength }, (_, i) => {
    const day = i + 1;
    const progress = day / cycleLength;
    let energy: number;
    if (progress <= 0.18) energy = 25 + Math.random() * 10;
    else if (progress <= 0.46) energy = 40 + progress * 80 + Math.random() * 8;
    else if (progress <= 0.57) energy = 85 + Math.random() * 10;
    else energy = 70 - (progress - 0.57) * 60 + Math.random() * 8;
    return Math.min(95, Math.max(10, energy));
  });

  const width = 280;
  const height = 50;
  const stepX = width / (points.length - 1);

  const pathD = points.map((p, i) => {
    const x = i * stepX;
    const y = height - (p / 100) * height;
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(" ");

  const todayX = (cycleDay - 1) * stepX;
  const todayY = height - (points[cycleDay - 1] / 100) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height + 10}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8A0B8" />
          <stop offset="35%" stopColor="#B8A5D8" />
          <stop offset="55%" stopColor="#D4A0C8" />
          <stop offset="100%" stopColor="#D4CCE6" />
        </linearGradient>
      </defs>
      <path d={pathD + ` L ${width} ${height + 5} L 0 ${height + 5} Z`} fill="url(#chartGrad)" opacity="0.15" />
      <path d={pathD} fill="none" stroke="url(#chartGrad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={todayX} cy={todayY} r="4" fill="#9B8EC4" stroke="white" strokeWidth="2" />
    </svg>
  );
}

// ── Gamification ──

function MiniAchievement({ days }: { days: number }) {
  const milestones = [
    { at: 7, label: "Первая неделя", emoji: "🌱" },
    { at: 14, label: "2 недели", emoji: "🌿" },
    { at: 28, label: "Первый цикл", emoji: "🌸" },
    { at: 56, label: "2 цикла", emoji: "💮" },
    { at: 84, label: "3 цикла — норма!", emoji: "🏆" },
  ];

  const current = milestones.filter(m => days >= m.at).pop();
  const next = milestones.find(m => days < m.at);

  if (!next) return (
    <div className="flex items-center gap-2 bg-mira-success/10 rounded-xl px-3 py-2">
      <span className="text-lg">🏆</span>
      <p className="text-xs font-semibold text-mira-success">Стабильная норма сформирована!</p>
    </div>
  );

  const progress = next ? Math.round((days / next.at) * 100) : 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{current?.emoji ?? "🌱"}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-mira-text">
            {current ? current.label : "Начало пути"}
          </p>
          <p className="text-[10px] text-mira-muted">→ {next.emoji} {next.label}</p>
        </div>
        <div className="h-1.5 rounded-full bg-mira-lavender-light overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-mira-primary to-mira-cycle"
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
        </div>
        <p className="text-[9px] text-mira-muted mt-0.5">{days} из {next.at} дней</p>
      </div>
    </div>
  );
}

// ── Main page ──

export default function V2Demo() {
  const [ready, setReady] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const [cycleDay, setCycleDay] = useState(15);
  const [phase, setPhase] = useState<CyclePhase>("ovulation");
  const [daysUntil, setDaysUntil] = useState(13);
  const [name, setName] = useState("Айсель");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [totalDays, setTotalDays] = useState(3);

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
      setTotalDays(Object.keys(data.checkIns).length);
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  const config = phases[phase];
  const daysRange = daysUntil > 2 ? `${daysUntil - 2}–${daysUntil + 2} дн.` : daysUntil > 0 ? `${daysUntil} дн.` : "сегодня";
  const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>

          {/* Header — просто */}
          <motion.div variants={fadeUp} className="mb-5">
            <p className="text-sm text-mira-muted">Привет, {name}</p>
          </motion.div>

          {/* Текущий период — главный блок */}
          <motion.div variants={fadeUp} className="mb-4">
            <Card className={`p-5 bg-gradient-to-br ${config.gradient} border-0`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{config.emoji}</span>
                  <p className="text-lg font-bold text-mira-text">{config.periodName}</p>
                </div>
                <Badge className="bg-white/30 border-white/20 text-mira-text">
                  День {cycleDay} из {cycleLength}
                </Badge>
              </div>

              <p className="text-sm text-mira-text/80 mb-3">{config.description}</p>

              {/* Мини-график */}
              <MiniCycleChart cycleDay={cycleDay} cycleLength={cycleLength} phase={phase} />

              {/* Что ожидать */}
              <div className="mt-3 space-y-1.5">
                {config.symptoms.map(s => (
                  <p key={s} className="text-xs text-mira-text/70 flex items-start gap-1.5">
                    <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-mira-text/30" />{s}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-[10px] text-mira-text/50">{config.duration}</p>
                <p className="text-[10px] text-mira-text/50">Месячные через {daysRange}</p>
              </div>
            </Card>
          </motion.div>

          {/* Риск беременности */}
          <motion.div variants={fadeUp} className="mb-3">
            <FertilityIndicator level={config.fertilityLevel} />
          </motion.div>

          {/* Рекомендации — grid 2 колонки */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5 mb-4">
            {/* Рекомендация дня */}
            <Card className="p-3.5 border-mira-primary/10 bg-[#EDE8F5]/15">
              <span className="text-lg">💡</span>
              <p className="text-xs font-semibold text-mira-text mt-1.5">{config.tip}</p>
            </Card>

            {/* Одежда */}
            <Card className="p-3.5 border-[#C4B07E]/10 bg-[#F5F0E0]/15">
              <span className="text-lg">👗</span>
              <p className="text-xs text-mira-text mt-1.5">{config.clothing.split("—")[0]}</p>
            </Card>

            {/* Витамин */}
            <Card className="p-3.5 border-mira-success/10 bg-[#E0F5E8]/15">
              <span className="text-lg">{config.vitamin.icon}</span>
              <p className="text-xs font-bold text-mira-text mt-1.5">{config.vitamin.name}</p>
              <p className="text-[10px] text-mira-success">{config.vitamin.how.split("—")[0]}</p>
            </Card>

            {/* Статья — превью */}
            <Card className="p-3.5 border-0 bg-gradient-to-br from-white to-[#F8F5FE] cursor-pointer"
              onClick={() => setArticleOpen(!articleOpen)}>
              <span className="text-lg">📖</span>
              <p className="text-xs font-bold text-mira-text mt-1.5">{config.article.title}</p>
              <p className="text-[10px] text-mira-primary mt-0.5">Читать →</p>
            </Card>
          </motion.div>

          {/* Статья раскрытая */}
          {articleOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
              <Card className="p-5 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
                <p className="text-sm font-bold text-mira-text mb-2">{config.article.title}</p>
                <p className="text-xs text-mira-muted leading-relaxed">{config.article.preview}</p>
                <button onClick={() => setArticleOpen(false)} className="text-xs text-mira-primary mt-2">Свернуть ↑</button>
              </Card>
            </motion.div>
          )}

          {/* Геймификация вместо карты нормы */}
          <motion.div variants={fadeUp} className="mb-4">
            <Card className="p-4">
              <MiniAchievement days={totalDays} />
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="mb-4">
            <Button className="w-full" size="lg" onClick={() => {}}>
              + Отметить состояние <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Быстрые кнопки */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2 justify-center">
            {["✅ Всё ок", "😣 Боль", "😴 Плохой сон", "😤 ПМС"].map(b => (
              <button key={b} className="rounded-full bg-white/80 backdrop-blur-sm px-3.5 py-2 text-xs font-semibold text-mira-text shadow-card transition hover:shadow-card-hover active:scale-95">
                {b}
              </button>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
