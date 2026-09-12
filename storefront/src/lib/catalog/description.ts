/**
 * Product Description Sanitization & HTML Generation
 *
 * The storefront PDP renders `description_html` using `dangerouslySetInnerHTML`.
 * To completely eliminate XSS vulnerabilities, admins edit plain text descriptions only.
 * The server escapes all HTML special characters before wrapping text in paragraphs.
 */

export interface SafeDescriptionResult {
  description: string;
  description_html: string;
}

/**
 * Escapes raw string content for safe embedding into HTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Converts an admin-supplied plain-text description into a clean, safe HTML representation.
 * - Trims input.
 * - Escapes all HTML markup and special characters.
 * - Splits double newlines into `<p>` paragraphs.
 * - Converts single newlines into `<br />`.
 * - Rejects any executable tags or script injection.
 */
export function formatSafeDescription(
  rawDescription: string | null | undefined,
): SafeDescriptionResult {
  if (!rawDescription?.trim()) {
    return {
      description: "",
      description_html: "",
    };
  }

  const trimmed = rawDescription.trim();

  // 1. Escape all HTML special characters first
  const escaped = escapeHtml(trimmed);

  // 2. Split by 2 or more newlines into paragraphs
  const paragraphs = escaped
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${p.replace(/\r?\n/g, "<br />")}</p>`);

  return {
    description: trimmed,
    description_html: paragraphs.join(""),
  };
}
