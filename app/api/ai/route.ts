// app/api/ai/route.ts
import OpenAI from "openai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const SYSTEM_PROMPT =
  "Jsi AI asistent pro lékařské zprávy v češtině. " +
  "Vracíš POUZE validní JSON objekt bez markdownu a bez dalšího textu. " +
  "Povolené klíče jsou přesně: patientFirstName, patientLastName, patientBirthDate, patientInsurance, oa, ra, pa, sa, fa, aa, ea, no, vf, subj, obj, examination, therapy, diagnosis, icd10. " +
  "Každá hodnota musí být textový řetězec (string), stručný a klinicky relevantní; pokud údaj chybí, vrať prázdný string. " +
  "NEVYMYŠLEJ identifikaci pacienta (jméno, datum narození, pojišťovna), pokud není v zadání. " +
  "Význam klíčů: oa=osobní anamnéza, ra=rodinná anamnéza, pa=pandemiologická anamnéza, sa=sociální anamnéza, fa=farmakologická anamnéza, aa=alergologická anamnéza, ea=expozice/faktory prostředí, no=nynější onemocnění, vf=vitální funkce, subj=subjektivní potíže, obj=objektivní nález, examination=provedená vyšetření, therapy=léčba, diagnosis=diagnóza, icd10=MKN-10 kód. " +
  "Do anamnestických polí nepatří jména lékařů ani kontaktní údaje. " +
  "Když uživatel výslovně žádá ukázkový/demonstrativní příklad, vytvoř medicínsky smysluplný fiktivní obsah, ale patient* klíče ponech prázdné, pokud je uživatel nedal."

const FIELD_KEYS: Array<keyof Fields> = [
  "patientFirstName",
  "patientLastName",
  "patientBirthDate",
  "patientInsurance",
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
]

const normalizeFields = (value: unknown): Fields => {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const normalized: Fields = {}

  for (const key of FIELD_KEYS) {
    const raw = input[key]
    if (typeof raw === "string") {
      normalized[key] = raw.trim()
    } else if (raw == null) {
      normalized[key] = ""
    } else {
      normalized[key] = String(raw).trim()
    }
  }

  return normalized
}

type Fields = {
  patientFirstName?: string
  patientLastName?: string
  patientBirthDate?: string
  patientInsurance?: string
  oa?: string
  ra?: string
  pa?: string
  sa?: string
  fa?: string
  aa?: string
  ea?: string
  no?: string
  vf?: string
  subj?: string
  obj?: string
  examination?: string
  therapy?: string
  diagnosis?: string
  icd10?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const prompt = (body?.prompt ?? "").toString().trim()
    const provider = (body?.provider ?? "deepseek").toString().trim().toLowerCase()

    if (!prompt) {
      return NextResponse.json({ error: "Chybí prompt." }, { status: 400 })
    }

    let text = "{}"

    if (provider === "deepseek") {
      if (!process.env.NVIDIA_API_KEY) {
        return NextResponse.json({ error: "Chybí NVIDIA_API_KEY v .env.local" }, { status: 500 })
      }

      const client = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
      })

      const completion = await client.chat.completions.create({
        model: "moonshotai/kimi-k2-instruct",
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 4096,
        messages: [
          { role: "user", content: `${SYSTEM_PROMPT}\n\nNa základě tohoto popisu případu vytvoř strukturovanou lékařskou zprávu: ${prompt}` },
        ],
        stream: false,
      })

      text = completion.choices?.[0]?.message?.content ?? "{}"
    } else if (provider === "claude") {
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: "Chybí ANTHROPIC_API_KEY v .env.local" }, { status: 500 })
      }

      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          temperature: 0.2,
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content:
                `Na základě tohoto popisu případu vytvoř strukturovanou lékařskou zprávu: ${prompt}\n\n` +
                "Vrať výstup pouze jako čistý JSON objekt bez markdownu.",
            },
          ],
        }),
      })

      const anthropicData = await anthropicResponse.json().catch(() => ({} as any))
      if (!anthropicResponse.ok) {
        return NextResponse.json(
          {
            error: anthropicData?.error?.message || "Anthropic API chyba.",
            code: anthropicData?.error?.type,
          },
          { status: anthropicResponse.status || 502 }
        )
      }

      text =
        anthropicData?.content
          ?.find?.((part: any) => part?.type === "text")
          ?.text?.toString?.()
          ?.trim?.() ?? "{}"
    } else if (provider === "github") {
      if (!process.env.GITHUB_TOKEN) {
        return NextResponse.json({ error: "Chybí GITHUB_TOKEN v .env.local" }, { status: 500 })
      }

      const githubClient = new OpenAI({
        apiKey: process.env.GITHUB_TOKEN,
        baseURL: "https://models.github.ai/inference",
      })

      const completion = await githubClient.chat.completions.create({
        model: "openai/gpt-4.1-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Na základě tohoto popisu případu vytvoř strukturovanou lékařskou zprávu: ${prompt}`,
          },
        ],
        response_format: { type: "json_object" },
      })

      text = completion.choices?.[0]?.message?.content ?? "{}"
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Chybí OPENAI_API_KEY v .env.local" }, { status: 500 })
      }

      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Na základě tohoto popisu případu vytvoř strukturovanou lékařskou zprávu: ${prompt}`,
          },
        ],
        response_format: { type: "json_object" },
      })

      text = completion.choices?.[0]?.message?.content ?? "{}"
    }

    let fields: Fields = {}
    try {
      fields = normalizeFields(JSON.parse(text))
    } catch {
      return NextResponse.json(
        { error: "Model nevrátil validní JSON.", raw: text },
        { status: 502 }
      )
    }

    return NextResponse.json({ fields })
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status ?? 500
    const message =
      err?.message ??
      err?.response?.data?.error?.message ??
      "Neznámá chyba."

    return NextResponse.json(
      {
        error: message,
        code: err?.code ?? err?.response?.data?.error?.code,
        type: err?.type ?? err?.response?.data?.error?.type,
      },
      { status }
    )
  }
}
