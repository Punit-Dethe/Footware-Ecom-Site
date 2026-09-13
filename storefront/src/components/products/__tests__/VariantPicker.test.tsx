import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OptionType, Variant } from "@/types/commerce";
import { VariantPicker } from "../VariantPicker";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const sizeOption: OptionType = {
  id: "ot_size",
  name: "size",
  label: "Size",
  position: 1,
  kind: "button",
};

const variants = ["6", "7"].map(
  (size) =>
    ({
      id: `variant-${size}`,
      purchasable: true,
      option_values: [
        {
          id: `size-${size}`,
          option_type_id: "ot_size",
          name: size,
          label: `UK/India ${size}`,
        },
      ],
    }) as Variant,
);

describe("VariantPicker", () => {
  it("selects the matching size and opens the size guide", () => {
    const onVariantChange = vi.fn();
    render(
      <>
        <VariantPicker
          variants={variants}
          optionTypes={[sizeOption]}
          selectedVariant={variants[0]}
          onVariantChange={onVariantChange}
          sizeGuideHref="#size-guide"
          compactSizes
        />
        <details id="size-guide">
          <summary>Guide</summary>
        </details>
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "7" }));
    expect(onVariantChange).toHaveBeenCalledWith(variants[1]);

    fireEvent.click(screen.getByRole("link", { name: "sizeGuide" }));
    expect(document.getElementById("size-guide")).toHaveAttribute("open");
  });
});
