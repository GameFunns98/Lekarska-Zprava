// app/api/ai/route.ts
import OpenAI from "openai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Chybí OPENAI_API_KEY v .env.local" }, { status: 500 })
    }

    const body = await req.json().catch(() => null)
    const prompt = (body?.prompt ?? "").toString().trim()

    if (!prompt) {
      return NextResponse.json({ error: "Chybí prompt." }, { status: 400 })
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Jsi AI asistent pro lékařské zprávy. Pomáháš vytvářet strukturované lékařské zprávy v češtině. " +
            "Odpovídej POUZE jako validní JSON objekt s klíči: oa, ra, pa, sa, fa, aa, ea, no, vf, subj, obj, examination, therapy, diagnosis, icd10. " +
            "Hodnoty piš stručně a profesionálně. Nevkládej žádný další text mimo JSON.",
        },
        {
          role: "user",
          content: `Na základě tohoto popisu případu vytvoř strukturovanou lékařskou zprávu: ${prompt}`,
        },
      ],
      // Tohle výrazně zvyšuje šanci na čistý JSON bez balastu:
      response_format: { type: "json_object" },
    })

    const text = completion.choices?.[0]?.message?.content ?? "{}"

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
console.log("OPENAI key present:", !!process.env.OPENAI_API_KEY)
