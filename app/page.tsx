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

export default function MedicalReportApp() {
  const [isOnline, setIsOnline] = useState(true)
  const [autoSaved, setAutoSaved] = useState(false)

  const [documentType, setDocumentType] = useState("EP")
  const [caseNumber, setCaseNumber] = useState("001")
  const [doctorName, setDoctorName] = useState("MUDr. Fero Lakatos")
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiProvider, setAiProvider] = useState<"openai" | "claude" | "copilot">("openai")

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

const providerLabel = aiProvider === "claude" ? "Claude" : aiProvider === "copilot" ? "GitHub Copilot" : "OpenAI"

const handleAiAssist = async () => {
  if (!aiPrompt.trim()) return

  if (!isOnline) {
    alert("AI asistent vyžaduje připojení k internetu. V offline režimu můžete formulář vyplnit ručně.")
    return
  }

  setIsGenerating(true)
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: aiPrompt, provider: aiProvider }),
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
    const report = generateReport()
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
                onValueChange={(value) => setAiProvider(value as "openai" | "claude" | "copilot")}
              >
                <SelectTrigger id="ai-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4o mini)</SelectItem>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                  <SelectItem value="copilot">GitHub Copilot / Models</SelectItem>
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
                  Generuji zprávu přes {providerLabel}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Vygenerovat zprávu pomocí {providerLabel}
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
                  <Button onClick={handleManualSave} variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Uložit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="doc-type">Typ dokumentu</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger id="doc-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
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
                <Tabs defaultValue="anamneza">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="anamneza">Anamnéza</TabsTrigger>
                    <TabsTrigger value="status">Status</TabsTrigger>
                    <TabsTrigger value="vysetreni">Vyšetření</TabsTrigger>
                    <TabsTrigger value="zaver">Závěr</TabsTrigger>
                  </TabsList>

                  <TabsContent value="anamneza" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="oa">OA - Osobní anamnéza</Label>
                      <Textarea id="oa" value={oa} onChange={(e) => setOa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="ra">RA - Rodinná anamnéza</Label>
                      <Textarea id="ra" value={ra} onChange={(e) => setRa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="pa">PA - Pandemiologická anamnéza</Label>
                      <Textarea id="pa" value={pa} onChange={(e) => setPa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="sa">SA - Sociální anamnéza</Label>
                      <Textarea id="sa" value={sa} onChange={(e) => setSa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="fa">FA - Farmakologická anamnéza</Label>
                      <Textarea id="fa" value={fa} onChange={(e) => setFa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="aa">AA - Anamnéza alergií</Label>
                      <Textarea id="aa" value={aa} onChange={(e) => setAa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="ea">EA - Expozice a faktory prostředí</Label>
                      <Textarea id="ea" value={ea} onChange={(e) => setEa(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="no">NO - Nynější onemocnění</Label>
                      <Textarea id="no" value={no} onChange={(e) => setNo(e.target.value)} />
                    </div>
                  </TabsContent>

                  <TabsContent value="status" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="vf">VF - Vital signs (životní funkce)</Label>
                      <Textarea
                        id="vf"
                        value={vf}
                        onChange={(e) => setVf(e.target.value)}
                        placeholder="Např: Tlak 120/80 mmHg, puls 72 bpm, teplota 36.6°C"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subj">Subj. - Subjektivní hodnocení</Label>
                      <Textarea
                        id="subj"
                        value={subj}
                        onChange={(e) => setSubj(e.target.value)}
                        placeholder="Subjektivní stížnosti a pocity pacienta"
                      />
                    </div>
                    <div>
                      <Label htmlFor="obj">Obj. - Objektivní zjištění</Label>
                      <Textarea
                        id="obj"
                        value={obj}
                        onChange={(e) => setObj(e.target.value)}
                        placeholder="Objektivní vyšetření a nálezy"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="vysetreni" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="examination">Vyšetření</Label>
                      <Textarea
                        id="examination"
                        value={examination}
                        onChange={(e) => setExamination(e.target.value)}
                        className="min-h-[150px]"
                        placeholder="Provedená vyšetření a jejich výsledky"
                      />
                    </div>
                    <div>
                      <Label htmlFor="therapy">Terapie</Label>
                      <Textarea
                        id="therapy"
                        value={therapy}
                        onChange={(e) => setTherapy(e.target.value)}
                        className="min-h-[150px]"
                        placeholder="Předepsaná nebo provedená léčba"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="zaver" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="diagnosis">Diagnóza</Label>
                      <Input
                        id="diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Např: Epilepsie, Generalizované tonicko-klonické záchvaty"
                      />
                    </div>
                    <div>
                      <Label htmlFor="icd10">MKN-10 kód</Label>
                      <Input
                        id="icd10"
                        value={icd10}
                        onChange={(e) => setIcd10(e.target.value)}
                        placeholder="Např: G40.0"
                      />
                    </div>
                  </TabsContent>
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
    </div>
  )
}
