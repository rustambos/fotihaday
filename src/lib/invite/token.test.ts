import { describe, expect, it } from "vitest";
import { sha256Hex, signToken, verifyToken } from "./token.server";

describe("admin session", () => {
  it("initial password 131700 matches the stored hash format", async () => {
    expect(await sha256Hex("131700")).toBe(
      "057db51f2b313c956df72ebbb30b5c61043429891605c6748547b1fb467ddad5",
    );
  });

  it("token is valid before expiry and rejected after", async () => {
    const t = await signToken("s3cret", 1000, 0);
    expect(await verifyToken(t, "s3cret", 500)).toBe(true);
    expect(await verifyToken(t, "s3cret", 1500)).toBe(false);
  });

  it("token signed with another secret is rejected", async () => {
    const t = await signToken("a", 1000, 0);
    expect(await verifyToken(t, "b", 10)).toBe(false);
  });
});
