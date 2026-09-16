import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { EditorialStudyProps } from "../EditorialStudyTypes";

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
          <div className="folio-three-scene__image">
            <Image
              src="/editorial/heritage-architecture.webp"
              alt={copy.heritageImageAlt}
              fill
              sizes="(max-width: 760px) calc(100vw - 48px), (max-width: 1600px) 80vw, 1260px"
            />
          </div>
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
          <div className="folio-three-scene__image">
            <Image
              src="/editorial/worn/worn-01.jpg"
              alt={copy.officeImageAlt}
              fill
              sizes="(max-width: 760px) calc(100vw - 48px), (max-width: 1600px) 80vw, 1260px"
            />
          </div>
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
