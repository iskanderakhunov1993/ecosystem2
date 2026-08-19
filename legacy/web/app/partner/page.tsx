"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Moon, Zap, Brain, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiraLogo } from "@/components/ui/MiraLogo";
import { readData, getCycleDay, getCyclePhase, getPhaseLabel, getDaysUntilPeriod } from "@/lib/store";
import type { CyclePhase } from "@/lib/types";

const phaseForPartner: Record<CyclePhase, {
  emoji: string;
  mood: string;
  energy: string;
  whatToDo: string[];
  whatNotToDo: string[];
}> = {
  menstruation: {
    emoji: "🩸",
    mood: "Может быть усталость, раздражительность, грусть. Это гормоны, не настроение.",
    energy: "Энергия на минимуме. Тело обновляется.",
    whatToDo: [
      "Предложи тёплый чай или грелку",
      "Спроси «Чем помочь?» вместо «Что с тобой?»",
      "Возьми на себя часть дел",
      "Просто будь рядом — иногда этого достаточно",
    ],
    whatNotToDo: [
      "Не говори «Это просто месячные»",
      "Не обесценивай боль",
      "Не жди активности и бодрости",
      "Не принимай раздражительность на свой счёт",
    ],
  },
  follicular: {
    emoji: "🌱",
    mood: "Настроение улучшается. Энергия растёт. Хорошее время для планов вместе.",
    energy: "Эстроген растёт → мотивация и ясность мышления.",
    whatToDo: [
      "Предложи совместную активность",
      "Обсуди планы и идеи — сейчас лучший момент",
      "Поддержи новые начинания",
    ],
    whatNotToDo: [
      "Не откладывай важные разговоры — сейчас самое время",
    ],
  },
  ovulation: {
    emoji: "✨",
    mood: "Пик уверенности и общительности. Максимум энергии.",
    energy: "Тестостерон + эстроген = максимум сил и желания.",
    whatToDo: [
      "Наслаждайся моментом — она в лучшей форме",
      "Романтика сейчас особенно приятна",
      "Совместные приключения и активность",
    ],
    whatNotToDo: [
      "Если планируете / не планируете беременность — учитывайте фертильность",
    ],
  },
  luteal: {
    emoji: "🌙",
    mood: "Прогестерон падает → возможны раздражительность, тревога, тяга к сладкому. Это ПМС, не характер.",
    energy: "Энергия снижается. Сон может ухудшиться.",
    whatToDo: [
      "Будь терпеливее — она не контролирует гормоны",
      "Принеси шоколад или любимую еду",
      "Не спорь по мелочам — сейчас всё ощущается острее",
      "Предложи тихий вечер дома",
    ],
    whatNotToDo: [
      "Не говори «Ты преувеличиваешь»",
      "Не начинай серьёзных разговоров — отложи на фолликулярную фазу",
      "Не принимай перепады настроения лично",
    ],
  },
};

export default function PartnerPage() {
  const [ready, setReady] = useState(false);
  const [cycleDay, setCycleDay] = useState(1);
  const [phase, setPhase] = useState<CyclePhase>("follicular");
  const [daysUntil, setDaysUntil] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    const data = readData();
    if (!data.profile) return;
    const d = getCycleDay(data.profile);
    const p = getCyclePhase(d, data.profile.cycleConfig.periodLength, data.profile.cycleConfig.cycleLength);
    setCycleDay(d);
    setPhase(p);
    setDaysUntil(getDaysUntilPeriod(data.profile));
    setName(data.profile.name);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mira-bg">
        <p className="text-sm text-mira-muted">Данные не найдены. Попросите партнёра открыть эту ссылку со своего устройства.</p>
      </div>
    );
  }

  const info = phaseForPartner[phase];
  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-8">
      <div className="mx-auto max-w-md">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>

          {/* Header */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
            <MiraLogo size={36} />
            <div>
              <p className="text-sm font-bold text-mira-text">Mira</p>
              <p className="text-[10px] text-mira-muted">Режим партнёра</p>
            </div>
          </motion.div>

          {/* Current state */}
          <motion.div variants={fadeUp}>
            <Card className="p-6 text-center mb-5">
              <p className="text-4xl mb-2">{info.emoji}</p>
              <p className="text-xs text-mira-muted">{name ? `У ${name} сейчас` : "Сейчас"}</p>
              <p className="text-xl font-bold text-mira-text">{getPhaseLabel(phase)} фаза</p>
              <p className="text-sm text-mira-muted mt-1">День {cycleDay} цикла</p>
              {daysUntil > 0 && daysUntil <= 7 && (
                <Badge className="mt-2">Месячные через ~{daysUntil} дн.</Badge>
              )}
            </Card>
          </motion.div>

          {/* Mood & Energy */}
          <motion.div variants={fadeUp}>
            <Card className="p-5 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-mira-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Настроение и энергия</p>
              </div>
              <p className="text-sm text-mira-text mb-2">{info.mood}</p>
              <div className="flex items-center gap-2 mt-2">
                <Zap className="h-3.5 w-3.5 text-[#C4B07E]" />
                <p className="text-xs text-mira-muted">{info.energy}</p>
              </div>
            </Card>
          </motion.div>

          {/* What to do */}
          <motion.div variants={fadeUp}>
            <Card className="p-5 border-mira-success/15 bg-[#E0F5E8]/20 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-success mb-3">Что можно сделать</p>
              <ul className="space-y-2">
                {info.whatToDo.map(tip => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-mira-text">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-success" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* What NOT to do */}
          <motion.div variants={fadeUp}>
            <Card className="p-5 border-[#C47E7E]/15 bg-[#F5E0E0]/20 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C47E7E] mb-3">Лучше не надо</p>
              <ul className="space-y-2">
                {info.whatNotToDo.map(tip => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-mira-text">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C47E7E]" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* Disclaimer */}
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-mira-lavender/20 bg-white p-4 text-center">
              <Shield className="h-4 w-4 text-mira-muted mx-auto mb-2" />
              <p className="text-xs text-mira-muted">
                Все данные хранятся только на устройстве вашего партнёра. Эта страница показывает только фазу цикла.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
