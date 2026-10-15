"use client";

/**
 * Place pickers for booking a parcel (COURIERS.md §7 step 2).
 * Pathao: City → Zone → Area (optional), each list loaded from the one before.
 * RedX: one searchable area box. Steadfast: nothing to pick.
 */
import React, { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { getAdminCourierAreasAction } from "../actions/couriers";
import type { CourierArea, CourierAreaField, CourierKey } from "@/types/admin-orders";
import { Field, Input, Select, Spinner, useDebouncedCallback } from "./ui";

export type AreaValue = Partial<Record<CourierAreaField, number>>;

function useAreaList(courier: CourierKey, params: { city_id?: number; zone_id?: number } | null) {
  const key = params ? JSON.stringify(params) : null;
  // Results are remembered with the request they answer, so a stale answer is never shown.
  const [state, setState] = useState<{ key: string | null; items: CourierArea[]; error: string | null }>({
    key: null,
    items: [],
    error: null,
  });

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    getAdminCourierAreasAction(courier, JSON.parse(key)).then((res) => {
      if (cancelled) return;
      setState(res.success ? { key, items: res.data.data, error: null } : { key, items: [], error: res.error.message });
    });
    return () => {
      cancelled = true;
    };
  }, [courier, key]);

  const current = key !== null && state.key === key;
  return { items: current ? state.items : [], loading: key !== null && !current, error: current ? state.error : null };
}

function PathaoPickers({ value, onChange, disabled }: { value: AreaValue; onChange: (v: AreaValue) => void; disabled?: boolean }) {
  const cities = useAreaList("pathao", {});
  const zones = useAreaList("pathao", value.city_id ? { city_id: value.city_id } : null);
  const areas = useAreaList("pathao", value.zone_id ? { zone_id: value.zone_id } : null);

  const num = (v: string) => (v ? Number(v) : undefined);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field label="City" required hint={cities.error ?? undefined}>
        <Select
          value={value.city_id ?? ""}
          disabled={disabled || cities.loading}
          onChange={(e) => onChange({ city_id: num(e.target.value) })}
          aria-label="Pathao city"
        >
          <option value="">{cities.loading ? "Loading…" : "Choose a city"}</option>
          {cities.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Zone" required hint={zones.error ?? undefined}>
        <Select
          value={value.zone_id ?? ""}
          disabled={disabled || !value.city_id || zones.loading}
          onChange={(e) => onChange({ city_id: value.city_id, zone_id: num(e.target.value) })}
          aria-label="Pathao zone"
        >
          <option value="">{zones.loading ? "Loading…" : value.city_id ? "Choose a zone" : "Pick a city first"}</option>
          {zones.items.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Area" hint={areas.error ?? "Optional"}>
        <Select
          value={value.area_id ?? ""}
          disabled={disabled || !value.zone_id || areas.loading}
          onChange={(e) => onChange({ city_id: value.city_id, zone_id: value.zone_id, area_id: num(e.target.value) })}
          aria-label="Pathao area"
        >
          <option value="">{areas.loading ? "Loading…" : value.zone_id ? "Any area" : "Pick a zone first"}</option>
          {areas.items.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

function RedxPicker({ value, onChange, disabled }: { value: AreaValue; onChange: (v: AreaValue) => void; disabled?: boolean }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<CourierArea | null>(null);
  const [results, setResults] = useState<CourierArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const search = useDebouncedCallback(async (term: string) => {
    const mine = ++seq.current;
    const res = await getAdminCourierAreasAction("redx", { q: term });
    if (mine !== seq.current) return;
    setLoading(false);
    if (res.success) {
      setResults(res.data.data.slice(0, 50));
      setError(null);
    } else {
      setResults([]);
      setError(res.error.message);
    }
  });

  if (picked && value.area_id === picked.id) {
    return (
      <Field label="Area" required>
        <div className="flex items-center justify-between gap-3 h-10 px-3 rounded-lg ring-1 ring-slate-200 bg-slate-50 text-sm">
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate font-medium text-slate-800">{picked.name}</span>
            <span className="text-xs text-slate-500 truncate">
              {[picked.post_code, picked.district].filter(Boolean).join(" · ")}
            </span>
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setPicked(null);
              onChange({});
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            aria-label="Change area"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label="Area" required hint={error ?? "Type at least 2 letters of the area, post code or district."}>
      <div className="relative">
        <Input
          value={q}
          disabled={disabled}
          placeholder="e.g. Dhanmondi or 1205"
          onChange={(e) => {
            const term = e.target.value;
            setQ(term);
            if (term.trim().length >= 2) {
              setLoading(true);
              search(term.trim());
            } else {
              seq.current++;
              setLoading(false);
              setResults([]);
            }
          }}
        />
        {q.trim().length >= 2 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 max-h-60 overflow-y-auto py-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">No RedX area matches “{q.trim()}”.</p>
            ) : (
              results.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setPicked(a);
                    setQ("");
                    setResults([]);
                    onChange({ area_id: a.id });
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span className="text-sm font-medium text-slate-800 truncate">{a.name}</span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {[a.post_code, a.district].filter(Boolean).join(" · ")}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Field>
  );
}

/** Renders the right pickers for `courier`; `fields` comes from `area_fields` on the available-couriers list. */
export function CourierAreaPickers({
  courier,
  fields,
  value,
  onChange,
  disabled,
}: {
  courier: CourierKey;
  fields: CourierAreaField[];
  value: AreaValue;
  onChange: (v: AreaValue) => void;
  disabled?: boolean;
}) {
  if (fields.length === 0) return null;
  if (courier === "pathao") return <PathaoPickers value={value} onChange={onChange} disabled={disabled} />;
  if (courier === "redx") return <RedxPicker value={value} onChange={onChange} disabled={disabled} />;
  return null;
}

/** Which place fields the API insists on before booking (COURIERS.md §7 step 4). */
export function missingAreaFields(courier: CourierKey, value: AreaValue): CourierAreaField[] {
  if (courier === "pathao") return (["city_id", "zone_id"] as const).filter((f) => !value[f]);
  if (courier === "redx") return value.area_id ? [] : ["area_id"];
  return [];
}
