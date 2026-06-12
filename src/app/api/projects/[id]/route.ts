import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withErrorHandler,
  validateProjectFields,
  pickProjectFields,
  badRequest,
  notFound,
  getOrgProject,
  forbidden,
} from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";

export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();

    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, orgId: ctx.orgId },
      include: {
        tasks: { orderBy: { order: "asc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!project) return notFound("Project not found");
    return NextResponse.json(project);
  }
);

export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();
    if (ctx.role === "viewer") return forbidden("Viewers cannot edit projects");

    const { id } = await params;
    const body = await req.json();

    const invalid = validateProjectFields(body);
    if (invalid) return badRequest(invalid);

    const current = await getOrgProject(id, ctx.orgId);
    if (!current) return notFound("Project not found");

    if (body.status && current.status !== body.status) {
      await prisma.activityLog.create({
        data: {
          projectId: id,
          action: `Status changed from ${current.status} to ${body.status}`,
          userId: ctx.userId,
        },
      });
    }

    if (body.progress !== undefined && current.progress !== body.progress) {
      await prisma.activityLog.create({
        data: {
          projectId: id,
          action: `Progress updated from ${current.progress}% to ${body.progress}%`,
          userId: ctx.userId,
        },
      });
    }

    const data = pickProjectFields(body);
    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        tasks: { orderBy: { order: "asc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });
    return NextResponse.json(project);
  }
);

export const DELETE = withErrorHandler(
  async (
    _req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();
    if (ctx.role === "viewer") return forbidden("Viewers cannot delete projects");

    const { id } = await params;
    const project = await getOrgProject(id, ctx.orgId);
    if (!project) return notFound("Project not found");

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
);
