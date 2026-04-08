"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Sparkles, Copy, Check, WifiOff, Wifi, Save, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const documentTypes = [
  { value: "TR", label: "TR - Trauma / Resuscitace" },
  { value: "EP", label: "EP - Epilepsie" },
  { value: "CV", label: "CV - Cerebrovaskulární příhoda" },
  { value: "ONC", label: "ONC - Onkologická diagnóza" },
  { value: "INF", label: "INF - Infekce" },
  { value: "PSY", label: "PSY - Psychologické vyšetření" },
]

type DocumentType = (typeof documentTypes)[number]["value"]

type ImportedFields = Partial<{
  reportTypeId: ReportTypeId
  caseNumber: string
  doctorName: string
  patientFirstName: string
  patientLastName: string
  patientBirthDate: string
  patientInsurance: string
  oa: string
  ra: string
  pa: string
  sa: string
  fa: string
  aa: string
  ea: string
  no: string
  vf: string
  subj: string
  obj: string
  examination: string
  therapy: string
  diagnosis: string
  icd10: string
}>

type DraftPayload = Partial<{
  documentType: DocumentType
  caseNumber: string
  doctorName: string
  patientFirstName: string
  patientLastName: string
  patientBirthDate: string
  patientInsurance: string
  oa: string
  ra: string
  pa: string
  sa: string
  fa: string
  aa: string
  ea: string
  no: string
  vf: string
  subj: string
  obj: string
  examination: string
  therapy: string
  diagnosis: string
  icd10: string
}>

const DEFAULT_FORM_VALUES = {
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

const VALID_DOCUMENT_TYPES = new Set(documentTypes.map((type) => type.value))
const LOCAL_STORAGE_KEY_PREFIX = "reportDraft"

const getDraftStorageKey = (type: DocumentType) => `${LOCAL_STORAGE_KEY_PREFIX}:${type}`
const getDefaultValuesForType = (type: DocumentType) => ({
  ...DEFAULT_FORM_VALUES,
  documentType: type,
})

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

  const [documentType, setDocumentType] = useState<DocumentType>("EP")
  const [caseNumber, setCaseNumber] = useState("001")
  const [doctorName, setDoctorName] = useState("MUDr. Fero Lakatos")
  const [patientFirstName, setPatientFirstName] = useState("")
  const [patientLastName, setPatientLastName] = useState("")
  const [patientBirthDate, setPatientBirthDate] = useState("")
  const [patientInsurance, setPatientInsurance] = useState("")
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiProvider, setAiProvider] = useState<"github" | "claude" | "openai" | "deepseek">("deepseek")

  // Anamnéza
  const [oa, setOa] = useState("")
  const [ra, setRa] = useState("")
  const [pa, setPa] = useState("")
  const [sa, setSa] = useState("")
  const [fa, setFa] = useState("")
  const [aa, setAa] = useState("")
  const [ea, setEa] = useState("")
  const [no, setNo] = useState("")

  // Status praesens
  const [vf, setVf] = useState("")
  const [subj, setSubj] = useState("")
  const [obj, setObj] = useState("")

  // Vyšetření a Terapie
  const [examination, setExamination] = useState("")
  const [therapy, setTherapy] = useState("")

  // Závěr
  const [diagnosis, setDiagnosis] = useState("")
  const [icd10, setIcd10] = useState("")

  const [aiPrompt, setAiPrompt] = useState("")
  const skipNextTypeDraftLoadRef = useRef(false)

  const activeReportType = REPORT_TYPES_BY_ID[reportTypeId]

  const applyImportedFields = (fields: ImportedFields) => {
    if (fields.documentType) {
      skipNextTypeDraftLoadRef.current = true
      setDocumentType(fields.documentType)
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

  const resetAllFields = (type: DocumentType = documentType) => {
    const defaults = getDefaultValuesForType(type)
    setDocumentType(defaults.documentType)
    applyFormValues(defaults)
    setAiPrompt(defaults.aiPrompt)
    setCopied(false)
    setImportStatus(null)
    localStorage.removeItem(getDraftStorageKey(type))
  }

  const loadDraftForType = (type: DocumentType) => {
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

  const parseImportedReport = (rawText: string, selectedDocumentType?: DocumentType): ParsedImportResult => {
    const text = rawText.replace(/\r\n/g, "\n")
    const lines = text.split("\n")
    const trimmedLines = lines.map((line) => line.trim())
    const parsed: ImportedFields = {}

    const firstContentLine = trimmedLines.find((line) => line.length > 0)
    if (firstContentLine) {
      const match = firstContentLine.match(/^([A-Z]+)_\d{6}\/(\d+)$/)
      if (match) {
        const found = REPORT_TYPES.find((type) => type.documentPrefix === match[1])
        if (found) parsed.reportTypeId = found.id
        parsed.caseNumber = match[2]
      }
    }

    const readLineValue = (prefixes: string[]): string => {
      for (const prefix of prefixes) {
        const line = trimmedLines.find((candidate) => candidate.startsWith(prefix))
        if (line) return line.slice(prefix.length).trim()
      }
      return ""
    }

    const readBlock = (startHeaders: string[], endHeaders: string[]) => {
      const startIndex = trimmedLines.findIndex((line) => startHeaders.includes(line))
      if (startIndex === -1) return ""

      let endIndex = trimmedLines.length
      for (const header of allKnownHeaders) {
        const candidateEnd = trimmedLines.findIndex((line, index) => index > startIndex && line === header)
        if (candidateEnd !== -1 && candidateEnd < endIndex) {
          endIndex = candidateEnd
        }
      }

      return lines.slice(startIndex + 1, endIndex).join("\n").trim()
    }

    const hasPsychologyHeaders = [
      "Identifikace klienta:",
      "Extrospekce:",
      "Hlavní závěry:",
      "Resumé, doporučení:",
      "Psychologické zařazení kandidáta:",
    ].some((header) => trimmedLines.includes(header))

    const activeProfile = hasPsychologyHeaders ? PSYCHOLOGY_PROFILE : STANDARD_PROFILE

    if (!parsed.documentType && selectedDocumentType && VALID_DOCUMENT_TYPES.has(selectedDocumentType)) {
      parsed.documentType = selectedDocumentType
    }

    const fullName = readLineValue(["Jméno a příjmení:"])
    if (fullName) {
      const [firstName, ...lastNameParts] = fullName.split(/\s+/)
      if (firstName) parsed.patientFirstName = firstName
      if (lastNameParts.length > 0) parsed.patientLastName = lastNameParts.join(" ")
    }

    const patientBirthDate = readLineValue("Datum narození:")
    if (patientBirthDate) parsed.patientBirthDate = patientBirthDate

    const patientInsurance = readLineValue("Pojišťovna:")
    if (patientInsurance) parsed.patientInsurance = patientInsurance

    const oaValue = readLineValue("OA:")
    if (oaValue) parsed.oa = oaValue
    const raValue = readLineValue("RA:")
    if (raValue) parsed.ra = raValue
    const paValue = readLineValue("PA:")
    if (paValue) parsed.pa = paValue
    const saValue = readLineValue("SA:")
    if (saValue) parsed.sa = saValue
    const faValue = readLineValue("FA:")
    if (faValue) parsed.fa = faValue
    const aaValue = readLineValue("AA:")
    if (aaValue) parsed.aa = aaValue
    const eaValue = readLineValue("EA:")
    if (eaValue) parsed.ea = eaValue
    const noValue = readLineValue("NO:")
    if (noValue) parsed.no = noValue

    const vfValue = readLineValue("VF:")
    if (vfValue) parsed.vf = vfValue
    const subjValue = readLineValue("Subj.:")
    if (subjValue) parsed.subj = subjValue
    const objValue = readLineValue("Obj.:")
    if (objValue) parsed.obj = objValue

    const examinationBlock = readBlock(
      ["Vyšetření:", "Použité metody a výsledky vyšetření:"],
      ["Terapie:", "Interpretace a doporučení:"],
    )
    if (examinationBlock) parsed.examination = examinationBlock
    const therapyBlock = readBlock(
      ["Terapie:", "Interpretace a doporučení:"],
      ["Závěrečné ustanovení:", "Závěr psychologického vyšetření:"],
    )
    if (therapyBlock) parsed.therapy = therapyBlock

    const diagnosisValue = readLineValue("Diagnóza:")
    if (diagnosisValue) parsed.diagnosis = diagnosisValue
    const icd10Value = readLineValue("MKN-10 kód:") || readLineValue("Klasifikační kód:")
    if (icd10Value) parsed.icd10 = icd10Value

    const doctorBlock = readBlock(["Zapsal:", "Zpracoval:"], [])
    if (doctorBlock) {
      const [firstDoctorLine] = doctorBlock.split("\n").map((line) => line.trim()).filter(Boolean)
      if (firstDoctorLine) parsed.doctorName = firstDoctorLine
    }

    for (const blockField of activeProfile.blockFields) {
      const value = readBlock(blockField.headers)
      if (value) {
        if (blockField.key === "doctorName") {
          const [firstDoctorLine] = value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
          if (firstDoctorLine) parsed.doctorName = firstDoctorLine
        } else {
          parsed[blockField.key] = value
        }
      }
    }

    const detectedTypeName =
      activeProfile.typeName +
      (parsed.documentType ? ` (${DOCUMENT_TYPE_LABELS[parsed.documentType]})` : parsed.documentType === undefined && selectedDocumentType ? ` (${DOCUMENT_TYPE_LABELS[selectedDocumentType]})` : "")

    return { fields: parsed, detectedTypeName }
  }

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    loadDraftForType(DEFAULT_FORM_VALUES.documentType)
  }, [])

  useEffect(() => {
    if (skipNextTypeDraftLoadRef.current) {
      skipNextTypeDraftLoadRef.current = false
      return
    }
    loadDraftForType(documentType)
  }, [documentType])

  useEffect(() => {
    const dataToSave = {
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

    localStorage.setItem(getDraftStorageKey(documentType), JSON.stringify(dataToSave))

    setAutoSaved(true)
    const timer = setTimeout(() => setAutoSaved(false), 1000)
    return () => clearTimeout(timer)
  }, [
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
  ])

  const handleManualSave = () => {
    const dataToSave = {
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
    localStorage.setItem(getDraftStorageKey(documentType), JSON.stringify(dataToSave))
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2000)
  }

  const handleClearConfirm = () => {
    resetAllFields()
    setShowClearModal(false)
  }

  const handleCopyChoice = async (createNewDocument: boolean) => {
    try {
      const report = generateReport()
      await navigator.clipboard.writeText(report)
      setCopied(true)

      if (createNewDocument) {
        resetAllFields()
      }

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[Copy] Error:", error)
      alert("Nepodařilo se zkopírovat text do schránky.")
    } finally {
      setShowCopyModal(false)
    }
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
        const { fields, detectedTypeName } = parseImportedReport(rawText, documentType as DocumentType)
        const parsedKeys = Object.keys(fields)

        if (parsedKeys.length === 0) {
          setImportStatus({
            type: "error",
            message: "Soubor neobsahuje rozpoznaný formát exportu. Zkontrolujte prosím strukturu TXT.",
          })
          return
        }

        applyImportedFields(fields)
        setImportStatus({
          type: "success",
          message: `Import dokončen (${detectedTypeName}). Načteno ${parsedKeys.length} polí.`,
        })
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
    const dateStr = `${day}${month}${year}`
    const caseStr = String(caseNumber).padStart(3, "0")
    return `${activeReportType.documentPrefix}_${dateStr}/${caseStr}`
  }

  const generateMedicalReport = () => {
    const documentName = generateDocumentName()
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
    return activeReportType.buildPreviewExport(documentName, reportData)
  }

  const generatePsychologicalReport = () => {
    const documentName = generateDocumentName()
    const patientFullName = [patientFirstName, patientLastName].filter(Boolean).join(" ")

    return `${documentName}

ZÁVĚREČNÁ ZPRÁVA Z PSYCHODIAGNOSTICKÉHO VYŠETŘENÍ
DŮVĚRNÝ MATERIÁL / DŮVĚRNÉ

Identifikační údaje klienta:
${patientFullName ? `Jméno a příjmení: ${patientFullName}` : ""}
${patientBirthDate ? `Datum narození: ${patientBirthDate}` : ""}
${patientInsurance ? `Pojišťovna: ${patientInsurance}` : ""}

Anamnestické údaje:
${oa ? `OA: ${oa}` : ""}
${ra ? `RA: ${ra}` : ""}
${pa ? `PA: ${pa}` : ""}
${sa ? `SA: ${sa}` : ""}
${fa ? `FA: ${fa}` : ""}
${aa ? `AA: ${aa}` : ""}
${ea ? `EA: ${ea}` : ""}
${no ? `NO: ${no}` : ""}

Průběh vyšetření a klinické pozorování:
${vf ? `VF: ${vf}` : ""}
${subj ? `Subj.: ${subj}` : ""}
${obj ? `Obj.: ${obj}` : ""}

Použité metody a výsledky vyšetření:
${examination || ""}

Interpretace a doporučení:
${therapy || ""}

Závěr psychologického vyšetření:
Diagnóza: ${diagnosis || ""}
Klasifikační kód: ${icd10 || ""}

Zpracoval:
${doctorName}
`
  }

  const generateReport = () => {
    if (documentType === "PSY") {
      return generatePsychologicalReport()
    }

    return generateMedicalReport()
  }

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
    ]
      .filter(Boolean)
      .join("\n")

    const composedPrompt = patientContext
      ? `${patientContext}\n\nPopis případu:\n${aiPrompt}`
      : aiPrompt

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: composedPrompt, provider: aiProvider, documentType }),
    })

    const data = await response.json().catch(() => ({} as any))

    if (!response.ok) {
      const msg = (data?.error || "").toString()

      if (response.status === 429 && msg.toLowerCase().includes("quota")) {
        alert("AI je nedostupná: vyčerpaná kvóta / není aktivní billing na OpenAI API. Formulář můžeš vyplnit ručně.")
        return
      }

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


  const handleCopyReport = () => {
    setShowCopyModal(true)
  }

  const handleDownload = () => {
    const report = generateReport()
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${generateDocumentName()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFieldValue = (key: ReportFieldKey): string => {
    const values: Record<ReportFieldKey, string> = {
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
    return values[key]
  }

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
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Asistent pro lékařské zprávy</h1>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                >
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                >
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Vytvářejte strukturované lékařské zprávy rychle a přesně</p>
          {autoSaved && (
            <div className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check className="w-3 h-3" />
              Data automaticky uložena
            </div>
          )}
        </div>

        {!isOnline && (
          <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <strong>Offline režim:</strong> AI asistent není dostupný. Můžete ale pokračovat v ručním vyplňování
              formuláře. Všechna data se ukládají automaticky do paměti prohlížeče. Po obnovení připojení bude AI
              asistent opět k dispozici.
            </AlertDescription>
          </Alert>
        )}

        {/* AI Assistant Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Asistent - Rychlé vyplnění
              {!isOnline && (
                <Badge variant="outline" className="ml-2">
                  Vyžaduje internet
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ai-provider">AI poskytovatel</Label>
              <Select
                value={aiProvider}
                onValueChange={(value) => setAiProvider(value as "github" | "claude" | "openai" | "deepseek")}
              >
                <SelectTrigger id="ai-provider">
                  <SelectValue />
                </SelectTrigger>
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
              <Textarea
                id="ai-prompt"
                placeholder="Např: Pacient 45 let, epilepsie od dětství, včera večer měl záchvat grand mal, na terapii valproátem..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
                disabled={!isOnline}
              />
            </div>
            <Button
              onClick={handleAiAssist}
              disabled={isGenerating || !aiPrompt.trim() || !isOnline}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generuji zprávu přes {providerLabel[aiProvider]}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Vygenerovat zprávu pomocí {providerLabel[aiProvider]}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Document Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informace o dokumentu</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={handleManualSave} variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Uložit
                    </Button>
                    <Button onClick={() => setShowClearModal(true)} variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Vymazat
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="txt-import">Import dokumentu (.txt)</Label>
                  <div className="mt-1">
                    <Input id="txt-import" type="file" accept=".txt" onChange={handleImportFile} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Načítejte pouze TXT exportovaný z této aplikace. Nerozpoznaná pole zůstanou beze změny.
                  </p>
                  {importStatus && (
                    <p
                      className={`text-sm mt-2 flex items-center gap-1 ${
                        importStatus.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {importStatus.type === "success" ? <Upload className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      {importStatus.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="doc-type">Typ zprávy</Label>
                  <Select value={reportTypeId} onValueChange={(value) => setReportTypeId(value as ReportTypeId)}>
                    <SelectTrigger id="doc-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="case-number">Číslo případu dne</Label>
                  <Input
                    id="case-number"
                    type="number"
                    min="1"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="doctor">Jméno lékaře</Label>
                  <Input id="doctor" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient-first-name">Jméno pacienta</Label>
                    <Input
                      id="patient-first-name"
                      value={patientFirstName}
                      onChange={(e) => setPatientFirstName(e.target.value)}
                      placeholder="Např: Jan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patient-last-name">Příjmení pacienta</Label>
                    <Input
                      id="patient-last-name"
                      value={patientLastName}
                      onChange={(e) => setPatientLastName(e.target.value)}
                      placeholder="Např: Novák"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient-birth-date">Datum narození</Label>
                    <Input
                      id="patient-birth-date"
                      type="date"
                      value={patientBirthDate}
                      onChange={(e) => setPatientBirthDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="patient-insurance">Pojišťovna</Label>
                    <Input
                      id="patient-insurance"
                      value={patientInsurance}
                      onChange={(e) => setPatientInsurance(e.target.value)}
                      placeholder="Např: VZP"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-sm text-muted-foreground">Název dokumentu</Label>
                  <Badge variant="secondary" className="text-base font-mono mt-1 w-full justify-center py-2">
                    {generateDocumentName()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Form Tabs */}
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue={activeReportType.formSections[0]?.id}>
                  <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${activeReportType.formSections.length}, minmax(0, 1fr))` }}>
                    {activeReportType.formSections.map((section) => (
                      <TabsTrigger key={section.id} value={section.id}>
                        {section.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {activeReportType.formSections.map((section) => (
                    <TabsContent key={section.id} value={section.id} className="space-y-4 mt-4">
                      {section.fields.map((field) => {
                        const value = getFieldValue(field.key)
                        const controlType = field.type ?? "textarea"
                        return (
                          <div key={field.key}>
                            <Label htmlFor={field.key}>{field.label}</Label>
                            {controlType === "input" ? (
                              <Input
                                id={field.key}
                                value={value}
                                onChange={(e) => setFieldValue(field.key, e.target.value)}
                                placeholder={field.placeholder}
                              />
                            ) : (
                              <Textarea
                                id={field.key}
                                value={value}
                                onChange={(e) => setFieldValue(field.key, e.target.value)}
                                className={field.minHeightClassName}
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        )
                      })}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Náhled zprávy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-950 border rounded-lg p-6 min-h-[600px] font-mono text-sm whitespace-pre-wrap">
                  {generateReport()}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCopyReport} variant="outline" className="flex-1 bg-transparent">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Zkopírováno
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopírovat
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Stáhnout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vymazat rozpracovaný dokument?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Tato akce vymaže všechna pole formuláře včetně AI promptu. Poté začnete nový dokument od nuly.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowClearModal(false)}>
                Zrušit
              </Button>
              <Button variant="destructive" onClick={handleClearConfirm}>
                Ano, vymazat
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Po zkopírování pokračovat jak?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Dokument se nejdříve zkopíruje do schránky. Pak můžete buď zachovat aktuální data, nebo rovnou začít nový dokument.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowCopyModal(false)}>
                Zrušit
              </Button>
              <Button variant="secondary" onClick={() => handleCopyChoice(false)}>
                Zkopírovat a zachovat
              </Button>
              <Button onClick={() => handleCopyChoice(true)}>
                Zkopírovat a nový
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
