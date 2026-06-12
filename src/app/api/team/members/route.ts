import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler, badRequest, forbidden } from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";
import bcrypt from "bcryptjs";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getSessionContext();
  if (!ctx) return unauthorized();
  if (ctx.role !== "admin") return forbidden("Only admins can invite members");

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) return badRequest("Name, email, and password are required");
  if (role && !["admin", "member", "viewer"].includes(role)) {
    return badRequest("Invalid role");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const alreadyMember = await prisma.orgMember.findFirst({
      where: { userId: existing.id, orgId: ctx.orgId },
    });
    if (alreadyMember) return badRequest("User is already a team member");

    const member = await prisma.orgMember.create({
      data: { userId: existing.id, orgId: ctx.orgId, role: role ?? "member" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(member, { status: 201 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashed },
  });

  const member = await prisma.orgMember.create({
    data: { userId: user.id, orgId: ctx.orgId, role: role ?? "member" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(member, { status: 201 });
});
