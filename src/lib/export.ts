import type { AnalysisUI } from "@/lib/db-transforms"

// --- CSV Export ---
export function analysesToCSV(analyses: AnalysisUI[]): string {
  const headers = [
    "Jogador",
    "Posicao",
    "Nacionalidade",
    "Idade",
    "Clube",
    "Valor de Mercado",
    "Vx",
    "Rx",
    "SCN+",
    "Decisao",
    "Confianca",
    "Data da Analise",
  ]

  const rows = analyses.map((a) => [
    escapeCsvField(a.player?.name ?? ""),
    escapeCsvField(a.player?.position ?? ""),
    escapeCsvField(a.player?.nationality ?? ""),
    a.player?.age?.toString() ?? "",
    escapeCsvField(a.player?.club ?? ""),
    a.player?.marketValue?.toString() ?? "",
    a.vx?.toFixed(1) ?? "",
    a.rx?.toFixed(1) ?? "",
    a.algorithms?.SCN_plus?.toFixed(1) ?? "",
    escapeCsvField(a.decision ?? ""),
    a.confidence ? `${(a.confidence * 100).toFixed(0)}%` : "",
    a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : "",
  ])

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

// --- JSON Export ---
export function analysesToJSON(analyses: AnalysisUI[]): string {
  const exported = analyses.map((a) => ({
    player: {
      name: a.player?.name,
      position: a.player?.position,
      nationality: a.player?.nationality,
      age: a.player?.age,
      club: a.player?.club,
      marketValue: a.player?.marketValue,
    },
    scores: {
      vx: a.vx,
      rx: a.rx,
      scnPlus: a.algorithms?.SCN_plus,
      confidence: a.confidence,
    },
    vxComponents: a.vxComponents,
    rxComponents: a.rxComponents,
    neuralLayers: a.layers,
    algorithmScores: a.algorithms,
    decision: a.decision,
    reasoning: a.reasoning,
    risks: a.risks,
    recommendedActions: a.recommendedActions,
    analyzedAt: a.createdAt,
  }))

  return JSON.stringify(
    {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      count: exported.length,
      analyses: exported,
    },
    null,
    2
  )
}

// --- XLSX Export (lightweight XML-based spreadsheet) ---
export function analysesToXLSX(analyses: AnalysisUI[]): string {
  const headers = [
    "Jogador",
    "Posicao",
    "Nacionalidade",
    "Idade",
    "Clube",
    "Valor de Mercado",
    "Vx",
    "Rx",
    "SCN+",
    "Decisao",
    "Confianca %",
    "Data",
  ]

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<?mso-application progid="Excel.Sheet"?>\n'
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n'
  xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
  xml += "  <Styles>\n"
  xml +=
    '    <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#10B981" ss:Pattern="Solid"/></Style>\n'
  xml += '    <Style ss:ID="number"><NumberFormat ss:Format="0.0"/></Style>\n'
  xml += "  </Styles>\n"
  xml += '  <Worksheet ss:Name="Analises">\n'
  xml += "    <Table>\n"

  // Header row
  xml += '      <Row ss:StyleID="header">\n'
  for (const h of headers) {
    xml += `        <Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`
  }
  xml += "      </Row>\n"

  // Data rows
  for (const a of analyses) {
    xml += "      <Row>\n"
    xml += `        <Cell><Data ss:Type="String">${escapeXml(a.player?.name ?? "")}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="String">${escapeXml(a.player?.position ?? "")}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="String">${escapeXml(a.player?.nationality ?? "")}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="Number">${a.player?.age ?? 0}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="String">${escapeXml(a.player?.club ?? "")}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="Number">${a.player?.marketValue ?? 0}</Data></Cell>\n`
    xml += `        <Cell ss:StyleID="number"><Data ss:Type="Number">${a.vx ?? 0}</Data></Cell>\n`
    xml += `        <Cell ss:StyleID="number"><Data ss:Type="Number">${a.rx ?? 0}</Data></Cell>\n`
    xml += `        <Cell ss:StyleID="number"><Data ss:Type="Number">${a.algorithms?.SCN_plus ?? 0}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="String">${escapeXml(a.decision ?? "")}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="Number">${a.confidence ? Math.round(a.confidence * 100) : 0}</Data></Cell>\n`
    xml += `        <Cell><Data ss:Type="String">${a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : ""}</Data></Cell>\n`
    xml += "      </Row>\n"
  }

  xml += "    </Table>\n"
  xml += "  </Worksheet>\n"
  xml += "</Workbook>"

  return xml
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// --- Download helpers (client-side) ---
export function downloadBlob(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadCSV(
  analyses: AnalysisUI[],
  filename = "cortex-analises.csv"
) {
  downloadBlob(analysesToCSV(analyses), filename, "text/csv;charset=utf-8")
}

export function downloadJSON(
  analyses: AnalysisUI[],
  filename = "cortex-analises.json"
) {
  downloadBlob(analysesToJSON(analyses), filename, "application/json")
}

export function downloadXLSX(
  analyses: AnalysisUI[],
  filename = "cortex-analises.xml"
) {
  downloadBlob(analysesToXLSX(analyses), filename, "application/vnd.ms-excel")
}
