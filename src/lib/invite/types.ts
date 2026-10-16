import { z } from "zod";

export const LANGS = ["uz", "ru", "en"] as const;
export type Lang = (typeof LANGS)[number];

const L = z.object({
  uz: z.string().max(2000).optional(),
  ru: z.string().max(2000).optional(),
  en: z.string().max(2000).optional(),
});
export type Localized = z.infer<typeof L>;

export const inviteSchema = z.object({
  greeting: L,
  hosts: L,
  title: L,
  welcome: L,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  venue: L,
  address: L,
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  schedule: z.array(z.object({ time: z.string().max(10), label: L })).max(20),
  photos: z.array(z.object({ url: z.string().max(2000), path: z.string().max(300).optional() })).max(40),
  musicUrl: z.string().max(300),
  rsvpEnabled: z.boolean(),
  maxGuests: z.number().int().min(1).max(20),
  rsvpNote: L,
  thanks: L,
});
export type InviteData = z.infer<typeof inviteSchema>;

export function tr(l: Localized | undefined, lang: Lang): string {
  if (!l) return "";
  return l[lang] || l.uz || l.ru || l.en || "";
}

/** Event moment; times are entered in Tashkent time (UTC+5). */
export function eventDate(d: Pick<InviteData, "date" | "time">): Date {
  return new Date(`${d.date}T${d.time}:00+05:00`);
}

export function mapQuery(d: InviteData): string {
  if (d.lat != null && d.lng != null) return `${d.lat},${d.lng}`;
  return tr(d.address, "uz") || tr(d.venue, "uz");
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
