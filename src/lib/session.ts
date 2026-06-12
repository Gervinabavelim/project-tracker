import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function getSessionContext() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
  });
  if (!membership) return null;

  return {
    userId: session.user.id,
    orgId: membership.orgId,
    role: membership.role,
    orgName: membership.org.name,
  };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
