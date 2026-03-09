"use client";

import { Canvas } from "@react-three/fiber";
import { Monolith } from "./Monolith";

interface SceneCanvasProps {
  triggerSelector: string;
  scrollStart?: string;
  scrollEnd?: string;
  className?: string;
}

export default function SceneCanvas({
  triggerSelector,
  scrollStart,
  scrollEnd,
  className,
}: SceneCanvasProps) {
  return (
    <Canvas
      className={className}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", premultipliedAlpha: false }}
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <Monolith
        triggerSelector={triggerSelector}
        scrollStart={scrollStart}
        scrollEnd={scrollEnd}
      />
    </Canvas>
  );
}
