/**
 * Maps technical error messages to user-friendly PT-BR messages.
 */

const ERROR_MAP: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /API_FOOTBALL_KEY not configured/i,
    message: "API de futebol nao configurada. Adicione a chave nas configuracoes.",
  },
  {
    pattern: /RAPIDAPI_KEY/i,
    message: "Chave da API de futebol invalida ou ausente.",
  },
  {
    pattern: /Free plans? (do not|don't) have access/i,
    message: "Temporada indisponivel no plano gratuito. Use temporadas de 2022 a 2024.",
  },
  {
    pattern: /rate.?limit|too many requests|429/i,
    message: "Limite de requisicoes atingido. Aguarde alguns minutos e tente novamente.",
  },
  {
    pattern: /fetch failed|network|ECONNREFUSED|ENOTFOUND/i,
    message: "Sem conexao com o servidor. Verifique sua internet e tente novamente.",
  },
  {
    pattern: /timeout|ETIMEDOUT/i,
    message: "A requisicao demorou demais. Tente novamente em instantes.",
  },
  {
    pattern: /unauthorized|401|not authenticated/i,
    message: "Sessao expirada. Faca login novamente.",
  },
  {
    pattern: /forbidden|403/i,
    message: "Voce nao tem permissao para esta acao.",
  },
  {
    pattern: /not found|404/i,
    message: "Recurso nao encontrado.",
  },
  {
    pattern: /500|internal server/i,
    message: "Erro interno do servidor. Tente novamente em instantes.",
  },
  {
    pattern: /player.*not found/i,
    message: "Jogador nao encontrado na base de dados.",
  },
  {
    pattern: /already exists|duplicate/i,
    message: "Este registro ja existe na base de dados.",
  },
  {
    pattern: /invalid.*json|unexpected token/i,
    message: "Erro ao processar dados. Tente novamente.",
  },
  {
    pattern: /quota|credit|billing/i,
    message: "Limite do plano atingido. Verifique sua assinatura.",
  },
]

export function friendlyError(raw?: string | null): string {
  if (!raw) return "Ocorreu um erro inesperado. Tente novamente."

  for (const { pattern, message } of ERROR_MAP) {
    if (pattern.test(raw)) return message
  }

  // If the message is already in Portuguese and short enough, use it directly
  if (raw.length < 120 && /[a-záéíóúãõç]/i.test(raw)) {
    return raw
  }

  return "Ocorreu um erro inesperado. Tente novamente."
}
