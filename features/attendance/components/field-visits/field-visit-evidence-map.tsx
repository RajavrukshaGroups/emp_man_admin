"use client";

import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

interface FieldVisitEvidenceMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  label?: string;
}

export function FieldVisitEvidenceMap({
  latitude,
  longitude,
  accuracy,
  label = "Recorded location",
}: FieldVisitEvidenceMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={position}
        zoom={17}
        scrollWheelZoom={false}
        dragging
        doubleClickZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapPositionUpdater latitude={latitude} longitude={longitude} />

        {typeof accuracy === "number" && accuracy > 0 && (
          <Circle
            center={position}
            radius={accuracy}
            pathOptions={{
              fillOpacity: 0.08,
              opacity: 0.35,
            }}
          />
        )}

        <Marker position={position} draggable={false}>
          <Popup>
            <div className="space-y-1">
              <strong>{label}</strong>

              <div>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>

              {typeof accuracy === "number" && (
                <div>Accuracy: {Math.round(accuracy)} m</div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

function MapPositionUpdater({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], 17);
  }, [map, latitude, longitude]);

  return null;
}
