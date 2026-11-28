import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis;

function isNodeRuntime() {
  return (
    !(
      typeof navigator !== "undefined" &&
      navigator.userAgent === "Cloudflare-Workers"
    ) &&
    typeof process !== "undefined" &&
    process.release?.name === "node" &&
    Boolean(process.versions?.node)
  );
}

function shouldUseLocalSqlite() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.USE_CLOUDFLARE_D1_DEV !== "true" &&
    (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) &&
    isNodeRuntime()
  );
}

export function getDatabaseProvider() {
  if (shouldUseLocalSqlite()) {
    return "sqlite";
  }
  return globalThis[Symbol.for("__cloudflare-context__")]?.env?.DB
    ? "d1"
    : "sqlite";
}

function createSqliteClient() {
  const nodeModule = process.getBuiltinModule?.("node:module");
  const req =
    typeof require !== "undefined"
      ? require
      : nodeModule?.createRequire?.(import.meta.url);

  if (!req) {
    throw new Error("Unable to load SQLite adapter outside Node.js.");
  }

  // Dynamic lookup avoids bundling native better-sqlite3 into Cloudflare Workers
  const sqliteAdapterPkg = "@prisma/adapter-better-sqlite3";
  const { PrismaBetterSqlite3 } = req(sqliteAdapterPkg);
  let url = process.env.DATABASE_URL || "file:./prisma/dev.db";
  if (!url.startsWith("file:")) {
    url = "file:./prisma/dev.db";
  }
  const filePath = url.slice("file:".length).split("?")[0];
  if (filePath && filePath !== ":memory:") {
    const fs =
      process.getBuiltinModule?.("node:fs") ||
      (typeof require !== "undefined" ? require("fs") : null);
    const path =
      process.getBuiltinModule?.("node:path") ||
      (typeof require !== "undefined" ? require("path") : null);
    if (fs && path) {
      const dir = path.dirname(
        path.resolve(/*turbopackIgnore: true*/ process.cwd(), filePath)
      );
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

function createPrismaClient() {
  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  const d1 = cfContext?.env?.DB;

  if (shouldUseLocalSqlite()) {
    try {
      return createSqliteClient();
    } catch (err) {
      console.error("Failed to initialize Prisma SQLite adapter:", err);
      throw err;
    }
  }

  if (d1) {
    const adapter = new PrismaD1(d1);
    return new PrismaClient({ adapter });
  }

  if (isNodeRuntime()) {
    try {
      return createSqliteClient();
    } catch (err) {
      console.error("Failed to initialize Prisma SQLite adapter:", err);
      throw err;
    }
  }

  throw new Error("Missing Cloudflare D1 database binding (env.DB).");
}

export function getPrisma() {
  if (shouldUseLocalSqlite()) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  if (cfContext?.env?.DB) {
    if (!cfContext.__prisma) {
      cfContext.__prisma = createPrismaClient();
    }
    return cfContext.__prisma;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getPrisma();
      const value = Reflect.get(client, prop, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);

export default prisma;

export function isUniqueConstraintError(err) {
  if (!err || typeof err !== "object") return false;
  if (err.code === "P2002") return true;
  const msg = typeof err.message === "string" ? err.message : "";
  return (
    msg.includes("UNIQUE constraint failed") ||
    msg.includes("P2002") ||
    msg.toLowerCase().includes("unique constraint")
  );
}

export function isNotFoundError(err) {
  return Boolean(err && typeof err === "object" && err.code === "P2025");
}
