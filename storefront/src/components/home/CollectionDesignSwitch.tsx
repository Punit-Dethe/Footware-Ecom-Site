"use client";

import { type ReactNode, useState } from "react";

interface CollectionDesignSwitchProps {
  heading: ReactNode;
  label: string;
  first: ReactNode;
  second: ReactNode;
}

export function CollectionDesignSwitch({
  heading,
  label,
  first,
  second,
}: CollectionDesignSwitchProps) {
  const [design, setDesign] = useState<1 | 2>(1);

  return (
    <>
      <div className="folio-three-design-header">
        {heading}
        <div className="folio-three-design-switch" role="group" aria-label={label}>
          {([1, 2] as const).map((number) => (
            <button
              key={number}
              type="button"
              aria-label={`${label} ${number}`}
              aria-pressed={design === number}
              onClick={() => setDesign(number)}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
      {design === 1 ? first : second}
    </>
  );
}
