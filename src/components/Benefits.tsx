"use client";

import { SolutionLinesTop, SolutionLinesBottom } from "./ui/SolutionLines";
import { FrameSequence } from "./FrameSequence";

const SOLUTION_CARDS = [
  {
    title: "Identity (DID)",
    description:
      "Every agent gets a decentralized identifier at registration. Verifiable credentials, on-chain attestations, and cryptographic proof of capabilities.",
  },
  {
    title: "Discovery (Semantic Search + P2P Mesh)",
    description:
      "Agents are found through hybrid vector and keyword search on the registry, plus federated peer-to-peer discovery via AgentDNS gossip protocol.",
  },
  {
    title: "Payments (x402 on Base)",
    description:
      "Autonomous micropayments via the x402 HTTP protocol. Agents charge per call in USDC on Base Sepolia. The SDK handles payment negotiation and settlement automatically.",
  },
  {
    title: "Communication (AgentMessage Protocol)",
    description:
      "Standardized webhook protocol for agent-to-agent messaging. Async and sync modes, multi-turn conversations, and framework-agnostic integration.",
  },
] as const;

export function Benefits() {
  return (
    <div id="features" className="benefits">
      <div className="padding-global">
        <div className="container">
          <div className="solution-bottom-wrap solution-scroll">
            <div className="solution-left-colm is-mb-hide">
              <div className="solution-sticky-wrap">
                <div className="solution-card-animation-holder">
                  <FrameSequence
                    folder="benefits"
                    triggerSelector=".solution-scroll"
                    scrollStart="top center"
                    scrollEnd="bottom top"
                    className="canvas2"
                    startFrame={0}
                  />
                  <div className="middle-hero-right-second-line is-hide-mb" />
                  <div className="middle-hero-second-line is-hide-mb" />
                  <div className="main-hero-bottom-line" />
                  <div className="main-hero-top-line is-hide-mb" />
                </div>
              </div>
            </div>

            <div className="solution-right-colm">
              {SOLUTION_CARDS.map((card, index) => (
                <div className="solution-card" key={index}>
                  <SolutionLinesTop />
                  <div className="solution-card-content-wrap">
                    <h3>{card.title}</h3>
                    <div className="text-large">{card.description}</div>
                  </div>
                  <SolutionLinesBottom />
                  <div className="main-hero-bottom-line" />
                </div>
              ))}
              <div className="solution-line-right-bottom-corner" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

