"use server";

import { cacheLife, cacheTag } from "next/cache";
import { POLICIES } from "@/lib/catalog/store-config";
import type { Policy } from "@/types/commerce";

export async function cachedGetPolicy(
  slugOrId: string,
  _options?: { locale?: string; country?: string },
): Promise<Policy | null> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("policies", `policy:${slugOrId}`);

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

export async function getPolicy(
  slugOrId: string,
  options?: { locale?: string; country?: string },
): Promise<Policy | null> {
  return cachedGetPolicy(slugOrId, options);
}
