"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readData, getCycleDay, getCyclePhase, getDaysUntilPeriod, getWaterEntry } from "@/lib/store";
import type { CyclePhase } from "@/lib/types";

type PhaseData = {
  emoji: string; gradient: string; name: string; what: string;
  expect: string[]; energy: number; mood: string;
  tip: string; clothing: string;
  vitamin: { icon: string; text: string };
  fertility: { icon: string; label: string; color: string } | null;
  article: { title: string; text: string };
};

const P: Record<CyclePhase, PhaseData> = {
  menstruation: {
    emoji: "🩸", gradient: "from-[#F5D0D8] to-[#E8B0C0]", name: "Менструация",
    what: "Тело обновляется. Энергия на минимуме — это нормально.",
    expect: ["Боль внизу живота", "Усталость", "Перепады настроения"],
    energy: 30, mood: "😌",
    tip: "Грелка, тёплый чай, лёгкая прогулка",
    clothing: "Тёмное бельё, свободная одежда",
    vitamin: { icon: "💊", text: "Магний 300мг — перед сном с водой" },
    fertility: null,
    article: { title: "Почему болит живот?", text: "Простагландины сокращают матку — отсюда спазмы. Магний расслабляет мышцы." },
  },
  follicular: {
    emoji: "🌱", gradient: "from-[#E0D4F5] to-[#D0C4E8]", name: "Фолликулярная фаза",
    what: "Эстроген растёт. Энергия, настроение и память улучшаются.",
    expect: ["Энергия растёт", "Улучшается концентрация", "Кожа выглядит лучше"],
    energy: 65, mood: "😊",
    tip: "Силовая тренировка, белок, новые дела",
    clothing: "Носи что хочешь — лучшие дни",
    vitamin: { icon: "☀️", text: "Витамин D 2000МЕ — утром с едой" },
    fertility: { icon: "🟡", label: "Средний", color: "text-amber-600 bg-amber-50 border-amber-200" },
    article: { title: "Почему после месячных хорошо?", text: "Эстроген улучшает серотонин — гормон счастья. Это биология, не случайность." },
  },
  ovulation: {
    emoji: "✨", gradient: "from-[#E8D0F5] to-[#D8C0E8]", name: "Овуляция",
    what: "Яйцеклетка выходит. Пик энергии, уверенности и привлекательности.",
    expect: ["Максимум энергии", "Уверенность", "Возможна лёгкая боль сбоку"],
    energy: 90, mood: "🤩",
    tip: "Интенсивная тренировка, важные встречи",
    clothing: "Всё что нравится — ты сияешь",
    vitamin: { icon: "✨", text: "Цинк 15мг — с едой" },
    fertility: { icon: "🔴", label: "Высокий", color: "text-red-600 bg-red-50 border-red-200" },
    article: { title: "Что такое овуляция?", text: "Яйцеклетка живёт 12-24 часа. Тестостерон даёт уверенность и энергию." },
  },
  luteal: {
    emoji: "🌙", gradient: "from-[#E8E0F0] to-[#D8D0E0]", name: "Лютеиновая фаза",
    what: "Прогестерон растёт и падает. Могут появиться ПМС-симптомы.",
    expect: ["Тяга к сладкому", "Сон ухудшается", "Раздражительность — это гормоны"],
    energy: 45, mood: "😐",
    tip: "Магний, йога, ранний сон",
    clothing: "Удобное и свободное — возможно вздутие",
    vitamin: { icon: "🌙", text: "Магний + B6 — перед сном" },
    fertility: { icon: "🟢", label: "Низкий", color: "text-green-600 bg-green-50 border-green-200" },
    article: { title: "Почему тянет на сладкое?", text: "Прогестерон повышает аппетит. Финики и тёмный шоколад — здоровая замена." },
  },
};

function MiniChart({ cycleDay, cycleLength }: { cycleDay: number; cycleLength: number }) {
  const pts = Array.from({ length: cycleLength }, (_, i) => {
    const p = (i + 1) / cycleLength;
    if (p <= 0.18) return 25 + Math.sin(i) * 5;
    if (p <= 0.46) return 35 + p * 90;
    if (p <= 0.57) return 88 + Math.sin(i) * 5;
    return 75 - (p - 0.57) * 70;
  });
  const w = 260, h = 40;
  const sx = w / (pts.length - 1);
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${i * sx} ${h - (v / 100) * h}`).join(" ");
  const tx = (cycleDay - 1) * sx, ty = h - (pts[cycleDay - 1] / 100) * h;
  return (
    <svg viewBox={`0 0 ${w} ${h + 5}`} className="w-full h-10">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#E8A0B8" /><stop offset="40%" stopColor="#B8A5D8" />
        <stop offset="55%" stopColor="#D4A0C8" /><stop offset="100%" stopColor="#D4CCE6" />
      </linearGradient></defs>
      <path d={d + ` L ${w} ${h + 5} L 0 ${h + 5} Z`} fill="url(#cg)" opacity="0.12" />
      <path d={d} fill="none" stroke="url(#cg)" strokeWidth="1.5" />
      <circle cx={tx} cy={ty} r="3.5" fill="#9B8EC4" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function Gamification({ days }: { days: number }) {
  const ms = [{ at: 7, l: "Неделя", e: "🌱" }, { at: 28, l: "Цикл", e: "🌸" }, { at: 84, l: "Норма!", e: "🏆" }];
  const next = ms.find(m => days < m.at) ?? ms[ms.length - 1];
  const pct = Math.min(100, Math.round((days / next.at) * 100));
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-base">{days >= 84 ? "🏆" : days >= 28 ? "🌸" : "🌱"}</span>
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

export default function V3Demo() {
  const [v, setV] = useState(1);
  const [artOpen, setArtOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [cd, setCd] = useState(15);
  const [phase, setPhase] = useState<CyclePhase>("ovulation");
  const [du, setDu] = useState(13);
  const [name, setName] = useState("Айсель");
  const [cl, setCl] = useState(28);
  const [pl, setPl] = useState(5);
  const [td, setTd] = useState(3);
  const [water, setWater] = useState(0);

  useEffect(() => {
    const data = readData();
    if (data.profile) {
      const d = getCycleDay(data.profile);
      setCd(d);
      setPhase(getCyclePhase(d, data.profile.cycleConfig.periodLength, data.profile.cycleConfig.cycleLength));
      setDu(getDaysUntilPeriod(data.profile));
      setName(data.profile.name);
      setCl(data.profile.cycleConfig.cycleLength);
      setPl(data.profile.cycleConfig.periodLength);
      setTd(Object.keys(data.checkIns).length);
      setWater(getWaterEntry(data).glasses);
    }
    setReady(true);
  }, []);

  if (!ready) return null;
  const c = P[phase];
  const dr = du > 2 ? `${du - 2}–${du + 2} дн.` : du > 0 ? `${du} дн.` : "сегодня";

  return (
    <div className="min-h-screen bg-mira-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        {/* Switcher */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-card">
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => { setV(i); setArtOpen(false); }}
              className={`flex-1 rounded-xl py-2 text-[10px] font-bold transition ${v === i ? "bg-mira-primary text-white" : "text-mira-muted"}`}>{i}</button>
          ))}
        </div>

        {/* ═══ 1: Чистый минимум ═══ */}
        {v === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-mira-muted">Привет, {name}</p>

            <Card className={`p-5 bg-gradient-to-br ${c.gradient} border-0`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.emoji}</span>
                  <p className="text-lg font-bold text-mira-text">{c.name}</p>
                </div>
                <Badge className="bg-white/30 border-0 text-mira-text text-[10px]">{cd}/{cl}</Badge>
              </div>
              <p className="text-sm text-mira-text/70 mb-3">{c.what}</p>
              <MiniChart cycleDay={cd} cycleLength={cl} />
              <p className="text-[10px] text-mira-text/40 mt-2">Месячные через {dr}</p>
            </Card>

            <Card className="p-3.5">
              <p className="text-xs text-mira-text">💡 {c.tip}</p>
            </Card>

            <Button className="w-full" size="lg">+ Отметить состояние</Button>

            <div className="flex flex-wrap gap-2 justify-center">
              {["✅ Всё ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-mira-text shadow-card active:scale-95">{b}</button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ 2: С рекомендациями grid ═══ */}
        {v === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-mira-muted">Привет, {name}</p>

            <Card className={`p-5 bg-gradient-to-br ${c.gradient} border-0`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <p className="text-lg font-bold text-mira-text">{c.name}</p>
                  <p className="text-[10px] text-mira-text/50">День {cd} из {cl} · Месячные через {dr}</p>
                </div>
              </div>
              <p className="text-sm text-mira-text/70 mb-3">{c.what}</p>
              <MiniChart cycleDay={cd} cycleLength={cl} />
            </Card>

            {c.fertility && (
              <div className={`rounded-2xl border p-3 flex items-center gap-3 ${c.fertility.color}`}>
                <span className="text-lg">{c.fertility.icon}</span>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  <p className="text-xs font-bold">Риск беременности: {c.fertility.label}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <Card className="p-3"><span className="text-base">💡</span><p className="text-xs text-mira-text mt-1">{c.tip}</p></Card>
              <Card className="p-3"><span className="text-base">👗</span><p className="text-xs text-mira-text mt-1">{c.clothing}</p></Card>
              <Card className="p-3"><span className="text-base">{c.vitamin.icon}</span><p className="text-xs text-mira-text mt-1">{c.vitamin.text}</p></Card>
              <Card className="p-3 cursor-pointer" onClick={() => setArtOpen(!artOpen)}>
                <span className="text-base">📖</span><p className="text-xs font-bold text-mira-text mt-1">{c.article.title}</p>
                <p className="text-[10px] text-mira-primary">Читать →</p>
              </Card>
            </div>

            {artOpen && (
              <Card className="p-4 bg-gradient-to-br from-white to-[#F8F5FE] border-0">
                <p className="text-sm font-bold text-mira-text mb-1">{c.article.title}</p>
                <p className="text-xs text-mira-muted">{c.article.text}</p>
              </Card>
            )}

            <Card className="p-3"><Gamification days={td} /></Card>
            <Button className="w-full" size="lg">+ Отметить состояние</Button>
          </motion.div>
        )}

        {/* ═══ 3: Всё в одной карточке ═══ */}
        {v === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-mira-muted">Привет, {name}</p>

            <div className={`rounded-[2rem] bg-gradient-to-br ${c.gradient} p-6 shadow-[0_8px_40px_rgba(155,142,196,0.15)]`}>
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-white/30 border-0 text-mira-text">{cd}/{cl}</Badge>
                <span className="text-2xl">{c.emoji}</span>
              </div>

              <p className="text-2xl font-bold text-mira-text mb-1">{c.name}</p>
              <p className="text-sm text-mira-text/60 mb-4">{c.what}</p>

              <MiniChart cycleDay={cd} cycleLength={cl} />

              <div className="mt-4 space-y-2">
                {[
                  { i: "💡", t: c.tip },
                  { i: "👗", t: c.clothing },
                  { i: c.vitamin.icon, t: c.vitamin.text },
                ].map(r => (
                  <div key={r.t} className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                    <span className="text-sm">{r.i}</span>
                    <p className="text-xs text-mira-text">{r.t}</p>
                  </div>
                ))}
              </div>

              {c.fertility && (
                <div className="mt-3 flex items-center gap-2 bg-white/25 rounded-xl px-3 py-2">
                  <span>{c.fertility.icon}</span>
                  <AlertTriangle className="h-3 w-3 text-mira-text/60" />
                  <p className="text-xs font-bold text-mira-text">Риск: {c.fertility.label}</p>
                </div>
              )}

              <p className="text-[10px] text-mira-text/40 mt-3">Месячные через {dr}</p>
            </div>

            <Card className="p-3"><Gamification days={td} /></Card>
            <Button className="w-full" size="lg">+ Отметить состояние</Button>
          </motion.div>
        )}

        {/* ═══ 4: Чат-стиль ═══ */}
        {v === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
            <p className="text-sm text-mira-muted mb-2">Привет, {name} 👋</p>

            {[
              { i: c.emoji, content: (
                <div>
                  <p className="text-sm font-bold text-mira-text">День {cd}. {c.name}</p>
                  <p className="text-xs text-mira-text/70 mt-1">{c.what}</p>
                  <div className="mt-2"><MiniChart cycleDay={cd} cycleLength={cl} /></div>
                </div>
              )},
              ...(c.fertility ? [{ i: c.fertility.icon, content: (
                <p className="text-xs text-mira-text"><span className="font-bold">Риск беременности: {c.fertility.label}.</span></p>
              )}] : []),
              { i: "💡", content: <p className="text-xs text-mira-text">{c.tip}</p> },
              { i: "👗", content: <p className="text-xs text-mira-text">{c.clothing}</p> },
              { i: c.vitamin.icon, content: <p className="text-xs text-mira-text">{c.vitamin.text}</p> },
              { i: "📖", content: (
                <div>
                  <p className="text-xs font-bold text-mira-text">{c.article.title}</p>
                  <p className="text-[10px] text-mira-muted mt-0.5">{c.article.text}</p>
                </div>
              )},
              { i: "🔔", content: <p className="text-xs text-mira-text">Месячные через {dr}</p> },
            ].map((msg, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }} className="flex gap-2">
                <span className="text-base mt-1 shrink-0">{msg.i}</span>
                <Card className="p-3 flex-1">{msg.content}</Card>
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              <Card className="p-3 mt-1"><Gamification days={td} /></Card>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
              <Button className="w-full mt-1" size="lg">+ Отметить состояние</Button>
              <div className="flex gap-2 justify-center mt-2">
                {["✅ Всё ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                  <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-mira-text shadow-card active:scale-95">{b}</button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══ 5: Карточки-вкладки (симптомы раскрываются) ═══ */}
        {v === 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-mira-muted">Привет, {name}</p>

            {/* Hero */}
            <Card className={`p-5 bg-gradient-to-br ${c.gradient} border-0`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{c.emoji}</span>
                <p className="text-lg font-bold text-mira-text">{c.name}</p>
                <Badge className="ml-auto bg-white/30 border-0 text-mira-text text-[10px]">{cd}/{cl}</Badge>
              </div>
              <p className="text-sm text-mira-text/70">{c.what}</p>
              <div className="mt-3"><MiniChart cycleDay={cd} cycleLength={cl} /></div>
            </Card>

            {/* Expandable sections */}
            {[
              { emoji: "🫀", title: "Что ожидать", content: (
                <div className="space-y-1">{c.expect.map(s => <p key={s} className="text-xs text-mira-text">• {s}</p>)}</div>
              )},
              ...(c.fertility ? [{ emoji: c.fertility.icon, title: `Риск беременности: ${c.fertility.label}`, content: (
                <p className="text-xs text-mira-muted">Не является методом контрацепции.</p>
              )}] : []),
              { emoji: "💡", title: "Рекомендации", content: (
                <div className="space-y-1.5">
                  <p className="text-xs text-mira-text">{c.tip}</p>
                  <p className="text-xs text-mira-text">👗 {c.clothing}</p>
                  <p className="text-xs text-mira-text">{c.vitamin.icon} {c.vitamin.text}</p>
                </div>
              )},
              { emoji: "📖", title: c.article.title, content: (
                <p className="text-xs text-mira-muted">{c.article.text}</p>
              )},
            ].map((section, idx) => (
              <ExpandableSection key={idx} emoji={section.emoji} title={section.title}>
                {section.content}
              </ExpandableSection>
            ))}

            <Card className="p-3"><Gamification days={td} /></Card>

            <p className="text-[10px] text-center text-mira-muted">🔔 Месячные через {dr}</p>

            <Button className="w-full" size="lg">+ Отметить состояние</Button>

            <div className="flex flex-wrap gap-2 justify-center">
              {["✅ Всё ок", "😣 Боль", "😴 Сон", "😤 ПМС"].map(b => (
                <button key={b} className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-mira-text shadow-card active:scale-95">{b}</button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ExpandableSection({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 p-3.5 text-left">
        <span className="text-base">{emoji}</span>
        <p className="text-sm font-semibold text-mira-text flex-1">{title}</p>
        <ChevronDown className={`h-4 w-4 text-mira-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3.5 pb-3.5 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
