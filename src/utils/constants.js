//export const API_URL = 'https://api.cocarr.com/v1';
//export const API_URL = 'https://cocarr-web-production.up.railway.app/v1';
//export const API_URL = 'http://172.20.10.2:3030/v1';
export const API_URL = 'https://api-dev.cocarr.com/v1';
// export const API_URL = 'https://cocarr-apitest.infantsurya.in/v1';

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

// Verify-by-car-number bypass. When true, clicking "Verify" skips the
// /host/vehicles/verify API call and goes straight to step 2 with the entered
// number (fields editable). Set to false to hit the real RC verification API.
export const BYPASS_RC_VERIFY = true;
