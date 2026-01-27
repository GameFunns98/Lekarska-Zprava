"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Sparkles, Copy, Check, WifiOff, Wifi, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const documentTypes = [
  { value: "TR", label: "TR - Trauma / Resuscitace" },
  { value: "EP", label: "EP - Epilepsie" },
  { value: "CV", label: "CV - Cerebrovaskulární příhoda" },
  { value: "ONC", label: "ONC - Onkologická diagnóza" },
  { value: "INF", label: "INF - Infekce" },
]

// JSON Schema pro Structured Outputs (response_format: json_schema)
const MEDICAL_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    oa: { type: "string", description: "OA - Onemocnění aktuální" },
    ra: { type: "string", description: "RA - Rizikové faktory" },
    pa: { type: "string", description: "PA - Problémy předchozí" },
    sa: { type: "string", description: "SA - Symptomy aktuálního stavu" },
    fa: { type: "string", description: "FA - Fyzikální nález" },
    aa: { type: "string", description: "AA - Anamnéza alergií" },
    ea: { type: "string", description: "EA - Expozice a faktory prostředí" },
    no: { type: "string", description: "NO - Nutné další záznamy" },
    vf: { type: "string", description: "VF - Vital signs (životní funkce)" },
    subj: { type: "string", description: "Subj. - Subjektivní hodnocení" },
    obj: { type: "string", description: "Obj. - Objektivní zjištění" },
    examination: { type: "string", description: "Vyšetření" },
    therapy: { type: "string", description: "Terapie" },
    diagnosis: { type: "string", description: "Diagnóza" },
    icd10: { type: "string", description: "MKN-10 kód" },
  },
  required: [
    "oa",
    "ra",
    "pa",
    "sa",
    "fa",
    "aa",
    "ea",
    "no",
    "vf",
    "subj",
    "obj",
    "examination",
    "therapy",
    "diagnosis",
    "icd10",
  ],
} as const

export default function MedicalReportApp() {
  const [isOnline, setIsOnline] = useState(true)
  const [autoSaved, setAutoSaved] = useState(false)

  const [documentType, setDocumentType] = useState("EP")
  const [caseNumber, setCaseNumber] = useState("001")
  const [doctorName, setDoctorName] = useState("MUDr. Fero Lakatos")
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // OpenAI API (vložený klíč v UI)
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [keyInSession, setKeyInSession] = useState(false)

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
    // Načti API klíč jen ze sessionStorage (méně zlé než localStorage)
    try {
      const k = sessionStorage.getItem("openai_api_key")
      if (k) {
        setOpenaiApiKey(k)
        setKeyInSession(true)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const savedData = localStorage.getItem("medicalReportDraft")
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setDocumentType(parsed.documentType || "EP")
        setCaseNumber(parsed.caseNumber || "001")
        setDoctorName(parsed.doctorName || "MUDr. Fero Lakatos")
        setOa(parsed.oa || "")
        setRa(parsed.ra || "")
        setPa(parsed.pa || "")
        setSa(parsed.sa || "")
        setFa(parsed.fa || "")
        setAa(parsed.aa || "")
        setEa(parsed.ea || "")
        setNo(parsed.no || "")
        setVf(parsed.vf || "")
        setSubj(parsed.subj || "")
        setObj(parsed.obj || "")
        setExamination(parsed.examination || "")
        setTherapy(parsed.therapy || "")
        setDiagnosis(parsed.diagnosis || "")
        setIcd10(parsed.icd10 || "")
      } catch (error) {
        console.error("[v0] Error loading saved data:", error)
      }
    }
  }, [])

  useEffect(() => {
    const dataToSave = {
      documentType,
      caseNumber,
      doctorName,
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

    localStorage.setItem("medicalReportDraft", JSON.stringify(dataToSave))

    setAutoSaved(true)
    const timer = setTimeout(() => setAutoSaved(false), 1000)
    return () => clearTimeout(timer)
  }, [
    documentType,
    caseNumber,
    doctorName,
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
      documentType,
      caseNumber,
      doctorName,
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
    localStorage.setItem("medicalReportDraft", JSON.stringify(dataToSave))
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2000)
  }

  const handleSaveKeyToSession = () => {
    const k = openaiApiKey.trim()
    if (!k) return
    try {
      sessionStorage.setItem("openai_api_key", k)
      setKeyInSession(true)
    } catch {
      // ignore
    }
  }

  const handleClearKeyFromSession = () => {
    try {
      sessionStorage.removeItem("openai_api_key")
    } catch {
      // ignore
    }
    setKeyInSession(false)
    setOpenaiApiKey("")
  }

  const generateDocumentName = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, "0")
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const year = String(today.getFullYear()).slice(-2)
    const dateStr = `${day}${month}${year}`
    const caseStr = String(caseNumber).padStart(3, "0")
    return `${documentType}_${dateStr}/${caseStr}`
  }

  const generateReport = () => {
    const documentName = generateDocumentName()

    return `${documentName}

ZÁZNAM DO DOKUMENTACE

Anamnéza:
${oa ? `OA: ${oa}` : ""}
${ra ? `RA: ${ra}` : ""}
${pa ? `PA: ${pa}` : ""}
${sa ? `SA: ${sa}` : ""}
${fa ? `FA: ${fa}` : ""}
${aa ? `AA: ${aa}` : ""}
${ea ? `EA: ${ea}` : ""}
${no ? `NO: ${no}` : ""}

Status praesens:
${vf ? `VF: ${vf}` : ""}
${subj ? `Subj.: ${subj}` : ""}
${obj ? `Obj.: ${obj}` : ""}

Vyšetření:
${examination || ""}

Terapie:
${therapy || ""}

Závěrečné ustanovení:
Diagnóza: ${diagnosis || ""}
MKN-10 kód: ${icd10 || ""}

Zapsal:
${doctorName}
`
  }

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return

    if (!isOnline) {
      alert("AI asistent vyžaduje připojení k internetu. V offline režimu můžete formulář vyplnit ručně.")
      return
    }

    const apiKey = openaiApiKey.trim()
    if (!apiKey) {
      alert("Chybí OpenAI API key. Vložte jej prosím do pole 'OpenAI API key'.")
      return
    }

    setIsGenerating(true)
    try {
      // Chat Completions + Structured Outputs (json_schema)
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
