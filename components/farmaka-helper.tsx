"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pill } from "lucide-react"

type SuklResult = {
  nazev: string
  doplnek: string
  kodSukl: string
  sila: string
  forma: string
  cestaPodani: string
  atc: string
  vydej: string
  uhrada: string
  dostupnost: boolean
}

type FarmakaHelperProps = {
  onInsert: (text: string) => void
  disabled?: boolean
}

export function FarmakaHelper({ onInsert, disabled }: FarmakaHelperProps) {
  const [query, setQuery] = useState("")
  const [cestaPodani, setCestaPodani] = useState("POR")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<SuklResult[]>([])

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/sukl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nazev: query.trim(), cestaPodani, pocet: 8 }),
      })
      const data = await response.json().catch(() => ({} as any))
      if (!response.ok) {
        throw new Error(data?.error || "Vyhledávání selhalo.")
      }
      setResults(Array.isArray(data?.results) ? data.results : [])
    } catch (err) {
      setResults([])
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const formatForInsert = (item: SuklResult) =>
    [
      item.nazev,
      item.doplnek,
      item.sila,
      item.forma,
      item.cestaPodani ? `(${item.cestaPodani})` : "",
      item.kodSukl ? `[SÚKL: ${item.kodSukl}]` : "",
    ]
      .filter(Boolean)
      .join(" ")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Pill className="w-4 h-4 text-blue-600" />Pomocník – farmaka (SÚKL)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-2">
          <div>
            <Label htmlFor="sukl-query">Název léčiva</Label>
            <Input
              id="sukl-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="např. paralen"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  search()
                }
              }}
              disabled={disabled || loading}
            />
          </div>
          <div>
            <Label htmlFor="sukl-route">Cesta podání</Label>
            <Select value={cestaPodani} onValueChange={setCestaPodani} disabled={disabled || loading}>
              <SelectTrigger id="sukl-route"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="POR">POR</SelectItem>
                <SelectItem value="INH">INH</SelectItem>
                <SelectItem value="DER">DER</SelectItem>
                <SelectItem value="INJ">INJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={search} disabled={disabled || loading || !query.trim()} className="self-end">
            {loading ? "Hledám..." : "Hledat"}
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {results.length > 0 && (
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {results.map((item) => (
              <div key={`${item.kodSukl}-${item.nazev}`} className="border rounded-md p-2 bg-white dark:bg-gray-950">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{[item.nazev, item.doplnek].filter(Boolean).join(" ")}</p>
                    <p className="text-xs text-muted-foreground">{[item.sila, item.forma, item.cestaPodani].filter(Boolean).join(" • ")}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.kodSukl && <Badge variant="outline">SÚKL: {item.kodSukl}</Badge>}
                      {item.vydej && <Badge variant="outline">{item.vydej}</Badge>}
                      {item.uhrada && <Badge variant="outline">{item.uhrada}</Badge>}
                      <Badge variant={item.dostupnost ? "secondary" : "destructive"}>{item.dostupnost ? "V dodávkách" : "Bez dodávek"}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onInsert(formatForInsert(item))}>
                    Vložit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
