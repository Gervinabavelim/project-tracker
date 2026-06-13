import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDbPath(): string {
  const candidates = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "..", "prisma", "dev.db"),
    path.join(process.cwd(), "..", "..", "prisma", "dev.db"),
  ];

  // In Electron production: extraResources puts prisma/ next to app.asar
  if (process.resourcesPath) {
    candidates.unshift(path.join(process.resourcesPath, "prisma", "dev.db"));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}

function createClient() {
  const dbPath = resolveDbPath();
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
