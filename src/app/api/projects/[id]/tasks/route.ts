import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/projects/:id/tasks — add a task
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const maxOrder = await prisma.task.aggregate({
    where: { projectId: id },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      text: body.text,
      projectId: id,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await prisma.activityLog.create({
    data: { projectId: id, action: `Task added: "${body.text}"` },
  });

  return NextResponse.json(task, { status: 201 });
}
