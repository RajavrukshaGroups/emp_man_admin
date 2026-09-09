"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export interface AttendanceLocationMapValue {
  latitude: number;
  longitude: number;
}

interface AttendanceLocationMapProps {
  value: AttendanceLocationMapValue;

  radiusMeters: number;

  onChange: (value: AttendanceLocationMapValue) => void;

  height?: string;

  disabled?: boolean;
}

/**
 * Fix Leaflet's default marker icons when used with bundlers/Next.js.
 */
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

export function AttendanceLocationMap({
  value,
  radiusMeters,
  onChange,
  height = "420px",
  disabled = false,
}: AttendanceLocationMapProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
      style={{ height }}
    >
      <MapContainer
        center={[value.latitude, value.longitude]}
        zoom={17}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapPositionController
          latitude={value.latitude}
          longitude={value.longitude}
        />

        <MapClickHandler disabled={disabled} onChange={onChange} />

        <Marker
          position={[value.latitude, value.longitude]}
          icon={markerIcon}
          draggable={!disabled}
          eventHandlers={{
            dragend(event) {
              if (disabled) {
                return;
              }

              const marker = event.target as L.Marker;

              const position = marker.getLatLng();

              onChange({
                latitude: position.lat,
                longitude: position.lng,
              });
            },
          }}
        />

        <Circle
          center={[value.latitude, value.longitude]}
          radius={radiusMeters}
          pathOptions={{
            fillOpacity: 0.12,
            weight: 2,
          }}
        />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
        Click the map or drag the marker to adjust the location.
      </div>
    </div>
  );
}

interface MapClickHandlerProps {
  disabled: boolean;

  onChange: (value: AttendanceLocationMapValue) => void;
}

function MapClickHandler({ disabled, onChange }: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      if (disabled) {
        return;
      }

      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

interface MapPositionControllerProps {
  latitude: number;

  longitude: number;
}

/**
 * Keeps the Leaflet map synchronized when coordinates are
 * changed outside the map.
 *
 * Examples:
 * - location search
 * - "Use current location"
 * - manually entered coordinates
 */
function MapPositionController({
  latitude,
  longitude,
}: MapPositionControllerProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 17), {
      animate: true,
      duration: 0.7,
    });
  }, [latitude, longitude, map]);

  return null;
}
