import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { inviteSchema, type InviteData } from "./types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function requireAdmin(token: string) {
  const { verifyToken } = await import("./token.server");
  const ok = await verifyToken(token, process.env["ADMIN_SESSION_SECRET"]!);
  if (!ok) throw new Error("UNAUTHORIZED");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const slugSchema = z.string().regex(/^[a-z0-9-]{3,40}$/);

export const getInvitation = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: slugSchema.parse(d.slug) }))
  .handler(async ({ data }) => {
    const { data: row } = await publicClient()
      .from("invitations")
      .select("id, slug, data")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!row) return null;
    return { id: row.id, slug: row.slug, data: row.data as unknown as InviteData };
  });

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: slugSchema,
        name: z.string().trim().min(1).max(100),
        guests: z.number().int().min(1).max(20),
        attending: z.boolean(),
        message: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: inv } = await sb.from("invitations").select("id").eq("slug", data.slug).maybeSingle();
    if (!inv) throw new Error("Invitation not found");
    const { error } = await sb.from("rsvps").insert({
      invitation_id: inv.id,
      guest_name: data.name,
      guests_count: data.guests,
      attending: data.attending,
      message: data.message || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { sha256Hex, safeEqual, signToken } = await import("./token.server");
    const hash = await sha256Hex(data.password);
    if (!safeEqual(hash, process.env["ADMIN_PASSWORD_HASH"] ?? "")) return { ok: false as const };
    return { ok: true as const, token: await signToken(process.env["ADMIN_SESSION_SECRET"]!) };
  });

export const saveInvitation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().max(300), slug: slugSchema.nullable(), data: inviteSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const payload = data.data as unknown as Database["public"]["Tables"]["invitations"]["Insert"]["data"] & {};
    if (data.slug) {
      const { error } = await admin
        .from("invitations")
        .update({ data: payload, updated_at: new Date().toISOString() })
        .eq("slug", data.slug);
      if (error) throw new Error(error.message);
      return { slug: data.slug };
    }
    for (let i = 0; i < 5; i++) {
      const slug = Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map((b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32])
        .join("");
      const { error } = await admin.from("invitations").insert({ slug, data: payload });
      if (!error) return { slug };
      if (!error.message.includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Could not generate slug");
  });

export const createPhotoUpload = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().max(300), ext: z.enum(["jpg", "jpeg", "png", "webp", "gif"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const path = `${crypto.randomUUID()}.${data.ext}`;
    const { data: up, error } = await admin.storage.from("photos").createSignedUploadUrl(path);
    if (error || !up) throw new Error(error?.message ?? "Upload failed");
    return { path, uploadToken: up.token };
  });

export const finalizePhoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().max(300), path: z.string().regex(/^[\w-]+\.\w+$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const { data: s, error } = await admin.storage
      .from("photos")
      .createSignedUrl(data.path, 60 * 60 * 24 * 365 * 10);
    if (error || !s) throw new Error(error?.message ?? "Failed");
    return { url: s.signedUrl, path: data.path };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().max(300), path: z.string().regex(/^[\w-]+\.\w+$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    await admin.storage.from("photos").remove([data.path]);
    return { ok: true };
  });

export const listRsvps = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(300), slug: slugSchema }).parse(d))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.token);
    const { data: inv } = await admin.from("invitations").select("id").eq("slug", data.slug).maybeSingle();
    if (!inv) return [];
    const { data: rows, error } = await admin
      .from("rsvps")
      .select("id, guest_name, guests_count, attending, message, created_at")
      .eq("invitation_id", inv.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
