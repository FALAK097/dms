import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

import Database from "better-sqlite3";

const prisma = "node_modules/prisma/build/index.js";
const migrationsDir = resolve("migrations");
const migrationFiles = (await readdir(migrationsDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

assert(
  migrationFiles.length > 0,
  "No SQL migration files found in migrations/ directory."
);
console.log(
  `Found ${migrationFiles.length} migration file(s): ${migrationFiles.join(", ")}`
);

const tempDbName = `test_migration_${randomBytes(8).toString("hex")}.db`;
const tempDbPath = resolve("prisma", tempDbName);

function runPrisma(args, databaseUrl) {
  const result = spawnSync(process.execPath, [prisma, ...args], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`
    );
  }
  return result.stdout;
}

try {
  console.log(
    `Applying migrations to temporary SQLite database: ${tempDbPath}`
  );
  const db = new Database(tempDbPath);

  try {
    db.pragma("foreign_keys = ON");

    for (const file of migrationFiles) {
      console.log(`Executing ${file}...`);
      const sql = await readFile(resolve(migrationsDir, file), "utf8");
      db.exec(sql);
    }

    const integrity = db.pragma("integrity_check");
    assert.deepEqual(
      integrity,
      [{ integrity_check: "ok" }],
      "SQLite integrity check failed."
    );

    const foreignKeyViolations = db.pragma("foreign_key_check");
    assert.deepEqual(
      foreignKeyViolations,
      [],
      `Foreign key violations detected: ${JSON.stringify(foreignKeyViolations)}`
    );

    const expectedTables = [
      "account",
      "conversation",
      "document",
      "message",
      "session",
      "user",
      "verification",
    ];
    const tableRows = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all();
    const tableNames = tableRows.map((row) => row.name);
    for (const table of expectedTables) {
      assert(
        tableNames.includes(table),
        `Expected table "${table}" missing. Found: ${tableNames.join(", ")}`
      );
    }
    console.log(
      `Verified ${tableNames.length} table(s) in SQLite database: ${tableNames.join(", ")}`
    );

    const testUserId = "test-user-check";
    const testConvId = "test-conv-check";
    const testMsgId = "test-msg-check";
    const testDocId1 = "test-doc-1";
    const testDocId2 = "test-doc-2";

    db.prepare(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
       VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`
    ).run(testUserId, "CI Test User", "ci-test@dms.local");

    db.prepare(
      `INSERT INTO "conversation" ("id", "title", "userId", "createdAt", "updatedAt")
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`
    ).run(testConvId, "Test Conversation", testUserId);

    db.prepare(
      `INSERT INTO "message" ("id", "conversationId", "role", "content", "sources", "createdAt")
       VALUES (?, ?, 'USER', 'Hello', '[{"citation":1}]', datetime('now'))`
    ).run(testMsgId, testConvId);

    db.prepare(
      `INSERT INTO "document" ("id", "name", "size", "type", "key", "url", "contentHash", "userId", "createdAt", "updatedAt")
       VALUES (?, 'doc1.pdf', 123, 'application/pdf', 'uploads/test/1.pdf', 'uploads/test/1.pdf', 'hash-1', ?, datetime('now'), datetime('now'))`
    ).run(testDocId1, testUserId);

    assert.throws(
      () => {
        db.prepare(
          `INSERT INTO "document" ("id", "name", "size", "type", "key", "url", "contentHash", "userId", "createdAt", "updatedAt")
           VALUES (?, 'doc2.pdf', 123, 'application/pdf', 'uploads/test/2.pdf', 'uploads/test/2.pdf', 'hash-1', ?, datetime('now'), datetime('now'))`
        ).run(testDocId2, testUserId);
      },
      /UNIQUE constraint failed/,
      "Expected unique (contentHash, userId) constraint violation."
    );

    db.prepare(`DELETE FROM "conversation" WHERE "id" = ?`).run(testConvId);
    const remainingMessages = db
      .prepare(
        `SELECT COUNT(*) AS count FROM "message" WHERE "conversationId" = ?`
      )
      .get(testConvId).count;
    assert.equal(
      remainingMessages,
      0,
      "Expected ON DELETE CASCADE to delete child messages."
    );
  } finally {
    db.close();
  }

  console.log("Checking Prisma schema diff against applied migrations...");
  const diffOutput = runPrisma(
    [
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    `file:${tempDbPath}`
  );
  console.log(diffOutput.trim() || "No schema differences detected.");
  console.log("D1 / SQLite migration check passed successfully!");
} finally {
  for (const candidate of [
    tempDbPath,
    `${tempDbPath}-journal`,
    `${tempDbPath}-wal`,
    `${tempDbPath}-shm`,
  ]) {
    if (existsSync(candidate)) {
      await unlink(candidate);
    }
  }
}
