import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { EditorialStudyProps } from "../EditorialStudyTypes";
import { ParallaxSceneImage } from "../ParallaxSceneImage";

export function CollectionsDesignThree({
  basePath,
  copy,
}: EditorialStudyProps) {
  return (
    <section
      className="folio-three-collections"
      aria-labelledby="mirza-collections-title-three"
    >
      <div className="folio-three-collections__inner mirza-frame">
        <h2
          id="mirza-collections-title-three"
          className="folio-three-collections__title mirza-display"
        >
          {copy.collectionsHeading}
        </h2>

        <Link
          href={`${basePath}/c/categories/traditional`}
          className="folio-three-scene folio-three-scene--traditional"
          aria-labelledby="mirza-traditional-title-three"
        >
          <ParallaxSceneImage
            src="/editorial/category-traditional-v3.webp"
            alt={copy.traditionalTitle}
            sizes="(max-width: 760px) calc(100vw - 48px), (max-width: 1600px) 80vw, 1260px"
            speed={0.28}
          />
          <div className="folio-three-scene__caption">
            <div>
              <h3 id="mirza-traditional-title-three" className="mirza-display">
                {copy.traditionalTitle}
              </h3>
              <p>{copy.traditionalDescription}</p>
            </div>
            <ArrowUpRight size={26} strokeWidth={1.2} aria-hidden="true" />
          </div>
        </Link>

        <Link
          href={`${basePath}/c/categories/office-wear`}
          className="folio-three-scene folio-three-scene--office"
          aria-labelledby="mirza-office-title-three"
        >
          <ParallaxSceneImage
            src="/editorial/category-office-v3.webp"
            alt={copy.officeTitle}
            sizes="(max-width: 760px) calc(100vw - 48px), (max-width: 1600px) 80vw, 1260px"
            speed={0.28}
          />
          <div className="folio-three-scene__caption">
            <div>
              <h3 id="mirza-office-title-three" className="mirza-display">
                {copy.officeTitle}
              </h3>
              <p>{copy.officeDescription}</p>
            </div>
            <ArrowUpRight size={26} strokeWidth={1.2} aria-hidden="true" />
          </div>
        </Link>
      </div>
    </section>
  );
}
