# COCARR-APP

React Native mobile app for COCARR (car-sharing platform). Redux (redux-persist), React Navigation, Firebase Auth, axios.

**Working branch: `develop`** — this is the actual default branch (`origin/HEAD -> origin/develop`), not `main`. Opposite convention from the backend/admin repos, which use `railway-dev` — don't assume, check `git branch --show-current` per repo.

## Structure
- `src/screens/` — organized by domain: `homeScreens/`, `rideScreens/` (rider), `host/*Screens/` (host), `profileScreens/`, `authScreens/`
- `src/navigators/` — `TabNavigator.js` (rider bottom tabs: Home/Rides/Offers/Membership), `HostNavigator.js` (host bottom tabs: Home/Bookings/Cars/Earnings), `ProfileStackNavigator.js` (rider profile) vs `HostProfileStackNavigator.js` (host profile) — **two separate profile stacks**, not shared
- `src/store/` — redux slices (`authSlice`, `bookingSlice`)
- `src/utils/constants.js` — `API_URL`, booking status constants (`BOOKING_INITIATED`, `BOOKING_BOOKED`, `BOOKING_ONGOING`, `BOOKING_FINISHED`, `BOOKING_CANCELLED`), `BRAND_COLOR`
- `src/utils/utils.js` — `photoUrl()`, `formatDate()`, `notify()`

## Images — private bucket, must proxy
Same as web: uploaded images live in a private bucket, so raw DB URLs 403. Always use `photoUrl()` from `src/utils/utils.js`. **Known recurring bug**: several upload screens build the post-upload reference URL as `urlRes.data.url + urlRes.data.fields.key` (string concatenation) instead of `${API_URL}/image/${key}` — this produces a malformed/inaccessible link. Fixed in `StartBookingScreen.js`; **still present** in `EndBookingScreen.js`, `HostStartBookingScreen.js`, `HostEndBookingScreen.js`, `HostCarInfoScreen.js` (grep for `.data.url +` to find more).

## Nav / mode shell
Two bottom-tab navigators (`TabNavigator.js` rider, `HostNavigator.js` host), switched via a round toggle button in `AppTabBar.js` (not a tab itself). Wallet points show in `TopBar.js` (renters only, top-right chip) — not a tab, not in the profile screen.

## Error handling
`src/components/ErrorBoundary.js` existed but was **never wired in anywhere** — a real bug (any crash → blank black page, no message). Now wrapped around `RootNavigator` in `App.js`.

## Booking status lifecycle
Same as web: `initiated → booked → ongoing → finished`, plus `cancelled`. **`initiated` is real and non-transient** (confirm-booking can fail after payment capture) — `RideInfoScreen.jsx`'s action buttons and `RidesScreen.jsx`'s "Booked" tab must match both `BOOKING_BOOKED` and `BOOKING_INITIATED`, not just the former (this was a real bug — an initiated ride was invisible in the list and had no Cancel/Reschedule options if reached directly).

## Start-ride flow
`RideInfoScreen.jsx` (rider ride detail) → Start Ride button only shows once `booking.startTime` has passed (`hasStarted`) → navigates to `StartBookingScreen.js` for OTP + odometer + 6 required car photos → `POST /booking/start-ride/:id`. The OTP comes from the **host's** screen (`HostBookingInfoScreen.js` displays `booking.startOtp`/`endOtp` split into digits) — host reads it aloud, rider types it in. It is not sent via SMS/push.

`RideInfoScreen.jsx` used a mount-only `useEffect` to fetch booking data — since React Navigation doesn't remount an already-in-stack screen on `navigation.navigate()` back to it, this left the screen showing stale pre-start data after successfully starting a ride. Fixed with `useFocusEffect` instead — refetches on every focus, not just mount.

## Onboarding / verification — ONE wizard, three modes
`screens/profileScreens/OnboardingWizardScreen.js` owns profile details AND identity documents. Four steps: details → Aadhaar → licence → live selfie. Steps 1–3 are mandatory; the selfie is optional.

Mode comes from the `mode` route param, so one screen serves all three:
- `onboarding` (default) — a new account, straight after OTP. Cannot be abandoned.
- `edit` — cancellable. **Cancel only appears once something has actually changed**; dirty state is a comparison against the values as loaded, not a flag each input sets.
- `review` — read-only, every section selectable from the rail, Edit in the header hands off to edit mode. This is what the profile's "Identity & documents" row opens.

**Eight screens were deleted** as duplicates of these steps: `EditProfileScreen`, `VerificationScreen`, `AadhaarVerificationScreen`, `LicenceVerificationScreen`, the whole `screens/verificationScreens/` folder (`KycVerificationScreen`, `LicenseVerificationScreen`, `ProfileVerificationScreen`) and the unused `VerificationNavigator`. `PanVerificationScreen` stays — PAN is a host payout prerequisite, not part of the rider identity check.

Anything that used to navigate to `EditProfile` or `Verification` now targets `OnboardingWizard` with the right `mode`. `TopBar` gained a `rightParams` prop for exactly this: without it the profile's edit action opened the wizard in its default onboarding mode and silently did the wrong thing.

**The step rail is tappable backwards.** Any step already reached is a button; steps ahead of `furthest` stay inert. Review mode makes everything reachable, since nothing is being submitted.

**One back control, and it is the header's.** It steps backwards within onboarding and is absent on step 1 where there is nowhere to go; in edit/review it leaves the screen. The screen previously used `CenterHeader`, whose back calls `navigation.goBack()` — on step 1 of a mandatory flow that dropped the user out of onboarding entirely — *and* carried a second "‹ Back" at the bottom of the scroll view, so two controls did different things.

**Camera only, never the gallery.** Every capture uses `launchCamera`; the selfie passes `cameraType: 'front'`. A gallery pick would defeat the liveness check, and for documents it invites a screenshot instead of the card. `launchImageLibrary` appears in this file only in the comment explaining why it is absent.

**Editing identity details invalidates the verification.** `PUT /user/onboarding` returns `verificationInvalidated: true` when name/DOB/address changed on an approved profile; the wizard says so via `notify` rather than letting the avatar badge quietly change.

Shared helpers mirror the web app and must stay in step: `utils/indianStates.js` (36 entries, byte-identical to web's) and `utils/age.js` (18+ rule, **local** calendar dates — `toISOString()` shifts to UTC and in IST rolls the boundary back a day).

## New-user login
`MainNavigator.tsx`'s `fetchLastBooking()` called `/booking/last-booking`, which returns bare `null` (not `{booking, review}`) for an account with zero finished bookings — reading `.review` off that threw on every brand-new user's first login (caught, but surfaced a misleading "Error fetching last booking" alert). Fixed to guard on `response.data` being non-null and stopped alerting on this non-critical background fetch.
