import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { EditorialStudyProps } from "../EditorialStudyTypes";

export function CraftDesignTwo({ basePath, copy }: EditorialStudyProps) {
  return (
    <section
      className="folio-two-craft"
      aria-labelledby="mirza-craft-title-two"
    >
      <div className="folio-two-craft__composition mirza-frame">
        <h2
          id="mirza-craft-title-two"
          className="folio-two-craft__title mirza-display"
        >
          <span>{copy.craftAltTitle}</span>
          <em>{copy.craftAltAccent}</em>
        </h2>
        <div className="folio-two-craft__process">
          <Image
            src="/editorial/craft-hands.webp"
            alt={copy.craftImageAlt}
            fill
            sizes="(max-width: 360px) calc(100vw - 40px), (max-width: 760px) calc(100vw - 48px), (max-width: 1600px) 52vw, 820px"
          />
        </div>
        <div className="folio-two-craft__copy">
          <p>{copy.craftAltDescription}</p>
          <Link
            className="mirza-link"
            href={`${basePath}/c/categories/traditional`}
          >
            {copy.craftCta}
            <ArrowUpRight size={18} strokeWidth={1.4} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
