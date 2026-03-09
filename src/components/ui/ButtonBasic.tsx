"use client";

import Image from "next/image";
import { AccentCorners } from "./AccentCorners";

interface ButtonBasicProps {
  href: string;
  text: string;
  target?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ButtonBasic({ href, text, target, className, onClick }: ButtonBasicProps) {
  return (
    <a href={href} target={target} className={`button-basic${className ? ` ${className}` : ""}`} onClick={onClick}>
      <div className="button-background" />
      <div className="btn-content">
        <div className="button-text-wrapper">
          <div text-split="" className="button-top-text">{text}</div>
          <div className="button-bottom-wrapper">
            <div text-split="" className="button-bottom-text">{text}</div>
          </div>
        </div>
      </div>
      <div className="btn-icon-wrap">
        <Image src="/assets/images/arrow-icon-2.svg" width={11} height={11} alt="Arrow" className="btn-icon" />
      </div>
      <AccentCorners />
    </a>
  );
}
