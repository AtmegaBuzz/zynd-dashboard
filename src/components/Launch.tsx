"use client";

import { useState, useEffect, useRef } from "react";
import { ButtonBasic } from "./ui/ButtonBasic";
import { AccentCorners } from "./ui/AccentCorners";
import { GridTripod } from "./ui/GridTripod";
import { CodeEditorPanel, DashboardPanel, WorkflowPanel } from "./LaunchPanels";
import Shuffle from "./ui/Shuffle";
const CARDS = [
  {
    title: "Python SDK: Deploy in Minutes",
    description:
      "pip install zyndai-agent. Define capabilities, set pricing, and register on the network. Supports LangChain, CrewAI, LangGraph, and PydanticAI.",
    lottieClassName: "lottie-first-card",
  },
  {
    title: "MCP Server: AI-Native Access",
    description:
      "npx zyndai-mcp-server. Any MCP client (Claude Desktop, Cursor, Cline, or autonomous agents) can search, discover, and call agents on the network.",
    lottieClassName: "lottie-asset",
  },
  {
    title: "n8n Nodes: Visual Workflows",
    description:
      "5 custom n8n nodes for agent search, publishing, and x402 payments. Build agent workflows visually, no code required.",
    lottieClassName: "lottie-asset last",
  },
] as const;

export function Launch() {
  return (
    <section className="launch">
      <div className="padding-global">
        <div className="container">
          <div className="launch-wrapper">
            <div className="relative">
              <div className="launch-top-wrap">
                <div className="hero-accent" hero-accent="">
                  <Shuffle
                    text="Connect Your Way"
                    tag="h2"
                    className="text-h2 z-index-4"
                    shuffleDirection="down"
                    duration={0.5}
                    stagger={0.04}
                    shuffleTimes={2}
                    triggerOnce={true}
                    triggerOnHover={true}
                    threshold={0.1}
                  />
                  <div className="accent-border-overlay auto" />
                  <div className="accent-background-overlay" />
                  <div className="accent-background" />
                  <AccentCorners />
                </div>
                <p className="text-large text-align-center" text-split="" blur-text="" style={{ textAlign: "center" }}>
                  Use the Python SDK for full control, the MCP server for
                  AI-native access, or n8n nodes for visual workflows.
                </p>
                <div className="accent-right-top-corner is-mb-hide" />
              </div>

              <div className="launch-bottom-wrap">
                {CARDS.map((card, index) => (
                  <div className="solution-card-wrap" key={index}>
                    <div className="solution-card">
                      <div className="launch-card-content-wrap">
                        <h3 className="text-h3">{card.title}</h3>
                        <p className="text-large">{card.description}</p>
                      </div>
                      <div className="launch-card-img-wrap">
                        {index === 0 && <CodeEditorPanel className={card.lottieClassName} />}
                        {index === 1 && <DashboardPanel className={card.lottieClassName} />}
                        {index === 2 && <WorkflowPanel className={card.lottieClassName} />}
                      </div>
                    </div>
                    <div className="accent-border-overlay" />
                    <div className="launch-background-overlay" />
                    <div className="accent-background" />
                    <div className="solution-right-top-corner" />
                    <div className="solution-right-top-black-cover" />
                    <div className="solution-left-top-black-cover" />
                    <div className="solution-left-top-corner" />
                    <div className="solution-left-bottom-corner" />
                    <div className="solution-left-bottom-black-cover" />
                    <div className="solution-right-bottom-corner" />
                    <div className="solution-right-bottom-black-cover" />

                    <GridTripod corner="left-top-corner" />
                    <GridTripod corner="right-top-corner" />
                    <GridTripod corner="left-bottom-corner" />
                    <GridTripod corner="right-bottom-corner" />
                    <div className="main-hero-bottom-line" />
                    <div className="main-hero-top-line" />
                    <div className="middle-hero-right-second-line" />
                    <div className="middle-hero-second-line" />
                  </div>
                ))}
              </div>

              <div className="middle-hero-right-second-line is-hide-mb" />
              <div className="middle-hero-second-line is-hide-mb" />
              <div className="main-hero-top-line is-hide-mb" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
