"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

export function useIsLoadTextAnimation() {
  useEffect(() => {
    const el = document.querySelector(".is-load-text");
    if (!el) return;

    const splitInstance = new SplitType(".is-load-text", { types: "words" });

    const isMobile = window.innerWidth <= 767;
    const startValue = isMobile ? "top 35%" : "top center";
    const endValue = isMobile ? "bottom 90%" : "bottom center";

    const tl = gsap.timeline();
    const tween = tl.from(splitInstance.words, {
      opacity: 0.25,
      stagger: 0.1,
      scrollTrigger: {
        trigger: ".is-load-text",
        start: startValue,
        end: endValue,
        scrub: 2,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tl.kill();
      splitInstance.revert();
    };
  }, []);
}
