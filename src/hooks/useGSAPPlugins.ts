"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    ScrambleTextPlugin: any;
    SplitText: any;
  }
}

export function useGSAPPlugins(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.ScrambleTextPlugin && window.SplitText) {
      gsap.registerPlugin(window.ScrambleTextPlugin, window.SplitText);
      setReady(true);
      return;
    }

    let loaded = 0;
    const scripts: HTMLScriptElement[] = [];

    function onLoad() {
      loaded++;
      if (loaded === 2 && window.ScrambleTextPlugin && window.SplitText) {
        gsap.registerPlugin(window.ScrambleTextPlugin, window.SplitText);
        setReady(true);
      }
    }

    ["/assets/SplitText.min.js", "/assets/ScrambleTextPlugin.min.js"].forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = onLoad;
      script.onerror = () => {
        console.error(`Failed to load GSAP plugin: ${src}`);
      };
      document.head.appendChild(script);
      scripts.push(script);
    });

    return () => {
      scripts.forEach((s) => s.remove());
    };
  }, []);

  return ready;
}
