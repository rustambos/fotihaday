<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Invitation content lives as one JSON blob per row in `invitations.data`, validated by `inviteSchema` in src/lib/invite/types.ts — keeps the editor flexible without migrations.
- Admin auth is a shared password (SHA-256 hash in secret ADMIN_PASSWORD_HASH) exchanged for a stateless HMAC token (ADMIN_SESSION_SECRET); all writes go through server functions using the service client — the public role can only read invitations and insert RSVPs.
- Photos live in a private `photos` bucket; uploads use signed upload URLs and the stored URL is a long-lived signed URL (public buckets are blocked in this workspace).
