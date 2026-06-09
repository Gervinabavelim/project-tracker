import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/projects — list all projects with tasks
export async function GET() {
  const projects = await prisma.project.findMany({
    include: { tasks: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(projects);
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description ?? "",
      status: body.status ?? "Planning",
      priority: body.priority ?? "Medium",
      progress: body.progress ?? 0,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: body.tags ?? "",
      notes: body.notes ?? "",
      activities: {
        create: { action: "Project created" },
      },
    },
    include: { tasks: true, activities: true },
  });
  return NextResponse.json(project, { status: 201 });
}
