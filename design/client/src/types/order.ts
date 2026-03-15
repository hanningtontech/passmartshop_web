/**
 * Order types for checkout and order display.
 * Aligns with backend (tRPC/DB) and admin processing.
 */

export type PaymentMethod = "M-Pesa" | "Cash on Delivery";

export type PaymentStatus =
  | "Pending"
  | "Awaiting Verification"
  | "Confirmed"
  | "Failed"
  | "Refunded";

export interface OrderPaymentInfo {
  paymentMethod: PaymentMethod;
  /** Required when paymentMethod is 'M-Pesa' */
  mpesaTransactionCode?: string;
  paymentStatus: PaymentStatus;
}
