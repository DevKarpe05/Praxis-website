"use client";

import { useCallback, useMemo, useState } from "react";
import Globe from "@/components/Globe";
import Hero from "@/components/Hero";
import Hud from "@/components/Hud";
import DoorEntry from "@/components/DoorEntry";
import NodePanel from "@/components/NodePanel";
import {
  Bottleneck,
  EndCta,
  Footer,
  Pillars,
  Roadmap,
} from "@/components/Sections";
import { NODES } from "@/lib/nodes";
import { useReducedMotion } from "@/lib/hooks";

export default function Home() {
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedNode = useMemo(
    () => NODES.find((n) => n.index === selectedIndex) ?? null,
    [selectedIndex]
  );

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleClose = useCallback(() => setSelectedIndex(null), []);

  const handleOpened = useCallback(() => setRevealed(true), []);

  const scrollToRequest = useCallback(() => {
    document
      .getElementById("request")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // "See what we capture" opens the highest-fidelity floor (the node with the
  // densest capture stack) to surface the full set of modalities.
  const seeWhatWeCapture = useCallback(() => {
    const densest = NODES.reduce((best, n) =>
      n.modalities.filter((m) => m.active).length >
      best.modalities.filter((m) => m.active).length
        ? n
        : best
    );
    setSelectedIndex(densest.index);
  }, []);

  return (
    <main>
      <DoorEntry onOpened={handleOpened} reducedMotion={reducedMotion} />

      {/* Hero + globe stage */}
      <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-[var(--void)]">
        <Globe
          nodes={NODES}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          reducedMotion={reducedMotion}
          active={revealed}
        />
        {/* legibility scrim behind hero text */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(5,7,13,0.82)_0%,rgba(5,7,13,0.5)_38%,rgba(5,7,13,0)_70%)]"
        />
        <Hero
          revealed={revealed}
          reducedMotion={reducedMotion}
          onRequestCollection={scrollToRequest}
          onSeeCapture={seeWhatWeCapture}
        />
        <Hud revealed={revealed} reducedMotion={reducedMotion} />
      </section>

      <Bottleneck />
      <Pillars />
      <Roadmap />
      <EndCta />
      <Footer />

      <NodePanel
        node={selectedNode}
        total={NODES.length}
        onClose={handleClose}
      />
    </main>
  );
}
