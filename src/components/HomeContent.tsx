"use client";

import { memo } from "react";
import { Hero } from "@/components/Hero";
import { Solution } from "@/components/Solution";
import { Benefits } from "@/components/Benefits";
import { Launch } from "@/components/Launch";
import { Seamless } from "@/components/Seamless";
import { Reward } from "@/components/Reward";
import { Meets } from "@/components/Meets";
import { Roadmap } from "@/components/Roadmap";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { useGSAPPlugins } from "@/hooks/useGSAPPlugins";
import { useTextSplit } from "@/hooks/useTextSplit";
import { useScrollAnimations } from "@/hooks/useScrollAnimations";
import { useScrambleAnimations } from "@/hooks/useScrambleAnimations";
import { useButtonHoverAnimations } from "@/hooks/useButtonHoverAnimations";
import { useSolutionCardLineAnimations } from "@/hooks/useSolutionCardLineAnimations";
import { useIsLoadTextAnimation } from "@/hooks/useIsLoadTextAnimation";

export const HomeContent = memo(function HomeContent() {
  const pluginsReady = useGSAPPlugins();
  useTextSplit();
  useScrollAnimations();
  useScrambleAnimations(pluginsReady);
  useButtonHoverAnimations();
  useSolutionCardLineAnimations();
  useIsLoadTextAnimation();

  return (
    <>
      <div className="intro">
        <Hero />
        <Solution />
      </div>
      <Benefits />
      <Launch />
      <Seamless />
      <Reward />
      <Meets />
      <Roadmap />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
});
