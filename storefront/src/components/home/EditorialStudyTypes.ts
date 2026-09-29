import type { ReactNode } from "react";

export interface EditorialStudyCopy {
  craftTitle: string;
  craftTitleAccent: string;
  craftDescription: string;
  craftCta: string;
  craftImageAlt: string;
  craftDetailAlt: string;
  craftDetailCaption: string;
  finishedImageAlt: string;
  craftAltTitle: string;
  craftAltAccent: string;
  craftAltNarrative?: string;
  craftAltDescription: string;
  collectionsHeading: ReactNode;
  traditionalTitle: string;
  traditionalDescription: string;
  traditionalSecondaryDescription: string;
  traditionalCompactDescription: string;
  traditionalCta: string;
  officeTitle: string;
  officeDescription: string;
  officeSecondaryDescription: string;
  officeCompactDescription: string;
  collectionDesignLabel: string;
  officeCta: string;
  heritageImageAlt: string;
  officeImageAlt: string;
}

export interface EditorialStudyProps {
  basePath: string;
  copy: EditorialStudyCopy;
}
