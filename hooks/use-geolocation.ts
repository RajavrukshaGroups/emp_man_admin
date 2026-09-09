"use client";

import { useCallback, useState } from "react";

export interface BrowserLocation {
    latitude: number;
    longitude: number;
    accuracy: number;
    capturedAt: string;
}

type GeolocationStatus =
    | "idle"
    | "loading"
    | "success"
    | "error";

export function useGeolocation() {
    const [status, setStatus] =
        useState<GeolocationStatus>("idle");

    const [location, setLocation] =
        useState<BrowserLocation | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const getCurrentLocation =
        useCallback(async (): Promise<BrowserLocation> => {
            if (typeof window === "undefined") {
                throw new Error(
                    "Location is not available on the server.",
                );
            }

            if (!navigator.geolocation) {
                throw new Error(
                    "Location services are not supported by this browser.",
                );
            }

            setStatus("loading");
            setError(null);

            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const result: BrowserLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            capturedAt: new Date(
                                position.timestamp,
                            ).toISOString(),
                        };

                        setLocation(result);
                        setStatus("success");

                        resolve(result);
                    },

                    (geolocationError) => {
                        let message =
                            "Unable to access your current location.";

                        switch (geolocationError.code) {
                            case geolocationError.PERMISSION_DENIED:
                                message =
                                    "Location permission was denied. Please allow location access and try again.";
                                break;

                            case geolocationError.POSITION_UNAVAILABLE:
                                message =
                                    "Your current location could not be determined. Please check your GPS or network connection.";
                                break;

                            case geolocationError.TIMEOUT:
                                message =
                                    "Location request timed out. Please try again.";
                                break;
                        }

                        setError(message);
                        setStatus("error");

                        reject(new Error(message));
                    },

                    {
                        enableHighAccuracy: true,

                        timeout: 15000,

                        maximumAge: 0,
                    },
                );
            });
        }, []);

    const reset = useCallback(() => {
        setStatus("idle");
        setLocation(null);
        setError(null);
    }, []);

    return {
        status,

        location,

        error,

        isLoading: status === "loading",

        getCurrentLocation,

        reset,
    };
}