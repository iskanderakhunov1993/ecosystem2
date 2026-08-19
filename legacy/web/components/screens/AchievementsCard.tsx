"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getAchievements, getUnlockedCount } from "@/lib/gamification";
import type { MiraLocalData } from "@/lib/types";

export function AchievementsCard({ data }: { data: MiraLocalData }) {
  const achievements = getAchievements(data);
  const { unlocked, total } = getUnlockedCount(data);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-mira-text">Достижения</p>
        <span className="text-xs font-semibold text-mira-primary">{unlocked} из {total}</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${
              a.unlocked
                ? "bg-gradient-to-br from-[#F5E0A0] to-[#E8C060] shadow-lg"
                : "bg-mira-lavender-light/50 grayscale opacity-40"
            }`}>
              <span className="text-2xl">{a.unlocked ? a.emoji : "🔒"}</span>
            </div>
            <span className={`text-[9px] font-semibold leading-tight ${a.unlocked ? "text-mira-text" : "text-mira-muted"}`}>
              {a.title}
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
