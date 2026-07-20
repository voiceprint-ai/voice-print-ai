"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import React, { useRef } from "react";

interface RotatingDiamondsProps {
  smallScreenDiamondSize: number;
  mediumScreenDiamondSize: number;
  largeScreenDiamondSize: number;
}

function RotatingDiamonds({
  smallScreenDiamondSize,
  mediumScreenDiamondSize,
  largeScreenDiamondSize,
}: RotatingDiamondsProps) {
  const diamondContainerRef = useRef<HTMLDivElement>(null);

  const diamondsList = [
    {
      label: "Large diamond",
      initialRotation: 55,
      opacity: 0.14,
      duration: 38,
    },
    {
      label: "Medium diamond",
      initialRotation: 50,
      opacity: 0.24,
      duration: 44,
    },
    {
      label: "Small diamond",
      initialRotation: 45,
      opacity: 0.44,
      duration: 52,
    },
  ];

  useGSAP(
    () => {
      const diamonds = gsap.utils.toArray<HTMLElement>(".diamond");

      diamonds.forEach((diamond, index) => {
        const initialRotation = diamondsList[index].initialRotation;

        gsap.fromTo(
          diamond,
          {
            rotation: initialRotation,
          },
          {
            rotation: initialRotation + 360,
            duration: diamondsList[index].duration,
            repeat: -1,
            ease: "none",
          }
        );
      });
    },
    {
      scope: diamondContainerRef,
      dependencies: [],
    }
  );

  return (
    <div ref={diamondContainerRef} className="pointer-events-none absolute inset-0 -z-1">
      {diamondsList.map((diamond, i) => (
        <div
          key={diamond.label}
          aria-label={diamond.label}
          style={
            {
              "--small-size": `${smallScreenDiamondSize - 40 * i}px`,
              "--medium-size": `${mediumScreenDiamondSize - 40 * i}px`,
              "--large-size": `${largeScreenDiamondSize - 40 * i}px`,
              opacity: diamond.opacity,
            } as React.CSSProperties
          }
          className="diamond absolute top-1/2 left-1/2 aspect-square w-(--small-size) -translate-x-1/2 -translate-y-1/2 bg-transparent sm:w-(--medium-size) md:w-(--large-size) spread-dotted-border"
        />
      ))}
    </div>
  );
}

export default RotatingDiamonds;