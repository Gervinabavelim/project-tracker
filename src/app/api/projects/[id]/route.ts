import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { order: "asc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

// PATCH /api/projects/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Track status changes in activity log
  if (body.status) {
    const current = await prisma.project.findUnique({ where: { id } });
    if (current && current.status !== body.status) {
      await prisma.activityLog.create({
        data: {
          projectId: id,
          action: `Status changed from ${current.status} to ${body.status}`,
        },
      });
    }
  }

  // Track progress changes
  if (body.progress !== undefined) {
    const current = await prisma.project.findUnique({ where: { id } });
    if (current && current.progress !== body.progress) {
      await prisma.activityLog.create({
        data: {
          projectId: id,
          action: `Progress updated from ${current.progress}% to ${body.progress}%`,
        },
      });
    }
  }

  const data: Record<string, unknown> = { ...body };
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

// DELETE /api/projects/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
