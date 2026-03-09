"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CanvasAnimationConfig {
  frameCount: number;
  frameSrc: (index: number) => string;
  triggerSelector: string;
  scrollStart?: string;
  scrollEnd?: string;
}

export function useCanvasAnimation({
  frameCount,
  frameSrc,
  triggerSelector,
  scrollStart = "top top",
  scrollEnd = "bottom 75%",
}: CanvasAnimationConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const images: HTMLImageElement[] = [];
    const animationState = { frame: 0 };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      images.push(img);
    }

    function renderFrame() {
      if (!context || !canvas) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      const image = images[animationState.frame];
      if (!image || !image.complete) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgWidth = image.width;
      const imgHeight = image.height;
      const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
      const x = canvasWidth / 2 - (imgWidth / 2) * scale;
      const y = canvasHeight / 2 - (imgHeight / 2) * scale;

      context.drawImage(image, 0, 0, imgWidth, imgHeight, x, y, imgWidth * scale, imgHeight * scale);
    }

    const tween = gsap.to(animationState, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: triggerSelector,
        start: scrollStart,
        end: scrollEnd,
        scrub: 1.6,
      },
      onUpdate: renderFrame,
    });

    images[0].onload = renderFrame;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    renderFrame();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      renderFrame();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      tween.kill();
    };
  }, [frameCount, frameSrc, triggerSelector, scrollStart, scrollEnd]);

  return canvasRef;
}
