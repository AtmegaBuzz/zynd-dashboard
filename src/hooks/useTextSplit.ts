"use client";

import { useEffect } from "react";
import SplitType from "split-type";

export function useTextSplit() {
  useEffect(() => {
    const instances = new SplitType("[text-split]:not(.button-top-text):not(.button-bottom-text)", {
      types: "words,chars",
      tagName: "span",
    });

    document.querySelectorAll("[text-split]:not(.button-top-text):not(.button-bottom-text)").forEach((el) => {
      (el as HTMLElement).style.opacity = "1";
    });

    return () => {
      instances.revert();
    };
  }, []);
}
