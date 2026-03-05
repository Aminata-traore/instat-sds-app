"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Option = { id: number; label: string };

export default function RegionCercle() {
  const [regions, setRegions] = useState<Option[]>([]);
  const [cercles, setCercles] = useState<Option[]>([]);
  const [regionId, setRegionId] = useState<number | "">("");
  const [cercleId, setCercleId] = useState<number | "">("");

  useEffect(() => {
    const loadRegions = async () => {
      const { data } = await supabase
        .from("ref_regions")
        .select("id,label")
        .order("label");

      if (data) setRegions(data);
    };

    loadRegions();
  }, []);

  useEffect(() => {
    const loadCercles = async () => {
      if (!regionId) return;

      const { data } = await supabase
        .from("ref_cercles")
        .select("id,label")
        .eq("region_id", regionId)
        .order("label");

      if (data) setCercles(data);
    };

    loadCercles();
  }, [regionId]);

  return (
    <div className="space-y-4">

      <div>
        <label>Région</label>
        <select
          value={regionId}
          onChange={(e) => setRegionId(Number(e.target.value))}
          className="border p-2 w-full"
        >
          <option value="">Choisir la région</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Cercle</label>
        <select className="border p-2 w-full">
          <option value="">Choisir le cercle</option>
          {cercles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}
