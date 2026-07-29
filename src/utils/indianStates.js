// All 28 states and 8 union territories. Mirrors the web app's
// src/data/indianStates.js — the two must stay in step, because the admin
// compares this value against what OCR reads off the document.
//
// A free-text state field produced values a reviewer then had to reconcile
// ("KA", "Karnataka", "karnatka"), which is exactly the kind of mismatch the KYC
// review exists to catch — so the form must not be the thing creating it.
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export const UNION_TERRITORIES = [
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const ALL_STATES = [...INDIAN_STATES, ...UNION_TERRITORIES];
