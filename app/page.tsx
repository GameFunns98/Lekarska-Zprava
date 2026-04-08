"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { REPORT_TYPES, REPORT_TYPES_BY_ID, type ReportData, type ReportFieldKey, type ReportTypeId } from "@/lib/report-types"
import { useReportCheckStream } from "@/lib/use-report-check-stream"
import { Check, Copy, Download, FileText, Save, Sparkles, Trash2, Upload, Wifi, WifiOff } from "lucide-react"

type ImportedFields = Partial<ReportData & { reportTypeId: ReportTypeId }>
type DraftPayload = Partial<ReportData & { reportTypeId: ReportTypeId; savedAt: string }>
type ParsedImportResult = { fields: ImportedFields; detectedTypeName: string }

const DEFAULT_FORM_VALUES: ReportData & { reportTypeId: ReportTypeId; aiPrompt: string } = {
  reportTypeId: REPORT_TYPES[0].id as ReportTypeId,
  caseNumber: "001",
  doctorName: "MUDr. Fero Lakatos",
  patientFirstName: "",
  patientLastName: "",
  patientBirthDate: "",
  patientInsurance: "",
  oa: "",
  ra: "",
  pa: "",
  sa: "",
  fa: "",
  aa: "",
  ea: "",
  no: "",
  vf: "",
  subj: "",
  obj: "",
  examination: "",
  therapy: "",
  diagnosis: "",
  icd10: "",
  aiPrompt: "",
}

const LOCAL_STORAGE_KEY_PREFIX = "reportDraft"
const getDraftStorageKey = (type: ReportTypeId) => `${LOCAL_STORAGE_KEY_PREFIX}:${type}`
const getDefaultValuesForType = (type: ReportTypeId) => ({ ...DEFAULT_FORM_VALUES, reportTypeId: type })

export default function MedicalReportApp() {
  const providerLabel: Record<"github" | "claude" | "openai" | "deepseek", string> = {
    github: "GitHub",
    openai: "OpenAI",
    claude: "Claude",
    deepseek: "DeepSeek",
  }

  const [isOnline, setIsOnline] = useState(true)
  const [autoSaved, setAutoSaved] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [reportTypeId, setReportTypeId] = useState<ReportTypeId>(DEFAULT_FORM_VALUES.reportTypeId)
  const [caseNumber, setCaseNumber] = useState(DEFAULT_FORM_VALUES.caseNumber)
  const [doctorName, setDoctorName] = useState(DEFAULT_FORM_VALUES.doctorName)
  const [patientFirstName, setPatientFirstName] = useState("")
  const [patientLastName, setPatientLastName] = useState("")
  const [patientBirthDate, setPatientBirthDate] = useState("")
  const [patientInsurance, setPatientInsurance] = useState("")
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiProvider, setAiProvider] = useState<"github" | "claude" | "openai" | "deepseek">("deepseek")

  const [oa, setOa] = useState("")
  const [ra, setRa] = useState("")
  const [pa, setPa] = useState("")
  const [sa, setSa] = useState("")
  const [fa, setFa] = useState("")
  const [aa, setAa] = useState("")
  const [ea, setEa] = useState("")
  const [no, setNo] = useState("")

  const [vf, setVf] = useState("")
  const [subj, setSubj] = useState("")
  const [obj, setObj] = useState("")

  const [examination, setExamination] = useState("")
  const [therapy, setTherapy] = useState("")

  const [diagnosis, setDiagnosis] = useState("")
  const [icd10, setIcd10] = useState("")

  const [aiPrompt, setAiPrompt] = useState("")
  const skipNextTypeDraftLoadRef = useRef(false)
  const {
    issues: reportCheckIssues,
    icd10Suggestions,
    progress: reportCheckProgress,
    summary: reportCheckSummary,
    running: isCheckingReport,
    errorMessage: reportCheckError,
    start: startReportCheck,
    cancel: cancelReportCheck,
  } = useReportCheckStream()

  const activeReportType = REPORT_TYPES_BY_ID[reportTypeId]

  const applyImportedFields = (fields: ImportedFields) => {
    if (fields.reportTypeId) {
      skipNextTypeDraftLoadRef.current = true
      setReportTypeId(fields.reportTypeId)
    }
    if (fields.caseNumber) setCaseNumber(fields.caseNumber)
    if (fields.doctorName) setDoctorName(fields.doctorName)
    if (fields.patientFirstName) setPatientFirstName(fields.patientFirstName)
    if (fields.patientLastName) setPatientLastName(fields.patientLastName)
    if (fields.patientBirthDate) setPatientBirthDate(fields.patientBirthDate)
    if (fields.patientInsurance) setPatientInsurance(fields.patientInsurance)
    if (fields.oa) setOa(fields.oa)
    if (fields.ra) setRa(fields.ra)
    if (fields.pa) setPa(fields.pa)
    if (fields.sa) setSa(fields.sa)
    if (fields.fa) setFa(fields.fa)
    if (fields.aa) setAa(fields.aa)
    if (fields.ea) setEa(fields.ea)
    if (fields.no) setNo(fields.no)
    if (fields.vf) setVf(fields.vf)
    if (fields.subj) setSubj(fields.subj)
    if (fields.obj) setObj(fields.obj)
    if (fields.examination) setExamination(fields.examination)
    if (fields.therapy) setTherapy(fields.therapy)
    if (fields.diagnosis) setDiagnosis(fields.diagnosis)
    if (fields.icd10) setIcd10(fields.icd10)
  }

  const applyFormValues = (values: DraftPayload) => {
    setCaseNumber(values.caseNumber || DEFAULT_FORM_VALUES.caseNumber)
    setDoctorName(values.doctorName || DEFAULT_FORM_VALUES.doctorName)
    setPatientFirstName(values.patientFirstName || "")
    setPatientLastName(values.patientLastName || "")
    setPatientBirthDate(values.patientBirthDate || "")
    setPatientInsurance(values.patientInsurance || "")
    setOa(values.oa || "")
    setRa(values.ra || "")
    setPa(values.pa || "")
    setSa(values.sa || "")
    setFa(values.fa || "")
    setAa(values.aa || "")
    setEa(values.ea || "")
    setNo(values.no || "")
    setVf(values.vf || "")
    setSubj(values.subj || "")
    setObj(values.obj || "")
    setExamination(values.examination || "")
    setTherapy(values.therapy || "")
    setDiagnosis(values.diagnosis || "")
    setIcd10(values.icd10 || "")
  }

  const resetAllFields = (type: ReportTypeId = reportTypeId) => {
    const defaults = getDefaultValuesForType(type)
    setReportTypeId(defaults.reportTypeId)
    applyFormValues(defaults)
    setAiPrompt(defaults.aiPrompt)
    setCopied(false)
    setImportStatus(null)
    localStorage.removeItem(getDraftStorageKey(type))
  }

  const loadDraftForType = (type: ReportTypeId) => {
    const savedData = localStorage.getItem(getDraftStorageKey(type))
    if (!savedData) {
      applyFormValues(getDefaultValuesForType(type))
      return
    }

    try {
      const parsed = JSON.parse(savedData) as DraftPayload
      applyFormValues(parsed)
    } catch (error) {
      console.error("[v0] Error loading saved data:", error)
      applyFormValues(getDefaultValuesForType(type))
    }
  }

  const parseImportedReport = (rawText: string, selectedReportTypeId?: ReportTypeId): ParsedImportResult => {
    const text = rawText.replace(/\r\n/g, "\n")
    const lines = text.split("\n")
    const trimmedLines = lines.map((line) => line.trim())
    const parsed: ImportedFields = {}

    const firstContentLine = trimmedLines.find((line) => line.length > 0)
    if (firstContentLine) {
      const match = firstContentLine.match(/^([A-Z]+)_\d{6}\/(\d+)$/)
      if (match) {
        const found = REPORT_TYPES.find((type) => type.documentPrefix === match[1])
        if (found) parsed.reportTypeId = found.id as ReportTypeId
        parsed.caseNumber = match[2]
      }
    }

    const resolvedTypeId = parsed.reportTypeId || selectedReportTypeId || DEFAULT_FORM_VALUES.reportTypeId
    const rules = REPORT_TYPES_BY_ID[resolvedTypeId].importRules
    const allKnownHeaders = new Set([...rules.sectionHeaders, ...rules.blockMappings.map((b) => b.startHeader), ...rules.blockMappings.flatMap((b) => b.endHeaders), rules.doctorHeader])

    const readLineValue = (prefix: string): string => {
      const line = trimmedLines.find((candidate) => candidate.startsWith(prefix))
      return line ? line.slice(prefix.length).trim() : ""
    }

    const readBlock = (startHeader: string, endHeaders: string[]) => {
      const startIndex = trimmedLines.findIndex((line) => line === startHeader)
      if (startIndex === -1) return ""

      let endIndex = trimmedLines.length
      for (const header of [...endHeaders, ...Array.from(allKnownHeaders)]) {
        const candidateEnd = trimmedLines.findIndex((line, index) => index > startIndex && line === header)
        if (candidateEnd !== -1 && candidateEnd < endIndex) {
          endIndex = candidateEnd
        }
      }

      return lines.slice(startIndex + 1, endIndex).join("\n").trim()
    }

    for (const [prefix, key] of Object.entries(rules.lineMappings)) {
      const value = readLineValue(prefix)
      if (!value) continue

      if (key === "patientFullName") {
        const [firstName, ...lastNameParts] = value.split(/\s+/)
        if (firstName) parsed.patientFirstName = firstName
        if (lastNameParts.length > 0) parsed.patientLastName = lastNameParts.join(" ")
      } else {
        parsed[key] = value
      }
    }

    for (const block of rules.blockMappings) {
      const value = readBlock(block.startHeader, block.endHeaders)
      if (value) parsed[block.key] = value
    }

    const doctorBlock = readBlock(rules.doctorHeader, [])
    if (doctorBlock) {
      const [firstDoctorLine] = doctorBlock.split("\n").map((line) => line.trim()).filter(Boolean)
      if (firstDoctorLine) parsed.doctorName = firstDoctorLine
    }

    parsed.reportTypeId = resolvedTypeId
    return { fields: parsed, detectedTypeName: REPORT_TYPES_BY_ID[resolvedTypeId].label }
  }

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    updateOnlineStatus()
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    loadDraftForType(DEFAULT_FORM_VALUES.reportTypeId)
  }, [])

  useEffect(() => {
    if (skipNextTypeDraftLoadRef.current) {
      skipNextTypeDraftLoadRef.current = false
      return
    }
    loadDraftForType(reportTypeId)
  }, [reportTypeId])

  useEffect(() => {
    const dataToSave: DraftPayload = {
      reportTypeId,
      caseNumber,
      doctorName,
      patientFirstName,
      patientLastName,
      patientBirthDate,
      patientInsurance,
      oa,
      ra,
      pa,
      sa,
      fa,
      aa,
      ea,
      no,
      vf,
      subj,
      obj,
      examination,
      therapy,
      diagnosis,
      icd10,
    }

    localStorage.setItem(getDraftStorageKey(reportTypeId), JSON.stringify(dataToSave))
    setAutoSaved(true)
    const timer = setTimeout(() => setAutoSaved(false), 1000)
    return () => clearTimeout(timer)
  }, [reportTypeId, caseNumber, doctorName, patientFirstName, patientLastName, patientBirthDate, patientInsurance, oa, ra, pa, sa, fa, aa, ea, no, vf, subj, obj, examination, therapy, diagnosis, icd10])

  const handleManualSave = () => {
    const dataToSave: DraftPayload = {
      reportTypeId,
      caseNumber,
      doctorName,
      patientFirstName,
      patientLastName,
      patientBirthDate,
      patientInsurance,
      oa,
      ra,
      pa,
      sa,
      fa,
      aa,
      ea,
      no,
      vf,
      subj,
      obj,
      examination,
      therapy,
      diagnosis,
      icd10,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(getDraftStorageKey(reportTypeId), JSON.stringify(dataToSave))
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2000)
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setImportStatus({ type: "error", message: "Vyberte soubor ve formátu .txt." })
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const rawText = typeof reader.result === "string" ? reader.result : ""
        const { fields, detectedTypeName } = parseImportedReport(rawText, reportTypeId)
        const parsedKeys = Object.keys(fields)

        if (parsedKeys.length === 0) {
          setImportStatus({ type: "error", message: "Soubor neobsahuje rozpoznaný formát exportu. Zkontrolujte prosím strukturu TXT." })
          return
        }

        applyImportedFields(fields)
        setImportStatus({ type: "success", message: `Import dokončen (${detectedTypeName}). Načteno ${parsedKeys.length} polí.` })
      } catch (error) {
        console.error("[Import] Error:", error)
        setImportStatus({ type: "error", message: "Import selhal. Soubor se nepodařilo zpracovat." })
      } finally {
        event.target.value = ""
      }
    }

    reader.onerror = () => {
      setImportStatus({ type: "error", message: "Soubor se nepodařilo přečíst." })
      event.target.value = ""
    }

    reader.readAsText(file)
  }

  const generateDocumentName = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, "0")
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const year = String(today.getFullYear()).slice(-2)
    const caseStr = String(caseNumber).padStart(3, "0")
    return `${activeReportType.documentPrefix}_${day}${month}${year}/${caseStr}`
  }

  const generateReport = () => {
    const reportData: ReportData = {
      caseNumber,
      doctorName,
      patientFirstName,
      patientLastName,
      patientBirthDate,
      patientInsurance,
      oa,
      ra,
      pa,
      sa,
      fa,
      aa,
      ea,
      no,
      vf,
      subj,
      obj,
      examination,
      therapy,
      diagnosis,
      icd10,
    }
    return activeReportType.buildPreviewExport(generateDocumentName(), reportData)
  }

  const getReportFieldsPayload = () => ({
    caseNumber,
    doctorName,
    patientFirstName,
    patientLastName,
    patientBirthDate,
    patientInsurance,
    oa,
    ra,
    pa,
    sa,
    fa,
    aa,
    ea,
    no,
    vf,
    subj,
    obj,
    examination,
    therapy,
    diagnosis,
    icd10,
  })

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return
    if (!isOnline) {
      alert("AI asistent vyžaduje připojení k internetu. V offline režimu můžete formulář vyplnit ručně.")
      return
    }

    setIsGenerating(true)
    try {
      const patientContext = [
        patientFirstName || patientLastName ? `Jméno a příjmení: ${[patientFirstName, patientLastName].filter(Boolean).join(" ")}` : "",
        patientBirthDate ? `Datum narození: ${patientBirthDate}` : "",
        patientInsurance ? `Pojišťovna: ${patientInsurance}` : "",
      ].filter(Boolean).join("\n")

      const composedPrompt = patientContext ? `${patientContext}\n\nPopis případu:\n${aiPrompt}` : aiPrompt
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: composedPrompt, provider: aiProvider, documentType: reportTypeId }),
      })

      const data = await response.json().catch(() => ({} as any))
      if (!response.ok) {
        const extra = [data?.type, data?.code].filter(Boolean).join(" / ")
        throw new Error(`${data?.error || "Chyba při volání AI."}${extra ? ` (${extra})` : ""}`)
      }

      const parsed = data?.fields || {}
      if (parsed.patientFirstName) setPatientFirstName(parsed.patientFirstName)
      if (parsed.patientLastName) setPatientLastName(parsed.patientLastName)
      if (parsed.patientBirthDate) setPatientBirthDate(parsed.patientBirthDate)
      if (parsed.patientInsurance) setPatientInsurance(parsed.patientInsurance)
      if (parsed.oa) setOa(parsed.oa)
      if (parsed.ra) setRa(parsed.ra)
      if (parsed.pa) setPa(parsed.pa)
      if (parsed.sa) setSa(parsed.sa)
      if (parsed.fa) setFa(parsed.fa)
      if (parsed.aa) setAa(parsed.aa)
      if (parsed.ea) setEa(parsed.ea)
      if (parsed.no) setNo(parsed.no)
      if (parsed.vf) setVf(parsed.vf)
      if (parsed.subj) setSubj(parsed.subj)
      if (parsed.obj) setObj(parsed.obj)
      if (parsed.examination) setExamination(parsed.examination)
      if (parsed.therapy) setTherapy(parsed.therapy)
      if (parsed.diagnosis) setDiagnosis(parsed.diagnosis)
      if (parsed.icd10) setIcd10(parsed.icd10)
    } catch (error) {
      console.error("[AI] Error:", error)
      alert(`Chyba AI asistenta: ${(error as Error).message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const getFieldValue = (key: ReportFieldKey): string => ({
    patientFirstName,
    patientLastName,
    patientBirthDate,
    patientInsurance,
    oa,
    ra,
    pa,
    sa,
    fa,
    aa,
    ea,
    no,
    vf,
    subj,
    obj,
    examination,
    therapy,
    diagnosis,
    icd10,
  })[key]

  const setFieldValue = (key: ReportFieldKey, value: string) => {
    const setters: Record<ReportFieldKey, (next: string) => void> = {
      patientFirstName: setPatientFirstName,
      patientLastName: setPatientLastName,
      patientBirthDate: setPatientBirthDate,
      patientInsurance: setPatientInsurance,
      oa: setOa,
      ra: setRa,
      pa: setPa,
      sa: setSa,
      fa: setFa,
      aa: setAa,
      ea: setEa,
      no: setNo,
      vf: setVf,
      subj: setSubj,
      obj: setObj,
      examination: setExamination,
      therapy: setTherapy,
      diagnosis: setDiagnosis,
      icd10: setIcd10,
    }
    setters[key](value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Asistent pro lékařské zprávy</h1>
            <Badge variant="secondary" className={isOnline ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>{isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}{isOnline ? "Online" : "Offline"}</Badge>
          </div>
          {autoSaved && <div className="flex items-center justify-center gap-1 text-sm text-green-600"><Check className="w-3 h-3" />Data automaticky uložena</div>}
        </div>

        {!isOnline && <Alert><WifiOff className="h-4 w-4" /><AlertDescription><strong>Offline režim:</strong> AI asistent není dostupný.</AlertDescription></Alert>}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-600" />AI Asistent - Rychlé vyplnění</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ai-provider">AI poskytovatel</Label>
              <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as "github" | "claude" | "openai" | "deepseek")}> 
                <SelectTrigger id="ai-provider"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">DeepSeek (NVIDIA)</SelectItem>
                  <SelectItem value="github">GitHub Models</SelectItem>
                  <SelectItem value="openai" disabled>OpenAI (GPT-4o mini)</SelectItem>
                  <SelectItem value="claude" disabled>Claude (Anthropic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ai-prompt">Popište případ pacienta</Label>
              <Textarea id="ai-prompt" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="min-h-[100px]" disabled={!isOnline} />
            </div>
            <Button onClick={handleAiAssist} disabled={isGenerating || !aiPrompt.trim() || !isOnline} className="w-full bg-blue-600 hover:bg-blue-700">
              {isGenerating ? <> <Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generuji zprávu přes {providerLabel[aiProvider]}... </> : <> <Sparkles className="w-4 h-4 mr-2" /> Vygenerovat zprávu pomocí {providerLabel[aiProvider]} </>}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informace o dokumentu</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={handleManualSave} variant="outline" size="sm"><Save className="w-4 h-4 mr-2" />Uložit</Button>
                    <Button onClick={() => setShowClearModal(true)} variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" />Vymazat</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="txt-import">Import dokumentu (.txt)</Label>
                  <Input id="txt-import" type="file" accept=".txt" onChange={handleImportFile} />
                  {importStatus && <p className={`text-sm mt-2 ${importStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>{importStatus.type === "success" ? <Upload className="w-4 h-4 inline mr-1" /> : null}{importStatus.message}</p>}
                </div>

                <div>
                  <Label htmlFor="doc-type">Typ zprávy</Label>
                  <Select value={reportTypeId} onValueChange={(value) => setReportTypeId(value as ReportTypeId)}>
                    <SelectTrigger id="doc-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div><Label htmlFor="case-number">Číslo případu dne</Label><Input id="case-number" type="number" min="1" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} /></div>
                <div><Label htmlFor="doctor">Jméno lékaře</Label><Input id="doctor" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} /></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="patient-first-name">Jméno pacienta</Label><Input id="patient-first-name" value={patientFirstName} onChange={(e) => setPatientFirstName(e.target.value)} /></div>
                  <div><Label htmlFor="patient-last-name">Příjmení pacienta</Label><Input id="patient-last-name" value={patientLastName} onChange={(e) => setPatientLastName(e.target.value)} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="patient-birth-date">Datum narození</Label><Input id="patient-birth-date" type="date" value={patientBirthDate} onChange={(e) => setPatientBirthDate(e.target.value)} /></div>
                  <div><Label htmlFor="patient-insurance">Pojišťovna</Label><Input id="patient-insurance" value={patientInsurance} onChange={(e) => setPatientInsurance(e.target.value)} /></div>
                </div>

                <div className="pt-2"><Label className="text-sm text-muted-foreground">Název dokumentu</Label><Badge variant="secondary" className="text-base font-mono mt-1 w-full justify-center py-2">{generateDocumentName()}</Badge></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue={activeReportType.formSections[0]?.id}>
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${activeReportType.formSections.length}, minmax(0, 1fr))` }}>
                    {activeReportType.formSections.map((section) => <TabsTrigger key={section.id} value={section.id}>{section.label}</TabsTrigger>)}
                  </TabsList>
                  {activeReportType.formSections.map((section) => (
                    <TabsContent key={section.id} value={section.id} className="space-y-4 mt-4">
                      {section.fields.map((field) => (
                        <div key={field.key}>
                          <Label htmlFor={field.key}>{field.label}</Label>
                          {(field.type ?? "textarea") === "input" ? (
                            <Input id={field.key} value={getFieldValue(field.key)} onChange={(e) => setFieldValue(field.key, e.target.value)} placeholder={field.placeholder} />
                          ) : (
                            <Textarea id={field.key} value={getFieldValue(field.key)} onChange={(e) => setFieldValue(field.key, e.target.value)} className={field.minHeightClassName} placeholder={field.placeholder} />
                          )}
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Náhled zprávy</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-950 border rounded-lg p-6 min-h-[600px] font-mono text-sm whitespace-pre-wrap">{generateReport()}</div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setShowCopyModal(true)} variant="outline" className="flex-1 bg-transparent">{copied ? <><Check className="w-4 h-4 mr-2" />Zkopírováno</> : <><Copy className="w-4 h-4 mr-2" />Kopírovat</>}</Button>
                  <Button onClick={() => {
                    const blob = new Blob([generateReport()], { type: "text/plain;charset=utf-8" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${generateDocumentName()}.txt`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }} className="flex-1"><Download className="w-4 h-4 mr-2" />Stáhnout</Button>
                </div>
                <div className="mt-4 space-y-3 border rounded-lg p-4 bg-muted/30">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => startReportCheck({ reportType: reportTypeId, strictMode: true, fields: getReportFieldsPayload() })}
                      disabled={isCheckingReport}
                    >
                      {isCheckingReport ? "Probíhá kontrola..." : "Zkontrolovat zprávu"}
                    </Button>
                    {isCheckingReport && (
                      <Button variant="outline" onClick={cancelReportCheck}>Zrušit</Button>
                    )}
                    <Badge variant="outline">Průběh: {reportCheckProgress.percent}%</Badge>
                  </div>

                  {reportCheckProgress.message && (
                    <p className="text-sm text-muted-foreground">
                      {reportCheckProgress.message}
                    </p>
                  )}

                  {reportCheckError && (
                    <p className="text-sm text-red-600">{reportCheckError}</p>
                  )}

                  {reportCheckSummary && (
                    <div className="text-sm flex flex-wrap gap-2">
                      <Badge variant={reportCheckSummary.hasBlockingErrors ? "destructive" : "secondary"}>
                        Skóre: {reportCheckSummary.score}
                      </Badge>
                      <Badge variant="outline">Chyby: {reportCheckSummary.counts.error}</Badge>
                      <Badge variant="outline">Upozornění: {reportCheckSummary.counts.warning}</Badge>
                      <Badge variant="outline">Info: {reportCheckSummary.counts.info}</Badge>
                    </div>
                  )}

                  {reportCheckIssues.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Nalezené problémy</p>
                      {reportCheckIssues.map((issue) => (
                        <div key={issue.id} className="rounded-md border p-3 bg-white dark:bg-gray-950">
                          <div className="flex items-center gap-2">
                            <Badge variant={issue.severity === "error" ? "destructive" : issue.severity === "warning" ? "secondary" : "outline"}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{issue.title}</span>
                          </div>
                          <p className="text-sm mt-1">{issue.message}</p>
                          {issue.suggestion && <p className="text-sm text-muted-foreground mt-1">Návrh: {issue.suggestion}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {icd10Suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Návrhy MKN-10</p>
                      {icd10Suggestions.map((item) => (
                        <div key={`${item.code}-${item.reason}`} className="rounded-md border p-3 bg-white dark:bg-gray-950">
                          <p className="text-sm font-medium">{item.code} — {item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showClearModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border p-6 space-y-4"><h2 className="text-lg font-semibold">Vymazat rozpracovaný dokument?</h2><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowClearModal(false)}>Zrušit</Button><Button variant="destructive" onClick={() => { resetAllFields(); setShowClearModal(false) }}>Ano, vymazat</Button></div></div></div>}

      {showCopyModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border p-6 space-y-4"><h2 className="text-lg font-semibold">Po zkopírování pokračovat jak?</h2><div className="flex flex-col sm:flex-row gap-2 sm:justify-end"><Button variant="outline" onClick={() => setShowCopyModal(false)}>Zrušit</Button><Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(generateReport()); setCopied(true); setShowCopyModal(false); setTimeout(() => setCopied(false), 2000) }}>Zkopírovat a zachovat</Button><Button onClick={async () => { await navigator.clipboard.writeText(generateReport()); setCopied(true); resetAllFields(); setShowCopyModal(false); setTimeout(() => setCopied(false), 2000) }}>Zkopírovat a nový</Button></div></div></div>}
    </div>
  )
}
