"use server";

import type { GiftCard } from "@/types/commerce";

export async function getGiftCards(): Promise<{ data: GiftCard[] }> {
  return { data: [] };
}

export async function getGiftCard(_id: string): Promise<GiftCard | null> {
  return null;
}
