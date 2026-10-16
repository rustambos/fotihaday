import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { InvitationView } from "@/components/invite/InvitationView";
import { getInvitation } from "@/lib/invite/invite.functions";
import { tr } from "@/lib/invite/types";

const inviteQuery = (slug: string) =>
  queryOptions({ queryKey: ["invitation", slug], queryFn: () => getInvitation({ data: { slug } }) });

export const Route = createFileRoute("/i/$slug")({
  loader: async ({ context, params }) => {
    const inv = await context.queryClient.ensureQueryData(inviteQuery(params.slug)).catch(() => null);
    if (!inv) throw notFound();
    return { title: `${tr(inv.data.hosts, "uz")} — ${tr(inv.data.title, "uz")}`, desc: tr(inv.data.welcome, "uz") };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.title ?? "Taklifnoma";
    const desc = loaderData?.desc ?? "Sizni to'yimizga taklif etamiz";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: InvitePage,
});

function InvitePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(inviteQuery(slug));
  return <InvitationView key={slug} data={data!.data} slug={slug} />;
}
