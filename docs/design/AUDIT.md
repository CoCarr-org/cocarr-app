# COCARR mobile app — design audit

**Scope:** every screen and shared component in `src/` on `develop` @ `a619926` (52 screen files, 17 components, 12 navigators).
**Method:** code-level review against `docs/design/UX_LAWS.md`, Apple HIG / Material, and WCAG 2.1 AA, plus measured counts (colours, font sizes, touch targets, labels, states) taken with AST scripts over the whole tree.
**Limit:** this audit reads the code; it has not been checked on a device. Anything marked *verify on device* needs a look on a small iPhone (SE), a large iPhone, and a mid-range Android, in both modes and at the largest text size.

Severity: **P0** broken or blocks a task · **P1** hurts many users or the brand · **P2** polish.
Status: **Fixed** on branch `design/gold-theme-light-dark` · **Open**.

---

## 1. Summary

| # | Finding | Sev | Status |
|---|---|---|---|
| 1 | Login phone screen uses `Platform` without importing it — throws on render | P0 | Fixed |
| 2 | No light mode; 2,300 hard-coded hex values; ~40 near-identical greys | P1 | Fixed |
| 3 | Typography: `CustomText` requests Inter, which is not bundled — every `weight=` is ignored | P1 | Fixed |
| 4 | Text down to 8–9 pt; 170 places under 11 pt | P1 | 8–9 pt fixed; 10 pt open |
| 5 | Accessibility labels on 6 of 298 touch targets | P1 | Partly fixed (shell, profile, appearance) |
| 6 | iOS `notify()` is a blocking alert for every message (83 calls) | P1 | Fixed |
| 7 | Razorpay checkout shows a broken logo (`https://your-app-logo.png`, 4 places) | P1 | Open |
| 8 | Booking-status colours copied into 3 files and drifted | P2 | Fixed |
| 9 | Toasts were white on green (≈2.4:1) and white on red | P1 | Fixed |
| 10 | Two `Alert` imports missing (schedule screens' error paths would crash) | P0 | Fixed |
| 11 | `HostBookingInfoScreen`: star tap calls `setShowReview` outside its scope — throws | P0 | Open |
| 12 | `WalletPage`: `initiateBooking` is undefined | P1 | Open |
| 13 | Detail screens are label/value dumps: 25–37 sub-11 pt labels and 31–44 uppercase labels each | P1 | Open |
| 14 | Eight icon libraries mixed (Ionicons, Feather, AntDesign, FontAwesome, Material, Octicons, SimpleLine, MaterialCommunity) | P2 | Open |
| 15 | Currency shown as both "Rs." (44) and "₹" (8) | P2 | Open |
| 16 | Log out had no confirmation and looked like any other row | P2 | Fixed |
| 17 | "Rate Us" opens the App Store / Play Store home page, not COCARR's listing | P2 | Open |
| 18 | Same screens registered in up to 4 navigators; a stack (`HostHomeStackNavigator`) references an undefined `Hostome` | P2 | Open |
| 19 | Dead files: `SettingsScreen` (placeholder), `HostCarScreen.js` (empty), `ErrorModal` (unused, broken imports) | P2 | Open |
| 20 | 173 `console.log` calls ship in release, some logging the Firebase user object | P1 | Open |
| 21 | OTP boxes don't support SMS/iOS one-time-code autofill | P2 | Open |
| 22 | Jest setup broken on RN 0.86 (`preset: 'react-native'` moved to `@react-native/jest-preset`) | P2 | Open |
| 23 | Razorpay **test** keys hard-coded in 5 payment screens (two different keys) | P0 | Open |
| 24 | `PaymentSuccess` is never navigated to — after paying, riders land on Trips with no confirmation | P1 | Open |
| 25 | `DatePicker` `minDate` uses UTC (`toISOString`), allowing yesterday before 05:30 IST | P2 | Open |
| 26 | Host Profile → Inbox opens a blank screen (list commented out) | P2 | Open |
| 27 | `CLAUDE.md` says documents are "camera only, never the gallery"; code (correctly) allows the library | P2 | Open |

---

## 2. Brand and visual system

**Gold.** The UI gold `#EDBF31` matches the old app logo. The new artwork you supplied has a softer wheel gold, `#ECBD65`. The theme keeps `#EDBF31` (as requested); switching to the artwork's gold is one line, `BRAND_GOLD` in `src/theme/palette.js`.

**Gold overuse (Von Restorff).** Gold was the colour for primary buttons, active tabs, prices, icons, section titles, links, today-in-calendar, switch thumbs and the mode toggle — 145 uses of the literal, 87 of them as text. When everything is gold, the one action that matters doesn't stand out. *Rule now in the design system:* gold fill for the single primary action and the active state; gold text sparingly.

**Greys.** ~40 distinct greys (`#757575`, `#959595`, `#8A8A8A`, `#808080`, `#A3A3A3`, `#C3C3C3`…) with no semantic meaning. Collapsed to 5 text tokens and 5 surface tokens.

**Contrast (measured).** `#757575` on `#1C1C1E` (the most common secondary text on cards) is **3.7:1 — fails AA**. Now `textTertiary` `#98989D` at 5.2:1 on cards. Every token pair is checked by `scripts/check-contrast.js`.

**Logo.** The header used `images/logo.png` at 54×28 — the wordmark was ~9 pt tall. The new `BrandLogo` is 34 pt in the header, 56–64 pt on auth screens, and has a dark-wordmark variant for light mode (the source art is white-on-black and would vanish on ivory).

## 3. Typography

- `CustomText` mapped weights to `Inter-*` font families. No Inter file is bundled (iOS `UIAppFonts` lists Geist/HostGrotesk/MonaSans; Android has no `assets/fonts`). Unknown families fall back to the system font at **regular** weight, so `weight="Bold"` on headings and prices did nothing. Fixed: system font + real `fontWeight`.
- Size distribution before: 8 pt ×3, 9 pt ×23, 10 pt ×144, 11 pt ×156, 12 pt ×269. Body copy was mostly 12–13 pt; Apple's body is 17, Material's 16. 8–9 pt raised to 11. **Open:** raise 10 pt labels to 11–12 and body from 12 to 14–15 screen by screen, checking layouts.
- 340+ `textTransform: 'uppercase'` labels at 10–11 pt with tracking. Uppercase small text is the slowest to read; keep it only for short section overlines.
- `CustomText` defaults to `numberOfLines={1}` — every label silently truncates. With Dynamic Type this hides content. **Open:** default to unlimited and opt in to truncation.

## 4. Accessibility

| Check | Before | Now |
|---|---|---|
| Icon-only buttons with a label | 6 / 298 touchables | Shell, profile, appearance, logo covered; screens open |
| Touch targets < 44 pt | Back button 36, avatar 38, edit 38, wallet chip ~30 tall, tab items ~44 | Header controls 44, tabs ≥ 50, chip 36 |
| Status by colour alone | Ride status pills had labels ✓; verification badge was icon + colour ✓ | — |
| Dynamic Type | No cap, `numberOfLines={1}` everywhere | `maxFontSizeMultiplier={1.6}` on `CustomText` |
| Screen reader roles | 8 `accessibilityRole` | + tabs, radios, alerts on toasts |

**Open, by screen priority:** add `accessibilityLabel` to icon-only buttons on CarsListing (sort/filter), CarInfo (back, share, map), RideInfo (call host, cancel), AddCar (photo slots), HostCarInfo (edit/delete). Group key/value rows with `accessible` so VoiceOver reads "Pickup time, 12 Nov 10:00" as one element.

## 5. Feedback and states

- **Blocking alerts.** On iOS, `notify()` called `Alert.alert('', text)` — a modal with no title the user must dismiss, for success messages and for silent background-fetch failures. 83 call sites. Now a toast on both platforms (Flow, Doherty).
- **Loading.** 30 screens use a bare `ActivityIndicator`; 2 have skeletons. Lists (Cars, Rides, Host bookings, Earnings) should use skeleton rows (Doherty threshold).
- **Empty states.** Present on 11 screens. Missing on Rides (new user sees two empty tabs with "From / To" headers), Host bookings, Wallet transactions, Host inbox. Each needs one line of copy and one action.
- **Errors.** Several screens show "Something went wrong. Please try again later." with no retry. Add a Retry button (pull-to-refresh is not discoverable).

## 6. Navigation and information architecture

- Rider tabs: **Home · Rides · Offers · Membership** + mode toggle. Offers and Membership are marketing destinations taking two of four top-level slots; Profile is only reachable from the header avatar. Consider **Home · Trips · Wallet/Offers · Profile** (Jakob's law — most rental apps put the account in a tab).
- Host tabs: **Home · Bookings · Cars · Earnings** — good, matches the host's mental model.
- Route sprawl: `CarsListing`, `CreateSchedule`, `OnboardingWizard`, `PanVerification`, `Wallet`, `Offers`, `Referral` are each registered in 3–4 navigators. The same name resolving to different stacks makes back behaviour unpredictable.
- Mode toggle: well-reasoned (sits outside the tab pill). Label "Host"/"Rent" at 12 pt in a 52 pt circle — add an icon (car + key) for recognition.

## 7. Flow-by-flow

### Sign-in (Open → Mobile → OTP)
- Welcome had no logo; title "Enjoy luxury with our self-drive car" (grammar), CTA "LET'S START RIDING" uppercase. Now: logo, value line, subtitle, "Get started". **Fixed.**
- Phone screen crashes on `Platform` (P0). **Fixed.**
- "HAVE A REFERRAL CODE?" uppercase link — fine, but the field should collapse by default (Hick).
- OTP: add `textContentType="oneTimeCode"` / `autoComplete="sms-otp"` and accept a 6-digit paste into the first box. **Open.**

### Search and book (Home → Date/City pickers → CarsListing → CarInfo → Payment → Success)
- Home search follows Where → When → Search ✓ (mental model).
- Home stacks: search, premium banner, Why COCARR, offers, Top cars, FAQ. The FAQ and "Why choose" belong on a logged-out marketing screen, not a returning user's home (Pareto). Move below the fold or remove.
- CarsListing: price is 18 pt medium; card meta 10–12 pt. Make price the heaviest element (Von Restorff), seats/fuel/transmission one chunked line.
- CarInfo and CarPayment both call `/booking/summary`, `/booking/initiate`, `/booking/confirm` — two places can start a payment. Pick one (CarPayment, titled "Booking Summary").
- Price breakdown uses "Rs." while success uses "₹". Use `₹` with Indian digit grouping (`₹1,25,000`) everywhere.
- Razorpay `image: 'https://your-app-logo.png'` → broken logo in the payment sheet at the most trust-sensitive moment. Host the logo (e.g. `https://cocarr.com/logo-razorpay.png`, 256×256) and reference it. **Open.**
- PaymentSuccess is the end of the peak-end arc: add pickup time and place, and "Add to calendar".

### Trip (Rides → RideInfo → Start → Extension/Reschedule/Cancel → End → Review)
- RideInfo: 25 labels under 11 pt, 31 uppercase. Restructure into cards: When · Where · Car · Payment · Photos, actions in a sticky footer.
- Start Ride appears only after start time ✓ with an explanation ✓.
- Cancel shows the refund tiers before confirming ✓ — good transparency.
- Review: three star rows (Comfort / Host / Cleanliness) + text. Fine.

### Verification (OnboardingWizard, PAN)
- Strongest flow in the app: one wizard, step rail, OCR fallback that keeps photos, clear copy. Keep it as the reference for others.

### Host (HostHome → AddCar → HostCars → HostCarInfo → Schedule → Bookings → Start/End → Damage → Earnings → Bank)
- AddCar (1,897 lines, 11 inputs, 42 touchables) is the longest flow. RC OCR first ✓. Split the file into step components; add a persistent "Step 2 of 5" header (goal-gradient).
- HostBookingInfo: shows Start/End OTP for the host to read aloud ✓; 37 sub-11 pt labels. Same restructure as RideInfo.
- Star tap in the review section throws (P0, #11).
- HostBankPage: account number entered once with no confirm field. Ask twice or mask with reveal.

## 8. What was changed on this branch

- `src/theme/` — palette (dark + light), runtime (`C`, `themedStyleSheet`), `ThemeProvider`, `status.js`
- 79 files: 2,260 colour literals → semantic tokens (codemod); module-level colour maps → render-time functions
- `App.js` — ThemeProvider, navigation theme, nav state preserved across theme switches, new toasts
- `AppearancePicker` on both profile screens (System / Light / Dark); log-out confirmation; row text 12/11 → 15/13 pt
- `BrandLogo` with dark and light artwork from the supplied logo; used in header, welcome, phone and OTP screens
- `CustomText` — system font with real weights
- `notify()` — toast on both platforms
- Header / tab bar — 44 pt targets, 11 pt tab labels, gold-tinted active tab
- Welcome screen copy and layout
- Missing `Platform` / `Alert` imports
- `scripts/check-contrast.js`, `docs/design/*`, `.claude/skills/*`
