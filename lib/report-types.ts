export type ReportFieldKey =
  | "patientFirstName"
  | "patientLastName"
  | "patientBirthDate"
  | "patientInsurance"
  | "oa"
  | "ra"
  | "pa"
  | "sa"
  | "fa"
  | "aa"
  | "ea"
  | "no"
  | "vf"
  | "subj"
  | "obj"
  | "examination"
  | "therapy"
  | "diagnosis"
  | "icd10"

export type FormFieldType = "input" | "textarea"

export type FormFieldConfig = {
  key: ReportFieldKey
  label: string
  type?: FormFieldType
  placeholder?: string
  minHeightClassName?: string
}

export type FormSectionConfig = {
  id: string
  label: string
  fields: FormFieldConfig[]
}

export type ReportData = {
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
}

export type ImportRules = {
  sectionHeaders: string[]
  lineMappings: Record<string, ReportFieldKey | "patientFullName">
  blockMappings: Array<{ startHeader: string; endHeaders: string[]; key: ReportFieldKey }>
  doctorHeader: string
}

export type ReportTypeConfig = {
  id: string
  label: string
  documentPrefix: string
  formSections: FormSectionConfig[]
  buildPreviewExport: (documentName: string, data: ReportData) => string
  importRules: ImportRules
}

const defaultImportRules: ImportRules = {
  sectionHeaders: [
    "Identifikace pacienta:",
    "Anamnéza:",
    "Status praesens:",
    "Vyšetření:",
    "Terapie:",
    "Závěrečné ustanovení:",
    "Zapsal:",
  ],
  lineMappings: {
    "Jméno a příjmení:": "patientFullName",
    "Datum narození:": "patientBirthDate",
    "Pojišťovna:": "patientInsurance",
    "OA:": "oa",
    "RA:": "ra",
    "PA:": "pa",
    "SA:": "sa",
    "FA:": "fa",
    "AA:": "aa",
    "EA:": "ea",
    "NO:": "no",
    "VF:": "vf",
    "Subj.:": "subj",
    "Obj.:": "obj",
    "Diagnóza:": "diagnosis",
    "MKN-10 kód:": "icd10",
  },
  blockMappings: [
    { startHeader: "Vyšetření:", endHeaders: ["Terapie:"], key: "examination" },
    { startHeader: "Terapie:", endHeaders: ["Závěrečné ustanovení:"], key: "therapy" },
  ],
  doctorHeader: "Zapsal:",
}

const buildStandardMedicalTemplate = (documentName: string, data: ReportData) => {
  const patientFullName = [data.patientFirstName, data.patientLastName].filter(Boolean).join(" ")

  return `${documentName}

ZÁZNAM DO DOKUMENTACE

Identifikace pacienta:
${patientFullName ? `Jméno a příjmení: ${patientFullName}` : ""}
${data.patientBirthDate ? `Datum narození: ${data.patientBirthDate}` : ""}
${data.patientInsurance ? `Pojišťovna: ${data.patientInsurance}` : ""}

Anamnéza:
${data.oa ? `OA: ${data.oa}` : ""}
${data.ra ? `RA: ${data.ra}` : ""}
${data.pa ? `PA: ${data.pa}` : ""}
${data.sa ? `SA: ${data.sa}` : ""}
${data.fa ? `FA: ${data.fa}` : ""}
${data.aa ? `AA: ${data.aa}` : ""}
${data.ea ? `EA: ${data.ea}` : ""}
${data.no ? `NO: ${data.no}` : ""}

Status praesens:
${data.vf ? `VF: ${data.vf}` : ""}
${data.subj ? `Subj.: ${data.subj}` : ""}
${data.obj ? `Obj.: ${data.obj}` : ""}

Vyšetření:
${data.examination || ""}

Terapie:
${data.therapy || ""}

Závěrečné ustanovení:
Diagnóza: ${data.diagnosis || ""}
MKN-10 kód: ${data.icd10 || ""}

Zapsal:
${data.doctorName}
`
}

export const REPORT_TYPES: ReportTypeConfig[] = [
  {
    id: "medical",
    label: "Lékařská zpráva",
    documentPrefix: "EP",
    formSections: [
      {
        id: "anamneza",
        label: "Anamnéza",
        fields: [
          { key: "oa", label: "OA - Osobní anamnéza" },
          { key: "ra", label: "RA - Rodinná anamnéza" },
          { key: "pa", label: "PA - Pracovní anamnéza" },
          { key: "sa", label: "SA - Sociální anamnéza" },
          { key: "fa", label: "FA - Farmakologická anamnéza" },
          { key: "aa", label: "AA - Anamnéza alergií" },
          { key: "ea", label: "EA - Expozice a faktory prostředí" },
          { key: "no", label: "NO - Nynější onemocnění" },
        ],
      },
      {
        id: "status",
        label: "Status",
        fields: [
          {
            key: "vf",
            label: "VF - Vital signs (životní funkce)",
            placeholder: "Např: Tlak 120/80 mmHg, puls 72 bpm, teplota 36.6°C",
          },
          { key: "subj", label: "Subj. - Subjektivní hodnocení", placeholder: "Subjektivní stížnosti a pocity pacienta" },
          { key: "obj", label: "Obj. - Objektivní zjištění", placeholder: "Objektivní vyšetření a nálezy" },
        ],
      },
      {
        id: "vysetreni",
        label: "Vyšetření",
        fields: [
          { key: "examination", label: "Vyšetření", placeholder: "Provedená vyšetření a jejich výsledky", minHeightClassName: "min-h-[150px]" },
          { key: "therapy", label: "Terapie", placeholder: "Předepsaná nebo provedená léčba", minHeightClassName: "min-h-[150px]" },
        ],
      },
      {
        id: "zaver",
        label: "Závěr",
        fields: [
          {
            key: "diagnosis",
            label: "Diagnóza",
            type: "input",
            placeholder: "Např: Epilepsie, Generalizované tonicko-klonické záchvaty",
          },
          { key: "icd10", label: "MKN-10 kód", type: "input", placeholder: "Např: G40.0" },
        ],
      },
    ],
    buildPreviewExport: buildStandardMedicalTemplate,
    importRules: defaultImportRules,
  },
  {
    id: "psychological",
    label: "Psychologická zpráva",
    documentPrefix: "PSY",
    formSections: [
      {
        id: "anamneza",
        label: "Anamnéza",
        fields: [
          { key: "oa", label: "OA - Osobní anamnéza" },
          { key: "ra", label: "RA - Rodinné zázemí" },
          { key: "sa", label: "SA - Sociální anamnéza" },
          { key: "no", label: "NO - Nynější obtíže" },
        ],
      },
      {
        id: "status",
        label: "Psychický stav",
        fields: [
          { key: "subj", label: "Subj. - Sebepopis a prožívání" },
          { key: "obj", label: "Obj. - Pozorování terapeuta" },
          { key: "vf", label: "VF - Fungování v běžném životě" },
        ],
      },
      {
        id: "intervence",
        label: "Intervence",
        fields: [
          { key: "examination", label: "Vyšetření / metody", minHeightClassName: "min-h-[150px]" },
          { key: "therapy", label: "Intervence a doporučení", minHeightClassName: "min-h-[150px]" },
        ],
      },
      {
        id: "zaver",
        label: "Závěr",
        fields: [
          { key: "diagnosis", label: "Pracovní závěr", type: "input" },
          { key: "icd10", label: "MKN-10 kód", type: "input" },
        ],
      },
    ],
    buildPreviewExport: (documentName, data) => buildStandardMedicalTemplate(documentName, data),
    importRules: defaultImportRules,
  },
]

export const REPORT_TYPES_BY_ID = Object.fromEntries(REPORT_TYPES.map((type) => [type.id, type])) as Record<string, ReportTypeConfig>

export type ReportTypeId = (typeof REPORT_TYPES)[number]["id"]
