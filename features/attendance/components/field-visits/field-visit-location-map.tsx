"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

import "leaflet/dist/leaflet.css";

interface FieldVisitLocationMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export function FieldVisitLocationMap({
  latitude,
  longitude,
  accuracy,
}: FieldVisitLocationMapProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={true}
        style={{
          height: "260px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CircleMarker
          center={[latitude, longitude]}
          radius={9}
          pathOptions={{
            fillOpacity: 0.9,
          }}
        >
          <Tooltip permanent direction="top">
            Detected location
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-medium text-slate-700">
          GPS detected location
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
          {accuracy != null ? ` · Accuracy ±${Math.round(accuracy)}m` : ""}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          This location is read-only and cannot be manually changed.
        </p>
      </div>
    </div>
  );
}
