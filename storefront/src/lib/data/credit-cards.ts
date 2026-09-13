"use server";

import type { CreditCard } from "@/types/commerce";

export async function getCreditCards(): Promise<{ data: CreditCard[] }> {
  return { data: [] };
}

export async function deleteCreditCard(_id: string) {
  return {
    success: false,
    error: "Saved payment methods are currently unavailable",
  };
}
