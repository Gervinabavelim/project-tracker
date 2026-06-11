import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withErrorHandler,
  validateProjectFields,
  pickProjectFields,
  badRequest,
  notFound,
} from "@/lib/api-utils";

export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
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
    const { id } = await params;
    const body = await req.json();

    const invalid = validateProjectFields(body);
    if (invalid) return badRequest(invalid);

    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) return notFound("Project not found");

    if (body.status && current.status !== body.status) {
      await prisma.activityLog.create({
        data: {
          projectId: id,
          action: `Status changed from ${current.status} to ${body.status}`,
        },
      });
    }

    if (body.progress !== undefined && current.progress !== body.progress) {
      await prisma.activityLog.create({
        data: {
          projectId: id,
          action: `Progress updated from ${current.progress}% to ${body.progress}%`,
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
    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project not found");
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
);
