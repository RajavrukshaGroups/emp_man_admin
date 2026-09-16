"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AttendanceLocationPreviewMapProps {
  currentLocation: Coordinates;

  attendanceLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
    geofenceRadiusMeters?: number;
  } | null;

  showGeofence?: boolean;

  height?: string;
}

const employeeMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const attendanceLocationIcon = L.divIcon({
  className: "",

  html: `
    <div
      style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #0f172a;
        border: 4px solid white;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <div
        style="
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: white;
        "
      ></div>
    </div>
  `,

  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export function AttendanceLocationPreviewMap({
  currentLocation,
  attendanceLocation,
  showGeofence = true,
  height = "300px",
}: AttendanceLocationPreviewMapProps) {
  const hasAttendanceLocation =
    typeof attendanceLocation?.latitude === "number" &&
    typeof attendanceLocation?.longitude === "number";

  const officeCoordinates = useMemo<Coordinates | null>(() => {
    if (!hasAttendanceLocation) {
      return null;
    }

    return {
      latitude: attendanceLocation!.latitude!,
      longitude: attendanceLocation!.longitude!,
    };
  }, [
    attendanceLocation?.latitude,
    attendanceLocation?.longitude,
    hasAttendanceLocation,
  ]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
      style={{ height }}
    >
      <MapContainer
        center={[currentLocation.latitude, currentLocation.longitude]}
        zoom={17}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsController
          currentLocation={currentLocation}
          attendanceLocation={officeCoordinates}
        />

        {/* Employee's actual browser GPS position */}
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={employeeMarkerIcon}
          draggable={false}
        />

        {officeCoordinates ? (
          <>
            {/* Assigned attendance location */}
            <Marker
              position={[
                officeCoordinates.latitude,
                officeCoordinates.longitude,
              ]}
              icon={attendanceLocationIcon}
              draggable={false}
            />

            {showGeofence ? (
              <Circle
                center={[
                  officeCoordinates.latitude,
                  officeCoordinates.longitude,
                ]}
                radius={attendanceLocation?.geofenceRadiusMeters ?? 0}
                pathOptions={{
                  fillOpacity: 0.12,
                  weight: 2,
                }}
              />
            ) : null}
          </>
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
        Your location is detected automatically and cannot be moved.
      </div>
    </div>
  );
}

interface MapBoundsControllerProps {
  currentLocation: Coordinates;

  attendanceLocation: Coordinates | null;
}

function MapBoundsController({
  currentLocation,
  attendanceLocation,
}: MapBoundsControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!attendanceLocation) {
      map.flyTo([currentLocation.latitude, currentLocation.longitude], 17, {
        animate: true,
        duration: 0.6,
      });

      return;
    }

    const bounds = L.latLngBounds([
      [currentLocation.latitude, currentLocation.longitude],

      [attendanceLocation.latitude, attendanceLocation.longitude],
    ]);

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 17,
      animate: true,
    });
  }, [
    currentLocation.latitude,
    currentLocation.longitude,
    attendanceLocation,
    map,
  ]);

  return null;
}
