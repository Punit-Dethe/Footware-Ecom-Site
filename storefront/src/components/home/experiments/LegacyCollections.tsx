import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { EditorialStudyProps } from "../EditorialStudyTypes";
import { ParallaxSceneImage } from "../ParallaxSceneImage";

export function LegacyCollections({ basePath, copy }: EditorialStudyProps) {
  return (
    <div className="folio-three-legacy-collections__inner">
        <Link
          href={`${basePath}/c/categories/traditional`}
          className="folio-three-legacy-scene folio-three-legacy-scene--traditional"
          aria-labelledby="mirza-traditional-title-legacy"
        >
          <ParallaxSceneImage
            src="/editorial/traditional-home-dusk-v2.webp"
            alt={copy.heritageImageAlt}
            sizes="(max-width: 760px) calc(100vw - 48px), (max-width: 1600px) 80vw, 1260px"
            speed={0.2}
            classPrefix="folio-three-legacy-scene"
          />
          <div className="folio-three-legacy-scene__caption">
            <div>
              <h3 id="mirza-traditional-title-legacy" className="mirza-display">
                {copy.traditionalTitle}
              </h3>
              <p>{copy.traditionalCompactDescription}</p>
            </div>
            <ArrowUpRight size={26} strokeWidth={1.2} aria-hidden="true" />
          </div>
        </Link>

        <Link
          href={`${basePath}/c/categories/office-wear`}
          className="folio-three-legacy-scene folio-three-legacy-scene--office"
          aria-labelledby="mirza-office-title-legacy"
        >
          <ParallaxSceneImage
            src="/editorial/office-corridor-dusk.webp"
            alt={copy.officeImageAlt}
            sizes="(max-width: 760px) calc(100vw - 48px), (max-width: 1600px) 80vw, 1260px"
            speed={0.2}
            classPrefix="folio-three-legacy-scene"
          />
          <div className="folio-three-legacy-scene__caption">
            <div>
              <h3 id="mirza-office-title-legacy" className="mirza-display">
                {copy.officeTitle}
              </h3>
              <p>{copy.officeCompactDescription}</p>
            </div>
            <ArrowUpRight size={26} strokeWidth={1.2} aria-hidden="true" />
          </div>
        </Link>
    </div>
  );
}
