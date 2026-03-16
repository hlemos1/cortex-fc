"use client";

import { useRef, useState } from "react";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { ChartExport } from "@/components/ui/chart-export";

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

type MetricKey = "rating" | "xg" | "goals";

const METRIC_CONFIG = {
  rating: { name: "Rating", color: "#10b981", domain: [5, 10] as [number, number], avg: 7.0 },
  xg: { name: "xG", color: "#f59e0b", domain: [0, 2] as [number, number], avg: 0.3 },
  goals: { name: "Gols", color: "#06b6d4", domain: [0, 3] as [number, number], avg: 0 },
};

const METRICS: MetricKey[] = ["rating", "xg", "goals"];

function computeMovingAverage(data: Array<{ value: number | null }>, window: number) {
  return data.map((_, i, arr) => {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1).filter((d) => d.value !== null);
    if (slice.length === 0) return null;
    const sum = slice.reduce((acc, d) => acc + (d.value ?? 0), 0);
    return parseFloat((sum / slice.length).toFixed(3));
  });
}

function GlassmorphicTooltip({
  active,
  payload,
  label,
  metricName,
  color,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  metricName: string;
  color: string;
}) {
  if (!active || !payload?.length) return null;

  const rawEntry = payload.find((p) => p.dataKey === "value");
  const trendEntry = payload.find((p) => p.dataKey === "trend");

  return (
    <div
      className="rounded-xl border border-zinc-700/50 px-4 py-3 text-xs shadow-2xl"
      style={{
        backgroundColor: "rgba(24, 24, 27, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <p className="text-zinc-400 mb-2 font-medium">{label}</p>
      {rawEntry && (
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-zinc-400">{metricName}:</span>
          <span className="text-white font-mono font-semibold">
            {rawEntry.value?.toFixed(2)}
          </span>
        </div>
      )}
      {trendEntry && trendEntry.value != null && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full opacity-50"
            style={{ backgroundColor: color }}
          />
          <span className="text-zinc-500">Trend (3j):</span>
          <span className="text-zinc-300 font-mono text-[11px]">
            {trendEntry.value?.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

export function PerformanceChart({ data, metric: initialMetric = "rating" }: PerformanceChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>(initialMetric);
  const chartRef = useRef<HTMLDivElement>(null);

  const config = METRIC_CONFIG[activeMetric];

  const filteredData = data.filter((d) => d[activeMetric] !== null);
  const chartData = filteredData.map((d) => ({
    date: d.date,
    value: d[activeMetric] as number,
  }));

  const trendValues = computeMovingAverage(chartData, 3);
  const enrichedData = chartData.map((d, i) => ({
    ...d,
    trend: trendValues[i],
  }));

  const gradientId = `gradient-${activeMetric}`;

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
        Sem dados de {config.name} disponiveis
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Metric Toggle */}
      <div className="flex gap-1.5">
        {METRICS.map((m) => {
          const isActive = m === activeMetric;
          return (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-zinc-400"
              }`}
            >
              {METRIC_CONFIG[m].name}
            </button>
          );
        })}
      </div>

      {/* Chart Container */}
      <div ref={chartRef} className="relative">
        <ChartExport containerRef={chartRef} filename={`performance-${activeMetric}`} />
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={enrichedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip
              content={
                <GlassmorphicTooltip
                  metricName={config.name}
                  color={config.color}
                />
              }
            />
            {config.avg > 0 && (
              <ReferenceLine y={config.avg} stroke="#3f3f46" strokeDasharray="5 5" />
            )}
            {/* Gradient fill area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${gradientId})`}
              animationDuration={1500}
            />
            {/* Trend line (3-match moving average) */}
            <Line
              type="monotone"
              dataKey="trend"
              stroke={config.color}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              strokeOpacity={0.4}
              dot={false}
              activeDot={false}
              animationDuration={1500}
            />
            {/* Main line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={{ r: 3, fill: config.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: config.color, stroke: "#09090b", strokeWidth: 2 }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
