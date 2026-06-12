import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withErrorHandler,
  validateRequired,
  badRequest,
  notFound,
  syncProjectFromTasks,
  getOrgProject,
  forbidden,
} from "@/lib/api-utils";
import { getSessionContext, unauthorized } from "@/lib/session";

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const ctx = await getSessionContext();
    if (!ctx) return unauthorized();
    if (ctx.role === "viewer") return forbidden("Viewers cannot add tasks");

    const { id } = await params;
    const body = await req.json();

    const project = await getOrgProject(id, ctx.orgId);
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
      data: { projectId: id, action: `Task added: "${text}"`, userId: ctx.userId },
    });

    await syncProjectFromTasks(id);

    return NextResponse.json(task, { status: 201 });
  }
);
