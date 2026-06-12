import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withErrorHandler,
  validateRequired,
  badRequest,
  notFound,
  syncProjectFromTasks,
} from "@/lib/api-utils";

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const { id } = await params;
    const body = await req.json();

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project not found");

    const missing = validateRequired(body, ["text"]);
    if (missing) return badRequest(missing);

    const text = (body.text as string).trim();

    const maxOrder = await prisma.task.aggregate({
      where: { projectId: id },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        text,
        projectId: id,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    await prisma.activityLog.create({
      data: { projectId: id, action: `Task added: "${text}"` },
    });

    await syncProjectFromTasks(id);

    return NextResponse.json(task, { status: 201 });
  }
);
