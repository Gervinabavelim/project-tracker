import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler, badRequest, forbidden, notFound } from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";

export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();
    if (ctx.role !== "admin") return forbidden("Only admins can change roles");

    const { memberId } = await params;
    const { role } = await req.json();

    if (!["admin", "member", "viewer"].includes(role)) {
      return badRequest("Invalid role");
    }

    const member = await prisma.orgMember.findFirst({
      where: { id: memberId, orgId: ctx.orgId },
    });
    if (!member) return notFound("Member not found");

    if (member.userId === ctx.userId) {
      return badRequest("Cannot change your own role");
    }

    const updated = await prisma.orgMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(updated);
  }
);

export const DELETE = withErrorHandler(
  async (
    _req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();
    if (ctx.role !== "admin") return forbidden("Only admins can remove members");

    const { memberId } = await params;

    const member = await prisma.orgMember.findFirst({
      where: { id: memberId, orgId: ctx.orgId },
    });
    if (!member) return notFound("Member not found");

    if (member.userId === ctx.userId) {
      return badRequest("Cannot remove yourself");
    }

    await prisma.orgMember.delete({ where: { id: memberId } });
    return NextResponse.json({ ok: true });
  }
);
