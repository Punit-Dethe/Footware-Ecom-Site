import { describe, expect, it } from "vitest";
import { escapeHtml, formatSafeDescription } from "../description";

describe("Safe Product Description Formatter", () => {
  it("escapes all dangerous HTML characters", () => {
    const raw = `<script>alert("XSS & attack")</script> 'hello'`;
    const escaped = escapeHtml(raw);

    expect(escaped).not.toContain("<script>");
    expect(escaped).not.toContain("</script>");
    expect(escaped).toContain("&lt;script&gt;");
    expect(escaped).toContain("&lt;/script&gt;");
    expect(escaped).toContain("&quot;XSS &amp; attack&quot;");
    expect(escaped).toContain("&#39;hello&#39;");
  });

  it("formats multi-paragraph plain text into safe HTML paragraphs", () => {
    const raw = `First paragraph.\n\nSecond paragraph line 1\nSecond paragraph line 2\n\nThird paragraph.`;
    const res = formatSafeDescription(raw);

    expect(res.description).toBe(raw);
    expect(res.description_html).toBe(
      "<p>First paragraph.</p><p>Second paragraph line 1<br />Second paragraph line 2</p><p>Third paragraph.</p>",
    );
  });

  it("neutralizes script and iframe payloads embedded in descriptions", () => {
    const payload = `<iframe src="javascript:alert(1)"></iframe>\n\n<img src=x onerror=alert(1)>`;
    const res = formatSafeDescription(payload);

    expect(res.description_html).not.toContain("<iframe");
    expect(res.description_html).not.toContain("<img");
    expect(res.description_html).toContain("&lt;iframe");
    expect(res.description_html).toContain("&lt;img");
  });

  it("handles null, undefined, and whitespace gracefully", () => {
    expect(formatSafeDescription(null)).toEqual({
      description: "",
      description_html: "",
    });
    expect(formatSafeDescription(undefined)).toEqual({
      description: "",
      description_html: "",
    });
    expect(formatSafeDescription("   \n\n  ")).toEqual({
      description: "",
      description_html: "",
    });
  });
});
