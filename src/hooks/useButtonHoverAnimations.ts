"use client";

import { useEffect } from "react";
import gsap from "gsap";
import SplitType from "split-type";

export function useButtonHoverAnimations() {
  useEffect(() => {
    // Split both button types
    const basicSplit = new SplitType(".button-basic", {
      types: "chars",
      tagName: "span",
    });
    const secondarySplit = new SplitType(".button-secondary", {
      types: "chars",
      tagName: "span",
    });

    const cleanups: (() => void)[] = [];

    function setupButtonHover(selector: string) {
      document.querySelectorAll(selector).forEach((btn) => {
        const topChars = btn.querySelectorAll(".button-top-text .char");
        const bottomChars = btn.querySelectorAll(".button-bottom-text .char");

        gsap.set(bottomChars, { yPercent: 0 });

        const tl = gsap.timeline({ paused: true });
        tl.to(topChars, {
          yPercent: -100,
          duration: 0.4,
          stagger: 0.02,
          ease: "power4.out",
        }, 0);
        tl.to(bottomChars, {
          yPercent: -100,
          duration: 0.4,
          stagger: 0.02,
          ease: "power4.out",
        }, 0);

        const onEnter = () => tl.play();
        const onLeave = () => tl.reverse();

        btn.addEventListener("mouseenter", onEnter);
        btn.addEventListener("mouseleave", onLeave);

        cleanups.push(() => {
          btn.removeEventListener("mouseenter", onEnter);
          btn.removeEventListener("mouseleave", onLeave);
          tl.kill();
        });
      });
    }

    setupButtonHover(".button-basic");
    setupButtonHover(".button-secondary");

    return () => {
      cleanups.forEach((fn) => fn());
      basicSplit.revert();
      secondarySplit.revert();
    };
  }, []);
}
