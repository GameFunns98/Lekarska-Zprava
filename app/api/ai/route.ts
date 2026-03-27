// app/api/ai/route.ts
import OpenAI from "openai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const SYSTEM_PROMPT =
  "Jsi AI asistent pro lékařské zprávy. Pomáháš vytvářet strukturované lékařské zprávy v češtině. " +
  "Odpovídej POUZE jako validní JSON objekt s klíči: oa, ra, pa, sa, fa, aa, ea, no, vf, subj, obj, examination, therapy, diagnosis, icd10. " +
  "Hodnoty piš stručně a profesionálně. Nevkládej žádný další text mimo JSON."

type Fields = {
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
    const provider = (body?.provider ?? "openai").toString().trim().toLowerCase()

    if (!prompt) {
      return NextResponse.json({ error: "Chybí prompt." }, { status: 400 })
    }

    let text = "{}"

    if (provider === "claude") {
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
      fields = JSON.parse(text)
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
