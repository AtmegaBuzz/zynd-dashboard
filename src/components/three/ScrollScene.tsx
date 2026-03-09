"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

interface ScrollSceneProps {
  triggerSelector: string;
  scrollStart?: string;
  scrollEnd?: string;
  className?: string;
}

export function ScrollScene({ triggerSelector, scrollStart, scrollEnd, className }: ScrollSceneProps) {
  return (
    <Suspense fallback={<div className={className} />}>
      <SceneCanvas
        triggerSelector={triggerSelector}
        scrollStart={scrollStart}
        scrollEnd={scrollEnd}
        className={className}
      />
    </Suspense>
  );
}
