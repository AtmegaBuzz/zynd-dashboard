"use client";

import Image from "next/image";

interface ButtonSecondaryProps {
  href: string;
  text: string;
  bottomText?: string;
  target?: string;
  className?: string;
}

export function ButtonSecondary({ href, text, bottomText, target, className }: ButtonSecondaryProps) {
  return (
    <a href={href} target={target} className={`button-secondary is-hide-mb${className ? ` ${className}` : ""}`}>
      <div text-split="" className="button-top-text is-hide-mb">{text}</div>
      <div className="button-bottom-wrapper">
        <div text-split="" className="button-bottom-text">{bottomText ?? text}</div>
      </div>
      <div className="second-btn-icon-wrap">
        <Image src="/assets/images/arrow-icon.svg" width={10} height={10} alt="Arrow" className="second-btn-icon" />
      </div>
    </a>
  );
}
