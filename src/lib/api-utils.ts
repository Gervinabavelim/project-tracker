import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { STATUSES, PRIORITIES } from "@/lib/constants";

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

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
