import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminLogin, saveInvitation, createPhotoUpload, finalizePhoto, deletePhoto, listRsvps,
} from "@/lib/invite/invite.functions";
import { LANGS, type InviteData, type Lang, type Localized } from "@/lib/invite/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TOKEN_KEY = "invite-admin-token";

export function AdminFlow({ slug, data, trigger }: { slug: string | null; data: InviteData; trigger: ReactNode }) {
  const login = useServerFn(adminLogin);
  const [pwOpen, setPwOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const openKey = () => {
    const tk = sessionStorage.getItem(TOKEN_KEY);
    const exp = tk ? Number(tk.split(".")[1]) : 0;
    if (tk && exp > Date.now()) { setToken(tk); setEditOpen(true); } else setPwOpen(true);
  };

  return (
    <>
      <button aria-label="Admin" onClick={openKey}>{trigger}</button>
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Parol / Пароль / Password</DialogTitle>
            <DialogDescription>Parolni kiriting</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setErr("");
            const r = await login({ data: { password: pw } });
            if (!r.ok) return setErr("Noto'g'ri parol / Неверный пароль");
            sessionStorage.setItem(TOKEN_KEY, r.token);
            setToken(r.token); setPw(""); setPwOpen(false); setEditOpen(true);
          }}>
            <Input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} inputMode="numeric" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full">OK</Button>
          </form>
        </DialogContent>
      </Dialog>
      {token && editOpen && (
        <Editor token={token} slug={slug} initial={data} onClose={() => setEditOpen(false)}
          onExpired={() => { sessionStorage.removeItem(TOKEN_KEY); setEditOpen(false); setPwOpen(true); }} />
      )}
    </>
  );
}

function LInput({ label, value, lang, onChange, area }: { label: string; value: Localized; lang: Lang; onChange: (v: Localized) => void; area?: boolean }) {
  const C = area ? Textarea : Input;
  return (
    <div className="space-y-1">
      <Label>{label} <span className="text-xs uppercase text-muted-foreground">({lang})</span></Label>
      <C value={value[lang] ?? ""} placeholder={lang !== "uz" ? value.uz : ""} onChange={(e: any) => onChange({ ...value, [lang]: e.target.value })} />
    </div>
  );
}

function Editor({ token, slug, initial, onClose, onExpired }: {
  token: string; slug: string | null; initial: InviteData; onClose: () => void; onExpired: () => void;
}) {
  const save = useServerFn(saveInvitation);
  const mkUpload = useServerFn(createPhotoUpload);
  const finalize = useServerFn(finalizePhoto);
  const delPhoto = useServerFn(deletePhoto);
  const getRsvps = useServerFn(listRsvps);
  const navigate = useNavigate();
  const [d, setD] = useState<InviteData>(initial);
  const [lang, setLang] = useState<Lang>("uz");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rsvps, setRsvps] = useState<Awaited<ReturnType<typeof listRsvps>> | null>(null);

  const set = <K extends keyof InviteData>(k: K, v: InviteData[K]) => setD((p) => ({ ...p, [k]: v }));
  const handle = (e: unknown) => {
    const m = e instanceof Error ? e.message : String(e);
    if (m.includes("UNAUTHORIZED")) onExpired(); else setError(m);
  };

  useEffect(() => {
    if (slug) getRsvps({ data: { token, slug } }).then(setRsvps).catch(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const doSave = async (asNew: boolean) => {
    setBusy(true); setError("");
    try {
      const r = await save({ data: { token, slug: asNew ? null : slug, data: d } });
      setSavedSlug(r.slug);
    } catch (e) { handle(e); } finally { setBusy(false); }
  };

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true); setError("");
    try {
      const added: InviteData["photos"] = [];
      for (const f of Array.from(files)) {
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase() as "jpg";
        const { path, uploadToken } = await mkUpload({ data: { token, ext } });
        const { error } = await supabase.storage.from("photos").uploadToSignedUrl(path, uploadToken, f, { contentType: f.type });
        if (error) throw error;
        added.push(await finalize({ data: { token, path } }));
      }
      setD((p) => ({ ...p, photos: [...p.photos, ...added] }));
    } catch (e) { handle(e); } finally { setBusy(false); }
  };

  const link = savedSlug ? `${window.location.origin}/i/${savedSlug}` : "";
  const totals = rsvps && {
    yes: rsvps.filter((r) => r.attending).length,
    people: rsvps.filter((r) => r.attending).reduce((s, r) => s + r.guests_count, 0),
    no: rsvps.filter((r) => !r.attending).length,
  };

  return (
    <>
      <Dialog open={!savedSlug} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92svh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-script text-4xl font-normal text-secondary">Tahrirlash</DialogTitle>
            <DialogDescription>Matn tili / Язык текста / Text language:</DialogDescription>
          </DialogHeader>
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <Button key={l} size="sm" variant={lang === l ? "default" : "outline"} onClick={() => setLang(l)} className="uppercase">{l}</Button>
            ))}
          </div>
          <Tabs defaultValue="main">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="main">Asosiy</TabsTrigger>
              <TabsTrigger value="when">Vaqt</TabsTrigger>
              <TabsTrigger value="photos">Rasm</TabsTrigger>
              <TabsTrigger value="more">RSVP</TabsTrigger>
              <TabsTrigger value="guests">Ro'yxat</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-3">
              <LInput label="Salomlashish" lang={lang} value={d.greeting} onChange={(v) => set("greeting", v)} />
              <LInput label="Ismlar" lang={lang} value={d.hosts} onChange={(v) => set("hosts", v)} />
              <LInput label="Tadbir nomi" lang={lang} value={d.title} onChange={(v) => set("title", v)} />
              <LInput label="Taklif matni" lang={lang} area value={d.welcome} onChange={(v) => set("welcome", v)} />
              <LInput label="Yakuniy so'z" lang={lang} value={d.thanks} onChange={(v) => set("thanks", v)} />
              <div className="space-y-1">
                <Label>YouTube musiqa havolasi</Label>
                <Input value={d.musicUrl} onChange={(e) => set("musicUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
            </TabsContent>

            <TabsContent value="when" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Sana</Label><Input type="date" value={d.date} onChange={(e) => set("date", e.target.value)} /></div>
                <div className="space-y-1"><Label>Vaqt (Toshkent)</Label><Input type="time" value={d.time} onChange={(e) => set("time", e.target.value)} /></div>
              </div>
              <LInput label="Joy nomi" lang={lang} value={d.venue} onChange={(v) => set("venue", v)} />
              <LInput label="Manzil" lang={lang} value={d.address} onChange={(v) => set("address", v)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Kenglik (lat)</Label>
                  <Input inputMode="decimal" value={d.lat ?? ""} onChange={(e) => set("lat", e.target.value === "" ? null : Number(e.target.value))} /></div>
                <div className="space-y-1"><Label>Uzunlik (lng)</Label>
                  <Input inputMode="decimal" value={d.lng ?? ""} onChange={(e) => set("lng", e.target.value === "" ? null : Number(e.target.value))} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Koordinatalar bo'lsa xarita ularni ishlatadi, aks holda manzilni.</p>
              <Label>Dastur</Label>
              {d.schedule.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="w-24" type="time" value={s.time} onChange={(e) => set("schedule", d.schedule.map((x, j) => j === i ? { ...x, time: e.target.value } : x))} />
                  <Input value={s.label[lang] ?? ""} placeholder={s.label.uz} onChange={(e) => set("schedule", d.schedule.map((x, j) => j === i ? { ...x, label: { ...x.label, [lang]: e.target.value } } : x))} />
                  <Button size="icon" variant="ghost" onClick={() => set("schedule", d.schedule.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set("schedule", [...d.schedule, { time: "12:00", label: {} }])}><Plus className="h-4 w-4" /> Qo'shish</Button>
            </TabsContent>

            <TabsContent value="photos" className="space-y-3">
              <Input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => upload(e.target.files)} />
              <div className="grid grid-cols-3 gap-2">
                {d.photos.map((p, i) => (
                  <div key={p.url + i} className="relative">
                    <img src={p.url} alt="" className="aspect-square w-full rounded object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 p-1 text-ink-foreground">
                      <button aria-label="Up" disabled={i === 0} onClick={() => { const a = [...d.photos]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set("photos", a); }}><ArrowUp className="h-4 w-4" /></button>
                      <button aria-label="Delete" onClick={() => { if (p.path) delPhoto({ data: { token, path: p.path } }).catch(() => {}); set("photos", d.photos.filter((_, j) => j !== i)); }}><Trash2 className="h-4 w-4" /></button>
                      <button aria-label="Down" disabled={i === d.photos.length - 1} onClick={() => { const a = [...d.photos]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; set("photos", a); }}><ArrowDown className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="more" className="space-y-3">
              <div className="flex items-center justify-between"><Label>RSVP yoqilgan</Label><Switch checked={d.rsvpEnabled} onCheckedChange={(v) => set("rsvpEnabled", v)} /></div>
              <div className="space-y-1"><Label>Maksimal mehmonlar soni</Label>
                <Input type="number" min={1} max={20} value={d.maxGuests} onChange={(e) => set("maxGuests", Math.min(20, Math.max(1, Number(e.target.value) || 1)))} /></div>
              <LInput label="RSVP matni" lang={lang} area value={d.rsvpNote} onChange={(v) => set("rsvpNote", v)} />
            </TabsContent>

            <TabsContent value="guests">
              {!slug && <p className="text-sm text-muted-foreground">Avval taklifnomani saqlang.</p>}
              {totals && (
                <>
                  <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted p-2"><div className="text-2xl text-primary">{totals.yes}</div><div className="text-xs">Javob: ha</div></div>
                    <div className="rounded-md bg-muted p-2"><div className="text-2xl text-success">{totals.people}</div><div className="text-xs">Keladi</div></div>
                    <div className="rounded-md bg-muted p-2"><div className="text-2xl text-muted-foreground">{totals.no}</div><div className="text-xs">Kela olmaydi</div></div>
                  </div>
                  <ul className="divide-y divide-border text-sm">
                    {rsvps!.map((r) => (
                      <li key={r.id} className="py-2">
                        <div className="flex justify-between"><b>{r.guest_name}</b><span className={r.attending ? "text-success" : "text-muted-foreground"}>{r.attending ? `✓ ${r.guests_count}` : "✗"}</span></div>
                        {r.message && <p className="text-muted-foreground">{r.message}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      </li>
                    ))}
                    {rsvps!.length === 0 && <li className="py-2 text-muted-foreground">Hozircha javob yo'q.</li>}
                  </ul>
                </>
              )}
            </TabsContent>
          </Tabs>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => doSave(false)}>Saqlash</Button>
            {slug && <Button variant="outline" disabled={busy} onClick={() => doSave(true)}>Yangi nusxa</Button>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!savedSlug} onOpenChange={(o) => { if (!o) { onClose(); if (savedSlug) navigate({ to: "/i/$slug", params: { slug: savedSlug } }); } }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-script text-4xl font-normal text-secondary">Saqlandi!</DialogTitle>
            <DialogDescription>Bu havolani mehmonlarga yuboring</DialogDescription>
          </DialogHeader>
          <Input readOnly value={link} onFocus={(e) => e.target.select()} />
          <Button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Nusxalandi" : "Nusxalash"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
