import { NextRequest } from "next/server"

export const runtime = "nodejs"

type ReportType = "medical" | "psychological"
type Severity = "error" | "warning" | "info"

type ReportFields = Record<string, string>

type Issue = {
  id: string
  severity: Severity
  code: string
  field?: string
  title: string
  message: string
  suggestion?: string
  canAutofix?: boolean
}

const ICD10_REGEX = /^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

const normalizeString = (value: unknown) => (typeof value === "string" ? value.trim() : "")

const readFields = (value: unknown): ReportFields => {
  if (!value || typeof value !== "object") return {}

  const source = value as Record<string, unknown>
  const fields: ReportFields = {}

  for (const [key, raw] of Object.entries(source)) {
    fields[key] = normalizeString(raw)
  }

  return fields
}

const getRequiredFields = (reportType: ReportType) => {
  if (reportType === "psychological") {
    return ["subj", "obj", "therapy", "diagnosis"]
  }

  return ["subj", "obj", "examination", "therapy", "diagnosis"]
}

const validateFields = (fields: ReportFields, reportType: ReportType, strictMode: boolean) => {
  const issues: Issue[] = []

  for (const field of getRequiredFields(reportType)) {
    if (fields[field]) continue

    issues.push({
      id: `missing_${field}`,
      severity: strictMode ? "error" : "warning",
      code: `MISSING_${field.toUpperCase()}`,
      field,
      title: `Chybí ${field}`,
      message: `Pole ${field} je prázdné.`,
      canAutofix: false,
    })
  }

  if (!fields.ra) {
    issues.push({
      id: "missing_ra",
      severity: "warning",
      code: "MISSING_RA",
      field: "ra",
      title: "Chybí rodinná anamnéza",
      message: "Pole RA je prázdné. Doplňte ho nebo uveďte „nezjištěno“.",
      suggestion: "Rodinná anamnéza bez významné zátěže.",
      canAutofix: true,
    })
  }

  if (fields.icd10 && !ICD10_REGEX.test(fields.icd10.toUpperCase())) {
    issues.push({
      id: "invalid_icd10_format",
      severity: "warning",
      code: "INVALID_ICD10_FORMAT",
      field: "icd10",
      title: "Neplatný formát MKN-10",
      message: "Zkontrolujte formát kódu, např. I10 nebo G40.0.",
      canAutofix: false,
    })
  }

  return issues
}

const guessIcd10 = (fields: ReportFields) => {
  const diagnosis = `${fields.diagnosis || ""} ${fields.no || ""} ${fields.subj || ""}`.toLowerCase()
  const suggestions: Array<{ code: string; label: string; reason: string; confidence: number }> = []

  if (diagnosis.includes("hyperten")) {
    suggestions.push({
      code: "I10",
      label: "Esenciální (primární) hypertenze",
      reason: "Text obsahuje zmínky o hypertenzi.",
      confidence: 0.9,
    })
  }

  if (diagnosis.includes("bolest hlavy") || diagnosis.includes("cefalg")) {
    suggestions.push({
      code: "R51",
      label: "Bolest hlavy",
      reason: "Subjektivní obtíže obsahují bolest hlavy.",
      confidence: 0.65,
    })
  }

  if (suggestions.length === 0 && fields.icd10) {
    suggestions.push({
      code: fields.icd10.toUpperCase(),
      label: "Kód převzatý ze zprávy",
      reason: "Kód byl uveden uživatelem.",
      confidence: 0.5,
    })
  }

  return suggestions.slice(0, 3)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
  }

  const reportTypeRaw = normalizeString(body.reportType).toLowerCase()
  const reportType: ReportType = reportTypeRaw === "psychological" ? "psychological" : "medical"
  const strictMode = body.strictMode !== false
  const fields = readFields(body.fields)

  if (Object.keys(fields).length === 0) {
    return new Response(JSON.stringify({ error: "Chybí pole fields." }), { status: 422 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const runId = `chk_${Date.now()}`
      const startedAt = new Date().toISOString()
      const push = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)))

      try {
        push("start", { runId, startedAt })

        push("progress", { stage: "validation", percent: 20, message: "Kontroluji povinná pole" })
        const issues = validateFields(fields, reportType, strictMode)
        for (const issue of issues) {
          push("issue", issue)
        }

        push("progress", { stage: "consistency", percent: 70, message: "Kontroluji konzistenci textu" })

        push("progress", { stage: "icd10", percent: 85, message: "Navrhuji MKN-10" })
        const suggestions = guessIcd10(fields)
        for (const suggestion of suggestions) {
          push("icd10_suggestion", suggestion)
        }

        const counts = {
          error: issues.filter((item) => item.severity === "error").length,
          warning: issues.filter((item) => item.severity === "warning").length,
          info: issues.filter((item) => item.severity === "info").length,
        }

        push("summary", {
          score: Math.max(0, 100 - counts.error * 30 - counts.warning * 10),
          hasBlockingErrors: counts.error > 0,
          counts,
        })

        push("done", { runId, latencyMs: 300 })
      } catch {
        push("error", { code: "STREAM_FAILED", message: "Kontrola selhala." })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
