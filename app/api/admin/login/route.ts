import { NextResponse } from "next/server";
import crypto from "crypto";

function constantTimeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const password = body?.password;

    if (
      typeof password !== "string" ||
      !constantTimeEqual(password, adminPassword)
    ) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const sessionValue = crypto
      .createHash("sha256")
      .update(adminPassword)
      .digest("hex");

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 401 });
  }
}
