"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readData, getCycleDay, getCyclePhase, getDaysUntilPeriod, getWaterEntry } from "@/lib/store";
import type { CyclePhase } from "@/lib/types";

type Phase = {
  emoji: string; grad: string; name: string; desc: string;
  expect: string[]; energy: number; mood: string; moodLabel: string;
  tip: string; clothing: string;
  vit: { icon: string; text: string };
  fert: { icon: string; label: string; color: string; bg: string } | null;
  article: { title: string; text: string };
};

const PH: Record<CyclePhase, Phase> = {
  menstruation: {
    emoji: "🩸", grad: "from-[#F5D0D8] to-[#E8B0C0]", name: "Менструация",
    desc: "Тело обновляется. Энергия на минимуме — это нормально.",
    expect: ["Боль внизу живота", "Усталость и сонливость", "Перепады настроения"],
    energy: 30, mood: "😌", moodLabel: "спокойствие",
    tip: "Грелка, тёплый чай, лёгкая прогулка",
    clothing: "Тёмное бельё, свободная одежда",
    vit: { icon: "💊", text: "Магний 300мг — перед сном" },
    fert: null,
    article: { title: "Почему болит живот?", text: "Простагландины сокращают матку. Магний и тепло расслабляют мышцы и уменьшают боль. 46-76% женщин испытывают боль — ты не одна." },
  },
  follicular: {
    emoji: "🌱", grad: "from-[#E0D4F5] to-[#D0C4E8]", name: "Рост",
    desc: "Эстроген растёт. Настроение, память и энергия улучшаются.",
    expect: ["Энергия растёт каждый день", "Улучшается концентрация", "Кожа выглядит лучше"],
    energy: 65, mood: "😊", moodLabel: "подъём",
    tip: "Силовая тренировка, белок, новые дела",
    clothing: "Носи любимое — лучшие дни",
    vit: { icon: "☀️", text: "Витамин D 2000МЕ — утром" },
    fert: { icon: "🟡", label: "Средний", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    article: { title: "Почему после месячных хорошо?", text: "Эстроген повышает серотонин — гормон счастья. Улучшается память, кожа, настроение. Это биология." },
  },
  ovulation: {
    emoji: "✨", grad: "from-[#E8D0F5] to-[#D8C0E8]", name: "Овуляция",
    desc: "Яйцеклетка выходит. Пик энергии и уверенности.",
    expect: ["Максимум энергии", "Уверенность и общительность", "Лёгкая боль сбоку (норма)"],
    energy: 90, mood: "🤩", moodLabel: "отлично",
    tip: "Интенсив, важные встречи, активность",
    clothing: "Всё что нравится — ты сияешь",
    vit: { icon: "✨", text: "Цинк 15мг — с едой" },
    fert: { icon: "🔴", label: "Высокий", color: "text-red-600", bg: "bg-red-50 border-red-100" },
    article: { title: "Что такое овуляция?", text: "Яйцеклетка живёт 12-24 часа. Тестостерон даёт уверенность. Многие замечают повышенное желание общаться." },
  },
  luteal: {
    emoji: "🌙", grad: "from-[#E8E0F0] to-[#D8D0E0]", name: "Подготовка",
    desc: "Прогестерон растёт и падает. Возможны ПМС-симптомы.",
    expect: ["Тяга к сладкому — это гормоны", "Сон может ухудшиться", "Раздражительность — не характер"],
    energy: 45, mood: "😐", moodLabel: "переменчиво",
    tip: "Магний, йога, ранний сон",
    clothing: "Удобное, свободное — возможно вздутие",
    vit: { icon: "🌙", text: "Магний + B6 — перед сном" },
    fert: { icon: "🟢", label: "Низкий", color: "text-green-600", bg: "bg-green-50 border-green-100" },
    article: { title: "Почему тянет на сладкое?", text: "Прогестерон повышает аппетит. Серотонин падает — тело ищет быструю энергию. Финики и тёмный шоколад помогут." },
  },
};

// ── Graphs ──

function WaveChart({ cycleDay, cycleLength, height = 50 }: { cycleDay: number; cycleLength: number; height?: number }) {
  const w = 280;
  const pts = Array.from({ length: cycleLength }, (_, i) => {
    const p = (i + 1) / cycleLength;
    if (p <= 0.18) return 20 + Math.sin(i * 0.8) * 5;
    if (p <= 0.46) return 30 + p * 100;
    if (p <= 0.57) return 85 + Math.sin(i * 1.2) * 5;
    return 80 - (p - 0.57) * 80 + Math.sin(i * 0.7) * 4;
  });
  const sx = w / (pts.length - 1);
  const smooth = (pts: number[]) => {
    const r: string[] = [];
    pts.forEach((v, i) => {
      const x = i * sx, y = height - (v / 100) * height;
      if (i === 0) { r.push(`M ${x} ${y}`); return; }
      const px = (i - 1) * sx, py = height - (pts[i - 1] / 100) * height;
      const cpx1 = px + sx * 0.4, cpx2 = x - sx * 0.4;
      r.push(`C ${cpx1} ${py} ${cpx2} ${y} ${x} ${y}`);
    });
    return r.join(" ");
  };
  const d = smooth(pts);
  const tx = (cycleDay - 1) * sx, ty = height - (pts[Math.min(cycleDay - 1, pts.length - 1)] / 100) * height;

  return (
    <svg viewBox={`-5 -5 ${w + 10} ${height + 15}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8A0B8" /><stop offset="35%" stopColor="#B8A5D8" />
          <stop offset="55%" stopColor="#D4A0C8" /><stop offset="100%" stopColor="#D4CCE6" />
        </linearGradient>
        <linearGradient id="wgf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B8A5D8" stopOpacity="0.2" /><stop offset="100%" stopColor="#B8A5D8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + ` L ${w} ${height + 5} L 0 ${height + 5} Z`} fill="url(#wgf)" />
      <path d={d} fill="none" stroke="url(#wg)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={tx} cy={ty} r="5" fill="white" stroke="#9B8EC4" strokeWidth="2.5" />
      <circle cx={tx} cy={ty} r="2" fill="#9B8EC4" />
    </svg>
  );
}

function EnergyRing({ level, size = 48 }: { level: number; size?: number }) {
  const r = 18, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#EDE8F5" strokeWidth="4" />
        <motion.circle cx="22" cy="22" r={r} fill="none" stroke={level > 70 ? "#7BAF8D" : level > 40 ? "#C4B07E" : "#C47E9B"}
          strokeWidth="4" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(level / 100) * c} ${c - (level / 100) * c}` }}
          transition={{ duration: 1, ease: "easeOut" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-mira-text">{level}%</span>
    </div>
  );
}

function Gamification({ days }: { days: number }) {
  const ms = [{ at: 7, l: "Неделя", e: "🌱" }, { at: 28, l: "Цикл", e: "🌸" }, { at: 84, l: "Норма!", e: "🏆" }];
  const cur = ms.filter(m => days >= m.at).pop();
  const next = ms.find(m => days < m.at) ?? ms[ms.length - 1];
  const pct = Math.min(100, Math.round((days / next.at) * 100));
  return (
    <div className="flex items-center gap-2.5">
      <span>{cur?.e ?? "🌱"}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] font-semibold text-mira-text">{days} дн.</span>
          <span className="text-[10px] text-mira-muted">→ {next.e} {next.l}</span>
        </div>
        <div className="h-1.5 rounded-full bg-mira-lavender-light overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-mira-primary to-mira-cycle"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
        </div>
      </div>
    </div>
  );
}

export default function FinalDemo() {
  const [v, setV] = useState(1);
  const [artOpen, setArtOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [cd, setCd] = useState(15);
  const [phase, setPhase] = useState<CyclePhase>("ovulation");
  const [du, setDu] = useState(13);
  const [nm, setNm] = useState("Айсель");
  const [cl, setCl] = useState(28);
  const [pl, setPl] = useState(5);
  const [td, setTd] = useState(3);
  const [water, setWater] = useState(0);

  useEffect(() => {
    const data = readData();
    if (data.profile) {
      const d = getCycleDay(data.profile);
      setCd(d); setPhase(getCyclePhase(d, data.profile.cycleConfig.periodLength, data.profile.cycleConfig.cycleLength));
      setDu(getDaysUntilPeriod(data.profile)); setNm(data.profile.name);
      setCl(data.profile.cycleConfig.cycleLength); setPl(data.profile.cycleConfig.periodLength);
      setTd(Object.keys(data.checkIns).length); setWater(getWaterEntry(data).glasses);
    }
    setReady(true);
  }, []);

  if (!ready) return null;
  const c = PH[phase];
  const dr = du > 2 ? `${du - 2}–${du + 2} дн.` : du > 0 ? `${du} дн.` : "сегодня";
  const msgDelay = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.12 } });

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-card">
          {[1,2,3].map(i => (
            <button key={i} onClick={() => { setV(i); setArtOpen(false); }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${v === i ? "bg-mira-primary text-white" : "text-mira-muted"}`}>
              Финал {i}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            ФИНАЛ 1: Чат сверху → Grid снизу + красивый график
        ═══════════════════════════════════════════════ */}
        {v === 1 && (
          <div className="space-y-3">
            {/* Chat: Main phase */}
            <motion.div {...msgDelay(0)} className="flex gap-2.5">
              <span className="text-xl mt-1 shrink-0">{c.emoji}</span>
              <Card className={`p-4 flex-1 bg-gradient-to-br ${c.grad} border-0`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-base font-bold text-mira-text">{c.name}</p>
                  <Badge className="bg-white/30 border-0 text-mira-text text-[10px]">{cd}/{cl}</Badge>
                </div>
                <p className="text-xs text-mira-text/70 mb-3">{c.desc}</p>
                <WaveChart cycleDay={cd} cycleLength={cl} height={45} />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <EnergyRing level={c.energy} size={32} />
                      <span className="text-[9px] text-mira-text/50">энергия</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base">{c.mood}</span>
                      <span className="text-[9px] text-mira-text/50">{c.moodLabel}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-mira-text/40">~{dr} до месячных</p>
                </div>
              </Card>
            </motion.div>

            {/* Chat: Fertility */}
            {c.fert && (
              <motion.div {...msgDelay(1)} className="flex gap-2.5">
                <span className="text-xl mt-1 shrink-0">{c.fert.icon}</span>
                <Card className={`p-3 flex-1 border ${c.fert.bg}`}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`h-3 w-3 ${c.fert.color}`} />
                    <p className={`text-xs font-bold ${c.fert.color}`}>Риск беременности: {c.fert.label}</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Chat: What to expect */}
            <motion.div {...msgDelay(2)} className="flex gap-2.5">
              <span className="text-xl mt-1 shrink-0">🫀</span>
              <Card className="p-3 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-1.5">Что ожидать</p>
                {c.expect.map(s => <p key={s} className="text-xs text-mira-text mb-0.5">• {s}</p>)}
              </Card>
            </motion.div>

            {/* Grid: Recommendations */}
            <motion.div {...msgDelay(3)} className="grid grid-cols-2 gap-2.5 pt-1">
              <Card className="p-3">
                <span className="text-base">💡</span>
                <p className="text-xs text-mira-text mt-1.5">{c.tip}</p>
              </Card>
              <Card className="p-3">
                <span className="text-base">👗</span>
                <p className="text-xs text-mira-text mt-1.5">{c.clothing}</p>
              </Card>
              <Card className="p-3">
                <span className="text-base">{c.vit.icon}</span>
                <p className="text-xs font-semibold text-mira-text mt-1.5">{c.vit.text}</p>
              </Card>
              <Card className="p-3 cursor-pointer" onClick={() => setArtOpen(!artOpen)}>
                <span className="text-base">📖</span>
                <p className="text-xs font-bold text-mira-text mt-1.5">{c.article.title}</p>
                <p className="text-[9px] text-mira-primary">Читать →</p>
              </Card>
            </motion.div>

            {artOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-4 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
                  <p className="text-sm font-bold text-mira-text mb-1">{c.article.title}</p>
                  <p className="text-xs text-mira-muted leading-relaxed">{c.article.text}</p>
                  <button onClick={() => setArtOpen(false)} className="text-[10px] text-mira-primary mt-2">Свернуть ↑</button>
                </Card>
              </motion.div>
            )}

            <motion.div {...msgDelay(4)}>
              <Card className="p-3"><Gamification days={td} /></Card>
            </motion.div>

            <motion.div {...msgDelay(5)}>
              <Button className="w-full" size="lg">+ Отметить состояние <ChevronRight className="h-4 w-4" /></Button>
              <div className="flex gap-2 justify-center mt-2.5">
                {["✅ Всё ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                  <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-mira-text shadow-card active:scale-95">{b}</button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ФИНАЛ 2: Большая карточка + развёрнутый график + компакт
        ═══════════════════════════════════════════════ */}
        {v === 2 && (
          <div className="space-y-4">
            <motion.p {...msgDelay(0)} className="text-sm text-mira-muted">Привет, {nm}</motion.p>

            <motion.div {...msgDelay(0.5)}>
              <div className={`rounded-[2rem] bg-gradient-to-br ${c.grad} p-5 shadow-[0_8px_40px_rgba(155,142,196,0.12)]`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.emoji}</span>
                    <p className="text-lg font-bold text-mira-text">{c.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <EnergyRing level={c.energy} size={36} />
                    <span className="text-xl">{c.mood}</span>
                  </div>
                </div>

                <p className="text-sm text-mira-text/70 mb-3">{c.desc}</p>

                <WaveChart cycleDay={cd} cycleLength={cl} height={55} />

                <div className="flex items-center justify-between mt-2">
                  <Badge className="bg-white/30 border-0 text-mira-text text-[10px]">День {cd} из {cl}</Badge>
                  <p className="text-[10px] text-mira-text/40">Месячные через {dr}</p>
                </div>

                {/* Expect inside */}
                <div className="mt-3 bg-white/20 rounded-xl p-3">
                  {c.expect.map(s => <p key={s} className="text-[11px] text-mira-text/80 mb-0.5">• {s}</p>)}
                </div>
              </div>
            </motion.div>

            {/* Fertility */}
            {c.fert && (
              <motion.div {...msgDelay(1)}>
                <div className={`rounded-2xl border p-3 flex items-center gap-2.5 ${c.fert.bg}`}>
                  <span className="text-lg">{c.fert.icon}</span>
                  <AlertTriangle className={`h-3.5 w-3.5 ${c.fert.color}`} />
                  <p className={`text-xs font-bold ${c.fert.color}`}>Риск беременности: {c.fert.label}</p>
                </div>
              </motion.div>
            )}

            {/* Compact recommendations */}
            <motion.div {...msgDelay(2)} className="space-y-2">
              {[
                { i: "💡", t: c.tip },
                { i: "👗", t: c.clothing },
                { i: c.vit.icon, t: c.vit.text },
              ].map(r => (
                <Card key={r.t} className="p-3 flex items-center gap-3">
                  <span className="text-base shrink-0">{r.i}</span>
                  <p className="text-xs text-mira-text">{r.t}</p>
                </Card>
              ))}

              <Card className="p-3 flex items-center gap-3 cursor-pointer border-0 bg-gradient-to-r from-white to-[#F8F5FE]" onClick={() => setArtOpen(!artOpen)}>
                <span className="text-base shrink-0">📖</span>
                <p className="text-xs font-bold text-mira-text flex-1">{c.article.title}</p>
                <span className="text-[10px] text-mira-primary">→</span>
              </Card>
            </motion.div>

            {artOpen && (
              <Card className="p-4 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
                <p className="text-sm font-bold text-mira-text mb-1">{c.article.title}</p>
                <p className="text-xs text-mira-muted leading-relaxed">{c.article.text}</p>
              </Card>
            )}

            <motion.div {...msgDelay(3)}>
              <Card className="p-3"><Gamification days={td} /></Card>
            </motion.div>

            <motion.div {...msgDelay(4)}>
              <Button className="w-full" size="lg">+ Отметить состояние</Button>
            </motion.div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ФИНАЛ 3: Dashboard-стиль с графиками и виджетами
        ═══════════════════════════════════════════════ */}
        {v === 3 && (
          <div className="space-y-3">
            <motion.div {...msgDelay(0)} className="flex items-center justify-between">
              <p className="text-sm text-mira-muted">Привет, {nm}</p>
              <Badge>{c.name}</Badge>
            </motion.div>

            {/* Phase + Graph widget */}
            <motion.div {...msgDelay(0.5)}>
              <Card className="p-0 overflow-hidden">
                <div className={`p-4 bg-gradient-to-br ${c.grad}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.emoji}</span>
                      <p className="text-base font-bold text-mira-text">{c.name}</p>
                    </div>
                    <p className="text-xs text-mira-text/50">{cd}/{cl}</p>
                  </div>
                  <p className="text-xs text-mira-text/60">{c.desc}</p>
                </div>
                <div className="px-4 pt-2 pb-3">
                  <WaveChart cycleDay={cd} cycleLength={cl} height={50} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px] text-mira-muted">Менструация</span>
                    <span className="text-[8px] text-mira-muted">Рост</span>
                    <span className="text-[8px] text-mira-muted">Пик</span>
                    <span className="text-[8px] text-mira-muted">Подготовка</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Widgets row */}
            <motion.div {...msgDelay(1)} className="grid grid-cols-3 gap-2">
              <Card className="p-3 flex flex-col items-center">
                <EnergyRing level={c.energy} size={38} />
                <p className="text-[9px] text-mira-muted mt-1">энергия</p>
              </Card>
              <Card className="p-3 flex flex-col items-center">
                <span className="text-2xl">{c.mood}</span>
                <p className="text-[9px] text-mira-muted mt-1">{c.moodLabel}</p>
              </Card>
              <Card className="p-3 flex flex-col items-center">
                <p className="text-lg font-bold text-mira-text">{dr}</p>
                <p className="text-[9px] text-mira-muted">до месячных</p>
              </Card>
            </motion.div>

            {/* Fertility */}
            {c.fert && (
              <motion.div {...msgDelay(1.5)}>
                <div className={`rounded-2xl border p-2.5 flex items-center gap-2 ${c.fert.bg}`}>
                  <span>{c.fert.icon}</span>
                  <AlertTriangle className={`h-3 w-3 ${c.fert.color}`} />
                  <p className={`text-xs font-bold ${c.fert.color}`}>Риск: {c.fert.label}</p>
                </div>
              </motion.div>
            )}

            {/* Expect */}
            <motion.div {...msgDelay(2)}>
              <Card className="p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-mira-muted mb-1.5">Что ожидать</p>
                {c.expect.map(s => <p key={s} className="text-xs text-mira-text mb-0.5">• {s}</p>)}
              </Card>
            </motion.div>

            {/* Recommendations grid */}
            <motion.div {...msgDelay(2.5)} className="grid grid-cols-2 gap-2">
              <Card className="p-3"><span>💡</span><p className="text-xs text-mira-text mt-1">{c.tip}</p></Card>
              <Card className="p-3"><span>👗</span><p className="text-xs text-mira-text mt-1">{c.clothing}</p></Card>
              <Card className="p-3"><span>{c.vit.icon}</span><p className="text-xs text-mira-text mt-1">{c.vit.text}</p></Card>
              <Card className="p-3 cursor-pointer" onClick={() => setArtOpen(!artOpen)}>
                <span>📖</span><p className="text-xs font-bold text-mira-text mt-1">{c.article.title}</p>
                <p className="text-[9px] text-mira-primary">Читать →</p>
              </Card>
            </motion.div>

            {artOpen && (
              <Card className="p-4 border-0 bg-gradient-to-br from-white to-[#F8F5FE]">
                <p className="text-sm font-bold text-mira-text mb-1">{c.article.title}</p>
                <p className="text-xs text-mira-muted leading-relaxed">{c.article.text}</p>
              </Card>
            )}

            <motion.div {...msgDelay(3)}>
              <Card className="p-3"><Gamification days={td} /></Card>
            </motion.div>

            <motion.div {...msgDelay(3.5)}>
              <Button className="w-full" size="lg">+ Отметить состояние</Button>
              <div className="flex gap-2 justify-center mt-2">
                {["✅ Всё ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                  <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-mira-text shadow-card active:scale-95">{b}</button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
