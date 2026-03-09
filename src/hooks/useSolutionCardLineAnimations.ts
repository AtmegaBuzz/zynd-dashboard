"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useSolutionCardLineAnimations() {
  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];
    const cards = document.querySelectorAll(".soluton-card");

    cards.forEach((card) => {
      const topWrap = card.querySelector(".solution-top-lines-wrap");
      const bottomWrap = card.querySelector(".solution-bottom-lines-wrap");

      if (topWrap) {
        tweens.push(gsap.from(topWrap.children, {
          y: "-100%",
          opacity: 0,
          duration: 1,
          stagger: {
            each: 0.1,
            from: "random",
          },
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            end: "bottom 60%",
            scrub: 1.1,
          },
        }));
      }

      if (bottomWrap) {
        tweens.push(gsap.from(bottomWrap.children, {
          y: "100%",
          opacity: 0,
          duration: 1,
          stagger: {
            each: 0.1,
            from: "random",
          },
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 40%",
            end: "bottom top",
            scrub: true,
          },
        }));
      }
    });

    return () => {
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
  }, []);
}
