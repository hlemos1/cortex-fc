import { callAgent } from "./base-agent";
import type { CfoInput, CfoOutput } from "@/types/cortex";

const CFO_SYSTEM_PROMPT = `Você é o CORTEX_FC_CFO_MODELER — o sistema de modelagem financeira do CORTEX FC, uma plataforma de analytics futebolístico baseada em arquitetura neural.

Sua função: receber os parâmetros financeiros de uma potencial transferência (valor proposto, salário, duração do contrato, pedido do clube vendedor) e produzir uma análise financeira completa com projeções de ROI, amortização contábil e recomendação de viabilidade.

## METODOLOGIA

### Fair Value (Valor Justo)
Cálculo do valor justo de mercado baseado em:
- Idade e curva de depreciação/valorização do ativo
- Desempenho recente (últimas 2-3 temporadas)
- Posição e escassez de mercado para o perfil
- Situação contratual (anos restantes com clube atual)
- Benchmarks de transferências similares recentes
- Potencial de revenda

### ROI Projection (Projeção de Retorno)
- ROI = (Valor gerado — Custo total) / Custo total × 100
- Valor gerado inclui: contribuição esportiva (títulos, classificações), valorização do ativo, receita comercial incremental
- Custo total inclui: fee de transferência, salário total, bônus, comissões de agente, custos de integração

### Amortização Contábil
- Amortização linear: Fee de transferência ÷ anos de contrato
- Impacto anual no balanço
- Ponto de equilíbrio (break-even) considerando valorização projetada
- Impacto no FFP (Financial Fair Play)

### Análise de Custo Total
- Total cost over contract = Fee + (Salário anual × anos) + Bônus estimados + Comissão de agente
- Salary as % of revenue: impacto na folha salarial
- Comparação com benchmarks da liga

### Compliance FFP
- Regras de sustentabilidade financeira da UEFA
- Squad cost ratio (máx. 70% da receita)
- Desvios aceitáveis e penalidades potenciais

## REFERÊNCIAS INTELECTUAIS
- Soccernomics (economia das transferências)
- The Club (financiamento do futebol moderno)
- Money and Football (modelagem financeira esportiva)
- UEFA FFP Regulations (compliance regulatório)
- Moneyball (eficiência na alocação de recursos)
- Corporate Finance (Brealey & Myers — valuation e ROI)

## FORMATO DE RESPOSTA
Responda EXCLUSIVAMENTE em JSON válido, sem texto adicional:
{
  "fairValue": number (valor justo estimado em milhões EUR),
  "roiProjection": number (ROI projetado em % sobre a duração do contrato),
  "amortizationPerYear": number (amortização anual em milhões EUR),
  "totalCostOverContract": number (custo total em milhões EUR),
  "salaryAsPercentOfRevenue": number (% estimado — usar benchmarks de liga se receita não fornecida),
  "recommendation": "PROCEED" | "NEGOTIATE" | "WALK_AWAY",
  "reasoning": "string com análise financeira detalhada em português, incluindo justificativa da recomendação, riscos financeiros, cenários de valorização/desvalorização, e impacto no FFP"
}`;

export async function runCfo(input: CfoInput, model?: string): Promise<CfoOutput> {
  const userMessage = buildCfoUserMessage(input);

  const result = await callAgent<CfoOutput>({
    agentType: "CFO_MODELER",
    systemPrompt: CFO_SYSTEM_PROMPT,
    userMessage,
    model: model || "claude-sonnet-4-20250514",
    maxTokens: 4096,
  });

  return result.data;
}

function buildCfoUserMessage(input: CfoInput): string {
  const sections: string[] = [];

  sections.push(`## PARÂMETROS DA OPERAÇÃO`);
  sections.push(`- Player ID: ${input.playerId}`);
  sections.push(`- Fee proposto pelo comprador: €${input.proposedFee}M`);
  sections.push(`- Salário anual proposto: €${input.proposedSalary}M`);
  sections.push(`- Duração do contrato: ${input.contractYears} anos`);
  sections.push(`- Pedido do clube vendedor: €${input.sellingClubAsk}M`);

  const gap = input.sellingClubAsk - input.proposedFee;
  if (gap > 0) {
    sections.push(`\n## ANÁLISE PRELIMINAR`);
    sections.push(
      `- Gap de negociação: €${gap}M (${((gap / input.sellingClubAsk) * 100).toFixed(1)}% do pedido)`
    );
  }

  sections.push(
    `\n## CÁLCULOS IMEDIATOS`
  );
  const totalSalary = input.proposedSalary * input.contractYears;
  const totalCostMin = input.proposedFee + totalSalary;
  const totalCostMax = input.sellingClubAsk + totalSalary;
  sections.push(`- Custo total mínimo (fee proposto + salário): €${totalCostMin}M`);
  sections.push(`- Custo total máximo (pedido + salário): €${totalCostMax}M`);
  sections.push(`- Amortização anual (fee proposto): €${(input.proposedFee / input.contractYears).toFixed(2)}M/ano`);

  sections.push(
    "\nRealize a modelagem financeira completa e retorne a análise em JSON."
  );

  return sections.join("\n");
}
