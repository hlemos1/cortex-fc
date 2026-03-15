"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface MatchDataPoint {
  date: string;
  rating: number | null;
  xg: number | null;
  goals: number;
}

interface PerformanceChartProps {
  data: MatchDataPoint[];
  metric?: "rating" | "xg" | "goals";
}

const METRIC_CONFIG = {
  rating: { name: "Rating", color: "#10b981", domain: [5, 10] as [number, number], avg: 7.0 },
  xg: { name: "xG", color: "#f59e0b", domain: [0, 2] as [number, number], avg: 0.3 },
  goals: { name: "Gols", color: "#06b6d4", domain: [0, 3] as [number, number], avg: 0 },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">{payload[0].value?.toFixed(2)}</p>
    </div>
  );
}

export function PerformanceChart({ data, metric = "rating" }: PerformanceChartProps) {
  const config = METRIC_CONFIG[metric];
  const chartData = data
    .filter((d) => d[metric] !== null)
    .map((d) => ({
      date: d.date,
      value: d[metric],
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
        Sem dados de {config.name} disponiveis
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#71717a", fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: "#27272a" }}
        />
        <YAxis
          domain={config.domain}
          tick={{ fill: "#71717a", fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: "#27272a" }}
        />
        <Tooltip content={<CustomTooltip />} />
        {config.avg > 0 && (
          <ReferenceLine y={config.avg} stroke="#3f3f46" strokeDasharray="5 5" />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={2}
          dot={{ r: 3, fill: config.color, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: config.color, stroke: "#09090b", strokeWidth: 2 }}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
