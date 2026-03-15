/**
 * Checkout and order totals configuration.
 */

/** Tax rate applied to subtotal (0 = no tax, 0.1 = 10%). */
export const TAX_RATE = 0;

/** Cities/towns with free delivery (Nairobi & Thika). */
export const FREE_SHIPPING_AREAS = ["Nairobi", "Thika"];

/** Shipping cost (KSh) for areas outside Nairobi and Thika. May be increased by location/parcel company. */
export const SHIPPING_COST_OUTSIDE_KSH = 200;

/** Order total threshold for free shipping is no longer used; shipping is by delivery area only. */
export const FREE_SHIPPING_THRESHOLD_KSH = 2000;
export const SHIPPING_COST_KSH = 200;
