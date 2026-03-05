"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Option = {
  id: number;
  label: string;
};

type Props = {
  valueRegion?: number | "";
  valueCercle?: number | "";
  onChange?: (data: { region_id: number | ""; cercle_id: number | "" }) => void;
};

export default function RegionCercle({
  valueRegion = "",
  valueCercle = "",
  onChange,
}: Props) {
  const [regions, setRegions] = useState<Option[]>([]);
  const [cercles, setCercles] = useState<Option[]>([]);
  const [regionId, setRegionId] = useState<number | "">(valueRegion);
  const [cercleId, setCercleId] = useState<number | "">(valueCercle);

  // Charger les régions
  useEffect(() => {
    const loadRegions = async () => {
      const { data, error } = await supabase
        .from("ref_regions")
        .select("id,label")
        .order("label");

      if (!error && data) setRegions(data);
    };

    loadRegions();
  }, []);

  // Charger les cercles selon région
  useEffect(() => {
    const loadCercles = async () => {
      if (!regionId) {
        setCercles([]);
        return;
      }

      const { data, error } = await supabase
        .from("ref_cercles")
        .select("id,label")
        .eq("region_id", regionId)
        .order("label");

      if (!error && data) setCercles(data);
    };

    loadCercles();
  }, [regionId]);

  // notifier parent
  useEffect(() => {
    if (onChange) {
      onChange({
        region_id: regionId,
        cercle_id: cercleId,
      });
    }
  }, [regionId, cercleId, onChange]);

  return (
    <div className="space-y-4">
      {/* REGION */}
      <div>
        <label className="block text-sm font-medium mb-1">Région</label>

        <select
          value={regionId}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : "";
            setRegionId(val);
            setCercleId(""); // reset cercle
          }}
          className="border rounded-lg p-2 w-full"
        >
          <option value="">Choisir la région</option>

          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* CERCLE */}
      <div>
        <label className="block text-sm font-medium mb-1">Cercle</label>

        <select
          value={cercleId}
          onChange={(e) =>
            setCercleId(e.target.value ? Number(e.target.value) : "")
          }
          className="border rounded-lg p-2 w-full"
          disabled={!regionId}
        >
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
