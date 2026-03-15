/**
 * Squad Synergy Index — Algoritmo proprietario CORTEX FC.
 *
 * Calcula como um novo jogador encaixa no elenco existente,
 * considerando posicao, perfil tatico e complementaridade.
 */

interface PlayerProfile {
  name: string;
  position: string;
  scnPlus: number;
  age: number;
  vx: number;
  rx: number;
}

interface SynergyResult {
  overallFit: number;        // 0-100
  positionNeed: number;      // 0-100 (how much the position is needed)
  ageBalance: number;        // 0-100 (age diversity contribution)
  qualityDelta: number;      // delta vs current position average SCN+
  complementarity: number;   // 0-100 (how well vx/rx complements squad)
  reasoning: string[];
}

const IDEAL_AGE_DISTRIBUTION = {
  young: { min: 18, max: 23, idealPct: 0.3 },   // 30% developing
  prime: { min: 24, max: 29, idealPct: 0.5 },    // 50% peak
  senior: { min: 30, max: 38, idealPct: 0.2 },   // 20% experience
};

/**
 * Calculate synergy index for adding a new player to the squad.
 */
export function calculateSynergyIndex(
  newPlayer: PlayerProfile,
  squad: PlayerProfile[]
): SynergyResult {
  const reasoning: string[] = [];

  // 1. Position need (how thin is the squad at this position)
  const samePosition = squad.filter((p) => p.position === newPlayer.position);
  const positionCount = samePosition.length;
  let positionNeed: number;

  if (positionCount === 0) {
    positionNeed = 95;
    reasoning.push(`Posicao ${newPlayer.position} sem cobertura no elenco — necessidade critica`);
  } else if (positionCount === 1) {
    positionNeed = 80;
    reasoning.push(`Apenas 1 jogador na posicao ${newPlayer.position} — reforco importante`);
  } else if (positionCount === 2) {
    positionNeed = 50;
    reasoning.push(`2 jogadores na posicao ${newPlayer.position} — reforco moderado`);
  } else {
    positionNeed = Math.max(10, 40 - (positionCount - 2) * 15);
    reasoning.push(`${positionCount} jogadores na posicao ${newPlayer.position} — necessidade baixa`);
  }

  // 2. Quality delta vs position average
  const avgScnPosition = samePosition.length > 0
    ? samePosition.reduce((s, p) => s + p.scnPlus, 0) / samePosition.length
    : 50;
  const qualityDelta = newPlayer.scnPlus - avgScnPosition;

  if (qualityDelta > 10) {
    reasoning.push(`SCN+ ${newPlayer.scnPlus.toFixed(1)} e significativamente acima da media da posicao (${avgScnPosition.toFixed(1)})`);
  } else if (qualityDelta > 0) {
    reasoning.push(`SCN+ ${newPlayer.scnPlus.toFixed(1)} acima da media da posicao (${avgScnPosition.toFixed(1)})`);
  } else {
    reasoning.push(`SCN+ ${newPlayer.scnPlus.toFixed(1)} abaixo da media da posicao (${avgScnPosition.toFixed(1)})`);
  }

  // 3. Age balance
  const ages = [...squad.map((p) => p.age), newPlayer.age];
  const youngCount = ages.filter((a) => a >= 18 && a <= 23).length;
  const primeCount = ages.filter((a) => a >= 24 && a <= 29).length;
  const seniorCount = ages.filter((a) => a >= 30).length;
  const total = ages.length;

  const youngDev = Math.abs(youngCount / total - IDEAL_AGE_DISTRIBUTION.young.idealPct);
  const primeDev = Math.abs(primeCount / total - IDEAL_AGE_DISTRIBUTION.prime.idealPct);
  const seniorDev = Math.abs(seniorCount / total - IDEAL_AGE_DISTRIBUTION.senior.idealPct);
  const ageBalance = Math.max(0, 100 - (youngDev + primeDev + seniorDev) * 200);

  const ageCategory = newPlayer.age <= 23 ? "jovem" : newPlayer.age <= 29 ? "pico" : "experiente";
  reasoning.push(`Jogador ${ageCategory} (${newPlayer.age} anos) — balanco etario do elenco: ${ageBalance.toFixed(0)}/100`);

  // 4. Complementarity (Vx/Rx profile vs squad)
  const avgVx = squad.length > 0 ? squad.reduce((s, p) => s + p.vx, 0) / squad.length : 50;
  const avgRx = squad.length > 0 ? squad.reduce((s, p) => s + p.rx, 0) / squad.length : 50;

  // A squad benefits from diverse profiles. If squad is high-Vx, a high-Rx player adds balance.
  const vxDiversity = Math.abs(newPlayer.vx - avgVx);
  const rxDiversity = Math.abs(newPlayer.rx - avgRx);
  const complementarity = Math.min(100, 50 + (vxDiversity + rxDiversity) * 2);

  if (complementarity > 70) {
    reasoning.push(`Perfil Vx/Rx complementar ao elenco — diversifica capacidades`);
  } else {
    reasoning.push(`Perfil Vx/Rx similar ao elenco — baixa diversificacao`);
  }

  // Overall fit = weighted average
  const overallFit = Math.min(100, Math.max(0,
    positionNeed * 0.35 +
    Math.min(100, 50 + qualityDelta * 2) * 0.30 +
    ageBalance * 0.15 +
    complementarity * 0.20
  ));

  return {
    overallFit: Math.round(overallFit * 10) / 10,
    positionNeed: Math.round(positionNeed),
    ageBalance: Math.round(ageBalance),
    qualityDelta: Math.round(qualityDelta * 10) / 10,
    complementarity: Math.round(complementarity),
    reasoning,
  };
}
