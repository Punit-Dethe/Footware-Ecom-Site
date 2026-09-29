import { getTranslations } from "next-intl/server";
import type { EditorialStudyCopy } from "@/components/home/EditorialStudyTypes";
import { CollectionsDesignThree } from "@/components/home/experiments/FolioDesignThree";
import { CraftDesignTwo } from "@/components/home/experiments/FolioDesignTwo";

interface StoryProps {
  basePath: string;
  locale: string;
}

async function getStudyCopy(locale: string) {
  const home = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home.journal",
  });

  const copy: EditorialStudyCopy = {
    craftTitle: t("craftTitle"),
    craftTitleAccent: t("craftTitleAccent"),
    craftDescription: t("craftDescription"),
    craftCta: t("craftCta"),
    craftImageAlt: t("craftImageAlt"),
    craftDetailAlt: t("craftDetailAlt"),
    craftDetailCaption: t("craftDetailCaption"),
    finishedImageAlt: t("heroImageAlt"),
    craftAltTitle: t("craftAltTitle"),
    craftAltAccent: t("craftAltAccent"),
    craftAltNarrative: t("craftAltNarrative"),
    craftAltDescription: t("craftAltDescription"),
    collectionsHeading: t.rich("collectionsTitle", {
      em: (chunks) => <em>{chunks}</em>,
    }),
    traditionalTitle: t("traditionalTitle"),
    traditionalDescription: t("traditionalDescription"),
    traditionalSecondaryDescription: t("traditionalSecondaryDescription"),
    traditionalCompactDescription: t("traditionalCompactDescription"),
    traditionalCta: home("shopTraditional"),
    officeTitle: t("officeTitle"),
    officeDescription: t("officeDescription"),
    officeSecondaryDescription: t("officeSecondaryDescription"),
    officeCompactDescription: t("officeCompactDescription"),
    collectionDesignLabel: t("collectionDesignLabel"),
    officeCta: home("exploreFormals"),
    heritageImageAlt: t("heritageImageAlt"),
    officeImageAlt: t("officeImageAlt"),
  };

  return copy;
}

export async function CraftStory({ basePath, locale }: StoryProps) {
  const copy = await getStudyCopy(locale);

  return (
    <div id="craft" className="mirza-final-section">
      <CraftDesignTwo basePath={basePath} copy={copy} />
    </div>
  );
}

export async function CollectionStories({ basePath, locale }: StoryProps) {
  const copy = await getStudyCopy(locale);

  return <CollectionsDesignThree basePath={basePath} copy={copy} />;
}
