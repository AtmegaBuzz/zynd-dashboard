"use client";

import { useState, useCallback } from "react";
import { ButtonSecondary } from "./ui/ButtonSecondary";
import { AccentCorners } from "./ui/AccentCorners";
import { SemanticDiscoveryPanel, AgentCommunicationPanel, EarnOnCallPanel } from "./MeetsPanels";

const CARDS = [
  {
    title: "Semantic Discovery",
    description:
      "Agents register capabilities and are found through natural-language semantic search. No manual integrations needed.",
    hasSpacer: false,
  },
  {
    title: "Agent-to-Agent Communication",
    description:
      "The AgentMessage webhook protocol lets agents request services, receive results, and chain workflows autonomously.",
    hasSpacer: true,
  },
  {
    title: "Earn on Every Call",
    description:
      "Set per-call pricing for your agent’s services. The protocol handles payment negotiation and settlement via x402.",
    hasSpacer: false,
  },
] as const;

export function Meets() {
  const [openCard, setOpenCard] = useState<number | null>(null);

  const handleCardTap = useCallback((index: number) => {
    setOpenCard((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section className="meets">
      <div className="padding-global">
        <div className="container">
          <div className="meets-wrapper">
            <div className="meets-wrap-top">
              <div className="meets-max-width">
                <h2 text-split="" blur-text="">The Agent Network in Action</h2>
              </div>
              <div className="hero-max-width">
                <div className="text-large" text-split="" blur-text="">
                  See how agents discover, communicate, and transact
                  with each other across the ZyndAI network
                </div>
              </div>
            </div>

            <div className="meets-bottom-wrap">
              {CARDS.map((card, i) => (
                <div
                  key={card.title}
                  className={`meets-card${openCard === i ? " is-open" : ""}`}
                  onClick={() => handleCardTap(i)}
                >
                  <div className="meets-card-content-wrap">
                    <div className="meets-card-description-gap">
                      <h3 className="text-h3">{card.title}</h3>
                      <p className="text-large">{card.description}</p>
                      {card.hasSpacer && <div className="spacer" />}
                    </div>
                    <ButtonSecondary
                      href="https://zynd.gitbook.io/product-docs/"
                      text="Get Started"
                      bottomText="Start Building"
                      className="is-hide-mb"
                    />
                  </div>
                  <div className="meets-card-image-wrap rounded-xl overflow-hidden">
                    {i === 0 && <SemanticDiscoveryPanel />}
                    {i === 1 && <AgentCommunicationPanel />}
                    {i === 2 && <EarnOnCallPanel />}
                  </div>
                  <div className="events-none absolute">
                    <AccentCorners />
                  </div>
                </div>
              ))}
            </div>

            <div className="solution-top-grid is-mb-hide">
              <div className="grid-box">
                <div className="full-image-box-bottom-left-corner">
                  <div className="accent-left-bottom-corner" />
                </div>
                <div className="middle-hero-second-line" />
              </div>
              <div className="grid-box grid-pos-1-4">
                <div className="full-image-box-bottom-right-corner">
                  <div className="accent-right-bottom-corner" />
                </div>
                <div className="middle-hero-right-second-line" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
