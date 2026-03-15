"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  Search,
  X,
  TrendingUp,
  Shield,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { NeuralRadar } from "@/components/cortex/NeuralRadar";
import { DecisionBadge } from "@/components/cortex/DecisionBadge";
import { PositionHeatmap } from "@/components/cortex/PositionHeatmap";
import type { CortexDecision } from "@/types/cortex";

interface PlayerOption {
  id: string;
  name: string;
  position: string;
  positionCluster: string;
  positionDetail: string | null;
  club: string;
  nationality: string;
  age: number | null;
  marketValue: number;
}

interface CompareAnalysis {
  vx: number;
  rx: number;
  decision: CortexDecision;
  confidence: number;
  scnPlus: number;
  layers: {
    C1_technical: number;
    C2_tactical: number;
    C3_physical: number;
    C4_behavioral: number;
    C5_narrative: number;
    C6_economic: number;
    C7_ai: number;
  };
  algorithms: {
    AST: number;
    CLF: number;
    GNE: number;
    WSE: number;
    RBL: number;
    SACE: number;
    SCN_plus: number;
  };
}

interface ComparePlayer extends PlayerOption {
  analysis: CompareAnalysis | null;
}

function PlayerSelector({
  label,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  selected: ComparePlayer | null;
  onSelect: (p: ComparePlayer) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerOption[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/players?search=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setResults(
          (data.data ?? []).map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            position: p.positionDetail ?? p.positionCluster,
            positionCluster: p.positionCluster,
            positionDetail: p.positionDetail,
            club: (p.currentClub as Record<string, string>)?.name ?? "—",
            nationality: p.nationality,
            age: p.age,
            marketValue: p.marketValue ?? 0,
          }))
        );
      }
    } catch {
      // ignore
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  async function selectPlayer(p: PlayerOption) {
    // Fetch analysis
    try {
      const res = await fetch(`/api/players/${p.id}`);
      if (res.ok) {
        const data = await res.json();
        const a = data.data?.analyses?.[0];
        onSelect({
          ...p,
          analysis: a
            ? {
                vx: a.vx,
                rx: a.rx,
                decision: a.decision as CortexDecision,
                confidence: a.confidence,
                scnPlus: a.scnPlus ?? 0,
                layers: {
                  C1_technical: a.c1Technical,
                  C2_tactical: a.c2Tactical,
                  C3_physical: a.c3Physical,
                  C4_behavioral: a.c4Behavioral,
                  C5_narrative: a.c5Narrative,
                  C6_economic: a.c6Economic,
                  C7_ai: a.c7Ai,
                },
                algorithms: {
                  AST: a.ast ?? 0,
                  CLF: a.clf ?? 0,
                  GNE: a.gne ?? 0,
                  WSE: a.wse ?? 0,
                  RBL: a.rbl ?? 0,
                  SACE: a.sace ?? 0,
                  SCN_plus: a.scnPlus ?? 0,
                },
              }
            : null,
        });
      }
    } catch {
      onSelect({ ...p, analysis: null });
    }
    setQuery("");
    setResults([]);
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3">
        <div>
          <p className="text-white font-semibold">{selected.name}</p>
          <p className="text-xs text-zinc-500">
            {selected.position} — {selected.club}
          </p>
        </div>
        <button
          onClick={onClear}
          className="text-zinc-500 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar ${label}...`}
          className="w-full bg-zinc-800/50 border border-zinc-700/30 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
        />
      </div>
      {(results.length > 0 || searching) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {searching && (
            <p className="text-xs text-zinc-500 p-3">Buscando...</p>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPlayer(p)}
              className="w-full text-left px-3 py-2 hover:bg-zinc-700/50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-white">{p.name}</p>
                <p className="text-[10px] text-zinc-500">
                  {p.position} — {p.club}
                </p>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">
                {p.nationality}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareBar({
  label,
  valueA,
  valueB,
  max = 10,
  colorA = "bg-emerald-500",
  colorB = "bg-cyan-500",
}: {
  label: string;
  valueA: number;
  valueB: number;
  max?: number;
  colorA?: string;
  colorB?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-emerald-400 w-8 text-right">
        {valueA.toFixed(1)}
      </span>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden flex justify-end">
          <div
            className={`h-full ${colorA} rounded-full transition-all duration-700`}
            style={{ width: `${(valueA / max) * 100}%` }}
          />
        </div>
        <span className="text-[9px] text-zinc-600 w-14 text-center shrink-0">
          {label}
        </span>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorB} rounded-full transition-all duration-700`}
            style={{ width: `${(valueB / max) * 100}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-mono text-cyan-400 w-8">
        {valueB.toFixed(1)}
      </span>
    </div>
  );
}

export default function PlayerComparePage() {
  const [playerA, setPlayerA] = useState<ComparePlayer | null>(null);
  const [playerB, setPlayerB] = useState<ComparePlayer | null>(null);

  const bothSelected = playerA && playerB;
  const aAnalysis = playerA?.analysis;
  const bAnalysis = playerB?.analysis;

  return (
    <div className="animate-fade-in space-y-6">
      <Link href="/players">
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-500 hover:text-emerald-400 -ml-2 group transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </Link>

      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-emerald-500" />
        <h1 className="text-2xl font-bold gradient-text">Comparar Jogadores</h1>
      </div>

      {/* Player Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-emerald-400 mb-2 font-mono uppercase">Jogador A</p>
          <PlayerSelector
            label="Jogador A"
            selected={playerA}
            onSelect={setPlayerA}
            onClear={() => setPlayerA(null)}
          />
        </div>
        <div>
          <p className="text-xs text-cyan-400 mb-2 font-mono uppercase">Jogador B</p>
          <PlayerSelector
            label="Jogador B"
            selected={playerB}
            onSelect={setPlayerB}
            onClear={() => setPlayerB(null)}
          />
        </div>
      </div>

      {bothSelected && (
        <>
          {/* Basic Info Comparison */}
          <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-white font-bold text-lg">{playerA.name}</p>
                  <p className="text-xs text-zinc-500">{playerA.position}</p>
                  <p className="text-xs text-zinc-600">{playerA.club}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  {[
                    { label: "Idade", a: playerA.age ?? "—", b: playerB.age ?? "—" },
                    { label: "Valor", a: `€${playerA.marketValue}M`, b: `€${playerB.marketValue}M` },
                    { label: "Nac.", a: playerA.nationality, b: playerB.nationality },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2 text-[10px]">
                      <span className="text-emerald-400 font-mono w-12 text-right">{row.a}</span>
                      <span className="text-zinc-600 w-10 text-center">{row.label}</span>
                      <span className="text-cyan-400 font-mono w-12">{row.b}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{playerB.name}</p>
                  <p className="text-xs text-zinc-500">{playerB.position}</p>
                  <p className="text-xs text-zinc-600">{playerB.club}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VxRx Comparison */}
          {aAnalysis && bAnalysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Decision Cards */}
                <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      VxRx
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono text-emerald-400">
                            {aAnalysis.vx.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-zinc-600">Vx A</p>
                        </div>
                        <span className="text-zinc-700 text-xs">vs</span>
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono text-cyan-400">
                            {bAnalysis.vx.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-zinc-600">Vx B</p>
                        </div>
                      </div>
                      <Separator className="bg-zinc-800" />
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono text-red-400">
                            {aAnalysis.rx.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-zinc-600">Rx A</p>
                        </div>
                        <span className="text-zinc-700 text-xs">vs</span>
                        <div className="text-center">
                          <p className="text-2xl font-bold font-mono text-orange-400">
                            {bAnalysis.rx.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-zinc-600">Rx B</p>
                        </div>
                      </div>
                      <Separator className="bg-zinc-800" />
                      <div className="flex items-center justify-around">
                        <DecisionBadge decision={aAnalysis.decision} size="sm" />
                        <DecisionBadge decision={bAnalysis.decision} size="sm" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Neural Radar Overlay */}
                <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-500" />
                      Radar Neural Comparativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <NeuralRadar
                      layers={aAnalysis.layers}
                      playerName={playerA.name}
                      scnScore={aAnalysis.scnPlus}
                      size={340}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Algorithm Bars Comparison */}
              <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    Algoritmos — Comparacao Direta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-[10px] text-zinc-600 mb-2">
                    <span className="text-emerald-500">{playerA.name}</span>
                    <span className="text-cyan-500">{playerB.name}</span>
                  </div>
                  {[
                    { label: "AST", a: aAnalysis.algorithms.AST, b: bAnalysis.algorithms.AST },
                    { label: "CLF", a: aAnalysis.algorithms.CLF, b: bAnalysis.algorithms.CLF },
                    { label: "GNE", a: aAnalysis.algorithms.GNE, b: bAnalysis.algorithms.GNE },
                    { label: "WSE", a: aAnalysis.algorithms.WSE, b: bAnalysis.algorithms.WSE },
                    { label: "RBL", a: aAnalysis.algorithms.RBL, b: bAnalysis.algorithms.RBL },
                    { label: "SACE", a: aAnalysis.algorithms.SACE, b: bAnalysis.algorithms.SACE },
                    { label: "SCN+", a: aAnalysis.algorithms.SCN_plus, b: bAnalysis.algorithms.SCN_plus },
                  ].map((algo) => (
                    <CompareBar
                      key={algo.label}
                      label={algo.label}
                      valueA={algo.a}
                      valueB={algo.b}
                      max={100}
                    />
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Position Heatmaps Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-emerald-400 text-center">
                  {playerA.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PositionHeatmap
                  positionCluster={playerA.positionCluster}
                  positionDetail={playerA.positionDetail ?? undefined}
                />
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-cyan-400 text-center">
                  {playerB.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <PositionHeatmap
                  positionCluster={playerB.positionCluster}
                  positionDetail={playerB.positionDetail ?? undefined}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!bothSelected && (
        <Card className="bg-zinc-900/80 border-zinc-800 glass">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">
              Selecione dois jogadores para comparar seus perfis neurais
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
