# Security

How Re.Me is protected, what was fixed in the October 2026 audit, and the steps required to deploy those fixes.

## Deploy checklist (required: the fixes are not live until these run)

1. **Apply the database migration.** In Supabase, open **SQL Editor**, paste
   `supabase/migrations/20261007120000_prevent_role_escalation_and_revoke_anon.sql` and run it,
   or with the CLI: `supabase db push`.
2. **Check nobody already made themselves admin** (SQL Editor):
   ```sql
   SELECT id, email, role, updated_at FROM public.profiles WHERE role = 'admin';
   ```
   Any row you don't recognise: `UPDATE public.profiles SET role = 'user' WHERE id = '<id>';`
   then review that account's activity.
3. **Deploy the edge functions:**
   ```bash
   supabase functions deploy smart-paste transcribe-audio summarize-text process-ocr enrich-contact interaction-prep-agent meeting-prep-agent admin-stats generate-talking-points generate-conversation-starters
   ```
4. **Optional:** if the app is served from a domain other than `https://reme.uplifyt.com`, set the
   `ALLOWED_ORIGINS` function secret (comma-separated) so browsers on that domain can call the functions.
5. **Redeploy the website** (Bolt / Netlify) so `public/_headers` takes effect.
6. **Rotate the OpenAI API key** if usage on the OpenAI dashboard shows calls you can't account for.
   Until step 3, four AI functions accepted calls from anyone holding the public anon key.

## Issues fixed

| Severity | Issue | Fix |
|---|---|---|
| Critical | Any signed-in user could set `role = 'admin'` on their own profile (on insert or update). Admins can read and modify every user's contacts, reminders, notes and files. | Trigger `protect_profile_role` forces `role = 'user'` on insert and rejects role changes from API users. The service role and dashboard SQL can still manage roles. |
| High | `smart-paste`, `transcribe-audio`, `summarize-text` and `process-ocr` didn't check who was calling. The anon key is public, so anyone could spend the OpenAI quota (confirmed against the live project). | All four require a signed-in user. |
| High | No per-user limit on 7 AI functions. | Daily caps per user via `ai_usage_logs` (`_shared/guard.ts`). |
| Medium | Errors returned raw internal/OpenAI messages to the client. | Generic messages to the client; details logged server-side. |
| Medium | `process-ocr` accepted any URL as an "image", which the AI provider would fetch. | Only base64 image data URLs are accepted. |
| Medium | No input size limits on AI functions. | Text, audio and image size caps. |
| Medium | CSV exports open to formula injection (`=HYPERLINK(...)` in a name or note runs in Excel/Sheets). | Formula-leading cells are neutralised. |
| Medium | vCard export didn't escape values; a field containing a newline could inject vCard properties. | All values escaped per RFC 2426. |
| Medium | No security headers (CSP, clickjacking, MIME sniffing). | `public/_headers`: strict CSP (no inline scripts, connections limited to Supabase), `X-Frame-Options: DENY`, `nosniff`, Referrer and Permissions policies. |
| Low | LinkedIn URLs used as links without checking the scheme (`javascript:`). | `safeHttpUrl()` allows only http(s). |
| Low | `mailto:` links built from unencoded addresses (parameter injection). | Address is encoded. |
| Low | Tables created after April 2026 still granted privileges to `anon` (RLS returned no rows, but anon should hold no privileges). | Revoked. |
| Low | CORS `*` on all functions. | Allowlist: production domain, localhost, Bolt previews. |

## How access is controlled

- **Database:** row-level security on every table; each user can only reach rows with their own `user_id`.
  The `anon` role holds no table privileges. Admin access (`profiles.role = 'admin'`) can only be granted
  from the Supabase dashboard or with the service-role key.
- **Edge functions:** every function resolves the caller with `auth.getUser()`. The gateway's JWT check alone
  isn't enough, because the public anon key is also a valid JWT. Functions using the service-role key also
  filter by the caller's `user_id`.
- **Secrets:** `OPENAI_API_KEY` and the service-role key exist only as Supabase function secrets.
  The browser bundle contains only the public anon key. Git history has been scanned: no secrets were ever committed.
- **Client:** CSP blocks inline and third-party scripts (apart from the Bolt badge) and limits network calls to the Supabase project.

## Automated checks (CI)

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:
type-check, lint, unit tests, production build, `npm audit` on production dependencies,
`deno check` on all edge functions, and a gitleaks secret scan. Dependabot opens weekly dependency updates.

## Known remaining items

- 9 `npm audit` findings remain in **dev-only** build tooling (Vite dev server, Tailwind's CSS parser).
  Fixing them needs Vite 8 and Tailwind 4, both breaking upgrades. Shipped code has 0 known vulnerabilities.
- The owner/admin email for the admin dashboard and unlimited AI is hardcoded in three functions and the client.
  Consider switching those checks to `profiles.role = 'admin'`.
- Contact and profile photos are stored as base64 data URLs in the database rather than in Storage.

## Reporting a vulnerability

Please report security issues privately to the repository owner, not as a public GitHub issue.
