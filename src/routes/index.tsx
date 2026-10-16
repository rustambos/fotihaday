import { createFileRoute } from "@tanstack/react-router";
import { InvitationView } from "@/components/invite/InvitationView";
import { DEFAULT_INVITE } from "@/lib/invite/defaults";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WebInvite — Raqamli taklifnomalar" },
      { name: "description", content: "Elegant digital wedding invitations with RSVP, countdown, map and music." },
      { property: "og:title", content: "WebInvite — Raqamli taklifnomalar" },
      { property: "og:description", content: "Elegant digital wedding invitations with RSVP, countdown, map and music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <InvitationView data={DEFAULT_INVITE} slug={null} />,
});
