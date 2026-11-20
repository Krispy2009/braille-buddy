# Setting up Supabase for player accounts

Player accounts (sign in with an emailed code, progress sync, account deletion) use the Supabase project `hynbvcxulcklilmeqjtj`. The app only ever uses the **publishable** key, which is public and committed in `.env`. Everything that keeps players' data private is enforced in the database by row level security, so the steps below matter.

Never put the database password or the `service_role` / secret key in this repo, in `.env`, or in the app.

Do these in the [Supabase dashboard](https://supabase.com/dashboard/project/hynbvcxulcklilmeqjtj), in order.

## 1. Create the table, policies and delete function

1. Open **SQL Editor** and start a new query.
2. Paste the whole of `supabase/migrations/20261115120000_player_progress.sql` and run it.
3. It should end with "Success. No rows returned".

This creates `public.player_progress` (one row of progress per player), turns on row level security with policies that let a signed-in player read and write only their own row, removes all access for signed-out visitors (`anon`), and adds `public.delete_account()`, which deletes the calling player's account.

If you later use the Supabase CLI, this file is already in the CLI's `supabase/migrations` layout, so `supabase db push` would apply it. Do not run it twice by hand: the second run fails because the table exists.

### Size limits

Then run `supabase/migrations/20261120090000_player_progress_limits.sql` the same way (new query, paste, run). It adds check constraints so a player cannot save a progress value that is not a JSON object or is over 64 KB, or a daily value that is not an object or is over 8 KB. Real progress is about 7 KB at most, so normal play never comes near. Running it twice is harmless.

## 2. Run the row level security test

1. In **SQL Editor**, start another new query.
2. Paste the whole of `supabase/tests/rls_test.sql` and run it.
3. The result should be one row starting with **PASS**. If it stops with an error starting **FAIL:**, the message says what leaked; do not turn accounts on until it passes.

The test makes pretend players inside a transaction and rolls everything back, so it changes nothing. It checks that one player cannot read, change, delete or take over another player's progress, that oversize or malformed saves are refused, that signed-out visitors can do nothing, and that `delete_account()` removes only the caller. Run it again after any change to the table or its policies.

## 3. Auth: URL configuration

**Authentication → URL Configuration**:

- **Site URL**: `https://braille-buddy.krispytech.workers.dev`
- **Redirect URLs** (add each):
  - `https://braille-buddy.krispytech.workers.dev`
  - `https://braille-buddy.krispytech.workers.dev/**`
  - `http://localhost:5173` (for `npm start`)
  - `http://localhost:4173` (for `npm run preview`)
  - Add any custom domain or Cloudflare preview URL you sign in from, for example `https://*-braille-buddy.krispytech.workers.dev/**`.

The app asks for the email link to come back to the page's own origin (`emailRedirectTo: window.location.origin`). If that origin is not in the list, Supabase sends people to the Site URL instead.

## 4. Auth: email sign-in and the code in the email

**Authentication → Sign In / Providers → Email**: make sure **Email** is enabled. Since there are no passwords, "Confirm email" does not matter for this sign-in, but leave it on.

Check the **Email OTP length**: the app's text says "6-digit code", which is the default. (The code box accepts 6 to 10 digits, but if you change the length, change the wording in `src/components/Account/`.) The default OTP expiry of one hour is fine.

**Authentication → Emails → Templates → Magic Link**: the default template only has a link. Add the code, so players can type it instead of switching apps to tap the link (hard with a screen reader, and in an installed app the link opens in the browser rather than the app). For example:

- Subject: `Your Braille Buddy sign-in code`
- Body:

```html
<h2>Sign in to Braille Buddy</h2>
<p>Your code is:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 4px">{{ .Token }}</p>
<p>Type it in Braille Buddy. Or, on this device, <a href="{{ .ConfirmationURL }}">sign in with this link</a>.</p>
<p>If you did not ask to sign in, you can ignore this email.</p>
```

Also add `{{ .Token }}` the same way to the **Confirm signup** template: the very first sign-in for a new email may use that template instead, depending on your settings.

## 5. Email sending and rate limits

Supabase's built-in email sender is for testing only: it sends very few emails per hour and may only deliver to your own team's addresses. Before inviting players:

- **Authentication → Emails → SMTP Settings**: set up custom SMTP with an email provider (for example Resend, Postmark or Amazon SES), using a sender such as `no-reply@` on a domain you own.
- **Authentication → Rate Limits**: check "emails sent per hour" and "OTP / verification requests". Players who ask for too many codes see "Too many emails were sent just now. Wait a few minutes, then try again."
- If you choose a custom SMTP provider, name it on the Privacy page (`src/components/Privacy/Privacy.tsx`), since it handles players' email addresses.

## 6. Check the region for the Privacy page

**Project Settings → General** shows the project's region. The Privacy page currently says only "Supabase". If the region is in the EU, the TODO in `src/components/Privacy/Privacy.tsx` can be resolved by saying "Supabase (hosted in the EU)".

## 7. Try it

1. `npm start`, open http://localhost:5173, press the person button on Home, and sign in with your email.
2. Type the code from the email. Then sign out, and sign in again with the link instead.
3. In **Table Editor → player_progress** you should see one row for you, updated as you play.
4. Delete the account from the Account screen; the row and the user (under **Authentication → Users**) should both be gone, and your progress should still be in the browser.

## Regenerating types

`src/account/database.types.ts` holds the table and function types the
client is checked against. Regenerate it after any new migration (you need
to run `supabase login` once first):

```
npm run db:types
```

The output is unformatted; `npx oxfmt src/account/database.types.ts` tidies it,
and keep the header comment at the top.

## How the pieces fit

- `.env`: project URL and publishable key. Without them, accounts are hidden and the game works as before.
- `src/account/config.ts`: decides whether the Supabase code needs loading. It is loaded (as its own chunk) only when the Account screen is opened, when the browser already has a session (`sb-hynbvcxulcklilmeqjtj-auth-token` in localStorage), or when the page was opened from a sign-in link.
- `src/account/supabaseAccount.ts`: sign-in, sign-out, deletion, and wiring sync to Supabase.
- `src/account/sync.ts` and `src/account/merge.ts`: local-first sync and the merge rules.
- The service worker never touches requests to Supabase, and does not precache the account chunk.
