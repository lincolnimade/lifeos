import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-time password reset endpoint.
// Remove this file immediately after use.
const RESET_TOKEN = "rst_9k2m7x4q1p8v3n6z";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== RESET_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = "lincolnimade@gmail.com";
  const password = "Lynkyony1!";
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed },
    create: { email, password: hashed },
  });

  return NextResponse.json({ ok: true, email: user.email });
}
