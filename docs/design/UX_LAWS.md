# UX laws for COCARR

The principles every COCARR screen is designed and reviewed against. Each law has the rule, then what it means *in this app* — the screen, the control, the number. When a review cites a law, it cites it by name from this page.

Source for the laws themselves: Jon Yablonski, *Laws of UX* (lawsofux.com), plus Nielsen's heuristics and Apple HIG / Material where noted.

---

## Speed and effort

### Fitts's law
Time to hit a target depends on its size and distance. Big, close targets are fast.
- Every tappable control is **at least 44×44 pt** (iOS) / 48×48 dp (Android). Icons can be smaller; the touch area cannot — use padding or `hitSlop`.
- The booking CTA ("Book now", "Pay ₹…") lives in a **sticky bottom bar**, in the thumb zone, full width.
- Destructive actions (Cancel ride, Log out, Delete car) are *not* adjacent to the primary action.

### Hick's law
Decision time grows with the number and complexity of choices.
- Cars listing: one sort control, one filter sheet; filters grouped (Price · Seats · Fuel · Transmission), not a wall of chips.
- Booking: show the recommended plan pre-selected; other plans behind "See all plans".
- Host listing wizard: one decision per step.

### Doherty threshold
Productivity soars when the system responds in **< 400 ms**.
- Show a skeleton, not a spinner, for lists that take longer (cars, rides, bookings, earnings).
- Optimistic UI for toggles (availability, wallet points switch).
- Every button shows its pressed state immediately and a busy state if the request runs long.

### Tesler's law (conservation of complexity)
Complexity can't be removed, only moved — move it to the system.
- OCR reads the Aadhaar/licence number so the user doesn't type it (already in place).
- Location: default to the user's current city; ask only if detection fails.
- Price breakdown is computed and shown; the user never adds up hourly fee + delivery + deposit themselves.

### Postel's law
Be liberal in what you accept, conservative in what you send.
- Phone input accepts spaces, dashes, a leading `+91` or `0` and normalises.
- Vehicle numbers accept any case and spacing (`ts 09 ab 1234` → `TS09AB1234`).
- Dates and times are picked, never typed.

---

## Memory and attention

### Miller's law
People hold about 7 ± 2 items in working memory. Chunk.
- OTP shown and entered as 6 separate boxes (3 + 3 visual grouping on the host's display).
- Car spec rows chunked: *Seats · Fuel · Transmission* on one line.
- Booking summary: no more than 5 line items before the total.

### Chunking
Group related information into meaningful units.
- Ride detail: **When** (start/end) · **Where** (pickup) · **Car** · **Payment** · **Actions**, each its own card.
- Host earnings: This month · Pending payout · Lifetime.

### Cognitive load
Minimise the mental effort a screen demands.
- One primary action per screen, in gold. Everything else is secondary (outline) or tertiary (text).
- No uppercase micro-labels below 11 pt; no grey-on-grey below 4.5:1.

### Serial position effect
People remember the first and last items best.
- Tab order: **Home** first, **Membership/Earnings** last; the mode toggle sits apart at the end.
- Profile list: the most-used row first (Identity & documents), Log out last.

### Selective attention / banner blindness
People ignore things that look like ads.
- The offers banner on Home must carry a real, specific offer ("20% off weekend bookings"), not a generic promo graphic.
- Status prompts (Complete your profile) use the status colour and an icon, not the brand gold everywhere, so they aren't confused with marketing.

### Von Restorff effect (isolation)
The item that differs is the one remembered.
- Gold is reserved for **the one primary action** and **the active state**. If everything is gold, nothing is.
- The price on a car card is the heaviest text on the card.

### Zeigarnik effect
Unfinished tasks are remembered.
- The onboarding wizard's step rail shows progress (step 3 of 5) and the profile prompt keeps reminding until done.
- Ongoing ride shows a persistent card on Home with time remaining.

---

## Perception and grouping (Gestalt)

### Law of proximity
Things near each other are seen as related.
- Label sits 4 pt above its value; 16–24 pt between groups.

### Law of common region
Things inside the same boundary are seen as a group.
- Cards (`surface` on `background`) group a car's photo, name, specs and price.

### Law of similarity
Things that look alike are seen as related.
- All status pills come from one function, `bookingStatusStyle()` — Pending, Upcoming, Ongoing, Completed and Cancelled look like members of one family everywhere.

### Law of uniform connectedness
Visually connected elements read as related.
- Onboarding step rail: steps joined by a line; reached steps filled.

### Law of Prägnanz
People read complex images in their simplest form.
- Icons are one family (Ionicons, outline for inactive, filled for active). Mixing seven icon sets — as the app currently does — breaks this.

---

## Expectations and emotion

### Jakob's law
Users spend most of their time in *other* apps and expect yours to work the same way.
- Appearance defaults to **System**, matching the rest of the phone.
- Back is top-left, close (×) is top-right on sheets, swipe-down dismisses sheets.
- Bottom tab bar for top-level destinations, the same on iOS and Android.

### Mental model
Design to match how users already think about the task.
- Renting a car: *Where → When → Which car → Pay*. The home search follows exactly that order.
- Hosting: *Add car → Set price → Set availability → Get bookings → Get paid*.

### Aesthetic-usability effect
Users perceive good-looking designs as more usable — and forgive small issues.
- Consistent radii (6 / 10 / 14 / 20), one spacing scale, one type scale.
- Real car photos, cropped consistently at 16:10.

### Peak-end rule
People judge an experience by its peak and its end.
- **Peak**: picking up the car — the start-ride OTP and photo flow must feel effortless.
- **End**: the payment-success and end-ride screens must be warm and clear: what happened, what's next, receipt.

### Goal-gradient effect
Motivation rises as people near a goal.
- Onboarding progress rail; listing wizard "2 steps left"; membership progress toward the next tier.

### Parkinson's law
A task inflates to fill the time available — so shorten the path.
- Re-booking: "Book this car again" on a past ride.
- Autofill OTP from SMS on Android and from Messages on iOS (`textContentType="oneTimeCode"`).

### Paradox of the active user
Users don't read manuals; they start using the app immediately.
- No upfront tutorial. Explain in context: tooltips on the wallet chip, an empty-state line on Rides ("Your bookings show up here").

### Occam's razor
Among competing designs, choose the one with the fewest assumptions.
- Prefer removing a control over explaining it.

### Pareto principle
80% of effects come from 20% of causes.
- The search → car → pay → start ride flow gets the polish budget first.

### Flow
Full immersion in an activity, with clear goals and immediate feedback.
- No blocking alerts for success. `notify()` is a non-blocking toast; alerts are for decisions only (confirm cancel, confirm log out).

---

## Accessibility floor (not optional)

| Rule | Value |
|---|---|
| Text contrast | ≥ 4.5:1 (body), ≥ 3:1 (≥ 18 pt or bold ≥ 14 pt) — `scripts/check-contrast.js` enforces this for the palette |
| Non-text contrast | ≥ 3:1 for input borders, focus rings, icons that carry meaning |
| Smallest text | 11 pt; body 15 pt |
| Touch target | 44 × 44 pt |
| Dynamic Type | Text scales up to 1.6× (`maxFontSizeMultiplier`), layouts must not clip |
| Screen readers | Every icon-only button has `accessibilityLabel`; toggles and tabs set `accessibilityState` |
| Colour alone | Status is never colour-only — always a label or icon too |
