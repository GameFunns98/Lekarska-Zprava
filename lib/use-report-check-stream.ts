import { useRef, useState } from "react"

export type CheckSeverity = "error" | "warning" | "info"

export type CheckIssue = {
  id: string
  severity: CheckSeverity
  code: string
  field?: string
  title: string
  message: string
  suggestion?: string
  canAutofix?: boolean
}

export type Icd10Suggestion = {
  code: string
  label: string
  reason: string
  confidence: number
}

type CheckSummary = {
  score: number
  hasBlockingErrors: boolean
  counts: Record<CheckSeverity, number>
}

type Progress = {
  stage?: string
  percent: number
  message?: string
}

export function useReportCheckStream() {
  const [issues, setIssues] = useState<CheckIssue[]>([])
  const [icd10Suggestions, setIcd10Suggestions] = useState<Icd10Suggestion[]>([])
  const [progress, setProgress] = useState<Progress>({ percent: 0 })
  const [summary, setSummary] = useState<CheckSummary | null>(null)
  const [running, setRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const start = async (payload: unknown) => {
    setIssues([])
    setIcd10Suggestions([])
    setSummary(null)
    setProgress({ percent: 0 })
    setErrorMessage(null)
    setRunning(true)

    const abortController = new AbortController()
    abortRef.current = abortController

    const response = await fetch("/api/report-check/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    })

    if (!response.ok || !response.body) {
      setRunning(false)
      throw new Error("Stream request failed")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split("\n\n")
      buffer = chunks.pop() || ""

      for (const chunk of chunks) {
        const lines = chunk.split("\n")
        const eventLine = lines.find((line) => line.startsWith("event:"))
        const dataLine = lines.find((line) => line.startsWith("data:"))

        if (!eventLine || !dataLine) continue

        const event = eventLine.replace("event:", "").trim()
        const dataRaw = dataLine.replace("data:", "").trim()

        let data: any
        try {
          data = JSON.parse(dataRaw)
        } catch {
          continue
        }

        if (event === "progress") {
          setProgress({
            percent: Number(data.percent) || 0,
            stage: data.stage,
            message: data.message,
          })
        }

        if (event === "issue") {
          setIssues((previous) => [...previous, data as CheckIssue])
        }

        if (event === "icd10_suggestion") {
          setIcd10Suggestions((previous) => [...previous, data as Icd10Suggestion])
        }

        if (event === "summary") {
          setSummary(data as CheckSummary)
        }

        if (event === "error") {
          setErrorMessage(data?.message || "Kontrola selhala.")
          setRunning(false)
        }

        if (event === "done") {
          setRunning(false)
          setProgress((previous) => ({ ...previous, percent: 100 }))
        }
      }
    }

    setRunning(false)
  }

  const cancel = () => {
    abortRef.current?.abort()
    setRunning(false)
    setErrorMessage("Kontrola byla přerušena uživatelem.")
  }

  return {
    issues,
    icd10Suggestions,
    progress,
    summary,
    running,
    errorMessage,
    start,
    cancel,
  }
}
