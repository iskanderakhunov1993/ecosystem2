"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readData, getCycleDay, getCyclePhase, getDaysUntilPeriod } from "@/lib/store";
import type { CyclePhase } from "@/lib/types";

type PD = {
  emoji: string; name: string; desc: string; energy: number; mood: string;
  color1: string; color2: string; color3: string;
  expect: string[]; tip: string; clothing: string;
  vit: { icon: string; text: string };
  fert: { icon: string; label: string; danger: boolean } | null;
  article: { title: string; text: string };
};

const PH: Record<CyclePhase, PD> = {
  menstruation: {
    emoji: "🩸", name: "Менструация", desc: "Тело обновляется. Отдыхай.",
    energy: 30, mood: "😌", color1: "#E8A0B8", color2: "#F5D0D8", color3: "#C47E9B",
    expect: ["Боль внизу живота", "Усталость", "Перепады настроения"],
    tip: "Грелка + тёплый чай + прогулка", clothing: "Тёмное бельё, свободное",
    vit: { icon: "💊", text: "Магний 300мг перед сном" }, fert: null,
    article: { title: "Почему болит живот?", text: "Простагландины сокращают матку. Магний и тепло помогут." },
  },
  follicular: {
    emoji: "🌱", name: "Рост", desc: "Энергия растёт. Начинай новое.",
    energy: 65, mood: "😊", color1: "#B8A5D8", color2: "#E0D4F5", color3: "#9B8EC4",
    expect: ["Энергия растёт", "Концентрация лучше", "Кожа сияет"],
    tip: "Силовая + белок + новые привычки", clothing: "Любимые наряды",
    vit: { icon: "☀️", text: "Витамин D 2000МЕ утром" },
    fert: { icon: "🟡", label: "Средний", danger: false },
    article: { title: "Почему после месячных хорошо?", text: "Эстроген повышает серотонин. Это биология." },
  },
  ovulation: {
    emoji: "✨", name: "Овуляция", desc: "Пик энергии и уверенности.",
    energy: 90, mood: "🤩", color1: "#D4A0C8", color2: "#E8D0F5", color3: "#A87EC4",
    expect: ["Максимум энергии", "Уверенность", "Лёгкая боль сбоку"],
    tip: "Интенсив + важные дела + активность", clothing: "Всё что нравится — сияешь",
    vit: { icon: "✨", text: "Цинк 15мг с едой" },
    fert: { icon: "🔴", label: "Высокий", danger: true },
    article: { title: "Что такое овуляция?", text: "Яйцеклетка живёт 12-24 часа. Тестостерон даёт уверенность." },
  },
  luteal: {
    emoji: "🌙", name: "Подготовка", desc: "Замедление. Будь мягче к себе.",
    energy: 45, mood: "😐", color1: "#D4CCE6", color2: "#E8E0F0", color3: "#9B95A8",
    expect: ["Тяга к сладкому", "Плохой сон", "Раздражительность"],
    tip: "Магний + йога + ранний сон", clothing: "Удобное, свободное",
    vit: { icon: "🌙", text: "Магний + B6 перед сном" },
    fert: { icon: "🟢", label: "Низкий", danger: false },
    article: { title: "Почему тянет на сладкое?", text: "Прогестерон повышает аппетит. Финики и шоколад помогут." },
  },
};

// ── Circular phase diagram ──
function PhaseDial({ cycleDay, cycleLength, periodLength, color }: {
  cycleDay: number; cycleLength: number; periodLength: number; color: string;
}) {
  const r = 70, cx = 85, cy = 85, sw = 10;
  const circ = 2 * Math.PI * r;
  const remaining = cycleLength - periodLength;
  const segs = [
    { len: periodLength, col: "#E8A0B8" },
    { len: Math.round(remaining * 0.4), col: "#B8A5D8" },
    { len: Math.round(remaining * 0.12), col: "#D4A0C8" },
    { len: remaining - Math.round(remaining * 0.4) - Math.round(remaining * 0.12), col: "#D4CCE6" },
  ];
  let offset = circ * 0.25;
  const angle = ((cycleDay - 1) / cycleLength) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const dx = cx + r * Math.cos(rad), dy = cy + r * Math.sin(rad);

  return (
    <svg viewBox="0 0 170 170" className="w-full h-full">
      {segs.map((s, i) => {
        const len = (s.len / cycleLength) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.col} strokeWidth={sw}
            strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={offset} strokeLinecap="round" opacity={0.6} />
        );
        offset -= len;
        return el;
      })}
      <motion.circle cx={dx} cy={dy} r="7" fill="white" stroke={color} strokeWidth="3"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} />
      <circle cx={dx} cy={dy} r="3" fill={color} />
    </svg>
  );
}

// ── Horizontal bar segments ──
function SegmentBar({ cycleDay, cycleLength, periodLength }: {
  cycleDay: number; cycleLength: number; periodLength: number;
}) {
  const remaining = cycleLength - periodLength;
  const segs = [
    { l: "🩸", d: periodLength, c: "#E8A0B8" },
    { l: "🌱", d: Math.round(remaining * 0.4), c: "#B8A5D8" },
    { l: "✨", d: Math.round(remaining * 0.12), c: "#D4A0C8" },
    { l: "🌙", d: remaining - Math.round(remaining * 0.4) - Math.round(remaining * 0.12), c: "#D4CCE6" },
  ];
  const pos = ((cycleDay - 1) / (cycleLength - 1)) * 100;
  return (
    <div className="relative">
      <div className="flex h-8 rounded-2xl overflow-hidden gap-[1px]">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center justify-center rounded-xl" style={{ flex: s.d, background: s.c + "40" }}>
            <span className="text-xs">{s.l}</span>
          </div>
        ))}
      </div>
      <motion.div className="absolute top-[-2px] w-3 h-3 rounded-full bg-white border-2 border-mira-primary shadow-lg"
        style={{ left: `${Math.min(Math.max(pos, 2), 98)}%`, top: "50%", transform: "translate(-50%, -50%)" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
    </div>
  );
}

// ── Radial energy gauge ──
function EnergyGauge({ level, color }: { level: number; color: string }) {
  const r = 30, circ = Math.PI * r;
  return (
    <div className="relative w-20 h-12">
      <svg viewBox="0 0 70 40" className="w-full h-full">
        <path d="M 5 35 A 30 30 0 0 1 65 35" fill="none" stroke="#EDE8F5" strokeWidth="6" strokeLinecap="round" />
        <motion.path d="M 5 35 A 30 30 0 0 1 65 35" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${(level / 100) * circ} ${circ}` }}
          transition={{ duration: 1 }} />
      </svg>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-bold text-mira-text">{level}%</span>
    </div>
  );
}

function Gami({ days }: { days: number }) {
  const ms = [{ at: 7, l: "Неделя", e: "🌱" }, { at: 28, l: "Цикл", e: "🌸" }, { at: 84, l: "Норма!", e: "🏆" }];
  const next = ms.find(m => days < m.at) ?? ms[2];
  const pct = Math.min(100, Math.round((days / next.at) * 100));
  return (
    <div className="flex items-center gap-2">
      <span>{days >= 84 ? "🏆" : days >= 28 ? "🌸" : "🌱"}</span>
      <div className="flex-1">
        <div className="flex justify-between"><span className="text-[9px] font-semibold">{days} дн.</span><span className="text-[9px] text-mira-muted">→ {next.e}</span></div>
        <div className="h-1.5 rounded-full bg-mira-lavender-light overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-mira-primary to-mira-cycle"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
        </div>
      </div>
    </div>
  );
}

export default function NewDemo() {
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

  useEffect(() => {
    const data = readData();
    if (data.profile) {
      const d = getCycleDay(data.profile);
      setCd(d); setPhase(getCyclePhase(d, data.profile.cycleConfig.periodLength, data.profile.cycleConfig.cycleLength));
      setDu(getDaysUntilPeriod(data.profile)); setNm(data.profile.name);
      setCl(data.profile.cycleConfig.cycleLength); setPl(data.profile.cycleConfig.periodLength);
      setTd(Object.keys(data.checkIns).length);
    }
    setReady(true);
  }, []);

  if (!ready) return null;
  const c = PH[phase];
  const dr = du > 2 ? `${du - 2}–${du + 2} дн.` : du > 0 ? `${du} дн.` : "сегодня";
  const anim = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 } });

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-card">
          {[1, 2, 3].map(i => (
            <button key={i} onClick={() => { setV(i); setArtOpen(false); }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${v === i ? "bg-mira-primary text-white" : "text-mira-muted"}`}>
              Стиль {i}
            </button>
          ))}
        </div>

        {/* ═══ СТИЛЬ 1: Кольцо + карточки вокруг ═══ */}
        {v === 1 && (
          <div className="space-y-4">
            <motion.p {...anim(0)} className="text-sm text-mira-muted">Привет, {nm}</motion.p>

            {/* Phase ring */}
            <motion.div {...anim(0.5)}>
              <Card className="p-4 border-0" style={{ background: `linear-gradient(135deg, ${c.color2}80, white)` }}>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28 shrink-0 relative">
                    <PhaseDial cycleDay={cd} cycleLength={cl} periodLength={pl} color={c.color1} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl">{c.emoji}</span>
                      <span className="text-[10px] font-bold text-mira-text mt-0.5">{cd}/{cl}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-mira-text">{c.name}</p>
                    <p className="text-xs text-mira-text/60 mb-2">{c.desc}</p>
                    <EnergyGauge level={c.energy} color={c.color1} />
                    <p className="text-[10px] text-mira-muted mt-1">Месячные через {dr}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Expect */}
            <motion.div {...anim(1)}>
              <Card className="p-3">
                {c.expect.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 mb-1 last:mb-0">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c.color1 }}>{i + 1}</span>
                    <p className="text-xs text-mira-text">{s}</p>
                  </div>
                ))}
              </Card>
            </motion.div>

            {/* Fertility */}
            {c.fert && (
              <motion.div {...anim(1.5)}>
                <div className={`rounded-2xl border p-3 flex items-center gap-2 ${c.fert.danger ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                  <span className="text-lg">{c.fert.icon}</span>
                  <AlertTriangle className={`h-3.5 w-3.5 ${c.fert.danger ? "text-red-500" : "text-green-500"}`} />
                  <p className={`text-xs font-bold ${c.fert.danger ? "text-red-600" : "text-green-600"}`}>Риск: {c.fert.label}</p>
                </div>
              </motion.div>
            )}

            {/* Grid recs */}
            <motion.div {...anim(2)} className="grid grid-cols-2 gap-2">
              <Card className="p-3"><span>💡</span><p className="text-xs text-mira-text mt-1">{c.tip}</p></Card>
              <Card className="p-3"><span>👗</span><p className="text-xs text-mira-text mt-1">{c.clothing}</p></Card>
              <Card className="p-3"><span>{c.vit.icon}</span><p className="text-xs text-mira-text mt-1">{c.vit.text}</p></Card>
              <Card className="p-3 cursor-pointer" onClick={() => setArtOpen(!artOpen)}>
                <span>📖</span><p className="text-xs font-bold text-mira-text mt-1">{c.article.title}</p>
                <p className="text-[9px] text-mira-primary">→</p>
              </Card>
            </motion.div>

            {artOpen && <Card className="p-4 bg-gradient-to-br from-white to-[#F8F5FE] border-0"><p className="text-xs text-mira-muted">{c.article.text}</p></Card>}

            <motion.div {...anim(2.5)}><Card className="p-3"><Gami days={td} /></Card></motion.div>
            <motion.div {...anim(3)}>
              <Button className="w-full" size="lg">+ Отметить состояние</Button>
              <div className="flex gap-2 justify-center mt-2">
                {["✅ Ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                  <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold shadow-card active:scale-95">{b}</button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══ СТИЛЬ 2: Полный экран градиент + свайп-контент ═══ */}
        {v === 2 && (
          <div className="space-y-0">
            {/* Hero — full gradient */}
            <motion.div {...anim(0)}>
              <div className="rounded-[2rem] overflow-hidden shadow-[0_12px_48px_rgba(155,142,196,0.15)]" style={{ background: `linear-gradient(160deg, ${c.color2}, ${c.color1}40)` }}>
                <div className="p-6 pb-4">
                  <p className="text-sm text-mira-text/50">Привет, {nm}</p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-3xl font-bold text-mira-text">{c.name}</p>
                      <p className="text-sm text-mira-text/60 mt-1">{c.desc}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl">{c.emoji}</span>
                    </div>
                  </div>
                </div>

                {/* Segment bar */}
                <div className="px-6 pb-2">
                  <SegmentBar cycleDay={cd} cycleLength={cl} periodLength={pl} />
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-around px-6 py-3 bg-white/20">
                  <div className="text-center">
                    <EnergyGauge level={c.energy} color={c.color3} />
                    <p className="text-[9px] text-mira-text/50">энергия</p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl">{c.mood}</span>
                    <p className="text-[9px] text-mira-text/50">настроение</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-mira-text">{cd}</p>
                    <p className="text-[9px] text-mira-text/50">из {cl}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-mira-text">{dr}</p>
                    <p className="text-[9px] text-mira-text/50">до месяч.</p>
                  </div>
                </div>

                {/* Expect inside */}
                <div className="px-6 py-3 bg-white/10">
                  {c.expect.map(s => <p key={s} className="text-[11px] text-mira-text/70 mb-0.5">• {s}</p>)}
                </div>
              </div>
            </motion.div>

            <div className="space-y-3 mt-4">
              {c.fert && (
                <motion.div {...anim(1)}>
                  <div className={`rounded-2xl border p-2.5 flex items-center gap-2 ${c.fert.danger ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                    <span>{c.fert.icon}</span><AlertTriangle className={`h-3 w-3 ${c.fert.danger ? "text-red-500" : "text-green-500"}`} />
                    <p className={`text-xs font-bold ${c.fert.danger ? "text-red-600" : "text-green-600"}`}>Риск: {c.fert.label}</p>
                  </div>
                </motion.div>
              )}

              <motion.div {...anim(1.5)} className="grid grid-cols-2 gap-2">
                <Card className="p-3"><span>💡</span><p className="text-xs text-mira-text mt-1">{c.tip}</p></Card>
                <Card className="p-3"><span>👗</span><p className="text-xs text-mira-text mt-1">{c.clothing}</p></Card>
              </motion.div>

              <motion.div {...anim(2)} className="grid grid-cols-2 gap-2">
                <Card className="p-3"><span>{c.vit.icon}</span><p className="text-xs text-mira-text mt-1">{c.vit.text}</p></Card>
                <Card className="p-3 cursor-pointer" onClick={() => setArtOpen(!artOpen)}>
                  <span>📖</span><p className="text-xs font-bold text-mira-text mt-1">{c.article.title}</p>
                </Card>
              </motion.div>

              {artOpen && <Card className="p-4 bg-[#F8F5FE] border-0"><p className="text-xs text-mira-muted">{c.article.text}</p></Card>}

              <motion.div {...anim(2.5)}><Card className="p-3"><Gami days={td} /></Card></motion.div>
              <motion.div {...anim(3)}>
                <Button className="w-full" size="lg">+ Отметить состояние</Button>
              </motion.div>
            </div>
          </div>
        )}

        {/* ═══ СТИЛЬ 3: Горизонтальные полосы — как Apple Health ═══ */}
        {v === 3 && (
          <div className="space-y-2.5">
            <motion.p {...anim(0)} className="text-sm text-mira-muted mb-1">Привет, {nm}</motion.p>

            {/* Phase strip */}
            <motion.div {...anim(0.5)}>
              <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.color2}90, ${c.color1}30)` }}>
                <div className="flex items-center gap-4 p-4">
                  <span className="text-3xl">{c.emoji}</span>
                  <div className="flex-1">
                    <p className="text-base font-bold text-mira-text">{c.name}</p>
                    <p className="text-xs text-mira-text/60">{c.desc}</p>
                  </div>
                  <Badge className="bg-white/40 border-0 text-mira-text">{cd}/{cl}</Badge>
                </div>
                <div className="px-4 pb-3">
                  <SegmentBar cycleDay={cd} cycleLength={cl} periodLength={pl} />
                </div>
              </div>
            </motion.div>

            {/* Horizontal metric strips */}
            <motion.div {...anim(1)} className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-2.5 text-center" style={{ background: `${c.color1}15` }}>
                <EnergyGauge level={c.energy} color={c.color1} />
                <p className="text-[9px] text-mira-muted">энергия</p>
              </div>
              <div className="rounded-xl p-2.5 text-center" style={{ background: `${c.color1}15` }}>
                <span className="text-2xl">{c.mood}</span>
                <p className="text-[9px] text-mira-muted mt-1">настроение</p>
              </div>
              <div className="rounded-xl p-2.5 text-center" style={{ background: `${c.color1}15` }}>
                <p className="text-lg font-bold text-mira-text">{dr}</p>
                <p className="text-[9px] text-mira-muted">до месяч.</p>
              </div>
            </motion.div>

            {/* Expect strip */}
            <motion.div {...anim(1.5)}>
              <div className="rounded-xl bg-white/80 p-3 flex gap-3 overflow-x-auto">
                {c.expect.map((s, i) => (
                  <div key={s} className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: `${c.color1}15` }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: c.color1 }}>{i + 1}</span>
                    <span className="text-[10px] font-medium text-mira-text whitespace-nowrap">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Fertility */}
            {c.fert && (
              <motion.div {...anim(2)}>
                <div className={`rounded-xl p-2.5 flex items-center gap-2 ${c.fert.danger ? "bg-red-50" : "bg-green-50"}`}>
                  <span>{c.fert.icon}</span>
                  <AlertTriangle className={`h-3 w-3 ${c.fert.danger ? "text-red-500" : "text-green-500"}`} />
                  <p className={`text-xs font-bold ${c.fert.danger ? "text-red-600" : "text-green-600"}`}>Риск: {c.fert.label}</p>
                </div>
              </motion.div>
            )}

            {/* Recs as horizontal strips */}
            {[
              { i: "💡", t: c.tip },
              { i: "👗", t: c.clothing },
              { i: c.vit.icon, t: c.vit.text },
            ].map((r, idx) => (
              <motion.div key={r.t} {...anim(2.5 + idx * 0.3)}>
                <div className="rounded-xl bg-white/80 p-3 flex items-center gap-3">
                  <span className="text-base shrink-0">{r.i}</span>
                  <p className="text-xs text-mira-text">{r.t}</p>
                </div>
              </motion.div>
            ))}

            {/* Article strip */}
            <motion.div {...anim(3.5)}>
              <div className="rounded-xl bg-gradient-to-r from-white to-[#F8F5FE] p-3 flex items-center gap-3 cursor-pointer" onClick={() => setArtOpen(!artOpen)}>
                <span className="text-base">📖</span>
                <p className="text-xs font-bold text-mira-text flex-1">{c.article.title}</p>
                <ChevronRight className="h-3.5 w-3.5 text-mira-primary" />
              </div>
            </motion.div>

            {artOpen && <div className="rounded-xl bg-[#F8F5FE] p-4"><p className="text-xs text-mira-muted">{c.article.text}</p></div>}

            <motion.div {...anim(4)}>
              <div className="rounded-xl bg-white/80 p-3"><Gami days={td} /></div>
            </motion.div>

            <motion.div {...anim(4.5)}>
              <Button className="w-full" size="lg">+ Отметить состояние</Button>
              <div className="flex gap-2 justify-center mt-2">
                {["✅ Ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                  <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold shadow-card active:scale-95">{b}</button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
