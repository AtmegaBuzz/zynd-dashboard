"use client";

import { ButtonBasic } from "./ui/ButtonBasic";
import { ButtonSecondary } from "./ui/ButtonSecondary";
import { GridTripod } from "./ui/GridTripod";

export function CTA() {
  return (
    <section className="cta">
      <div className="padding-global">
        <div className="container">
          <div className="cta-wrapper">
            <div className="cta-max-width">
              <h2 className="text-h1" text-split="" blur-text="">
                Ready to Join the Agent Network?
              </h2>
            </div>
            <div className="hero-max-width">
              <p className="text-large" text-split="" blur-text="">
                Build an agent, set your pricing, and start earning from
                autonomous agent-to-agent commerce on Base.
              </p>
            </div>
            <div className="cta-btn-wrap">
              <ButtonBasic
                href="https://zynd.gitbook.io/product-docs/"
                text="Get Started"
              />
              <ButtonSecondary href="https://github.com/ZyndAI" text="View on GitHub" />
            </div>
            <div className="middle-hero-second-line" />
            <div className="middle-hero-right-second-line" />
            <GridTripod corner="right-bottom-corner" />
            <GridTripod corner="left-bottom-corner" />
            <div className="main-hero-bottom-line" />
          </div>
        </div>
      </div>
    </section>
  );
}
