import { describe, expect, it } from "vitest";

describe("Turso environment configuration", () => {
  it("can execute a lightweight authenticated query", async () => {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    expect(url, "TURSO_DATABASE_URL is required").toBeTruthy();
    expect(token, "TURSO_AUTH_TOKEN is required").toBeTruthy();

    const pipelineUrl = `${url!.replace(/^libsql:/, "https:").replace(/\/$/, "")}/v2/pipeline`;
    const response = await fetch(pipelineUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            type: "execute",
            stmt: { sql: "SELECT 1 AS ok" },
          },
        ],
      }),
    });

    expect(response.ok, `Turso responded with HTTP ${response.status}`).toBe(true);
    const payload = (await response.json()) as {
      results?: Array<{ response?: { result?: { rows?: Array<Array<{ value?: string | number }>> } } }>;
    };
    expect(String(payload.results?.[0]?.response?.result?.rows?.[0]?.[0]?.value)).toBe("1");
  }, 15_000);
});
