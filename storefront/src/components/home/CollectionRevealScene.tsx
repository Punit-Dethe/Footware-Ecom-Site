"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const CROP_ENTRY = 0.98;
const CROP_TAIL = 0.1;
const COPY_START_FRACTION = 1 - Math.cbrt(0.3);
const clampProgress = (value: number) => Math.max(0, Math.min(1, value));
const easeCrop = (progress: number) => 1 - (1 - progress) ** 2;

interface CollectionRevealSceneProps {
  direction: "traditional" | "office";
  title: string;
  description: string;
  secondaryDescription: string;
  cta: string;
  src: string;
  alt: string;
  href: string;
}

export function CollectionRevealScene({
  direction,
  title,
  description,
  secondaryDescription,
  cta,
  src,
  alt,
  href,
}: CollectionRevealSceneProps) {
  const rowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const caption = row.querySelector<HTMLElement>(
      ".folio-three-scene__caption",
    );
    const photograph = row.querySelector(".folio-three-scene__image");
    if (!caption || !photograph) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowScreen = window.matchMedia("(max-width: 1200px)");
    let active = true;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reducedMotion.matches || narrowScreen.matches) {
        row.style.setProperty("--image-progress", "1");
        row.style.setProperty("--copy-progress", "1");
        return;
      }
      if (!active) return;
      const top = row.getBoundingClientRect().top;
      const height = window.innerHeight;
      const photoRect = photograph.getBoundingClientRect();
      const imageMidpointTop =
        top + height / 2 - (photoRect.top + photoRect.bottom) / 2 + 1;
      const fullCopyTop = imageMidpointTop + Math.min(40, height * 0.06);
      const cropStart = height * CROP_ENTRY;
      const cropEnd = imageMidpointTop - height * CROP_TAIL;
      const cropDistance = cropStart - cropEnd;
      // One linear reading sweep spends the full interval on the actual content.
      // Keep the previously approved title start independent of the crop easing.
      const copyStart = Math.max(
        cropStart - COPY_START_FRACTION * cropDistance,
        fullCopyTop + Math.min(180, height * 0.3),
      );
      row.style.setProperty(
        "--image-progress",
        easeCrop(clampProgress((cropStart - top) / cropDistance)).toFixed(6),
      );
      row.style.setProperty(
        "--copy-progress",
        clampProgress(
          (copyStart - top) /
            (copyStart - fullCopyTop + Math.min(32, height * 0.04)),
        ).toFixed(6),
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) schedule();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(row);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    narrowScreen.addEventListener("change", schedule);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      narrowScreen.removeEventListener("change", schedule);
    };
  }, []);

  const titleId = `mirza-${direction}-title-three`;
  return (
    <article
      ref={rowRef}
      className={`folio-three-scene folio-three-scene--${direction}`}
      aria-labelledby={titleId}
    >
      <Link
        className="folio-three-scene__image"
        href={href}
        aria-labelledby={titleId}
      >
        <div className="folio-three-scene__image-inner">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1200px) 100vw, 88vw"
          />
        </div>
      </Link>
      <div className="folio-three-scene__caption">
        <div className="folio-three-scene__copy">
          <h3 id={titleId} className="mirza-display">
            {title}
          </h3>
          <p className="folio-three-scene__main-copy">{description}</p>
          <p className="folio-three-scene__secondary-copy">
            {secondaryDescription}
          </p>
          <Link className="mirza-link" href={href}>
            {cta}
            <ArrowUpRight size={17} strokeWidth={1.3} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
