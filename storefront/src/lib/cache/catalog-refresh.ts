import "server-only";
import { revalidateTag } from "next/cache";
import { after } from "next/server";

/**
 * Expires a public catalog cache tag after the current response is sent.
 *
 * Why not updateTag() inside admin Server Actions: Next.js applies queued
 * revalidations in a `finally` block *after* the action function returns.
 * If that step throws, the whole action request fails with "An error occurred
 * in the Server Components render", even though the database write already
 * committed, and the action's own try/catch cannot intercept it.
 *
 * Scheduling the invalidation with after() keeps the action response
 * independent of cache plumbing. `{ expire: 0 }` expires the tag immediately,
 * so the next storefront request recomputes the catalog from PostgreSQL.
 */
export function refreshCatalogTag(tag: string): void {
  try {
    after(() => {
      try {
        revalidateTag(tag, { expire: 0 });
      } catch (err) {
        console.error(`[catalog-refresh] Failed to expire cache tag '${tag}':`, err);
      }
    });
  } catch (err) {
    // Never let cache scheduling fail a committed write (e.g. a paid order).
    console.error(`[catalog-refresh] Could not schedule refresh for '${tag}':`, err);
  }
}
