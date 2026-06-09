import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/projects/:id/tasks/:taskId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id: taskId },
    data: body,
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
  }

  return NextResponse.json(task);
}

// DELETE /api/projects/:id/tasks/:taskId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  await prisma.task.delete({ where: { id: taskId } });

  if (task) {
    await prisma.activityLog.create({
      data: { projectId: id, action: `Task removed: "${task.text}"` },
    });
  }

  return NextResponse.json({ ok: true });
}
