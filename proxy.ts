import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/companies/:path*",
    "/departments/:path*",
    "/teams/:path*",
    "/employees/:path*",
    "/roles/:path*",
    "/permissions/:path*",
    "/users/:path*",
    "/company-access/:path*",
    "/profile/:path*",
  ],
};