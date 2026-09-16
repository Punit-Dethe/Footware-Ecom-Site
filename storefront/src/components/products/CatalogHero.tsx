import Image from "next/image";

interface CatalogHeroProps {
  title: string;
  eyebrow: string;
  intro: string;
  note: string;
  imageSrc?: string;
}

export function CatalogHero({
  title,
  eyebrow,
  intro,
  note,
  imageSrc = "/editorial/campaign-hero.webp",
}: CatalogHeroProps) {
  return (
    <section className="catalog-hero" aria-labelledby="catalog-title">
      <div className="catalog-hero__inner">
        <div className="catalog-hero__copy">
          <p className="catalog-eyebrow">{eyebrow}</p>
          <h1 id="catalog-title">{title}</h1>
          <p className="catalog-hero__intro">{intro}</p>
          <p className="catalog-hero__note">{note}</p>
        </div>
        <div className="catalog-hero__visual">
          <Image
            src={imageSrc}
            alt=""
            fill
            priority
            sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1600px) 66vw, 1040px"
            className="object-cover"
          />
        </div>
        <div className="catalog-hero__detail" aria-hidden="true">
          <Image
            src="/editorial/craft-hands.webp"
            alt=""
            fill
            sizes="(max-width: 760px) 42vw, (max-width: 1600px) 23vw, 360px"
          />
        </div>
      </div>
    </section>
  );
}
