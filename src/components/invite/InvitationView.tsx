import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, KeyRound, MapPin, Music, Pause, X, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import frame from "@/assets/frame.jpg";
import ikat from "@/assets/ikat.jpg";
import { LANGS, eventDate, mapQuery, tr, youtubeId, type InviteData, type Lang } from "@/lib/invite/types";
import { formatDate, t } from "@/lib/invite/i18n";
import { RsvpForm } from "./RsvpForm";
import { AdminFlow } from "./AdminFlow";

function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("uz");
  useEffect(() => {
    const s = localStorage.getItem("invite-lang") as Lang | null;
    if (s && LANGS.includes(s)) setLang(s);
  }, []);
  return [lang, (l) => { setLang(l); localStorage.setItem("invite-lang", l); }];
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (el.classList.add("is-in"), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function Ornament() {
  return (
    <div className="my-5 flex items-center justify-center gap-3 text-gold">
      <span className="h-px w-16 bg-gold/60" />
      <span className="text-lg">✦</span>
      <span className="h-px w-16 bg-gold/60" />
    </div>
  );
}

function Countdown({ target, lang }: { target: Date; lang: Lang }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - (now ?? target.getTime()));
  const parts = [
    [Math.floor(diff / 864e5), t("days", lang)],
    [Math.floor(diff / 36e5) % 24, t("hours", lang)],
    [Math.floor(diff / 6e4) % 60, t("minutes", lang)],
    [Math.floor(diff / 1e3) % 60, t("seconds", lang)],
  ] as const;
  if (now != null && diff === 0) return <p className="font-script text-5xl text-gold-gradient">{t("started", lang)}</p>;
  return (
    <>
      <div className="font-serif text-[7rem] leading-none text-gold-gradient">{parts[0][0]}</div>
      <p className="mt-1 text-sm uppercase tracking-[0.3em] text-ink-foreground/80">{parts[0][1]}</p>
      <div className="mt-8 grid grid-cols-3 gap-3">
        {parts.slice(1).map(([v, l]) => (
          <div key={l} className="rounded-lg border border-gold/40 bg-ink/60 px-2 py-3">
            <div className="text-3xl tabular-nums text-gold-soft">{String(v).padStart(2, "0")}</div>
            <div className="text-[0.65rem] uppercase tracking-widest text-ink-foreground/70">{l}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function MusicPlayer({ url, lang }: { url: string; lang: Lang }) {
  const id = youtubeId(url);
  const player = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const started = useRef(false);

  const start = () => {
    if (!id || started.current) return;
    started.current = true;
    const w = window as any;
    const create = () => {
      player.current = new w.YT.Player("yt-hidden", {
        videoId: id,
        playerVars: { autoplay: 1, loop: 1, playlist: id, controls: 0 },
        events: {
          onReady: (e: any) => { e.target.setVolume(70); e.target.playVideo(); },
          onStateChange: (e: any) => setPlaying(e.data === 1),
        },
      });
    };
    if (w.YT?.Player) return create();
    w.onYouTubeIframeAPIReady = create;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  };

  useEffect(() => {
    const h = () => start();
    document.addEventListener("pointerdown", h, { once: true });
    return () => document.removeEventListener("pointerdown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return null;
  return (
    <>
      <div className="pointer-events-none fixed -left-[9999px] h-px w-px overflow-hidden"><div id="yt-hidden" /></div>
      <button
        aria-label={t("music", lang)}
        onClick={(e) => {
          e.stopPropagation();
          if (!started.current) return start();
          const p = player.current;
          if (!p?.getPlayerState) return;
          playing ? p.pauseVideo() : p.playVideo();
        }}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-gold shadow-soft ring-1 ring-gold/50"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        {playing && <span className="absolute inset-0 rounded-full border border-dashed border-gold/60 animate-spin-slow" />}
      </button>
    </>
  );
}

function Gallery({ photos, lang }: { photos: InviteData["photos"]; lang: Lang }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  const go = (d: number) => setOpen((i) => (i == null ? i : (i + d + photos.length) % photos.length));
  return (
    <section className="px-6 py-20">
      <Reveal className="text-center">
        <h2 className="font-script text-6xl text-secondary">{t("gallery", lang)}</h2>
        <Ornament />
      </Reveal>
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        {photos.map((p, i) => (
          <Reveal key={p.url + i} className={i % 3 === 0 ? "col-span-2" : ""}>
            <button onClick={() => setOpen(i)} className="block w-full overflow-hidden rounded-xl shadow-soft ring-1 ring-gold/30">
              <img src={p.url} alt="" loading="lazy" className={`w-full object-cover transition-transform duration-700 hover:scale-105 ${i % 3 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"}`} />
            </button>
          </Reveal>
        ))}
      </div>
      {open != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95" onClick={() => setOpen(null)}>
          <button className="absolute right-4 top-4 text-ink-foreground" aria-label="Close"><X /></button>
          <button className="absolute left-2 p-3 text-ink-foreground" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous"><ChevronLeft /></button>
          <img src={photos[open]?.url} alt="" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-2 p-3 text-ink-foreground" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next"><ChevronRight /></button>
        </div>
      )}
    </section>
  );
}

export function InvitationView({ data, slug }: { data: InviteData; slug: string | null }) {
  const [lang, setLang] = useLang();
  const target = eventDate(data);
  const fd = formatDate(data.date, lang);
  const q = mapQuery(data);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  return (
    <div className="mx-auto min-h-screen max-w-[480px] overflow-hidden bg-background shadow-soft">
      {/* Language switcher */}
      <div className="fixed left-1/2 top-3 z-40 flex -translate-x-1/2 gap-1 rounded-full bg-ink/80 p-1 backdrop-blur">
        {LANGS.map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${lang === l ? "bg-gold-gradient text-ink" : "text-ink-foreground/70"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Hero */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-14 py-24 text-center"
        style={{ backgroundImage: `url(${frame})`, backgroundSize: "100% 100%" }}>
        <Reveal>
          <div className="mb-4 text-3xl text-gold">❋</div>
          <h1 className="font-script text-6xl leading-tight text-secondary">{tr(data.greeting, lang)}</h1>
          <Ornament />
          <p className="text-lg leading-relaxed text-foreground/80">{tr(data.welcome, lang)}</p>
          <p className="mt-6 text-sm uppercase tracking-[0.25em] text-muted-foreground">{tr(data.title, lang)}</p>
          <p className="mt-3 text-2xl font-semibold uppercase tracking-[0.15em] text-primary">{tr(data.hosts, lang)}</p>
        </Reveal>
        <a href="#date" className="absolute bottom-24 text-secondary animate-float-down" aria-label={t("scroll", lang)}>
          <ChevronDown className="h-8 w-8" />
        </a>
      </section>

      {/* Date & program */}
      <section id="date" className="px-8 py-20 text-center">
        <Reveal>
          <h2 className="font-script text-6xl text-secondary">{t("dateTitle", lang)}</h2>
          <Ornament />
          <p className="text-3xl text-primary">{fd.line}</p>
          <p className="mt-1 text-lg italic text-muted-foreground">{fd.weekday} · {data.time}</p>
        </Reveal>
        {data.schedule.length > 0 && (
          <Reveal className="mx-auto mt-12 max-w-xs text-left">
            <h3 className="mb-6 text-center font-script text-5xl text-secondary">{t("program", lang)}</h3>
            <ol className="relative border-l border-gold/60 pl-6">
              {data.schedule.map((s, i) => (
                <li key={i} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-gold bg-background" />
                  <div className="text-2xl italic text-gold">{s.time}</div>
                  <div className="text-foreground/80">{tr(s.label, lang)}</div>
                </li>
              ))}
            </ol>
          </Reveal>
        )}
      </section>

      {/* Countdown */}
      <section className="relative px-8 py-24 text-center text-ink-foreground"
        style={{ backgroundImage: `url(${ikat})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-ink/55" />
        <Reveal className="relative">
          <p className="text-sm uppercase tracking-[0.3em] text-gold-soft">{t("countdown", lang)}</p>
          <div className="my-6 flex items-center justify-center gap-3 text-gold"><span className="h-px w-12 bg-gold/60" />✦<span className="h-px w-12 bg-gold/60" /></div>
          <Countdown target={target} lang={lang} />
        </Reveal>
      </section>

      {/* Location */}
      <section className="px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-script text-6xl text-secondary">{t("location", lang)}</h2>
          <Ornament />
          <p className="text-2xl text-primary">{tr(data.venue, lang)}</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{tr(data.address, lang)}</p>
          {q && (
            <div className="mt-6 overflow-hidden rounded-xl shadow-soft ring-1 ring-gold/40">
              <iframe title="map" className="h-64 w-full" loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`} />
            </div>
          )}
          <a href={mapsLink} target="_blank" rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm uppercase tracking-widest text-secondary-foreground shadow-soft">
            <MapPin className="h-4 w-4" />{t("openMaps", lang)}
          </a>
        </Reveal>
      </section>

      <Gallery photos={data.photos} lang={lang} />

      {data.rsvpEnabled && (
        <section className="bg-card px-6 py-20 text-center">
          <Reveal>
            <h2 className="font-script text-5xl leading-tight text-secondary">{t("rsvpTitle", lang)}</h2>
            <Ornament />
            <p className="mb-8 text-muted-foreground">{tr(data.rsvpNote, lang)}</p>
            <RsvpForm slug={slug} lang={lang} maxGuests={data.maxGuests} />
          </Reveal>
        </section>
      )}

      <section className="px-6 py-16 text-center">
        <p className="font-script text-6xl text-gold-gradient">{tr(data.thanks, lang)}</p>
        <p className="mt-2 uppercase tracking-[0.2em] text-primary">{tr(data.hosts, lang)}</p>
      </section>

      <footer className="flex items-center justify-center gap-6 bg-ink py-6 text-gold">
        <a href="https://webinvite.uz" target="_blank" rel="noreferrer" aria-label="webinvite.uz" className="flex items-center gap-2 text-sm">
          <Globe className="h-5 w-5" /> webinvite.uz
        </a>
        <AdminFlow slug={slug} data={data} trigger={<KeyRound className="h-5 w-5" />} />
      </footer>

      <MusicPlayer url={data.musicUrl} lang={lang} />
    </div>
  );
}
