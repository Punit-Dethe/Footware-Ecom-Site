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
  craftAltDescription: string;
  collectionsHeading: ReactNode;
  traditionalTitle: string;
  traditionalDescription: string;
  officeTitle: string;
  officeDescription: string;
  heritageImageAlt: string;
  officeImageAlt: string;
}

export interface EditorialStudyProps {
  basePath: string;
  copy: EditorialStudyCopy;
}
