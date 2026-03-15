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

export function PositionHeatmap({ positionCluster, positionDetail }: PositionHeatmapProps) {
  const zones = getZones(positionCluster, positionDetail);

  return (
    <svg viewBox="0 0 100 140" className="w-full max-w-[200px] mx-auto">
      {/* Pitch background */}
      <rect x="2" y="2" width="96" height="136" rx="2" fill="#0a2e1a" stroke="#1a5c35" strokeWidth="0.5" />

      {/* Center line */}
      <line x1="2" y1="70" x2="98" y2="70" stroke="#1a5c35" strokeWidth="0.5" />

      {/* Center circle */}
      <circle cx="50" cy="70" r="12" fill="none" stroke="#1a5c35" strokeWidth="0.5" />
      <circle cx="50" cy="70" r="0.8" fill="#1a5c35" />

      {/* Goal areas */}
      <rect x="30" y="2" width="40" height="12" fill="none" stroke="#1a5c35" strokeWidth="0.5" />
      <rect x="38" y="2" width="24" height="6" fill="none" stroke="#1a5c35" strokeWidth="0.5" />
      <rect x="30" y="126" width="40" height="12" fill="none" stroke="#1a5c35" strokeWidth="0.5" />
      <rect x="38" y="132" width="24" height="6" fill="none" stroke="#1a5c35" strokeWidth="0.5" />

      {/* Penalty spots */}
      <circle cx="50" cy="15" r="0.6" fill="#1a5c35" />
      <circle cx="50" cy="125" r="0.6" fill="#1a5c35" />

      {/* Heat zones */}
      <defs>
        <radialGradient id="heatGrad">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {zones.map((zone, i) => (
        <circle
          key={i}
          cx={zone.x}
          cy={zone.y}
          r={10 * zone.intensity}
          fill="url(#heatGrad)"
          opacity={zone.intensity * 0.9}
        >
          <animate
            attributeName="opacity"
            values={`${zone.intensity * 0.5};${zone.intensity * 0.9};${zone.intensity * 0.5}`}
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Player dot */}
      {zones.length > 0 && (
        <circle
          cx={zones[0].x}
          cy={zones[0].y}
          r="2"
          fill="#10b981"
          stroke="#09090b"
          strokeWidth="0.5"
        >
          <animate
            attributeName="r"
            values="2;2.5;2"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
}
