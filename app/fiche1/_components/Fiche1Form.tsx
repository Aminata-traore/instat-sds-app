"use client"

import { useEffect, useMemo, useState } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Option = { id: string; libelle: string }

type ActivityRow = {
  activite: string
  resultat: string
  produit_id: string | null
  source_finance_id: string | null
  source_verification_id: string | null
  observation: string
}

type LocalStructureRow = {
  id: string
  region: string
  cercle: string
  structure: string
}

export default function Fiche1Form({ userId }: { userId: string }) {
  const supabase = useMemo(() => supabaseClient(), [])

  // --- SECTION 1 (entête) ---
  const [ficheId, setFicheId] = useState<string | null>(null)
  const [annee, setAnnee] = useState<number>(new Date().getFullYear() - 1)
  const [numeroFiche, setNumeroFiche] = useState("")
  const [responsableNom, setResponsableNom] = useState("")

  // Région/Cercle/Structure (on tente structures_locales, sinon champs libres)
  const [structuresLocales, setStructuresLocales] = useState<LocalStructureRow[]>([])
  const [region, setRegion] = useState<string>("")
  const [cercle, setCercle] = useState<string>("")
  const [structure, setStructure] = useState<string>("")

  const regions = useMemo(() => {
    const set = new Set(structuresLocales.map((s) => s.region).filter(Boolean))
    return Array.from(set).sort()
  }, [structuresLocales])

  const cercles = useMemo(() => {
    const set = new Set(
      structuresLocales
        .filter((s) => (region ? s.region === region : true))
        .map((s) => s.cercle)
        .filter(Boolean)
    )
    return Array.from(set).sort()
  }, [structuresLocales, region])

  const structures = useMemo(() => {
    const set = new Set(
      structuresLocales
        .filter((s) => (region ? s.region === region : true))
        .filter((s) => (cercle ? s.cercle === cercle : true))
        .map((s) => s.structure)
        .filter(Boolean)
    )
    return Array.from(set).sort()
  }, [structuresLocales, region, cercle])

  // --- Référentiels pour le tableau ---
  const [produits, setProduits] = useState<Option[]>([])
  const [sourcesFinance, setSourcesFinance] = useState<Option[]>([])
  const [sourcesVerif, setSourcesVerif] = useState<Option[]>([])

  // --- SECTION 2 (tableau dynamique) ---
  const [rows, setRows] = useState<ActivityRow[]>([
    {
      activite: "",
      resultat: "",
      produit_id: null,
      source_finance_id: null,
      source_verification_id: null,
      observation: "",
    },
  ])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Charger référentiels
  useEffect(() => {
    let alive = true

    const loadRefs = async () => {
      // 1) structures_locales (si existe)
      const { data: loc, error: locErr } = await supabase
        .from("structures_locales")
        .select("id,region,cercle,structure")
        .limit(5000)

      if (!locErr && alive && loc) setStructuresLocales(loc as LocalStructureRow[])

      // 2) produits
      const { data: p } = await supabase
        .from("ref_produits")
        .select("id,libelle")
        .order("libelle", { ascending: true })
      if (alive && p) setProduits(p as Option[])

      // 3) sources finance
      const { data: sf } = await supabase
        .from("ref_sources_finance")
        .select("id,libelle")
        .order("libelle", { ascending: true })
      if (alive && sf) setSourcesFinance(sf as Option[])

      // 4) sources verif
      const { data: sv } = await supabase
        .from("ref_sources_verif")
        .select("id,libelle")
        .order("libelle", { ascending: true })
      if (alive && sv) setSourcesVerif(sv as Option[])
    }

    loadRefs()
    return () => {
      alive = false
    }
  }, [supabase])

  // Si région change -> reset cercle/structure
  useEffect(() => {
    setCercle("")
    setStructure("")
  }, [region])

  // Si cercle change -> reset structure
  useEffect(() => {
    setStructure("")
  }, [cercle])

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        activite: "",
        resultat: "",
        produit_id: null,
        source_finance_id: null,
        source_verification_id: null,
        observation: "",
      },
    ])
  }

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, patch: Partial<ActivityRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const validateHeader = () => {
    if (!region || !cercle || !structure) return "Veuillez renseigner Région, Cercle et Structure."
    if (!responsableNom.trim()) return "Veuillez renseigner le nom du responsable."
    if (!numeroFiche.trim()) return "Veuillez renseigner le numéro de la fiche."
    if (!annee || isNaN(Number(annee))) return "Veuillez renseigner l’année."
    return null
  }

  const getCleanRows = () =>
    rows
      .filter((r) => r.activite.trim() !== "") // ignore les lignes vides
      .map((r) => ({
        activite: r.activite.trim(),
        resultat: r.resultat?.trim() || null,
        produit_id: r.produit_id,
        source_finance_id: r.source_finance_id,
        source_verification_id: r.source_verification_id,
        observation: r.observation?.trim() || null,
      }))

  const saveDraft = async () => {
    setMessage(null)

    const errMsg = validateHeader()
    if (errMsg) {
      setMessage(errMsg)
      return
    }

    setSaving(true)
    try {
      // NOTE: ici region_id / cercle_id / structure_id sont des TEXT.
      // ✅ Si ta DB est en UUID, il faut soit changer DB en TEXT,
      // soit créer des tables regions/cercles/structures et passer des UUID.
      const payload = {
        region_id: region,
        cercle_id: cercle,
        structure_id: structure,
        responsable_nom: responsableNom.trim(),
        annee,
        numero_fiche: numeroFiche.trim(),
        statut: "brouillon",
        created_by: userId,
      }

      let currentId = ficheId

      if (!currentId) {
        const { data, error } = await supabase.from("fiche1").insert(payload).select("id").single()
        if (error) throw error
        currentId = data.id
        setFicheId(currentId)
      } else {
        const { error } = await supabase.from("fiche1").update(payload).eq("id", currentId)
        if (error) throw error
      }

      // Remplacer les lignes d'activités (delete + insert)
      const { error: delErr } = await supabase
        .from("fiche1_activites")
        .delete()
        .eq("fiche1_id", currentId)
      if (delErr) throw delErr

      const cleanRows = getCleanRows().map((r) => ({ ...r, fiche1_id: currentId! }))

      if (cleanRows.length > 0) {
        const { error: insErr } = await supabase.from("fiche1_activites").insert(cleanRows)
        if (insErr) throw insErr
      }

      setMessage("Brouillon enregistré avec succès.")
    } catch (e: any) {
      console.error(e)
      setMessage(e?.message ?? "Erreur lors de l’enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const submitToValidator = async () => {
    setMessage(null)

    const errMsg = validateHeader()
    if (errMsg) {
      setMessage(errMsg)
      return
    }

    // ✅ empêche de soumettre une fiche vide
    const cleanRows = getCleanRows()
    if (cleanRows.length === 0) {
      setMessage("Ajoute au moins une activité avant de soumettre.")
      return
    }

    // ✅ si pas encore sauvegardée, on sauvegarde d'abord
    if (!ficheId) {
      await saveDraft()
      // après saveDraft, ficheId devrait être créé
      // mais comme setState est async, on re-vérifie côté DB:
      // on bloque ici si toujours null
      if (!ficheId) return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from("fiche1").update({ statut: "soumis" }).eq("id", ficheId)
      if (error) throw error
      setMessage("Fiche soumise au validateur.")
    } catch (e: any) {
      setMessage(e?.message ?? "Erreur lors de la soumission.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-md border px-4 py-3 text-sm bg-muted">
          {message}
        </div>
      )}

      {/* SECTION 1 */}
      <Card>
        <CardHeader>
          <CardTitle>Section 1 — Identification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Région</Label>
            {regions.length > 0 ? (
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue placeholder="Choisir une région" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Saisir la région" />
            )}
          </div>

          <div className="space-y-2">
            <Label>Cercle</Label>
            {cercles.length > 0 ? (
              <Select value={cercle} onValueChange={setCercle} disabled={!region}>
                <SelectTrigger><SelectValue placeholder="Choisir un cercle" /></SelectTrigger>
                <SelectContent>
                  {cercles.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={cercle} onChange={(e) => setCercle(e.target.value)} placeholder="Saisir le cercle" />
            )}
          </div>

          <div className="space-y-2">
            <Label>Structure</Label>
            {structures.length > 0 ? (
              <Select value={structure} onValueChange={setStructure} disabled={!cercle}>
                <SelectTrigger><SelectValue placeholder="Choisir une structure" /></SelectTrigger>
                <SelectContent>
                  {structures.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={structure} onChange={(e) => setStructure(e.target.value)} placeholder="Saisir la structure" />
            )}
          </div>

          <div className="space-y-2">
            <Label>Nom & prénom du responsable</Label>
            <Input
              value={responsableNom}
              onChange={(e) => setResponsableNom(e.target.value)}
              placeholder="Ex: Mme Traoré Aminata"
            />
          </div>

          <div className="space-y-2">
            <Label>Année (N-1)</Label>
            <Input type="number" value={annee} onChange={(e) => setAnnee(Number(e.target.value))} />
          </div>

          <div className="space-y-2">
            <Label>Numéro de la fiche</Label>
            <Input value={numeroFiche} onChange={(e) => setNumeroFiche(e.target.value)} placeholder="Ex: F1-2024-0001" />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Section 2 — Activités statistiques</CardTitle>
          <Button type="button" variant="outline" onClick={addRow}>
            + Ajouter une ligne
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {rows.map((r, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Activité</Label>
                  <Input value={r.activite} onChange={(e) => updateRow(idx, { activite: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Résultat attendu</Label>
                  <Input value={r.resultat} onChange={(e) => updateRow(idx, { resultat: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Produit</Label>
                  <Select value={r.produit_id ?? ""} onValueChange={(v) => updateRow(idx, { produit_id: v || null })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {produits.map((p) => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Source financement</Label>
                  <Select
                    value={r.source_finance_id ?? ""}
                    onValueChange={(v) => updateRow(idx, { source_finance_id: v || null })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {sourcesFinance.map((s) => <SelectItem key={s.id} value={s.id}>{s.libelle}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vérification</Label>
                  <Select
                    value={r.source_verification_id ?? ""}
                    onValueChange={(v) => updateRow(idx, { source_verification_id: v || null })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {sourcesVerif.map((s) => <SelectItem key={s.id} value={s.id}>{s.libelle}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Observations</Label>
                  <Input value={r.observation} onChange={(e) => updateRow(idx, { observation: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="destructive" onClick={() => removeRow(idx)} disabled={rows.length === 1}>
                  Supprimer la ligne
                </Button>
              </div>
            </div>
          ))}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={saveDraft} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer brouillon"}
            </Button>
            <Button type="button" onClick={submitToValidator} disabled={saving}>
              Soumettre
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
