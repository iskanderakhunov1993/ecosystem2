"use client";

import { motion } from "framer-motion";
import { BarChart3, Activity, Moon, Brain, AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCycleSummary } from "@/lib/insights";
import type { MiraLocalData } from "@/lib/types";

export function CycleSummaryCard({ data }: { data: MiraLocalData }) {
  const summary = getCycleSummary(data);
  if (!summary) return null;

  const completeness = Math.round((summary.loggedDays / summary.totalDays) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-mira-lavender-light/60 to-mira-rose-light/40 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-mira-primary" />
              <span className="text-sm font-bold text-mira-text">Итог цикла</span>
            </div>
            <Badge>Цикл #{summary.cycleNumber}</Badge>
          </div>
          <p className="mt-1 text-xs text-mira-muted">
            {summary.loggedDays} из {summary.totalDays} дней отмечено ({completeness}%)
          </p>
          {/* Mini progress */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/60">
            <div className="h-full rounded-full bg-mira-primary" style={{ width: `${completeness}%` }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-mira-lavender/10">
          <div className="bg-white p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3 w-3 text-mira-cycle" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Боль</span>
            </div>
            <p className="text-lg font-bold text-mira-text">{summary.painDays} <span className="text-xs font-normal text-mira-muted">дн.</span></p>
            {summary.strongPainDays > 0 && (
              <p className="text-[10px] text-mira-cycle">Сильная: {summary.strongPainDays}</p>
            )}
          </div>

          <div className="bg-white p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Moon className="h-3 w-3 text-[#7E8EC4]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Сон</span>
            </div>
            <p className="text-lg font-bold text-mira-text">{summary.avgSleep}</p>
            <p className="text-[10px] text-mira-muted">в среднем</p>
          </div>

          <div className="bg-white p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain className="h-3 w-3 text-mira-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Настроение</span>
            </div>
            <p className="text-sm font-bold text-mira-text">{summary.topMood}</p>
            <p className="text-[10px] text-mira-muted">чаще всего</p>
          </div>

          <div className="bg-white p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 text-[#A07EC4]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">ПМС</span>
            </div>
            {summary.topPms.length > 0 ? (
              <p className="text-xs font-semibold text-mira-text">{summary.topPms.join(", ")}</p>
            ) : (
              <p className="text-xs text-mira-muted">Не отмечено</p>
            )}
          </div>
        </div>

        {/* Deviations */}
        {summary.deviations.length > 0 && (
          <div className="border-t border-mira-lavender/10 bg-[#FFF8F0] px-5 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3 w-3 text-[#C4887E]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A06858]">Отклонения</span>
            </div>
            <ul className="space-y-1">
              {summary.deviations.map((d) => (
                <li key={d} className="flex items-center gap-1.5 text-xs text-[#8B5E50]">
                  <span className="h-1 w-1 rounded-full bg-[#C4887E]" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Highlight */}
        <div className="border-t border-mira-lavender/10 px-5 py-3">
          <p className="text-xs text-mira-primary font-semibold">{summary.highlight}</p>
        </div>
      </Card>
    </motion.div>
  );
}
