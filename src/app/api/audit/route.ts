import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler, forbidden } from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getSessionContext();
  if (!ctx) return unauthorized();
  if (ctx.role !== "admin") return forbidden("Only admins can view the audit log");

  const url = req.nextUrl;
  const userId = url.searchParams.get("userId");
  const projectId = url.searchParams.get("projectId");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = 50;

  const where: Record<string, unknown> = {
    project: { orgId: ctx.orgId },
  };
  if (userId) where.userId = userId;
  if (projectId) where.projectId = projectId;

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ activities, total, page, pages: Math.ceil(total / limit) });
});
