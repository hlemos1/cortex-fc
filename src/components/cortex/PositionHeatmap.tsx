"use client";

/**
 * SVG football pitch with position heat zones.
 * Highlights where the player operates most.
 */

interface PositionHeatmapProps {
  positionCluster: string;
  positionDetail?: string;
}

// Map position clusters to (x, y) zones on a pitch (0-100 scale)
const POSITION_ZONES: Record<string, Array<{ x: number; y: number; intensity: number }>> = {
  GK: [{ x: 50, y: 92, intensity: 1.0 }],
  CB: [
    { x: 40, y: 78, intensity: 0.9 },
    { x: 60, y: 78, intensity: 0.9 },
    { x: 50, y: 82, intensity: 0.7 },
  ],
  FB: [
    { x: 15, y: 65, intensity: 0.9 },
    { x: 85, y: 65, intensity: 0.9 },
    { x: 15, y: 45, intensity: 0.6 },
    { x: 85, y: 45, intensity: 0.6 },
  ],
  DM: [
    { x: 50, y: 62, intensity: 1.0 },
    { x: 40, y: 58, intensity: 0.6 },
    { x: 60, y: 58, intensity: 0.6 },
  ],
  CM: [
    { x: 50, y: 50, intensity: 1.0 },
    { x: 35, y: 48, intensity: 0.7 },
    { x: 65, y: 48, intensity: 0.7 },
  ],
  AM: [
    { x: 50, y: 35, intensity: 1.0 },
    { x: 35, y: 38, intensity: 0.6 },
    { x: 65, y: 38, intensity: 0.6 },
  ],
  W: [
    { x: 15, y: 35, intensity: 0.9 },
    { x: 85, y: 35, intensity: 0.9 },
    { x: 20, y: 25, intensity: 0.6 },
    { x: 80, y: 25, intensity: 0.6 },
  ],
  ST: [
    { x: 50, y: 18, intensity: 1.0 },
    { x: 40, y: 22, intensity: 0.7 },
    { x: 60, y: 22, intensity: 0.7 },
  ],
};

// Movement arrows per position cluster
const MOVEMENT_ARROWS: Record<string, Array<{ x1: number; y1: number; x2: number; y2: number }>> = {
  GK: [
    { x1: 45, y1: 92, x2: 40, y2: 88 },
    { x1: 55, y1: 92, x2: 60, y2: 88 },
    { x1: 50, y1: 92, x2: 50, y2: 86 },
  ],
  CB: [
    { x1: 40, y1: 78, x2: 30, y2: 75 },
    { x1: 60, y1: 78, x2: 70, y2: 75 },
    { x1: 50, y1: 82, x2: 50, y2: 76 },
  ],
  FB: [
    { x1: 15, y1: 65, x2: 15, y2: 45 },
    { x1: 85, y1: 65, x2: 85, y2: 45 },
    { x1: 15, y1: 45, x2: 25, y2: 35 },
    { x1: 85, y1: 45, x2: 75, y2: 35 },
  ],
  DM: [
    { x1: 50, y1: 62, x2: 35, y2: 58 },
    { x1: 50, y1: 62, x2: 65, y2: 58 },
    { x1: 50, y1: 62, x2: 50, y2: 68 },
    { x1: 50, y1: 62, x2: 50, y2: 55 },
  ],
  CM: [
    { x1: 50, y1: 50, x2: 50, y2: 40 },
    { x1: 50, y1: 50, x2: 50, y2: 60 },
    { x1: 50, y1: 50, x2: 38, y2: 46 },
    { x1: 50, y1: 50, x2: 62, y2: 46 },
  ],
  AM: [
    { x1: 50, y1: 35, x2: 35, y2: 28 },
    { x1: 50, y1: 35, x2: 65, y2: 28 },
    { x1: 50, y1: 35, x2: 50, y2: 25 },
  ],
  W: [
    { x1: 15, y1: 35, x2: 30, y2: 22 },
    { x1: 85, y1: 35, x2: 70, y2: 22 },
    { x1: 15, y1: 35, x2: 25, y2: 18 },
    { x1: 85, y1: 35, x2: 75, y2: 18 },
  ],
  ST: [
    { x1: 50, y1: 18, x2: 50, y2: 8 },
    { x1: 40, y1: 22, x2: 35, y2: 14 },
    { x1: 60, y1: 22, x2: 65, y2: 14 },
  ],
};

// Refine zones based on detail (e.g., "Left Winger" -> only left side)
function getZones(cluster: string, detail?: string) {
  const zones = POSITION_ZONES[cluster] ?? POSITION_ZONES.CM;

  if (!detail) return zones;

  const lower = detail.toLowerCase();
  if (lower.includes("left")) {
    return zones.filter((z) => z.x <= 55).map((z) => ({ ...z, x: Math.min(z.x, 30) }));
  }
  if (lower.includes("right")) {
    return zones.filter((z) => z.x >= 45).map((z) => ({ ...z, x: Math.max(z.x, 70) }));
  }
  if (lower.includes("centre back") || lower.includes("center back")) {
    return [{ x: 50, y: 78, intensity: 1.0 }, { x: 45, y: 75, intensity: 0.6 }, { x: 55, y: 75, intensity: 0.6 }];
  }

  return zones;
}

function getArrows(cluster: string, detail?: string) {
  const arrows = MOVEMENT_ARROWS[cluster] ?? MOVEMENT_ARROWS.CM;

  if (!detail) return arrows;

  const lower = detail.toLowerCase();
  if (lower.includes("left")) {
    return arrows.filter((a) => a.x1 <= 55 && a.x2 <= 60).map((a) => ({
      ...a,
      x1: Math.min(a.x1, 35),
      x2: Math.min(a.x2, 35),
    }));
  }
  if (lower.includes("right")) {
    return arrows.filter((a) => a.x1 >= 45 && a.x2 >= 40).map((a) => ({
      ...a,
      x1: Math.max(a.x1, 65),
      x2: Math.max(a.x2, 65),
    }));
  }

  return arrows;
}

export function PositionHeatmap({ positionCluster, positionDetail }: PositionHeatmapProps) {
  const zones = getZones(positionCluster, positionDetail);
  const arrows = getArrows(positionCluster, positionDetail);

  // Determine primary zone (highest intensity)
  const maxIntensity = Math.max(...zones.map((z) => z.intensity));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 110 155" className="w-full max-w-[220px] mx-auto">
        <defs>
          {/* Primary heat gradient — emerald */}
          <radialGradient id="heatGradPrimary">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          {/* Secondary heat gradient — cyan */}
          <radialGradient id="heatGradSecondary">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          {/* Arrow marker */}
          <marker
            id="arrowHead"
            markerWidth="4"
            markerHeight="3"
            refX="3.5"
            refY="1.5"
            orient="auto"
          >
            <polygon points="0 0, 4 1.5, 0 3" fill="#10b981" fillOpacity="0.25" />
          </marker>
        </defs>

        {/* Pitch background — offset by 5 for padding */}
        <rect x="5" y="5" width="100" height="145" rx="2" fill="#0a2e1a" stroke="#1a5c35" strokeWidth="0.5" />

        {/* Half labels */}
        <text x="55" y="13" textAnchor="middle" fill="#1a5c35" fontSize="5" fontWeight="500" opacity="0.5">ATK</text>
        <text x="55" y="147" textAnchor="middle" fill="#1a5c35" fontSize="5" fontWeight="500" opacity="0.5">DEF</text>

        {/* Center line */}
        <line x1="5" y1="77.5" x2="105" y2="77.5" stroke="#1a5c35" strokeWidth="0.5" />

        {/* Center circle */}
        <circle cx="55" cy="77.5" r="13" fill="none" stroke="#1a5c35" strokeWidth="0.5" />
        <circle cx="55" cy="77.5" r="0.8" fill="#1a5c35" />

        {/* Top goal area (attack) */}
        <rect x="32" y="5" width="46" height="14" fill="none" stroke="#1a5c35" strokeWidth="0.5" />
        <rect x="40" y="5" width="30" height="7" fill="none" stroke="#1a5c35" strokeWidth="0.5" />

        {/* Bottom goal area (defense) */}
        <rect x="32" y="136" width="46" height="14" fill="none" stroke="#1a5c35" strokeWidth="0.5" />
        <rect x="40" y="143" width="30" height="7" fill="none" stroke="#1a5c35" strokeWidth="0.5" />

        {/* Penalty spots */}
        <circle cx="55" cy="20" r="0.6" fill="#1a5c35" />
        <circle cx="55" cy="135" r="0.6" fill="#1a5c35" />

        {/* Corner arcs */}
        <path d="M 5 8 A 3 3 0 0 1 8 5" fill="none" stroke="#1a5c35" strokeWidth="0.4" />
        <path d="M 102 5 A 3 3 0 0 1 105 8" fill="none" stroke="#1a5c35" strokeWidth="0.4" />
        <path d="M 5 147 A 3 3 0 0 0 8 150" fill="none" stroke="#1a5c35" strokeWidth="0.4" />
        <path d="M 102 150 A 3 3 0 0 0 105 147" fill="none" stroke="#1a5c35" strokeWidth="0.4" />

        {/* Movement arrows */}
        {arrows.map((arrow, i) => {
          // Scale from 0-100 to 5-105 (pitch x) and proportionally for y
          const sx = 5 + arrow.x1 * 1.0;
          const sy = 5 + arrow.y1 * 1.45;
          const ex = 5 + arrow.x2 * 1.0;
          const ey = 5 + arrow.y2 * 1.45;

          return (
            <line
              key={`arrow-${i}`}
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="#10b981"
              strokeOpacity="0.2"
              strokeWidth="0.7"
              strokeDasharray="2 1.5"
              markerEnd="url(#arrowHead)"
            />
          );
        })}

        {/* Heat zones */}
        {zones.map((zone, i) => {
          const isPrimary = zone.intensity === maxIntensity;
          const cx = 5 + zone.x * 1.0;
          const cy = 5 + zone.y * 1.45;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={12 * zone.intensity}
              fill={isPrimary ? "url(#heatGradPrimary)" : "url(#heatGradSecondary)"}
              opacity={zone.intensity * 0.9}
            >
              <animate
                attributeName="opacity"
                values={`${zone.intensity * 0.5};${zone.intensity * 0.9};${zone.intensity * 0.5}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          );
        })}

        {/* Player dot */}
        {zones.length > 0 && (
          <circle
            cx={5 + zones[0].x * 1.0}
            cy={5 + zones[0].y * 1.45}
            r="2.2"
            fill="#10b981"
            stroke="#09090b"
            strokeWidth="0.5"
          >
            <animate
              attributeName="r"
              values="2.2;2.8;2.2"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>

      {/* Position label */}
      {positionDetail && (
        <span className="text-[11px] text-zinc-400 font-medium tracking-wide">
          {positionDetail}
        </span>
      )}
      {!positionDetail && positionCluster && (
        <span className="text-[11px] text-zinc-500 font-medium tracking-wide">
          {positionCluster}
        </span>
      )}
    </div>
  );
}
