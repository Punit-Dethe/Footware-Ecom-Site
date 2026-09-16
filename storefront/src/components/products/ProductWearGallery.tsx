"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

const WORN_IMAGES = [
  "/editorial/worn/worn-01.jpg",
  "/editorial/worn/worn-02.jpg",
  "/editorial/worn/worn-03.jpg",
  "/editorial/worn/worn-04.jpg",
] as const;

export function ProductWearGallery() {
  const t = useTranslations("products");
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updatePosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updatePosition]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".pdp-worn__figure");
    const distance = (card?.offsetWidth ?? track.clientWidth * 0.8) + 18;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollBy({
      left: distance * direction,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="pdp-worn__gallery">
      <section
        ref={trackRef}
        className="pdp-worn__track"
        aria-label={t("wornGalleryLabel")}
        onScroll={updatePosition}
      >
        {WORN_IMAGES.map((src, index) => (
          <figure className="pdp-worn__figure" key={src}>
            <Image
              src={src}
              alt={`${t("wornImageAlt")} ${index + 1}`}
              fill
              sizes="(max-width: 760px) 82vw, 58vw"
            />
          </figure>
        ))}
      </section>
      <button
        type="button"
        className="pdp-worn__control pdp-worn__control--previous"
        onClick={() => move(-1)}
        disabled={atStart}
        aria-label={t("previousProduct")}
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        className="pdp-worn__control pdp-worn__control--next"
        onClick={() => move(1)}
        disabled={atEnd}
        aria-label={t("nextProduct")}
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
