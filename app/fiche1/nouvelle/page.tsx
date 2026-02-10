"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type RefItem = { code: string; libelle: string };
type StructureItem = { code: string; structures: string; abreviation?: string | null };

type SaveMode = "brouillon" | "soumis";

function toggleInArray(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function toStr(v: any) {
  return v === null || v === undefined ? "" : String(v);
}

function normalizeRefItems(rows: any[] | null | undefined): RefItem[] {
  return (rows ?? [])
    .map((r) => ({
      code: toStr(r.code).trim(),
      libelle: toStr(r.libelle).trim(),
    }))
    .filter((x) => x.code.length > 0);
}

function normalizeStructures(rows: any[] | null | undefined): StructureItem[] {
  return (rows ?? [])
    .map((r) => ({
      code: toStr(r.code).trim(),
      structures: toStr(r.structures).trim(),
      abreviation: r.abreviation ?? null,
    }))
    .filter((x) => x.code.length > 0);
}

export default function NouvelleFiche1Page() {
  const { loading } = useRequireAuth();

  // -----------------------
  // Référentiels
  // -----------------------
  const [structures, setStructures] = useState<StructureItem[]>([]);
  const [resultats, setResultats] = useState<RefItem[]>([]);
  const [indicateurs, setIndicateurs] = useState<RefItem[]>([]);
  const [sourcesVerif, setSourcesVerif] = useState<RefItem[]>([]);
  const [produits, setProduits] = useState<RefItem[]>([]);
  const [sourcesFinance, setSourcesFinance] = useState<RefItem[]>([]);
  const [refError, setRefError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setRefError(null);

      const [s1, r1, i1, sv1, p1, sf1] = await Promise.all([
        supabase
          .from("ref_structures")
          .select("code, structures, abreviation")
          .order("code", { ascending: true }),
        supabase.from("ref_resultats").select("code, libelle").order("code", { ascending: true }),
        supabase.from("ref_indicateurs").select("code, libelle").order("code", { ascending: true }),
        supabase.from("ref_sources_verif").select("code, libelle").order("code", { ascending: true }),
        supabase.from("ref_produits").select("code, libelle").order("code", { ascending: true }),
        supabase.from("ref_sources_finance").select("code, libelle").order("code", { ascending: true }),
      ]);

      const err =
        s1.error?.message ||
        r1.error?.message ||
        i1.error?.message ||
        sv1.error?.message ||
        p1.error?.message ||
        sf1.error?.message ||
        null;

      if (err) {
        setRefError(err);
        return;
      }

      setStructures(normalizeStructures(s1.data as any));
      setResultats(normalizeRefItems(r1.data as any));
      setIndicateurs(normalizeRefItems(i1.data as any));
      setSourcesVerif(normalizeRefItems(sv1.data as any));
      setProduits(normalizeRefItems(p1.data as any));
      setSourcesFinance(normalizeRefItems(sf1.data as any));
    })();
  }, []);

  // -----------------------
  // Section 1 — Identification
  // -----------------------
  const [region, setRegion] = useState("");
  const [cercle, setCercle] = useState("");

  const [structureCode, setStructureCode] = useState("");
  const [collecteStructureCode, setCollecteStructureCode] = useState("");

  const [intituleActivite, setIntituleActivite] = useState("");
  const [resultatCode, setResultatCode] = useState("");

  const [responsable, setResponsable] = useState("");
  const [annee, setAnnee] = useState("");
  const [numeroFiche, setNumeroFiche] = useState("");

  const anneeInt = useMemo(() => {
    const n = parseInt(annee, 10);
    return Number.isFinite(n) ? n : null;
  }, [annee]);

  // -----------------------
  // Section 2 — Caractéristiques
  // -----------------------
  const [donneesDesag, setDonneesDesag] = useState<"1" | "2">("2"); // 1=Oui 2=Non

  // 2.02 (si 2.01=Oui)
  const [desagGenre, setDesagGenre] = useState<"1" | "2" | "3">("3");
  const [desagAge, setDesagAge] = useState<"1" | "2" | "3">("3");
  const [desagSexe, setDesagSexe] = useState<"1" | "2" | "3">("3");
  const [desagHandicap, setDesagHandicap] = useState<"1" | "2" | "3">("3");
  const [desagDecision, setDesagDecision] = useState<"1" | "2" | "3">("3");
  const [desagAutreGenre, setDesagAutreGenre] = useState("");

  const [desagTerr, setDesagTerr] = useState<"1" | "2" | "3">("3");
  const [desagRegion, setDesagRegion] = useState<"1" | "2" | "3">("3");
  const [desagCercle, setDesagCercle] = useState<"1" | "2" | "3">("3");
  const [desagArr, setDesagArr] = useState<"1" | "2" | "3">("3");
  const [desagCommune, setDesagCommune] = useState<"1" | "2" | "3">("3");
  const [desagAutreTerr, setDesagAutreTerr] = useState("");

  const [desagMilieu, setDesagMilieu] = useState<"1" | "2" | "3">("3");
  const [desagUrbain, setDesagUrbain] = useState<"1" | "2" | "3">("3");
  const [desagRural, setDesagRural] = useState<"1" | "2" | "3">("3");

  const [desagAutre, setDesagAutre] = useState<"1" | "2" | "3">("3");
  const [desagAutrePreciser, setDesagAutrePreciser] = useState("");

  // 2.03 Indicateurs
  const [indicateursCodes, setIndicateursCodes] = useState<string[]>([]);

  // 2.04 Envergure
  const [envergure, setEnvergure] = useState<string>(""); // 1..7
  const [envergureAutre, setEnvergureAutre] = useState("");

  // 2.05 Programmée
  const [programmee, setProgrammee] = useState<"1" | "2">("1");

  // -----------------------
  // Section 3 — Sources (3.10.05)
  // -----------------------
  const [sourcesVerifCodes, setSourcesVerifCodes] = useState<string[]>([]);
  const [sourceVerifAutre, setSourceVerifAutre] = useState("");

  // -----------------------
  // Section 4 — Produits obtenus (3.11)
  // -----------------------
  const [produitsCodes, setProduitsCodes] = useState<string[]>([]);
  const [produitAutre, setProduitAutre] = useState("");

  // -----------------------
  // Section 5 — Financement (4.01)
  // -----------------------
  const [financementCodes, setFinancementCodes] = useState<string[]>([]);
  const [financementAutre, setFinancementAutre] = useState("");

  // -----------------------
  // Save
  // -----------------------
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Validation: stricte seulement pour "soumis"
  const validateForSubmit = () => {
    if (!region.trim()) return "Région obligatoire";
    if (!cercle.trim()) return "Cercle obligatoire";
    if (!structureCode) return "Structure (réalisation) obligatoire";
    if (!collecteStructureCode) return "Structure (collecte SDS) obligatoire";
    if (!responsable.trim()) return "Nom du responsable obligatoire";
    if (!anneeInt) return "Année invalide";
    if (!numeroFiche.trim()) return "Numéro de fiche obligatoire";
    if (!intituleActivite.trim()) return "Intitulé de l’activité obligatoire";
    if (!resultatCode) return "Chaîne de résultats (code) obligatoire";
    if (!envergure) return "Envergure obligatoire";
    if (envergure === "7" && !envergureAutre.trim()) return "Précise 'Autre envergure'";
    return null;
  };

  const buildPayload = (mode: SaveMode, userId: string) => {
    return {
      user_id: userId,
      annee: anneeInt,
      numero_fiche: numeroFiche.trim() || null,
      statut: mode === "soumis" ? "soumis" : "brouillon",
      statut_validation: mode === "soumis" ? "soumis" : "brouillon",
      submitted_at: mode === "soumis" ? new Date().toISOString() : null,
      data: {
        section1: {
          region: region.trim(),
          cercle: cercle.trim(),
          structure_realisation_code: structureCode || null,
          structure_collecte_code: collecteStructureCode || null,
          responsable: responsable.trim(),
          annee: anneeInt,
          numero_fiche: numeroFiche.trim(),
          intitule_activite: intituleActivite.trim(),
          resultat_code: resultatCode || null,
        },
        section2: {
          donnees_desag: donneesDesag, // 1/2
          desagregation:
            donneesDesag === "1"
              ? {
                  genre: { flag: desagGenre, autre: desagAutreGenre.trim() || null },
                  age: desagAge,
                  sexe: desagSexe,
                  handicap: desagHandicap,
                  decision: desagDecision,
                  territorial: {
                    flag: desagTerr,
                    region: desagRegion,
                    cercle: desagCercle,
                    arrondissement: desagArr,
                    commune: desagCommune,
                    autre: desagAutreTerr.trim() || null,
                  },
                  milieu: { flag: desagMilieu, urbain: desagUrbain, rural: desagRural },
                  autre_niveau: { flag: desagAutre, precision: desagAutrePreciser.trim() || null },
                }
              : null,
          indicateurs_codes: indicateursCodes,
          envergure: { code: envergure || null, autre: envergure === "7" ? envergureAutre.trim() : null },
          programmee: programmee,
        },
        section3: {
          sources_verification_codes: sourcesVerifCodes,
          autre_source: sourceVerifAutre.trim() || null,
        },
        section4: {
          produits_codes: produitsCodes,
          autre_produit: produitAutre.trim() || null,
        },
        section5: {
          financement_codes: financementCodes,
          autre_financement: financementAutre.trim() || null,
        },
      },
    };
  };

  const resetForm = () => {
    setRegion("");
    setCercle("");
    setStructureCode("");
    setCollecteStructureCode("");
    setIntituleActivite("");
    setResultatCode("");
    setResponsable("");
    setAnnee("");
    setNumeroFiche("");

    setDonneesDesag("2");
    setDesagGenre("3");
    setDesagAge("3");
    setDesagSexe("3");
    setDesagHandicap("3");
    setDesagDecision("3");
    setDesagAutreGenre("");
    setDesagTerr("3");
    setDesagRegion("3");
    setDesagCercle("3");
    setDesagArr("3");
    setDesagCommune("3");
    setDesagAutreTerr("");
    setDesagMilieu("3");
    setDesagUrbain("3");
    setDesagRural("3");
    setDesagAutre("3");
    setDesagAutrePreciser("");

    setIndicateursCodes([]);
    setEnvergure("");
    setEnvergureAutre("");
    setProgrammee("1");

    setSourcesVerifCodes([]);
    setSourceVerifAutre("");
    setProduitsCodes([]);
    setProduitAutre("");
    setFinancementCodes([]);
    setFinancementAutre("");
  };

  const save = async (mode: SaveMode) => {
    setMsg(null);

    if (mode === "soumis") {
      const err = validateForSubmit();
      if (err) return setMsg(err);
    }

    setBusy(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Utilisateur non connecté");
      const userId = userData.user.id;

      const payload = buildPayload(mode, userId);

      const { error } = await supabase.from("answers_fiche1").insert(payload);
      if (error) throw new Error(error.message);

      setMsg(mode === "soumis" ? "✅ Fiche soumise !" : "✅ Brouillon enregistré !");
      if (mode === "soumis") resetForm();
    } catch (e: any) {
      setMsg(`Erreur: ${e.message ?? "inconnue"}`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
  };

  return (
    <main style={{ padding: 24, maxWidth: 980 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fiche 1 — Bilan des activités (N-1)</h1>

      {refError && (
        <p style={{ marginTop: 12, color: "crimson" }}>Erreur chargement référentiels: {refError}</p>
      )}

      {/* SECTION 1 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Section 1 — Identification</h2>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input style={inputStyle} placeholder="1.01 Région" value={region} onChange={(e) => setRegion(e.target.value)} />
          <input style={inputStyle} placeholder="1.02 Cercle" value={cercle} onChange={(e) => setCercle(e.target.value)} />

          <select style={inputStyle} value={structureCode} onChange={(e) => setStructureCode(e.target.value)}>
            <option value="">1.03 Structure (réalisation) — choisir</option>
            {structures.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.structures}
                {s.abreviation ? ` (${s.abreviation})` : ""}
              </option>
            ))}
          </select>

          <select
            style={inputStyle}
            value={collecteStructureCode}
            onChange={(e) => setCollecteStructureCode(e.target.value)}
          >
            <option value="">1.04 Structure (collecte SDS) — choisir</option>
            {structures.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.structures}
                {s.abreviation ? ` (${s.abreviation})` : ""}
              </option>
            ))}
          </select>

          <input
            style={{ ...inputStyle, gridColumn: "1 / -1" }}
            placeholder="Nom & prénom du responsable"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
          />

          <input
            style={{ ...inputStyle, gridColumn: "1 / -1" }}
            placeholder="1.05 Intitulé de l’activité"
            value={intituleActivite}
            onChange={(e) => setIntituleActivite(e.target.value)}
          />

          <select style={inputStyle} value={resultatCode} onChange={(e) => setResultatCode(e.target.value)}>
            <option value="">1.05a Chaîne de résultats — choisir</option>
            {resultats.map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.libelle}
              </option>
            ))}
          </select>

          <input style={inputStyle} placeholder="Année (ex: 2025)" value={annee} onChange={(e) => setAnnee(e.target.value)} />
          <input
            style={inputStyle}
            placeholder="Numéro de fiche"
            value={numeroFiche}
            onChange={(e) => setNumeroFiche(e.target.value)}
          />
        </div>
      </section>

      {/* SECTION 2 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Section 2 — Caractéristiques de l’activité</h2>

        <div style={{ marginTop: 10 }}>
          <label style={{ fontWeight: 600 }}>2.01 Données désagrégées ?</label>
          <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
            <label>
              <input type="radio" checked={donneesDesag === "1"} onChange={() => setDonneesDesag("1")} /> Oui
            </label>
            <label>
              <input type="radio" checked={donneesDesag === "2"} onChange={() => setDonneesDesag("2")} /> Non
            </label>
          </div>
        </div>

        {donneesDesag === "1" && (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1", fontWeight: 700, marginTop: 6 }}>2.02 Niveau de désagrégation</div>

            <select style={inputStyle} value={desagGenre} onChange={(e) => setDesagGenre(e.target.value as any)}>
              <option value="3">Par Genre ? (Sans objet)</option>
              <option value="1">Par Genre ? Oui</option>
              <option value="2">Par Genre ? Non</option>
            </select>
            <input
              style={inputStyle}
              placeholder="Autre genre (si précisé)"
              value={desagAutreGenre}
              onChange={(e) => setDesagAutreGenre(e.target.value)}
            />

            <select style={inputStyle} value={desagAge} onChange={(e) => setDesagAge(e.target.value as any)}>
              <option value="3">Age (Sans objet)</option>
              <option value="1">Age Oui</option>
              <option value="2">Age Non</option>
            </select>

            <select style={inputStyle} value={desagSexe} onChange={(e) => setDesagSexe(e.target.value as any)}>
              <option value="3">Sexe (Sans objet)</option>
              <option value="1">Sexe Oui</option>
              <option value="2">Sexe Non</option>
            </select>

            <select style={inputStyle} value={desagHandicap} onChange={(e) => setDesagHandicap(e.target.value as any)}>
              <option value="3">Handicap (Sans objet)</option>
              <option value="1">Handicap Oui</option>
              <option value="2">Handicap Non</option>
            </select>

            <select style={inputStyle} value={desagDecision} onChange={(e) => setDesagDecision(e.target.value as any)}>
              <option value="3">Participation décision (Sans objet)</option>
              <option value="1">Participation décision Oui</option>
              <option value="2">Participation décision Non</option>
            </select>

            <select style={inputStyle} value={desagTerr} onChange={(e) => setDesagTerr(e.target.value as any)}>
              <option value="3">Par niveau territorial ? (Sans objet)</option>
              <option value="1">Par niveau territorial ? Oui</option>
              <option value="2">Par niveau territorial ? Non</option>
            </select>

            <select style={inputStyle} value={desagRegion} onChange={(e) => setDesagRegion(e.target.value as any)}>
              <option value="3">Territorial: Région (Sans objet)</option>
              <option value="1">Territorial: Région Oui</option>
              <option value="2">Territorial: Région Non</option>
            </select>

            <select style={inputStyle} value={desagCercle} onChange={(e) => setDesagCercle(e.target.value as any)}>
              <option value="3">Territorial: Cercle (Sans objet)</option>
              <option value="1">Territorial: Cercle Oui</option>
              <option value="2">Territorial: Cercle Non</option>
            </select>

            <select style={inputStyle} value={desagArr} onChange={(e) => setDesagArr(e.target.value as any)}>
              <option value="3">Territorial: Arrondissement (Sans objet)</option>
              <option value="1">Territorial: Arrondissement Oui</option>
              <option value="2">Territorial: Arrondissement Non</option>
            </select>

            <select style={inputStyle} value={desagCommune} onChange={(e) => setDesagCommune(e.target.value as any)}>
              <option value="3">Territorial: Commune (Sans objet)</option>
              <option value="1">Territorial: Commune Oui</option>
              <option value="2">Territorial: Commune Non</option>
            </select>

            <input
              style={inputStyle}
              placeholder="Autre niveau territorial (si précisé)"
              value={desagAutreTerr}
              onChange={(e) => setDesagAutreTerr(e.target.value)}
            />

            <select style={inputStyle} value={desagMilieu} onChange={(e) => setDesagMilieu(e.target.value as any)}>
              <option value="3">Milieu de résidence ? (Sans objet)</option>
              <option value="1">Milieu de résidence ? Oui</option>
              <option value="2">Milieu de résidence ? Non</option>
            </select>

            <select style={inputStyle} value={desagUrbain} onChange={(e) => setDesagUrbain(e.target.value as any)}>
              <option value="3">Milieu: Urbain (Sans objet)</option>
              <option value="1">Milieu: Urbain Oui</option>
              <option value="2">Milieu: Urbain Non</option>
            </select>

            <select style={inputStyle} value={desagRural} onChange={(e) => setDesagRural(e.target.value as any)}>
              <option value="3">Milieu: Rural (Sans objet)</option>
              <option value="1">Milieu: Rural Oui</option>
              <option value="2">Milieu: Rural Non</option>
            </select>

            <select style={inputStyle} value={desagAutre} onChange={(e) => setDesagAutre(e.target.value as any)}>
              <option value="3">Autre niveau ? (Sans objet)</option>
              <option value="1">Autre niveau ? Oui</option>
              <option value="2">Autre niveau ? Non</option>
            </select>

            <input
              style={inputStyle}
              placeholder="Autre niveau à préciser"
              value={desagAutrePreciser}
              onChange={(e) => setDesagAutrePreciser(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 600 }}>2.03 Indicateurs renseignés (multi-choix)</div>
          <div
            style={{
              marginTop: 8,
              maxHeight: 220,
              overflow: "auto",
              border: "1px solid #eee",
              padding: 10,
              borderRadius: 8,
            }}
          >
            {indicateurs.map((it) => (
              <label key={it.code} style={{ display: "block", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={indicateursCodes.includes(it.code)}
                  onChange={() => setIndicateursCodes((a) => toggleInArray(a, it.code))}
                />{" "}
                {it.code} — {it.libelle}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>2.04 Envergure</div>
            <select style={inputStyle} value={envergure} onChange={(e) => setEnvergure(e.target.value)}>
              <option value="">Choisir…</option>
              <option value="1">Régional</option>
              <option value="2">Multirégional</option>
              <option value="3">National</option>
              <option value="4">Sous-régional</option>
              <option value="5">International</option>
              <option value="7">Autre (à préciser)</option>
            </select>
          </div>

          <input
            style={inputStyle}
            placeholder="Autre envergure (si choisi)"
            value={envergureAutre}
            onChange={(e) => setEnvergureAutre(e.target.value)}
          />

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontWeight: 600 }}>2.05 Activité programmée ?</div>
            <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
              <label>
                <input type="radio" checked={programmee === "1"} onChange={() => setProgrammee("1")} /> Oui
              </label>
              <label>
                <input type="radio" checked={programmee === "2"} onChange={() => setProgrammee("2")} /> Non
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Section 3 — Sources de vérification (3.10.05)</h2>

        <div
          style={{
            marginTop: 8,
            maxHeight: 220,
            overflow: "auto",
            border: "1px solid #eee",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {sourcesVerif.map((it) => (
            <label key={it.code} style={{ display: "block", marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={sourcesVerifCodes.includes(it.code)}
                onChange={() => setSourcesVerifCodes((a) => toggleInArray(a, it.code))}
              />{" "}
              {it.code} — {it.libelle}
            </label>
          ))}
        </div>

        <input
          style={{ ...inputStyle, marginTop: 10 }}
          placeholder="Autre source à préciser (optionnel)"
          value={sourceVerifAutre}
          onChange={(e) => setSourceVerifAutre(e.target.value)}
        />
      </section>

      {/* SECTION 4 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Section 4 — Produits obtenus (3.11)</h2>

        <div
          style={{
            marginTop: 8,
            maxHeight: 220,
            overflow: "auto",
            border: "1px solid #eee",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {produits.map((it) => (
            <label key={it.code} style={{ display: "block", marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={produitsCodes.includes(it.code)}
                onChange={() => setProduitsCodes((a) => toggleInArray(a, it.code))}
              />{" "}
              {it.code} — {it.libelle}
            </label>
          ))}
        </div>

        <input
          style={{ ...inputStyle, marginTop: 10 }}
          placeholder="Autre produit à préciser (optionnel)"
          value={produitAutre}
          onChange={(e) => setProduitAutre(e.target.value)}
        />
      </section>

      {/* SECTION 5 */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Section 5 — Sources de financement (4.01)</h2>

        <div
          style={{
            marginTop: 8,
            maxHeight: 220,
            overflow: "auto",
            border: "1px solid #eee",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {sourcesFinance.map((it) => (
            <label key={it.code} style={{ display: "block", marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={financementCodes.includes(it.code)}
                onChange={() => setFinancementCodes((a) => toggleInArray(a, it.code))}
              />{" "}
              {it.code} — {it.libelle}
            </label>
          ))}
        </div>

        <input
          style={{ ...inputStyle, marginTop: 10 }}
          placeholder="Autre source de financement à préciser (optionnel)"
          value={financementAutre}
          onChange={(e) => setFinancementAutre(e.target.value)}
        />
      </section>

      {/* Actions */}
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
        <button disabled={busy} onClick={() => save("brouillon")} style={{ padding: 10 }}>
          {busy ? "..." : "Enregistrer brouillon"}
        </button>
        <button disabled={busy} onClick={() => save("soumis")} style={{ padding: 10 }}>
          {busy ? "..." : "Soumettre"}
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 18, opacity: 0.7 }}>
        NB: Les données sont stockées dans <b>answers_fiche1.data</b> (JSON).
      </p>
    </main>
  );
}
