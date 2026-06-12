import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler, notFound } from "@/lib/api-utils";

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const { id } = await params;
    const body = await req.json();

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return notFound("Project not found");

    const events: { action: string }[] = body.events ?? [];
    for (const event of events) {
      await prisma.activityLog.create({
        data: { projectId: id, action: event.action },
      });
    }

    const updates: Record<string, unknown> = {
      lastScannedAt: new Date(),
    };

    if (body.progress !== undefined) {
      updates.progress = body.progress;
    }
    if (body.status !== undefined) {
      updates.status = body.status;
    }

    await prisma.project.update({ where: { id }, data: updates });

    return NextResponse.json({ ok: true, logged: events.length });
  }
);
