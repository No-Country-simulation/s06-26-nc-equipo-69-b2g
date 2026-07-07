import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Client-side PDF report generator built on jsPDF + jspdf-autotable.
 * All reports share the same branding (dark header bar, striped tables,
 * footer with page numbers and source) so they read as one system.
 *
 * jsPDF's built-in helvetica font covers Spanish accents (á, é, í, ó, ú,
 * ñ, ¿, ¡) out of the box, so no custom font is embedded here.
 */

const MARGIN = 14
const HEADER_HEIGHT = 26
const HEADER_COLOR = [44, 39, 80] // #2C2750 — var(--bit-purple-deep)
const STRIPE_COLOR = [245, 246, 244] // #F5F6F4 — table header/stripe bg used across the app
const TEXT_COLOR = [40, 40, 40]
const MUTED_COLOR = [120, 120, 120]
const SOURCE_LABEL = 'Fuente: Vísent CDRView'

const TABLE_THEME = {
  headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: 'bold', fontSize: 9 },
  alternateRowStyles: { fillColor: STRIPE_COLOR },
  styles: { fontSize: 8, cellPadding: 3, textColor: TEXT_COLOR },
  margin: { left: MARGIN, right: MARGIN },
}

function formatDateForFile(date = new Date()) {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatDateForDisplay(date = new Date()) {
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatClusterName(name = '') {
  return name
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' · ')
}

function riskLabel(nivel) {
  if (nivel === 'ALTO') return 'Alto'
  if (nivel === 'MEDIO') return 'Medio'
  if (nivel === 'BAJO') return 'Bajo'
  return '—'
}

function formatPercent(value) {
  if (value === null || value === undefined) return '—'
  return `${(value * 100).toFixed(1)}%`
}

function formatScore(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toFixed(3)
}

function formatNumber(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('es-AR')
}

/**
 * Strips common markdown syntax (headers, bold/italic, inline code,
 * bullets, leftover table pipes) into readable plain text. jsPDF has no
 * markdown renderer, so AI responses need this before being drawn as text.
 */
export function stripMarkdown(text = '') {
  if (!text) return ''
  const lines = text
    .split('\n')
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, '') // headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\*(.*?)\*/g, '$1') // italics
        .replace(/`{1,3}([^`]*)`{1,3}/g, '$1') // inline/code
        .replace(/^\s*[-*]\s+/, '• ') // bullet lists
        .replace(/^-{2,}[\s-]*$/, '') // markdown table separator rows (---|---)
        .replace(/\|/g, '  ·  ') // any leftover table pipes -> readable separator
        .trim()
    )

  return lines.filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n')
}

/**
 * Splits AI response text into plain-text and markdown-table blocks so
 * tables can be rendered as real PDF tables (autoTable) instead of flattened
 * text. Falls back to a single text block when no table is detected.
 */
export function parseMarkdownBlocks(text = '') {
  const lines = (text ?? '').split('\n')
  const blocks = []
  let i = 0

  const splitRow = (row) =>
    row
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c !== '')

  while (i < lines.length) {
    if (lines[i].trim().startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }

      if (tableLines.length >= 2) {
        blocks.push({
          type: 'table',
          header: splitRow(tableLines[0]),
          rows: tableLines.slice(2).map(splitRow),
        })
        continue
      }

      blocks.push({ type: 'text', content: tableLines.join('\n') })
      continue
    }

    const textLines = []
    while (i < lines.length && !lines[i].trim().startsWith('|')) {
      textLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'text', content: textLines.join('\n') })
  }

  return blocks
}

function drawHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFillColor(...HEADER_COLOR)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, MARGIN, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(subtitle, MARGIN, 20)

  doc.setTextColor(...TEXT_COLOR)
}

function drawFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED_COLOR)
    doc.text(SOURCE_LABEL, MARGIN, pageHeight - 10)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - MARGIN, pageHeight - 10, { align: 'right' })
  }
}

function ensureSpace(doc, cursorY, pageHeight, needed = 10) {
  if (cursorY + needed <= pageHeight - 16) return cursorY
  doc.addPage()
  return 20
}

/** Draws one plain-text block (already markdown-stripped), wrapping and paginating as needed. */
function renderTextBlock(doc, content, cursorY, contentWidth, pageHeight) {
  let y = cursorY
  const plain = stripMarkdown(content)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_COLOR)

  plain.split('\n').forEach((paragraph) => {
    if (!paragraph.trim()) {
      y += 3
      return
    }
    doc.splitTextToSize(paragraph, contentWidth).forEach((line) => {
      y = ensureSpace(doc, y, pageHeight, 6)
      doc.text(line, MARGIN, y)
      y += 5
    })
  })

  return y
}

/** Draws a mixed sequence of text/table blocks (see parseMarkdownBlocks), one after another. */
function renderBlocks(doc, blocks, cursorY, contentWidth, pageHeight) {
  let y = cursorY

  blocks.forEach((block) => {
    if (block.type === 'table' && block.rows.length > 0) {
      y = ensureSpace(doc, y, pageHeight, 20)
      autoTable(doc, {
        startY: y,
        head: [block.header],
        body: block.rows,
        ...TABLE_THEME,
      })
      y = doc.lastAutoTable.finalY + 6
    } else if (block.content?.trim()) {
      y = renderTextBlock(doc, block.content, y, contentWidth, pageHeight)
    }
  })

  return y
}

function summaryByRiskLevel(clusters) {
  return clusters.reduce(
    (acc, c) => {
      if (c.nivel_riesgo === 'ALTO') acc.ALTO += 1
      else if (c.nivel_riesgo === 'MEDIO') acc.MEDIO += 1
      else if (c.nivel_riesgo === 'BAJO') acc.BAJO += 1
      return acc
    },
    { ALTO: 0, MEDIO: 0, BAJO: 0 }
  )
}

const CLUSTER_COLUMNS = [
  { header: 'Región', dataKey: 'name' },
  { header: 'Municipio', dataKey: 'municipio' },
  { header: 'Score', dataKey: 'score' },
  { header: 'Riesgo', dataKey: 'riesgo' },
  { header: 'Usuarios', dataKey: 'usuarios' },
  { header: 'Red legado', dataKey: 'legacy' },
  { header: 'Congestión', dataKey: 'congestion' },
  { header: 'Sin cobertura', dataKey: 'cobertura' },
]

/** Maps raw /mapa/clusters properties (see mapaService.getClusters) into report table rows. */
export function clusterTableRows(clusters = []) {
  return clusters.map((c) => ({
    name: formatClusterName(c.cluster ?? ''),
    municipio: c.municipio || '—',
    score: formatScore(c.score_riesgo),
    riesgo: riskLabel(c.nivel_riesgo),
    usuarios: formatNumber(c.n_usuarios_total),
    legacy: formatPercent(c.pct_legacy_tech),
    congestion: formatPercent(c.congestion_media),
    cobertura: c.sin_cobertura ? 'Sí' : 'No',
  }))
}

function drawClusterTable(doc, clusters, startY, emptyMessage) {
  if (clusters.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED_COLOR)
    doc.text(emptyMessage, MARGIN, startY)
    return startY + 6
  }

  autoTable(doc, {
    startY,
    columns: CLUSTER_COLUMNS,
    body: clusterTableRows(clusters),
    ...TABLE_THEME,
  })
  return doc.lastAutoTable.finalY
}

/**
 * General territorial report: summary counts by risk level plus a full
 * table of every cluster returned by mapaService.getClusters().
 */
export function exportTerritorialReport(clusters = []) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const counts = summaryByRiskLevel(clusters)

  drawHeader(doc, 'Reporte territorial — BiT', `Generado el ${formatDateForDisplay()}`)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_COLOR)
  doc.text('Resumen por nivel de riesgo', MARGIN, 36)

  autoTable(doc, {
    startY: 40,
    head: [['Nivel de riesgo', 'Cantidad de zonas']],
    body: [
      ['Alto', String(counts.ALTO)],
      ['Medio', String(counts.MEDIO)],
      ['Bajo', String(counts.BAJO)],
      ['Total', String(clusters.length)],
    ],
    ...TABLE_THEME,
  })

  const afterSummaryY = doc.lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Detalle de zonas (${clusters.length})`, MARGIN, afterSummaryY)

  drawClusterTable(doc, clusters, afterSummaryY + 4, 'No hay zonas para mostrar.')

  drawFooter(doc)
  doc.save(`reporte-territorial-${formatDateForFile()}.pdf`)
}

/**
 * Comparison report for a filtered/selected subset of clusters, with an
 * optional "Análisis IA" section rendering the AI response text (markdown
 * tables become real PDF tables, everything else is stripped to plain text).
 */
export function exportComparisonReport({ clusters = [], aiResponse = null } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2
  const count = clusters.length

  drawHeader(
    doc,
    'Reporte de comparativa — BiT',
    `Generado el ${formatDateForDisplay()} · ${count} ${count === 1 ? 'zona' : 'zonas'}`
  )

  let cursorY = drawClusterTable(doc, clusters, 32, 'No hay zonas seleccionadas.')

  const responseText = typeof aiResponse === 'string' ? aiResponse : aiResponse?.respuesta_ia

  if (responseText?.trim()) {
    cursorY = ensureSpace(doc, cursorY + 10, pageHeight, 16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...TEXT_COLOR)
    doc.text('Análisis IA', MARGIN, cursorY)
    cursorY += 6

    renderBlocks(doc, parseMarkdownBlocks(responseText), cursorY, contentWidth, pageHeight)
  }

  drawFooter(doc)
  doc.save(`reporte-comparativa-${formatDateForFile()}.pdf`)
}

/**
 * Single Q&A report for one AI chat exchange: the user's question, the
 * assistant's answer, and (when present) the zones and sources it cited.
 */
export function exportChatResponse({ question = '', answer = '', clusters = [], fuentes = [] } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2

  drawHeader(doc, 'Consulta BiT', `Generado el ${formatDateForDisplay()}`)

  let cursorY = 34

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_COLOR)
  doc.text('Consulta', MARGIN, cursorY)
  cursorY += 6
  cursorY = renderTextBlock(doc, question || '—', cursorY, contentWidth, pageHeight)

  cursorY = ensureSpace(doc, cursorY + 6, pageHeight, 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_COLOR)
  doc.text('Respuesta', MARGIN, cursorY)
  cursorY += 6
  cursorY = renderBlocks(doc, parseMarkdownBlocks(answer || '—'), cursorY, contentWidth, pageHeight)

  if (clusters.length > 0) {
    cursorY = ensureSpace(doc, cursorY + 6, pageHeight, 16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_COLOR)
    doc.text('Zonas destacadas', MARGIN, cursorY)
    cursorY += 6
    cursorY = renderTextBlock(doc, clusters.map(formatClusterName).join(', '), cursorY, contentWidth, pageHeight)
  }

  if (fuentes.length > 0) {
    cursorY = ensureSpace(doc, cursorY + 6, pageHeight, 16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...TEXT_COLOR)
    doc.text('Fuentes', MARGIN, cursorY)
    cursorY += 6
    renderTextBlock(doc, fuentes.map((f) => `• ${f}`).join('\n'), cursorY, contentWidth, pageHeight)
  }

  drawFooter(doc)
  doc.save(`consulta-bit-${formatDateForFile()}.pdf`)
}
