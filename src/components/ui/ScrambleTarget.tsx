"use client";

import { useEffect, useRef } from "react";

interface ScrambleTargetProps {
  text: string;
}

export function ScrambleTarget({ text }: ScrambleTargetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = text;
    }
  }, [text]);

  return (
    <div
      ref={ref}
      data-scramble-hover="target"
      data-scramble=""
      data-scramble-text={text}
    />
  );
}
