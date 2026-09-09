import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_SEARCH_URL =
    "https://nominatim.openstreetmap.org/search";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q")?.trim();

    if (!query || query.length < 3) {
        return NextResponse.json([]);
    }

    try {
        const params = new URLSearchParams({
            q: query,
            format: "jsonv2",
            addressdetails: "1",
            limit: "6",
            countrycodes: "in",
        });

        const response = await fetch(
            `${NOMINATIM_SEARCH_URL}?${params.toString()}`,
            {
                headers: {
                    Accept: "application/json",
                    "User-Agent":
                        "EmployeeManagementSoftware/1.0",
                },

                next: {
                    revalidate: 3600,
                },
            },
        );

        if (!response.ok) {
            return NextResponse.json(
                {
                    message: "Unable to search locations.",
                },
                {
                    status: 502,
                },
            );
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            {
                message: "Location search service is unavailable.",
            },
            {
                status: 500,
            },
        );
    }
}