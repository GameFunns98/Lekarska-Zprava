import { NextResponse } from "next/server"

const SUKL_URL = "https://prehledy.sukl.cz/prehledy/v1/dlprc"

type SuklItem = {
  nazevLP?: string
  doplnekNazvu?: string
  kodSUKL?: string | number
  sila?: string
  lekovaForma?: { nazev?: { cs?: string } }
  cestaPodani?: { nazev?: { cs?: string } }
  atc?: { nazev?: { cs?: string } }
  zpusobVydeje?: string
  uhrada?: string
  jeDodavka?: boolean
}

const mapVydej = (kod?: string) => {
  const mapa: Record<string, string> = {
    R: "Na předpis",
    V: "Volně prodejné",
    F: "Farmaceutický režim",
    C: "Částečné omezení",
  }
  return kod ? mapa[kod] ?? kod : ""
}

const mapUhrada = (kod?: string) => {
  const mapa: Record<string, string> = {
    A: "Plně hrazeno",
    B: "Částečně hrazeno",
    D: "Nehrazeno",
  }
  return kod ? mapa[kod] ?? kod : ""
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const nazev = typeof body.nazev === "string" ? body.nazev.trim() : ""
    const cestaPodani = typeof body.cestaPodani === "string" ? body.cestaPodani : "POR"
    const stranka = Number.isFinite(Number(body.stranka)) ? Number(body.stranka) : 1
    const pocet = Number.isFinite(Number(body.pocet)) ? Math.min(Math.max(Number(body.pocet), 1), 20) : 8

    if (!nazev) {
      return NextResponse.json({ results: [] })
    }

    const payload = {
      filtr: nazev,
      pocet,
      stranka,
      sort: ["nazev", "je_dodavka"],
      smer: "asc",
      leciveLatky: [],
      leciveLatkyOperace: "OR",
      atc: "",
      cestaPodani,
      drzitelRegistrace: [],
      stavRegistrace: "",
      zpusobVydeje: ["R", "C", "NEUVEDENO", "L"],
      uhrada: ["A", "B"],
      dovoz: "",
      jeDodavka: false,
      stavZruseni: "N",
      ochrannyPrvek: "X",
      dostupnost: [],
      omezenaDostupnost: false,
    }

    const response = await fetch(SUKL_URL, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({ error: `SÚKL API chyba (${response.status})` }, { status: response.status })
    }

    const data = await response.json()
    const results = (Array.isArray(data?.data) ? data.data : []).map((item: SuklItem) => ({
      nazev: item?.nazevLP ?? "",
      doplnek: item?.doplnekNazvu ?? "",
      kodSukl: item?.kodSUKL ? String(item.kodSUKL) : "",
      sila: item?.sila ?? "",
      forma: item?.lekovaForma?.nazev?.cs ?? "",
      cestaPodani: item?.cestaPodani?.nazev?.cs ?? "",
      atc: item?.atc?.nazev?.cs ?? "",
      vydej: mapVydej(item?.zpusobVydeje),
      uhrada: mapUhrada(item?.uhrada),
      dostupnost: Boolean(item?.jeDodavka),
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[SUKL] route error:", error)
    return NextResponse.json({ error: "Nepodařilo se načíst data ze SÚKL API." }, { status: 500 })
  }
}
