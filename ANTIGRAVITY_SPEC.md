# Hisaab — Shared Expense App for Six People

> Working name: **Hisaab** (change freely). Read this whole file before writing code.
> Rename to `AGENTS.md` if you want Antigravity to load it automatically as a workspace rule.

---

## 1. Goal

A Splitwise-style app for **one fixed group of 6 people**, used on **6 different devices** (phones, tablets, PC). Anyone can add an expense and everyone sees it **instantly**. The oldest member must be able to use it without help.

**Design principle:** build for the least technical user first. If something needs explaining, simplify it or remove it.

### Non-goals (do NOT build)
- Multiple groups, friends lists, public sign-up
- Multiple currencies (INR only, ₹)
- Debt simplification / "optimised payments" (confusing for elders)
- Member photos, avatars, profile pictures, face anything
- Category icons or emojis. **Text only**: person name, category name
- Swipe gestures, long-press, hidden menus, drag-and-drop
- Dark patterns, ads, analytics trackers

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS (custom tokens below) |
| PWA | `vite-plugin-pwa` (installable, offline shell) |
| Backend | Supabase (Postgres + Realtime + Auth + Row Level Security) |
| Hosting | Vercel |
| Testing | Vitest for money/split logic; Playwright for the core flows |

Reason: one codebase runs on every device, no app store, live sync through Supabase Realtime.

---

## 3. Users & Access

- Exactly **6 members**, pre-created by an admin (member #1 is admin).
- No self sign-up. A person can only enter the app through a **personal invite link**.
- All members see all data (single shared group). Row Level Security restricts everything to authenticated, claimed members.

---

## 4. Login: "Log in once, stay logged in"

**Requirement:** one-time login per device. The session persists until the user taps **Log out**.

### Flow
1. Admin opens **Menu → Members** and taps **Create invite link** next to a member's name.
2. Admin sends the link by WhatsApp. The link contains a **single-use code** bound to that member.
3. The member opens the link on their device. Screen shows: *"Welcome. Are you Meena?"* with **Yes, that's me** / **No**.
4. On Yes: the app signs the device in and links it to that member. Done. **No password, no PIN, no email.**
5. From then on the app opens straight to Home, every time.

### Implementation notes
- Use `supabase.auth.signInAnonymously()` to create a real, persistent session, then call an RPC `claim_invite(code)` that sets `members.auth_user_id = auth.uid()` and marks the invite used. The RPC must be `security definer`, validate the code is unused and unexpired (7 days), and fail if the member is already claimed.
- Supabase auto-refreshes the session using the refresh token. **Do not** set session time-boxes or inactivity timeouts.
- Persist the session in `localStorage` (Supabase default) and call `navigator.storage.persist()` on first login.
- **Logout** lives only under Menu. It shows a confirm screen: *"Log out of Hisaab on this device? You will need a new invite link to come back."* Buttons: **Stay logged in** (default, primary) / **Log out**. After logout, admin must create a new invite for that member.
- **Lost or stolen device:** Admin → Members → **Remove this device** (clears `auth_user_id` so the old session loses all access via RLS), then creates a fresh invite.
- A member may be signed in on more than one device only if admin creates another invite for them. Allow up to 2 linked devices per member (`member_devices` table).
- **iPhone note:** show a one-time, plain-language banner after login: *"Tap Share, then Add to Home Screen, so Hisaab always stays signed in."* (Safari can clear web storage of non-installed sites after ~7 days of non-use; installed home-screen apps are safe.)

---

## 5. Data Model (Postgres, all money in integer **paise**)

```sql
members(
  id uuid pk, name text not null, is_admin bool default false,
  active bool default true, created_at timestamptz default now()
)

member_devices(
  id uuid pk, member_id uuid fk, auth_user_id uuid unique,
  linked_at timestamptz default now()
)

invites(
  code text pk, member_id uuid fk, created_by uuid fk,
  expires_at timestamptz, used_at timestamptz null
)

categories(
  id uuid pk, name text unique not null, sort int, active bool default true
)
-- seed: Groceries, Medicine, Electricity, Water, Gas, Fuel, Rent,
--       Dining, Travel, Household, Other

expenses(
  id uuid pk, title text not null,
  amount_paise bigint not null check (amount_paise > 0),
  paid_by uuid fk members, category_id uuid fk categories,
  expense_date date not null, note text,
  created_by uuid fk members, created_at timestamptz default now(),
  updated_at timestamptz, deleted_at timestamptz null, deleted_by uuid null
)

expense_splits(
  expense_id uuid fk, member_id uuid fk, share_paise bigint not null,
  primary key (expense_id, member_id)
)
-- invariant: sum(share_paise) = expenses.amount_paise

settlements(
  id uuid pk, from_member uuid fk, to_member uuid fk,
  amount_paise bigint not null check (amount_paise > 0),
  settled_on date not null, note text,
  created_by uuid fk, created_at timestamptz default now(),
  deleted_at timestamptz null
)

activity_log(
  id uuid pk, actor uuid fk members,
  action text,            -- 'added' | 'edited' | 'deleted' | 'restored' | 'settled'
  entity text, entity_id uuid,
  before jsonb, after jsonb, created_at timestamptz default now()
)
```

### Rules
- **No hard deletes.** Delete = set `deleted_at`. Deleted items are hidden by default, restorable by any member within the app.
- **Every add / edit / delete / restore / settle writes `activity_log`** (use a DB trigger, not client code).
- Enable Realtime on `expenses`, `expense_splits`, `settlements`, `activity_log`, `categories`, `members`.
- RLS: every table readable and writable only by a user whose `auth.uid()` exists in `member_devices`. Only admins can modify `members`, `invites`, `categories`, `member_devices`.
- Never use floats for money. Format only at the display layer (`₹1,23,456.50`, Indian digit grouping via `Intl.NumberFormat('en-IN')`).

---

## 6. Business Logic

### Splitting
- **Equal (default):** split among selected members. Remainder paise are given one each to the first members in alphabetical order, so the sum is always exact.
- **Custom amounts:** user types each person's share. Save is blocked until shares equal the total, with a live line: *"₹200 still to assign."*
- That's all. No percentages or share-units.

### Balances (pairwise, not simplified)
For each ordered pair (A, B): A owes B the sum of A's share on expenses B paid, minus B's share on expenses A paid, minus settlements from A to B, plus settlements from B to A. Show only the net, per person.

Home screen speaks in plain sentences:
- *"You owe Ramesh ₹1,200"*
- *"Meena owes you ₹450"*
- *"You are all settled up"*

Write unit tests for: remainder allocation, custom split validation, pairwise net, settlement reversal, soft-deleted rows excluded.

---

## 7. Screens (mobile-first, works up to desktop)

Bottom navigation, **3 text-labelled tabs**: **Home · History · Menu**. Plus one large **Add expense** button on Home (and floating on History).

### Home
1. Greeting: *"Hello, Meena"* (name only, text).
2. Summary card: *"Overall you get back ₹1,950"* or *"Overall you owe ₹800"*.
3. One card per other member, sorted by amount: name, sentence, and a **Settle up** button where relevant. Tapping the card opens that person's shared history.
4. Big primary button: **Add expense**.

### Add expense (single scrolling form, sticky Save at the bottom)
1. **How much?** Large numeric field, ₹ prefix, numeric keypad.
2. **What was it for?** Text field (title), plus **Category** as a row of large text buttons (name only). Selected state = filled + checkmark text "Selected".
3. **Who paid?** Six large name buttons, default = me.
4. **Split between** Six name checkboxes (all selected by default) with a **Custom amounts** toggle.
5. **Date** Defaults to today; large date picker.
6. **Save** → Review screen: *"Meena paid ₹3,000 for Groceries. Split equally among 6 people (₹500 each). Save this?"* → **Yes, save** / **Go back**.
7. After saving: snackbar *"Saved."* with **Undo** (visible 10 seconds, large).

### History
- Reverse-chronological feed, grouped by date: title, category name, amount, *"Paid by Ramesh · added by Meena"*.
- Filters as visible text chips: **All · Mine · This month**, plus a category dropdown.
- Tap an item → detail view with the full split, **Edit**, **Delete** (confirm), and its change log (*"Meena changed ₹800 to ₹850 · 12 Oct, 4:10 pm"*).
- Show a toggle **Show deleted** to restore items.

### Settle up
Pick person → amount prefilled with what is owed (editable) → review sentence → **Yes, record payment**. Records a settlement. (No actual payment processing.)

### Menu
- **Members** (admin only: invite links, remove device, rename)
- **Categories** (admin only: add / rename / hide)
- **Text size**: Normal / Large / Extra large (stored per device)
- **Export** all data as CSV
- **Log out** (with confirm; see §4)

---

## 8. Visual Design ("calm, trustworthy, bank-grade, not childish")

### Tokens
```
--bg:        #FAF8F4   (warm white)
--surface:   #FFFFFF
--text:      #12263A   (deep navy)
--muted:     #4A5A6A   (still AA contrast, never light grey)
--primary:   #0F6B6B   (deep teal)  buttons, links, focus
--owe:       #A63D2F   (brick)      only with the words "You owe"
--get:       #1B7A4B   (green)      only with the words "owes you"
--border:    #D9D4CA
radius: 12px   shadow: very subtle   spacing scale: 4/8/12/16/24/32
```

### Typography
- Font: **Atkinson Hyperlegible** (Google Fonts), fallback `Inter, system-ui`.
- Body **18px minimum**; labels 16px minimum; amounts **28–36px bold**; headings 24–28px.
- Line-height 1.5. Never use text smaller than 16px anywhere.

### Interaction
- Tap targets **≥ 56px** tall. One primary action per screen.
- Never rely on colour alone: always pair with words ("You owe", "Selected").
- Every icon-free: **buttons are text labels**. Do not add icon libraries for categories or people. Minimal chevrons/checkmarks drawn with CSS are fine.
- Visible focus ring, full keyboard support, `aria-label`s, WCAG AA contrast minimum (aim for AAA on body text).
- Confirm before save and before delete; always offer Undo.
- Plain language. Banned words in UI: *balance, net, ledger, settlement, sync, authenticate*. Use: *owe, get back, paid, saved, signed in*.
- Respect the OS text-size and reduced-motion settings. Keep animations to simple fades only.

### Images
- **None of people.** No avatars, no photos, no illustrations of money or coins.
- Allowed: the app wordmark (text), and a single calm, real photograph on the welcome screen only (optional; a plain `--bg` screen is acceptable too).

---

## 9. Real-time & Offline Behaviour

- Subscribe to Realtime changes on app open; update lists without refresh. Show a small text line *"Updated just now"* on Home.
- If offline: the app shell still opens, the last-loaded data is shown read-only with a clear banner: *"No internet. You can view entries but not add new ones yet."* Phase 4 may add queued offline writes.
- Conflict policy: last write wins at field level, but every change is logged in `activity_log`, so nothing is ever silently lost.
- Push notifications are **out of scope** for v1.

---

## 10. Build Phases (stop and show me after each phase)

**Phase 1: Foundation**
- Supabase schema, RLS policies, triggers for `activity_log`, seed 6 members and categories.
- Auth: invite link → claim flow, persistent session, logout confirm.
- Test: link a second browser and confirm the session survives closing and reopening.

**Phase 2: Core**
- Add expense (equal + custom), review screen, undo, History, Home balances, Settle up.
- Unit tests for all money logic.

**Phase 3: Realtime & polish**
- Realtime subscriptions, edit/delete/restore with change log, Text size setting, CSV export, Members/Categories admin.
- PWA install, iPhone "Add to Home Screen" banner.

**Phase 4 (optional):** receipt photo attachment, voice input for amount, offline write queue, Gujarati/Hindi UI strings (build all UI text through an i18n file from day one).

---

## 11. Acceptance Criteria

- [ ] A new member can go from invite link to Home in **under 30 seconds** with zero typing.
- [ ] After closing and reopening the browser/PWA, the user is still signed in. Only **Log out** ends the session.
- [ ] Expense added on device A appears on device B within **2 seconds**, without a refresh.
- [ ] The sum of splits always equals the expense total, to the paisa.
- [ ] No hard deletes exist; every change is visible in the activity log with who and when.
- [ ] No images of people and no category icons anywhere in the app.
- [ ] Lighthouse accessibility score ≥ 95; all tap targets ≥ 56px; body text ≥ 18px.
- [ ] A 65+ year-old tester can add an expense and settle up unassisted on the first attempt.

---

## 12. Agent Working Rules

- Plan first: produce an implementation plan artifact and wait for approval before coding each phase.
- Keep money logic in a pure, tested module (`/src/lib/money.ts`), with no UI code in it.
- All user-facing strings go through `/src/i18n/en.ts`.
- Never commit secrets; use `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Prefer boring, readable code over clever code. Small components, clear names.
- When a requirement here conflicts with a convenient shortcut, follow this file and ask me.
