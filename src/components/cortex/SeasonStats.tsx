"use client";

import { Target, Footprints, Award, Clock, ShieldAlert, Zap } from "lucide-react";

interface SeasonStatsProps {
  stats: {
    appearances: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    avgRating: number | null;
    xg: number | null;
    xa: number | null;
    passAccuracy: number | null;
    tackles: number;
    interceptions: number;
    yellowCards: number;
    redCards: number;
    duelsWonPct: number | null;
  };
}

export function SeasonStats({ stats }: SeasonStatsProps) {
  const items = [
    { label: "Jogos", value: stats.appearances, icon: Award, color: "text-emerald-400" },
    { label: "Minutos", value: stats.minutesPlayed.toLocaleString(), icon: Clock, color: "text-zinc-400" },
    { label: "Gols", value: stats.goals, icon: Target, color: "text-amber-400" },
    { label: "Assistencias", value: stats.assists, icon: Footprints, color: "text-cyan-400" },
    { label: "Rating Medio", value: stats.avgRating?.toFixed(1) ?? "—", icon: Zap, color: "text-emerald-400" },
    { label: "xG", value: stats.xg?.toFixed(1) ?? "—", icon: Target, color: "text-amber-400/70" },
    { label: "xA", value: stats.xa?.toFixed(1) ?? "—", icon: Footprints, color: "text-cyan-400/70" },
    { label: "Pass Acc.", value: stats.passAccuracy ? `${stats.passAccuracy.toFixed(0)}%` : "—", icon: Zap, color: "text-blue-400" },
    { label: "Tackles", value: stats.tackles, icon: ShieldAlert, color: "text-orange-400" },
    { label: "Interceptacoes", value: stats.interceptions, icon: ShieldAlert, color: "text-orange-400/70" },
    { label: "Duelos Ganhos", value: stats.duelsWonPct ? `${stats.duelsWonPct.toFixed(0)}%` : "—", icon: Zap, color: "text-purple-400" },
    { label: "Cartoes", value: `${stats.yellowCards}A ${stats.redCards}V`, icon: ShieldAlert, color: "text-red-400" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 text-center hover:bg-zinc-800/80 transition-colors"
          >
            <Icon className={`w-3.5 h-3.5 mx-auto mb-1.5 ${item.color}`} />
            <p className="text-lg font-bold font-mono text-white">{item.value}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}
