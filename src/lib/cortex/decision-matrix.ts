import type { CortexDecision } from "@/types/cortex";

/**
 * CORTEX FC Decision Matrix
 *
 * The ORACLE decision engine that maps Vx × Rx to a clear action.
 *
 *              Rx < 0.8       Rx 0.8-1.5      Rx > 1.5
 *            (low risk)    (moderate risk)   (high risk)
 * ──────────────────────────────────────────────────────
 * Vx > 1.5    CONTRATAR      CONTRATAR       ALERTA_CINZA
 * (high val)
 *
 * Vx 1.0-1.5  MONITORAR      MONITORAR       RECUSAR
 * (fair val)
 *
 * Vx < 1.0    EMPRESTIMO     RECUSAR         RECUSAR
 * (low val)
 *
 * Special case: If player is already in squad → BLINDAR logic
 */

export interface DecisionInput {
  vx: number;
  rx: number;
  isCurrentSquadPlayer: boolean;
  confidence: number;
}

export interface DecisionOutput {
  decision: CortexDecision;
  reasoning: string;
  actionPriority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  suggestedDeadline: string; // e.g. "Immediate", "This window", "Next window"
}

export function resolveDecision(input: DecisionInput): DecisionOutput {
  const { vx, rx, isCurrentSquadPlayer, confidence } = input;

  // BLINDAR: protect existing assets
  if (isCurrentSquadPlayer) {
    if (vx > 1.5) {
      return {
        decision: "BLINDAR",
        reasoning: `Jogador do elenco com Vx ${vx} (alto valor). Prioridade: renovar/blindar contrato antes que o mercado perceba o mesmo valor.`,
        actionPriority: "URGENT",
        suggestedDeadline: "Immediate",
      };
    }
    if (vx > 1.0) {
      return {
        decision: "MONITORAR",
        reasoning: `Jogador do elenco com Vx ${vx} (valor justo). Manter, mas monitorar evolução e alternativas.`,
        actionPriority: "MEDIUM",
        suggestedDeadline: "This window",
      };
    }
    return {
      decision: "EMPRESTIMO",
      reasoning: `Jogador do elenco com Vx ${vx} (abaixo do ideal). Considerar empréstimo para desenvolvimento ou liberar espaço salarial.`,
      actionPriority: "LOW",
      suggestedDeadline: "Next window",
    };
  }

  // External targets: Vx × Rx matrix
  if (vx > 1.5) {
    if (rx < 0.8) {
      return {
        decision: "CONTRATAR",
        reasoning: `Vx ${vx} (alto valor) + Rx ${rx} (baixo risco). Combinação ideal. Mover rápido — janela de oportunidade.`,
        actionPriority: "URGENT",
        suggestedDeadline: "Immediate",
      };
    }
    if (rx <= 1.5) {
      return {
        decision: "CONTRATAR",
        reasoning: `Vx ${vx} (alto valor) + Rx ${rx} (risco moderado). Valor compensa o risco. Negociar, mas não ultrapassar teto.`,
        actionPriority: "HIGH",
        suggestedDeadline: "This window",
      };
    }
    // rx > 1.5
    return {
      decision: "ALERTA_CINZA",
      reasoning: `Vx ${vx} (alto valor) mas Rx ${rx} (alto risco). Sinais mistos. Valor existe mas fatores de risco exigem investigação profunda antes de agir.`,
      actionPriority: "HIGH",
      suggestedDeadline: "This window",
    };
  }

  if (vx >= 1.0) {
    if (rx > 1.5) {
      return {
        decision: "RECUSAR",
        reasoning: `Vx ${vx} (valor justo) mas Rx ${rx} (alto risco). O risco não justifica um valor apenas adequado. Procurar alternativas mais seguras.`,
        actionPriority: "LOW",
        suggestedDeadline: "Next window",
      };
    }
    return {
      decision: "MONITORAR",
      reasoning: `Vx ${vx} (valor justo) + Rx ${rx} (risco aceitável). Não é urgente, mas vale acompanhar evolução. Pode se tornar CONTRATAR se preço cair ou performance subir.`,
      actionPriority: "MEDIUM",
      suggestedDeadline: "Next window",
    };
  }

  // vx < 1.0
  if (rx < 0.8) {
    return {
      decision: "EMPRESTIMO",
      reasoning: `Vx ${vx} (valor baixo para compra) mas Rx ${rx} (baixo risco). Considerar empréstimo como opção de baixo custo para cobrir necessidade temporária.`,
      actionPriority: "LOW",
      suggestedDeadline: "This window",
    };
  }

  return {
    decision: "RECUSAR",
    reasoning: `Vx ${vx} (valor insuficiente) + Rx ${rx} (risco elevado). Não há cenário favorável. Alocar recursos em outro alvo.`,
    actionPriority: "LOW",
    suggestedDeadline: "N/A",
  };
}

/**
 * Confidence adjustment
 * Low confidence reduces the strength of the decision
 */
export function adjustForConfidence(
  decision: DecisionOutput,
  confidence: number
): DecisionOutput {
  if (confidence >= 75) return decision;

  if (confidence >= 50) {
    return {
      ...decision,
      reasoning: `[Confiança ${confidence}%] ${decision.reasoning} — Dados insuficientes para certeza. Recomenda-se aprofundar análise.`,
      actionPriority:
        decision.actionPriority === "URGENT"
          ? "HIGH"
          : decision.actionPriority === "HIGH"
            ? "MEDIUM"
            : decision.actionPriority,
    };
  }

  // confidence < 50
  return {
    ...decision,
    decision: "MONITORAR",
    reasoning: `[Confiança ${confidence}%] Dados insuficientes para decisão segura. Resultado preliminar: ${decision.decision}. Necessário mais dados antes de agir.`,
    actionPriority: "LOW",
    suggestedDeadline: "Pending more data",
  };
}
