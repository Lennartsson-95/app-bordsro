<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep profile validation in a shared Zod schema and persist answers through authenticated server functions; this keeps client and server validation consistent.
- Store initial email-signup answers in auth metadata for the profile trigger, and social-login drafts only in sessionStorage until authenticated save; confirmation and OAuth must not lose answers.
- Use the single root account provider for auth identity updates, and the client-only authenticated layout for private profile pages; this avoids competing session listeners and SSR redirects.
- Generate meal suggestions and date ranges in a shared pure meal-plan module; persist per-user/date choices, eaten flags, custom food names and times, keeping suggested portions derived from the profile rather than stored.
- Use one shared meal editor for Today and Week so time and food edits use the same authenticated save path and portion rules.
- Keep meal reminders in the open Today page, persisted as profile preferences with local-clock scheduling; background push is not enabled and must not be implied.
- Keep optional own-item shopping quantities separate from item names and validate them through a shared schema; quantities must not change deduplication or check-off identity.
