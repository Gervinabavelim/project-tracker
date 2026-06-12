import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler, pickTaskFields, notFound, syncProjectFromTasks } from "@/lib/api-utils";

export const PATCH = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const { id, taskId } = await params;
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
    const { id, taskId } = await params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return notFound("Task not found");
    if (task.projectId !== id) return notFound("Task not found");

    await prisma.task.delete({ where: { id: taskId } });

    await prisma.activityLog.create({
      data: { projectId: id, action: `Task removed: "${task.text}"` },
    });

    await syncProjectFromTasks(id);

    return NextResponse.json({ ok: true });
  }
);
