"use server";

import { POLICIES } from "@/lib/catalog/store-config";
import type { Policy } from "@/types/commerce";

export async function getPolicy(
  slugOrId: string,
  _options?: { locale?: string; country?: string },
): Promise<Policy | null> {
  const found = POLICIES.find(
    (p) => p.slug === slugOrId || p.id === slugOrId,
  );
  if (!found) return null;

  return {
    id: found.id,
    name: found.title,
    slug: found.slug,
    body: found.body,
    body_html: null,
  };
}

export const cachedGetPolicy = getPolicy;

