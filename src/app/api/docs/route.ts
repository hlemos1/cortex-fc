import { NextResponse } from "next/server"

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Cortex FC API",
    description:
      "Neural Football Analytics API — Analise jogadores com IA, gere relatorios e tome decisoes com dados.",
    version: "1.0.0",
    contact: { email: "api@cortexfc.com" },
  },
  servers: [
    { url: "https://cortex-fc.vercel.app", description: "Production" },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key with ctx_ prefix",
      },
    },
  },
  paths: {
    "/api/v1/players": {
      get: {
        summary: "Listar jogadores",
        description: "Retorna jogadores com filtros e paginacao",
        tags: ["Players"],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "position", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Lista de jogadores" },
          "401": { description: "Nao autorizado" },
          "429": { description: "Rate limit excedido" },
        },
      },
    },
    "/api/v1/oracle": {
      post: {
        summary: "Executar agente Oracle",
        description:
          "Analisa um jogador com IA e retorna scores VxRx + decisao",
        tags: ["Agents"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "playerId",
                  "clubContextId",
                  "playerName",
                  "position",
                ],
                properties: {
                  playerId: { type: "string", format: "uuid" },
                  clubContextId: { type: "string", format: "uuid" },
                  playerName: { type: "string" },
                  position: { type: "string" },
                  model: {
                    type: "string",
                    enum: [
                      "claude-haiku-4-5-20251001",
                      "claude-sonnet-4-20250514",
                      "claude-opus-4-20250514",
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Resultado da analise" },
          "401": { description: "Nao autorizado" },
          "403": { description: "Scope insuficiente" },
          "429": { description: "Rate limit ou quota excedido" },
        },
      },
    },
    "/api/v1/reports": {
      get: {
        summary: "Listar relatorios",
        description: "Retorna relatorios gerados pela organizacao",
        tags: ["Reports"],
        parameters: [
          {
            name: "id",
            in: "query",
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": { description: "Lista de relatorios" },
          "401": { description: "Nao autorizado" },
        },
      },
    },
    "/api/v1/keys": {
      get: {
        summary: "Listar chaves API",
        tags: ["API Keys"],
        responses: { "200": { description: "Lista de chaves" } },
      },
      post: {
        summary: "Criar chave API",
        tags: ["API Keys"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  scopes: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["read", "write", "admin"],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Chave criada (retornada apenas uma vez)" },
        },
      },
    },
    "/api/v1/webhooks": {
      get: {
        summary: "Listar webhooks",
        tags: ["Webhooks"],
        responses: { "200": { description: "Lista de webhooks" } },
      },
      post: {
        summary: "Registrar webhook",
        tags: ["Webhooks"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "events"],
                properties: {
                  url: { type: "string", format: "uri" },
                  events: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Webhook registrado" } },
      },
    },
    "/api/account": {
      get: {
        summary: "Exportar dados pessoais (LGPD)",
        description:
          "Exporta todos os dados pessoais do usuario autenticado conforme LGPD Art. 18",
        tags: ["Account"],
        responses: {
          "200": { description: "Arquivo JSON com dados pessoais" },
          "401": { description: "Nao autorizado" },
        },
      },
      delete: {
        summary: "Excluir conta (LGPD)",
        description:
          "Remove a conta e todos os dados pessoais do usuario conforme LGPD Art. 18",
        tags: ["Account"],
        responses: {
          "200": { description: "Conta excluida com sucesso" },
          "401": { description: "Nao autorizado" },
          "500": { description: "Erro interno ao excluir" },
        },
      },
    },
    "/api/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        security: [],
        responses: {
          "200": { description: "Sistema saudavel" },
          "503": { description: "Sistema degradado ou indisponivel" },
        },
      },
    },
    "/api/docs": {
      get: {
        summary: "Documentacao da API (OpenAPI)",
        tags: ["System"],
        security: [],
        responses: {
          "200": { description: "OpenAPI 3.0 spec em JSON" },
        },
      },
    },
  },
  tags: [
    { name: "Players", description: "Gerenciamento de jogadores" },
    { name: "Agents", description: "Agentes de IA (Oracle, Analista, etc)" },
    { name: "Reports", description: "Relatorios e exportacao" },
    { name: "API Keys", description: "Gerenciamento de chaves de API" },
    { name: "Webhooks", description: "Webhooks para integracoes externas" },
    { name: "Account", description: "Conta do usuario e LGPD" },
    { name: "System", description: "Status, monitoramento e documentacao" },
  ],
}

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
