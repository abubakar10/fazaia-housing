import { describe, expect, it } from "vitest";
import {
  adminResetPasswordSchema,
  createUserSchema,
  inviteUserSchema,
  listUsersQuerySchema,
} from "../schemas/user.schemas";

describe("user schemas", () => {
  it("parses list query defaults", () => {
    const parsed = listUsersQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
    expect(parsed.sort).toBe("createdAt");
    expect(parsed.order).toBe("desc");
  });

  it("normalizes invite email", () => {
    const parsed = inviteUserSchema.parse({
      name: "Test User",
      email: "Admin@Example.COM",
    });
    expect(parsed.email).toBe("admin@example.com");
    expect(parsed.sendEmail).toBe(true);
  });

  it("requires password or generateTemporary for admin reset", () => {
    expect(() => adminResetPasswordSchema.parse({})).toThrow();
    const parsed = adminResetPasswordSchema.parse({ generateTemporary: true });
    expect(parsed.generateTemporary).toBe(true);
  });

  it("accepts create user with optional password", () => {
    const parsed = createUserSchema.parse({
      name: "New User",
      email: "new@falcon.local",
    });
    expect(parsed.status).toBe("ACTIVE");
    expect(parsed.password).toBeUndefined();
  });
});
