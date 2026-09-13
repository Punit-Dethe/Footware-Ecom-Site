import Image from "next/image";

interface CatalogHeroProps {
  title: string;
  eyebrow: string;
  intro: string;
  note: string;
  signature: string;
  imageSrc?: string;
}

export function CatalogHero({
  title,
  eyebrow,
  intro,
  note,
  signature,
  imageSrc = "/editorial/campaign-hero.webp",
}: CatalogHeroProps) {
  return (
    <section className="catalog-hero" aria-labelledby="catalog-title">
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
          sizes="(max-width: 760px) 100vw, 50vw"
          className="object-cover"
        />
        <span>{signature}</span>
      </div>
    </section>
  );
}
