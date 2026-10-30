import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow /admin/login
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    return NextResponse.next();
  }

  // Allow admin auth APIs
  if (
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/login/" ||
    pathname === "/api/admin/logout" ||
    pathname === "/api/admin/logout/"
  ) {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionCookie = request.cookies.get("admin_session")?.value;

  let isAuthenticated = false;

  if (adminPassword && sessionCookie) {
    const expectedSession = crypto
      .createHash("sha256")
      .update(adminPassword)
      .digest("hex");

    const sessionBuffer = Buffer.from(sessionCookie);
    const expectedBuffer = Buffer.from(expectedSession);

    if (
      sessionBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sessionBuffer, expectedBuffer)
    ) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/ocr",
    "/api/generate-questions",
    "/api/bulk/:path*",
    "/api/admin/:path*",
  ],
};

export default proxy;
