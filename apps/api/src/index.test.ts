import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "./index";

// Mock do prisma para não bater no banco real
vi.mock("@repo/db", () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      project: {
        findUnique: vi.fn().mockResolvedValue({ id: "proj-1", apiKey: "valid-key" }),
      },
      errorGroup: {
        upsert: vi.fn().mockResolvedValue({ id: "eg-1" }),
      },
      event: {
        create: vi.fn().mockResolvedValue({ id: "ev-1" }),
      }
    }))
  };
});

describe("API Endpoints", () => {
  it("GET / should return running status", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("ReplayOps API is running!");
  });

  it("POST /api/ingest should reject requests without Authorization header", async () => {
    const res = await request(app).post("/api/ingest").send({
      fingerprint: "test-fp",
      message: "Test error"
    });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Missing or invalid Authorization header");
  });

  it("POST /api/ingest should accept valid requests", async () => {
    const res = await request(app).post("/api/ingest")
      .set("Authorization", "Bearer valid-key")
      .send({
        fingerprint: "test-fp",
        message: "Test error",
        method: "POST",
        route: "/test"
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/replay should block SSRF attempts", async () => {
    const res = await request(app).post("/api/replay").send({
      method: "GET",
      url: "http://malicious-site.com/admin"
    });
    
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain("SSRF Protection");
  });
});
