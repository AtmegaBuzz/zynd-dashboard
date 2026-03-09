"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Window.SplitText and Window.ScrambleTextPlugin are declared in useGSAPPlugins.ts

export function useScrambleAnimations(pluginsReady: boolean) {
  useEffect(() => {
    if (!pluginsReady || !window.SplitText) return;

    const cleanups: (() => void)[] = [];
    const tweens: gsap.core.Tween[] = [];

    // Scramble on load: elements with data-scramble="load"
    document.querySelectorAll('[data-scramble="load"]').forEach((el) => {
      const split = new window.SplitText(el, {
        type: "words, chars",
        wordsClass: "word",
        charsClass: "char",
      });
      gsap.to(split.words, {
        duration: 1.2,
        stagger: 0.01,
        scrambleText: {
          text: "{original}",
          chars: "upperCase",
          speed: 0.85,
        },
        onComplete: () => split.revert(),
      });
    });

    // Scramble on scroll: elements with data-scramble="scroll"
    document.querySelectorAll('[data-scramble="scroll"]').forEach((el) => {
      const isAlt = el.hasAttribute("data-scramble-alt");
      const split = new window.SplitText(el, {
        type: "words, chars",
        wordsClass: "word",
        charsClass: "char",
      });
      const tween = gsap.to(split.words, {
        duration: 1.4,
        stagger: 0.015,
        scrambleText: {
          text: "{original}",
          chars: isAlt ? "▯|" : "upperCase",
          speed: 0.95,
        },
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          once: true,
        },
        onComplete: () => split.revert(),
      });
      tweens.push(tween);
    });

    // Scramble on hover: links with data-scramble-hover="link"
    document.querySelectorAll('[data-scramble-hover="link"]').forEach((el) => {
      const target = el.querySelector('[data-scramble-hover="target"]') as HTMLElement;
      if (!target) return;
      const originalText = target.textContent || "";
      const scrambleText = target.getAttribute("data-scramble-text") || originalText;

      const onEnter = () => {
        gsap.to(target, {
          duration: 1,
          scrambleText: {
            text: scrambleText,
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
          },
        });
      };

      const onLeave = () => {
        gsap.to(target, {
          duration: 0.6,
          scrambleText: {
            text: originalText,
            speed: 1,
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
          },
        });
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);

      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    });

    // Menu hover scramble: .menu elements
    document.querySelectorAll(".menu").forEach((menu) => {
      const targets = menu.querySelectorAll('[data-scramble-hover="target"]');

      const onEnter = () => {
        targets.forEach((t) => {
          (t as HTMLElement).style.pointerEvents = "none";
        });
        setTimeout(() => {
          targets.forEach((t) => {
            (t as HTMLElement).style.pointerEvents = "";
          });
        }, 1500);
        targets.forEach((t, i) => {
          const text = t.textContent || "";
          gsap.to(t, {
            duration: 1,
            delay: 0.2 * i,
            scrambleText: { text, speed: 1, chars: "◊▯∆" },
          });
        });
      };

      const onLeave = () => {
        targets.forEach((t) => {
          const text = t.getAttribute("data-original-text") || t.textContent || "";
          (t as HTMLElement).textContent = text;
          gsap.to(t, {
            duration: 1,
            scrambleText: { text, speed: 2, chars: "◊▯∆" },
          });
        });
      };

      menu.addEventListener("mouseenter", onEnter);
      menu.addEventListener("mouseleave", onLeave);

      cleanups.push(() => {
        menu.removeEventListener("mouseenter", onEnter);
        menu.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      cleanups.forEach((fn) => fn());
    };
  }, [pluginsReady]);
}
