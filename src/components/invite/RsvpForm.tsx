import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitRsvp } from "@/lib/invite/invite.functions";
import { t } from "@/lib/invite/i18n";
import type { Lang } from "@/lib/invite/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function RsvpForm({ slug, lang, maxGuests }: { slug: string | null; lang: Lang; maxGuests: number }) {
  const submit = useServerFn(submitRsvp);
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(1);
  const [attending, setAttending] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  if (state === "done") return <p className="font-script text-4xl text-primary">{t("sent", lang)}</p>;

  return (
    <form
      className="mx-auto max-w-sm space-y-4 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!slug || attending == null || !name.trim()) return;
        setState("sending");
        try {
          await submit({ data: { slug, name: name.trim(), guests, attending, message: message.trim() || undefined } });
          setState("done");
        } catch {
          setState("error");
        }
      }}
    >
      <Input required maxLength={100} placeholder={t("name", lang)} value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-background" />
      <label className="block text-sm text-muted-foreground">
        {t("guests", lang)}
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-foreground">
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {([true, false] as const).map((v) => (
          <button type="button" key={String(v)} onClick={() => setAttending(v)}
            className={`h-12 rounded-md border text-sm transition ${attending === v ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}>
            {v ? t("willCome", lang) : t("wontCome", lang)}
          </button>
        ))}
      </div>
      <Textarea maxLength={500} placeholder={t("wish", lang)} value={message} onChange={(e) => setMessage(e.target.value)} className="bg-background" />
      {!slug && <p className="text-center text-xs text-muted-foreground">{t("previewNote", lang)}</p>}
      {state === "error" && <p className="text-center text-sm text-destructive">{t("error", lang)}</p>}
      <Button type="submit" disabled={!slug || attending == null || state === "sending"} className="h-12 w-full uppercase tracking-widest">
        {t("send", lang)}
      </Button>
    </form>
  );
}
