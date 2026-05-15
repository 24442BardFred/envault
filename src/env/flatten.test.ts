import { describe, it, expect } from "vitest";
import { flattenEnv, expandEnv, formatFlattenReport } from "./flatten";

describe("flattenEnv", () => {
  it("flattens nested groups with default separator", () => {
    const nested = {
      DB: { HOST: "localhost", PORT: "5432" },
      APP_NAME: "envault",
    };
    const result = flattenEnv(nested);
    expect(result).toEqual({
      DB__HOST: "localhost",
      DB__PORT: "5432",
      APP_NAME: "envault",
    });
  });

  it("flattens with a custom separator", () => {
    const nested = { AWS: { REGION: "us-east-1", KEY: "abc" } };
    const result = flattenEnv(nested, "_");
    expect(result["AWS_REGION"]).toBe("us-east-1");
    expect(result["AWS_KEY"]).toBe("abc");
  });

  it("returns flat keys unchanged", () => {
    const nested = { SIMPLE: "value" };
    expect(flattenEnv(nested)).toEqual({ SIMPLE: "value" });
  });

  it("handles empty input", () => {
    expect(flattenEnv({})).toEqual({});
  });
});

describe("expandEnv", () => {
  it("expands flat keys into nested groups", () => {
    const flat = { DB__HOST: "localhost", DB__PORT: "5432", APP_NAME: "envault" };
    const result = expandEnv(flat);
    expect(result["DB"]).toEqual({ HOST: "localhost", PORT: "5432" });
    expect(result["APP_NAME"]).toBe("envault");
  });

  it("expands with custom separator", () => {
    const flat = { AWS_REGION: "us-east-1", AWS_KEY: "abc" };
    const result = expandEnv(flat, "_");
    expect(result["AWS"]).toEqual({ REGION: "us-east-1", KEY: "abc" });
  });

  it("handles keys without separator", () => {
    const flat = { PLAIN: "yes" };
    expect(expandEnv(flat)).toEqual({ PLAIN: "yes" });
  });

  it("roundtrips flatten -> expand", () => {
    const nested = { DB: { HOST: "localhost", PORT: "5432" }, NAME: "test" };
    const flat = flattenEnv(nested);
    const expanded = expandEnv(flat);
    expect(expanded).toEqual(nested);
  });
});

describe("formatFlattenReport", () => {
  it("formats a report with key count and separator", () => {
    const report = {
      original: { DB: "nested" },
      flattened: { DB__HOST: "localhost" },
      separator: "__",
      count: 1,
    };
    const output = formatFlattenReport(report);
    expect(output).toContain("1 key(s)");
    expect(output).toContain('"__"');
    expect(output).toContain("DB__HOST=localhost");
  });
});
