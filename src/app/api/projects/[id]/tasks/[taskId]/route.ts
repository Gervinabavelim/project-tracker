import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withErrorHandler,
  pickTaskFields,
  notFound,
  syncProjectFromTasks,
  getOrgProject,
  forbidden,
} from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";

export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();
    if (ctx.role === "viewer") return forbidden("Viewers cannot edit tasks");

    const { id, taskId } = await params;

    const project = await getOrgProject(id, ctx.orgId);
    if (!project) return notFound("Project not found");

    const body = await req.json();

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return notFound("Task not found");
    if (existing.projectId !== id) return notFound("Task not found");

    const data = pickTaskFields(body);

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    if (body.completed !== undefined) {
      await prisma.activityLog.create({
        data: {
          projectId: id,
          action: body.completed
            ? `Task completed: "${task.text}"`
            : `Task reopened: "${task.text}"`,
          userId: ctx.userId,
        },
      });
      await syncProjectFromTasks(id);
    }

    return NextResponse.json(task);
  }
);

export const DELETE = withErrorHandler(
  async (
    _req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();
    if (ctx.role === "viewer") return forbidden("Viewers cannot delete tasks");

    const { id, taskId } = await params;

    const project = await getOrgProject(id, ctx.orgId);
    if (!project) return notFound("Project not found");

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return notFound("Task not found");
    if (task.projectId !== id) return notFound("Task not found");

    await prisma.task.delete({ where: { id: taskId } });

    await prisma.activityLog.create({
      data: { projectId: id, action: `Task removed: "${task.text}"`, userId: ctx.userId },
    });

    await syncProjectFromTasks(id);

    return NextResponse.json({ ok: true });
  }
);
