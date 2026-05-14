import { aliasEnv, formatAliasReport } from "./alias";

describe("aliasEnv", () => {
  const baseEnv = {
    DB_HOST: "localhost",
    DB_PORT: "5432",
    OLD_SECRET: "abc123",
  };

  it("renames a key and removes the original by default", () => {
    const result = aliasEnv(baseEnv, { OLD_SECRET: "APP_SECRET" });
    expect(result.output["APP_SECRET"]).toBe("abc123");
    expect(result.output["OLD_SECRET"]).toBeUndefined();
    expect(result.renamed).toEqual([{ from: "OLD_SECRET", to: "APP_SECRET" }]);
    expect(result.skipped).toHaveLength(0);
  });

  it("keeps original key when removeOriginal is false", () => {
    const result = aliasEnv(baseEnv, { DB_HOST: "DATABASE_HOST" }, false);
    expect(result.output["DB_HOST"]).toBe("localhost");
    expect(result.output["DATABASE_HOST"]).toBe("localhost");
  });

  it("skips alias when source key does not exist", () => {
    const result = aliasEnv(baseEnv, { MISSING_KEY: "NEW_KEY" });
    expect(result.skipped).toEqual([
      { from: "MISSING_KEY", reason: 'key "MISSING_KEY" not found in env' },
    ]);
    expect(result.renamed).toHaveLength(0);
  });

  it("skips alias when target key already exists", () => {
    const result = aliasEnv(baseEnv, { DB_HOST: "DB_PORT" });
    expect(result.skipped).toEqual([
      { from: "DB_HOST", reason: 'target key "DB_PORT" already exists' },
    ]);
  });

  it("allows renaming a key to itself (no-op)", () => {
    const result = aliasEnv(baseEnv, { DB_HOST: "DB_HOST" });
    expect(result.renamed).toEqual([{ from: "DB_HOST", to: "DB_HOST" }]);
    expect(result.output["DB_HOST"]).toBe("localhost");
  });

  it("handles multiple aliases in one call", () => {
    const result = aliasEnv(baseEnv, {
      DB_HOST: "DATABASE_HOST",
      DB_PORT: "DATABASE_PORT",
    });
    expect(result.renamed).toHaveLength(2);
    expect(result.output["DATABASE_HOST"]).toBe("localhost");
    expect(result.output["DATABASE_PORT"]).toBe("5432");
    expect(result.output["DB_HOST"]).toBeUndefined();
    expect(result.output["DB_PORT"]).toBeUndefined();
  });
});

describe("formatAliasReport", () => {
  it("returns no-op message when nothing changed", () => {
    const result = aliasEnv({}, {});
    expect(formatAliasReport(result)).toBe("No aliases applied.");
  });

  it("formats renamed and skipped entries", () => {
    const result = aliasEnv(
      { OLD_KEY: "value" },
      { OLD_KEY: "NEW_KEY", MISSING: "X" }
    );
    const report = formatAliasReport(result);
    expect(report).toContain("Renamed:");
    expect(report).toContain("OLD_KEY → NEW_KEY");
    expect(report).toContain("Skipped:");
    expect(report).toContain("MISSING");
  });
});
