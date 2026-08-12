// THE API IS NOW THE PLATFORM GATEWAY, not the legacy monolith.
//
// Two things changed together and neither works without the other:
//
//   host  api-dev.cocarr.com  ->  apis-dev.cocarr.com   (note the `s`)
//   path  /v1                 ->  /v1/core
//
// The gateway routes by prefix (`/v1/core` -> core service, `/v1/workspace` ->
// workspace, and so on) and strips that prefix before proxying, so the core
// service still sees the same `/v1/user`, `/v1/booking`, `/v1/image` paths it
// always did. Every call in this app is relative to API_URL, so no endpoint
// string changes — but pointing at `apis-dev.cocarr.com/v1` WITHOUT `/core`
// reaches the gateway and 404s on everything, which looks like the whole
// backend is down rather than like a wrong prefix.
//
// `api-dev.cocarr.com` (no `s`) is the LEGACY monolith. It still answers on the
// old `/v1` paths, which is exactly why a half-done migration is hard to spot:
// both hosts respond, and only one of them is this platform.
export const API_URL = 'https://apis-dev.cocarr.com/v1/core';

// Previous values, kept for local work:
//   https://api-dev.cocarr.com/v1                        legacy monolith (dev)
//   https://api.cocarr.com/v1                            legacy monolith (prod)
//   http://172.20.10.2:3030/v1                           core service on a LAN device

export const BOOKING_INITIATED = "initiated"
export const BOOKING_BOOKED = "booked"
export const BOOKING_ONGOING = "ongoing"
export const BOOKING_FINISHED = "finished"
export const BOOKING_CANCELLED = "cancelled"
export const BRAND_COLOR = '#EDBF31';

// Cashfree RC (vehicle registration) verification during car listing.
// false = clicking Verify skips the API call and moves straight to the next
// step. Flip to true once the KYC key is live on the backend (which also needs
// RC_VERIFICATION_ENABLED=true there).
export const SHOULD_VERIFY_VEHICLE = false;

// ⚠ THESE ARE NO LONGER THE SWITCH. THE SERVER IS.
//
// Both of these were hardcoded `true`, so the SHIPPING APP skipped the real RC
// check and the real Aadhaar OTP for every user, with nothing in any admin
// screen saying so. Whether verification actually runs is not a decision a
// mobile build should be making: it cannot be changed without an app-store
// release, and nobody operating the platform can see what it is set to.
//
// It is now the `verification.providerBypass` feature flag, switchable in the
// ops portal and OFF unless someone deliberately turns it on. The server skips
// the provider calls; the client only needs to know so it does not show an OTP
// box when no code is going to arrive, and it learns that from
// `providerBypass` on GET /user/verification.
//
// These stay at FALSE as the local escape hatch for a developer working against
// a server they cannot configure. Never commit either as `true`.

// Verify-by-car-number bypass. When true, clicking "Verify" skips the
// /host/vehicles/verify API call and goes straight to step 2 with the entered
// number (fields editable).
export const BYPASS_RC_VERIFY = false;

// Cashfree offline-Aadhaar (KYC) OTP bypass during rider onboarding.
// When true, the Aadhaar step SKIPS the /user/check-kyc and /user/verify-kyc
// calls — the backend fulfils those through Cashfree, which is currently
// failing (the server IP is not whitelisted with the provider). The user still
// enters their number and photographs the card; the documents are submitted for
// the support team to verify by hand instead of being auto-checked. Flip to
// false once Cashfree KYC is live again (the backend also needs its IP
// whitelisted). Mirrors BYPASS_RC_VERIFY.
//
// Superseded by the server flag — see the note above. Left as a local escape
// hatch only, and it must stay false in anything that ships.
export const BYPASS_AADHAAR_VERIFY = false;
