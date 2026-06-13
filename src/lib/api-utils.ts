import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { STATUSES, PRIORITIES } from "@/lib/constants";
import { prisma } from "@/lib/db";

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("Prisma error:", error.code, error.message);
        return NextResponse.json(
          { error: "Database error" },
          { status: 500 }
        );
      }
      if (error instanceof Prisma.PrismaClientInitializationError) {
        console.error("Prisma init error:", error.message);
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 }
        );
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null) {
      return `Missing required field: ${field}`;
    }
    if (typeof value === "string" && value.trim() === "") {
      return `${field} cannot be empty`;
    }
  }
  return null;
}

export function validateProjectFields(
  body: Record<string, unknown>
): string | null {
  if (
    body.status !== undefined &&
    !(STATUSES as readonly string[]).includes(body.status as string)
  ) {
    return `Invalid status: must be one of ${STATUSES.join(", ")}`;
  }
  if (
    body.priority !== undefined &&
    !(PRIORITIES as readonly string[]).includes(body.priority as string)
  ) {
    return `Invalid priority: must be one of ${PRIORITIES.join(", ")}`;
  }
  if (body.progress !== undefined) {
    const p = Number(body.progress);
    if (isNaN(p) || p < 0 || p > 100) {
      return "Progress must be between 0 and 100";
    }
  }
  return null;
}

const ALLOWED_PROJECT_FIELDS = new Set([
  "name",
  "description",
  "status",
  "priority",
  "progress",
  "dueDate",
  "tags",
  "notes",
  "archived",
  "directory",
  "lastScannedAt",
  "assigneeId",
]);

export function pickProjectFields(
  body: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_PROJECT_FIELDS.has(key)) {
      result[key] = body[key];
    }
  }
  return result;
}

const ALLOWED_TASK_FIELDS = new Set(["completed", "text"]);

export function pickTaskFields(
  body: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_TASK_FIELDS.has(key)) {
      result[key] = body[key];
    }
  }
  return result;
}

export async function syncProjectFromTasks(projectId: string) {
  const allTasks = await prisma.task.findMany({ where: { projectId } });
  const completed = allTasks.filter((t) => t.completed).length;
  const newProgress = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  let newStatus = project.status;
  if (newProgress === 100 && allTasks.length > 0) {
    newStatus = "Done";
  } else if (newProgress > 0 && project.status === "Planning") {
    newStatus = "In Progress";
  } else if (newProgress === 0 && project.status === "Done") {
    newStatus = "Planning";
  } else if (newProgress === 0 && project.status === "In Progress") {
    newStatus = "Planning";
  }

  const updates: Record<string, unknown> = { progress: newProgress };
  if (newStatus !== project.status) {
    updates.status = newStatus;
    await prisma.activityLog.create({
      data: { projectId, action: `Status auto-changed from ${project.status} to ${newStatus}` },
    });
  }
  if (newProgress !== project.progress) {
    await prisma.activityLog.create({
      data: { projectId, action: `Progress auto-updated to ${newProgress}%` },
    });
  }

  await prisma.project.update({ where: { id: projectId }, data: updates });
}

export async function getOrgProject(projectId: string, orgId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, orgId },
  });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
