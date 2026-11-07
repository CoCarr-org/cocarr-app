import {
  BOOKING_BOOKED, BOOKING_CANCELLED, BOOKING_FINISHED, BOOKING_INITIATED, BOOKING_ONGOING,
} from '../utils/constants';
import { C } from './runtime';

// One booking-status pill palette for Rides, HostBookings and HostBookingInfo.
// It used to be copied into each of those files, and the copies had drifted
// (Upcoming was gold text in one, gold fill colour in another).
// A function, not a constant, so it reads the active scheme each render.
export function bookingStatusStyle(status) {
  switch (status) {
    case BOOKING_INITIATED:
      return { label: 'Pending', fg: C.primaryText, bg: C.primarySoft, bd: '#EDBF3155' };
    case BOOKING_BOOKED:
      return { label: 'Upcoming', fg: C.primaryText, bg: C.primarySoft, bd: '#EDBF3166' };
    case BOOKING_ONGOING:
      return { label: 'Ongoing', fg: C.success, bg: C.successSoft, bd: '#3FCE8F59' };
    case BOOKING_CANCELLED:
      return { label: 'Cancelled', fg: C.danger, bg: C.dangerSoft, bd: '#EF444455' };
    case BOOKING_FINISHED:
    default:
      return { label: 'Completed', fg: C.textSecondary, bg: C.surfaceHigh, bd: C.borderStrong };
  }
}
