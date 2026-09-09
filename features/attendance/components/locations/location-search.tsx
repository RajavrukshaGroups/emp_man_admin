"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

export interface LocationSearchResult {
  placeId: string;
  displayName: string;

  latitude: number;
  longitude: number;

  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;

  address?: {
    name?: string;
    building?: string;
    amenity?: string;
    office?: string;
    shop?: string;
    tourism?: string;

    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;

    city?: string;
    town?: string;
    village?: string;
    municipality?: string;

    city_district?: string;
    district?: string;
    county?: string;

    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface LocationSearchProps {
  onSelect: (result: LocationSearchResult) => void;
}

export function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current;

      try {
        setIsLoading(true);

        const params = new URLSearchParams({
          q: trimmedQuery,
          format: "jsonv2",
          addressdetails: "1",
          limit: "6",
          countrycodes: "in",
        });

        const response = await fetch(
          `/api/geocoding/search?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Unable to search locations.");
        }

        const data = (await response.json()) as NominatimResult[];

        if (requestId !== requestIdRef.current) {
          return;
        }

        const mapped = data.map(mapSearchResult);

        setResults(mapped);
        setIsOpen(mapped.length > 0);
      } catch {
        if (requestId === requestIdRef.current) {
          setResults([]);
          setIsOpen(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  function handleSelect(result: LocationSearchResult) {
    setQuery(result.displayName);
    setResults([]);
    setIsOpen(false);

    onSelect(result);
  }

  function handleClear() {
    requestIdRef.current += 1;

    setQuery("");
    setResults([]);
    setIsOpen(false);
    setIsLoading(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search building, company or address..."
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-20 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />

        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : null}

          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 transition hover:text-slate-700"
              aria-label="Clear location search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-[1200] mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {results.map((result) => (
            <button
              key={result.placeId}
              type="button"
              onClick={() => handleSelect(result)}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-50"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <MapPin className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium leading-5 text-slate-900">
                  {result.displayName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function mapSearchResult(item: NominatimResult): LocationSearchResult {
  const address = item.address ?? {};

  const placeName =
    address.name ||
    address.building ||
    address.amenity ||
    address.office ||
    address.shop ||
    address.tourism ||
    "";

  const road = [address.house_number, address.road].filter(Boolean).join(" ");

  return {
    placeId: String(item.place_id),

    displayName: item.display_name,

    latitude: Number(item.lat),
    longitude: Number(item.lon),

    address: {
      addressLine1: placeName || road,

      addressLine2: placeName && road ? road : "",

      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        "",

      district:
        address.city_district || address.district || address.county || "",

      state: address.state || "",

      country: address.country || "",

      postalCode: address.postcode || "",
    },
  };
}
