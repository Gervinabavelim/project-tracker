import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";

export const GET = withErrorHandler(async () => {
  const ctx = await getSessionContext();
  if (!ctx) return unauthorized();

  const org = await prisma.organization.findUnique({
    where: { id: ctx.orgId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  return NextResponse.json(org);
});
