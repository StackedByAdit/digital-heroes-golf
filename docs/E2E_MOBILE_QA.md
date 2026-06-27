# Digital Heroes Golf — End-to-End & Mobile QA Prompt

> Use this as the master prompt/checklist for verifying that **every page, every button, and
> every feature works perfectly on phone and web**, and that the project **passes the build
> end-to-end**. Run it on a real/emulated phone viewport (≤ 390px wide, e.g. iPhone SE / 12),
> a tablet (768px), and desktop (≥ 1280px).

## 0. Build & static checks (must all pass)

- [ ] `npm run lint` → no ESLint warnings or errors.
- [ ] `npm run build` → compiles, type-checks, and generates all static pages with exit code 0.
- [ ] No console errors/warnings on first paint of any route.
- [ ] No horizontal page scroll (`document.scrollingElement.scrollWidth <= window.innerWidth`)
      on any route at 320/360/390px widths.
- [ ] All interactive controls have a touch target ≥ 40px and `touch-manipulation` (no 300ms delay).
- [ ] Respects `prefers-reduced-motion` (hero balls, shimmer, prize pulse disabled).

## 1. Global / chrome

- [ ] Viewport meta is `width=device-width, initial-scale=1` and pinch-zoom is NOT disabled.
- [ ] **Navbar (public):** desktop pill nav shows ≥ lg; hamburger shows < lg.
  - [ ] Hamburger opens/closes; tapping a link closes it; menu does not overflow screen width.
  - [ ] Auth states render correctly: logged out (Log in / Get started), pending subscription
        (Subscribe), active member (Dashboard/Admin + Logout).
- [ ] **Dashboard chrome:** sidebar hidden on mobile, bottom tab bar (5 tabs) visible and fixed,
      respects `safe-area-inset-bottom`; active tab indicator shows.
- [ ] **Admin chrome:** sidebar is an off-canvas drawer on mobile (hamburger → slide-in + overlay);
      overlay tap closes it; sidebar is static ≥ lg.
- [ ] Toasts appear bottom-right and are readable on a phone (not clipped by tab bar).

## 2. Public pages

### Home `/`
- [ ] Hero image fills viewport; headline/sub-copy legible; CTAs tappable.
- [ ] "Explore charities" / "Donate" floating buttons don't overlap content on small screens.
- [ ] Stats counters animate; "How it works" 3-up grid stacks to 1 col on mobile.
- [ ] Featured charity, draw stats, testimonials, final CTA all stack cleanly.
- [ ] Logged-in users see "Welcome back, {name}" + dashboard CTA.

### How It Works `/how-it-works`
- [ ] All steps/sections stack; no overflow; images scale.

### Charities `/charities`
- [ ] Hero gradient card readable; stat cards 3-up → 1-col on mobile.
- [ ] Search + category filter usable on phone (full-width, stack).
- [ ] Featured charity split layout stacks to single column on mobile.
- [ ] Charity grid 3 → 2 → 1 cols; cards' "Learn more"/"Donate" links work.

### Charity detail `/charities/[id]`
- [ ] Header, image, description, events, and donate CTA render and stack.

### Donate `/donate` + `/donate/success`
- [ ] Charity picker (search + scrollable list) works; selecting highlights.
- [ ] Preset amount chips wrap; custom amount input works; min £1 enforced.
- [ ] Guest name/email shown when logged out; prefilled + hidden when logged in.
- [ ] Submit → Stripe Checkout redirect; success page renders post-payment.

### Pricing `/pricing`
- [ ] Monthly/Yearly plan cards stack to 1 col on mobile; "Save £20" badge visible.
- [ ] Contribution slider draggable on touch; value + computed £ update live.
- [ ] FAQ `<details>` expand/collapse on tap; trust badges wrap.

## 3. Auth

### Signup `/signup` (3-step)
- [ ] Step 1 (account): fields, validation (password ≥ 8), inline errors; keyboard types correct
      (email keyboard for email field).
- [ ] Step 2 (charity): search; charity grid 2-col → readable; contribution slider works on touch.
- [ ] Step 3 (plan): plan options stack to 1 col; selection ring shows; checkout error messages
      surface from `?error=` params.
- [ ] Stepper indicator reflects current step on mobile.

### Login `/login`
- [ ] Email/password fields, error states, redirectTo handling; submit works.

## 4. Member dashboard (`/dashboard/*`)

### Overview `/dashboard`
- [ ] Stat cards grid stacks on mobile.
- [ ] "Need N more scores" + winner-verification banners render.
- [ ] Subscription status + charity cards stack (12-col → single col).
- [ ] Score entry + draw participation cards stack on mobile.

### Scores `/dashboard/scores`
- [ ] Add Score / Replace Oldest button; form (date + stepper number input ±) works on touch.
- [ ] Progress bar accurate; capacity warning shown at limit.
- [ ] Scores render as **cards on mobile**, **table on desktop**; edit/delete work; delete confirm modal.

### Draws `/dashboard/draws`
- [ ] Draw history renders; entries/match results readable on mobile.

### Charity `/dashboard/charity`
- [ ] Current charity + contribution shown; change flow works.

### Account `/dashboard/account`
- [ ] Profile save; password change (match + length validation); subscription status;
      cancel-subscription confirm dialog (modal centered, buttons reachable on phone).

### Winner proof upload (when applicable)
- [ ] Upload control accepts image; status updates; errors surface.

## 5. Admin (`/admin/*`)

### Overview `/admin`
- [ ] KPI cards stack; links to sub-sections work.

### Users `/admin/users`
- [ ] Search + status + plan filters usable on phone (stack/full-width).
- [ ] List renders as **cards on mobile**, **table on desktop**.
- [ ] "View" opens slide-over (full-width on phone, scrollable): edit profile, status/plan/charity,
      reset password, cancel subscription (confirm), scores add/edit/delete.
- [ ] Pagination prev/next work and disable at bounds.

### Draws `/admin/draws`
- [ ] Create-draw form (month, type, submit) usable on phone.
- [ ] Draws render as cards on mobile / table on desktop; row actions wrap and tap correctly:
      Simulate, Regenerate, toggle type, Publish (preview modal), Delete (confirm), View results.
- [ ] All modals are scrollable and fit within `90vh` on phone.

### Charities `/admin/charities`
- [ ] Add Charity slide-over: name, description, category, image upload, URLs, featured toggle.
- [ ] List renders as **cards on mobile**, **table on desktop**; star (featured) + active toggles
      + edit + events + deactivate (confirm) all work.
- [ ] Events dialog: list + add/edit/remove event; fits phone.

### Winners `/admin/winners`
- [ ] Payout tracker + tabs + draw filter + Export CSV usable on phone.
- [ ] List renders as **cards on mobile**, **table on desktop**; select checkboxes, Approve/Reject,
      proof preview dialog (image/pdf scales to viewport), reject-notes modal, bulk approve confirm.

### Reports `/admin/reports`
- [ ] Metric grids stack; win-rate + rollover tables scroll horizontally if needed; pie + legend
      stack on mobile; Download CSV works.

## 6. Cross-cutting interaction checks (every modal/drawer/form)

- [ ] Opens/closes via button, overlay tap, and X; focus is reachable; no body scroll lock leaks.
- [ ] Long content scrolls inside the modal, never off-screen on phone.
- [ ] Primary/secondary buttons are both reachable without zoom on a 360px screen.
- [ ] Inputs are ≥ 16px font (prevents iOS auto-zoom) or zoom is acceptable.
- [ ] Async actions show loading/disabled state; success/error toasts fire.

## 7. Definition of done

- [ ] All boxes above pass on phone, tablet, and desktop.
- [ ] `npm run lint` and `npm run build` both succeed.
- [ ] No regressions to existing desktop behavior ("keep what's good").
