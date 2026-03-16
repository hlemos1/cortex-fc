"use client";

import { type RefObject, useCallback } from "react";
import { Download } from "lucide-react";

interface ChartExportProps {
  containerRef: RefObject<HTMLDivElement | null>;
  filename: string;
}

export function ChartExport({ containerRef, filename }: ChartExportProps) {
  const handleExport = useCallback(() => {
    if (!containerRef.current) return;

    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [containerRef, filename]);

  return (
    <button
      onClick={handleExport}
      className="absolute top-2 right-2 z-10 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50 rounded-lg p-1.5 transition-colors cursor-pointer"
      aria-label={`Exportar ${filename}`}
      title="Exportar como SVG"
    >
      <Download className="w-3.5 h-3.5 text-zinc-400" />
    </button>
  );
}
