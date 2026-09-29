import { CollectionDesignSwitch } from "../CollectionDesignSwitch";
import { CollectionRevealScene } from "../CollectionRevealScene";
import type { EditorialStudyProps } from "../EditorialStudyTypes";
import { LegacyCollections } from "./LegacyCollections";

export function CollectionsDesignThree({ basePath, copy }: EditorialStudyProps) {
  return (
    <section
      className="folio-three-collections"
      aria-labelledby="mirza-collections-title-three"
    >
      <div className="folio-three-collections__inner mirza-frame">
        <CollectionDesignSwitch
          label={copy.collectionDesignLabel}
          heading={
            <h2
              id="mirza-collections-title-three"
              className="folio-three-collections__title mirza-display"
            >
              {copy.collectionsHeading}
            </h2>
          }
          first={
            <div className="folio-three-design-layout">
              <CollectionRevealScene
                direction="traditional"
                href={`${basePath}/c/categories/traditional`}
                src="/editorial/traditional-home-dusk-v2.webp"
                alt={copy.heritageImageAlt}
                title={copy.traditionalTitle}
                description={copy.traditionalDescription}
                secondaryDescription={copy.traditionalSecondaryDescription}
                cta={copy.traditionalCta}
              />
              <CollectionRevealScene
                direction="office"
                href={`${basePath}/c/categories/office-wear`}
                src="/editorial/office-corridor-dusk.webp"
                alt={copy.officeImageAlt}
                title={copy.officeTitle}
                description={copy.officeDescription}
                secondaryDescription={copy.officeSecondaryDescription}
                cta={copy.officeCta}
              />
            </div>
          }
          second={<LegacyCollections basePath={basePath} copy={copy} />}
        />
      </div>
    </section>
  );
}
