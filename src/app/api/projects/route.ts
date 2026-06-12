import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withErrorHandler,
  validateRequired,
  validateProjectFields,
  badRequest,
} from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getSessionContext();
  if (!ctx) return unauthorized();

  const showArchived = req.nextUrl.searchParams.get("archived") === "true";
  const projects = await prisma.project.findMany({
    where: { orgId: ctx.orgId, archived: showArchived },
    include: { tasks: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(projects);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getSessionContext();
  if (!ctx) return unauthorized();
  if (ctx.role === "viewer") return badRequest("Viewers cannot create projects");

  const body = await req.json();

  const missing = validateRequired(body, ["name"]);
  if (missing) return badRequest(missing);

  const invalid = validateProjectFields(body);
  if (invalid) return badRequest(invalid);

  const project = await prisma.project.create({
    data: {
      name: (body.name as string).trim(),
      description: body.description ?? "",
      status: body.status ?? "Planning",
      priority: body.priority ?? "Medium",
      progress: body.progress ?? 0,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: body.tags ?? "",
      notes: body.notes ?? "",
      orgId: ctx.orgId,
      activities: {
        create: { action: "Project created", userId: ctx.userId },
      },
    },
    include: { tasks: true, activities: true },
  });
  return NextResponse.json(project, { status: 201 });
});
