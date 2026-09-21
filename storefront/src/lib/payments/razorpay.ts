import "server-only";

import crypto from "node:crypto";

/**
 * ARCHITECTURE NOTE: WEBHOOK RECONCILIATION
 * In this phase (Razorpay Standard Checkout — Test Mode), payments are captured
 * via the checkout popup and verified synchronously via the server-side callback.
 *
 * PRODUCTION REQUIREMENT (NEXT PHASE):
 * Before real-money launch, implement signed, idempotent Razorpay webhook endpoints
 * (listening to `payment.captured` / `order.paid`) with replay-attack protection
 * to recover transactions where the customer pays successfully but their browser
 * window or mobile connection closes before executing the client verification callback.
 */

export class RazorpayConfigError extends Error {
  constructor(message = "Razorpay credentials are not configured.") {
    super(message);
    this.name = "RazorpayConfigError";
  }
}

export class RazorpayApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "RazorpayApiError";
  }
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export interface CreateOrderParams {
  amount: number; // Integer in smallest currency subunits (cents/paise)
  currency: string; // ISO 4217 code (e.g. "INR", "USD")
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  invoice_id?: string | null;
  international?: boolean;
  method: string;
  amount_refunded?: number;
  refund_status?: string | null;
  captured?: boolean;
  description?: string;
  card_id?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
  fee?: number;
  tax?: number;
  error_code?: string | null;
  error_description?: string | null;
  created_at: number;
}

export function getRazorpayConfig(): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new RazorpayConfigError("Razorpay credentials are not configured.");
  }

  return { keyId, keySecret };
}

function getBasicAuthHeader(config: RazorpayConfig): string {
  const token = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  return `Basic ${token}`;
}

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

/**
 * Creates a server-authoritative Razorpay Order.
 * Partial payments are explicitly disabled.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams,
  configOverride?: RazorpayConfig,
): Promise<RazorpayOrderResponse> {
  const config = configOverride ?? getRazorpayConfig();

  const body = {
    amount: Math.round(params.amount),
    currency: params.currency.toUpperCase(),
    receipt: params.receipt,
    partial_payment: false,
    notes: params.notes || {},
  };

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Authorization": getBasicAuthHeader(config),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorDesc = `Razorpay order creation failed with status ${response.status}`;
    let errorCode: string | undefined;
    try {
      const errJson = await response.json();
      if (errJson.error?.description) {
        errorDesc = errJson.error.description;
      }
      errorCode = errJson.error?.code;
    } catch {
      // Non-JSON response
    }
    throw new RazorpayApiError(errorDesc, response.status, errorCode);
  }

  return (await response.json()) as RazorpayOrderResponse;
}

/**
 * Retrieves a Razorpay Order by ID.
 */
export async function fetchRazorpayOrder(
  orderId: string,
  configOverride?: RazorpayConfig,
): Promise<RazorpayOrderResponse> {
  const config = configOverride ?? getRazorpayConfig();

  const response = await fetch(`${RAZORPAY_API_BASE}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      "Authorization": getBasicAuthHeader(config),
    },
  });

  if (!response.ok) {
    let errorDesc = `Failed to fetch Razorpay order ${orderId} (${response.status})`;
    let errorCode: string | undefined;
    try {
      const errJson = await response.json();
      if (errJson.error?.description) {
        errorDesc = errJson.error.description;
      }
      errorCode = errJson.error?.code;
    } catch {
      // Non-JSON response
    }
    throw new RazorpayApiError(errorDesc, response.status, errorCode);
  }

  return (await response.json()) as RazorpayOrderResponse;
}

/**
 * Retrieves a Razorpay Payment by ID.
 */
export async function fetchRazorpayPayment(
  paymentId: string,
  configOverride?: RazorpayConfig,
): Promise<RazorpayPaymentResponse> {
  const config = configOverride ?? getRazorpayConfig();

  const response = await fetch(`${RAZORPAY_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      "Authorization": getBasicAuthHeader(config),
    },
  });

  if (!response.ok) {
    let errorDesc = `Failed to fetch Razorpay payment ${paymentId} (${response.status})`;
    let errorCode: string | undefined;
    try {
      const errJson = await response.json();
      if (errJson.error?.description) {
        errorDesc = errJson.error.description;
      }
      errorCode = errJson.error?.code;
    } catch {
      // Non-JSON response
    }
    throw new RazorpayApiError(errorDesc, response.status, errorCode);
  }

  return (await response.json()) as RazorpayPaymentResponse;
}

/**
 * Verifies Razorpay payment signature using constant-time comparison.
 * HMAC-SHA256(`${orderId}|${paymentId}`, keySecret) === signature
 */
export function verifyRazorpayPaymentSignature(
  params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
  configOverride?: RazorpayConfig,
): boolean {
  const config = configOverride ?? getRazorpayConfig();
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(payload)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  const receivedBuf = Buffer.from(razorpaySignature, "utf8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
