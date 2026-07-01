"use client";

import { useEffect, useState } from "react";
import Cinematic from "@/components/Cinematic";
import CinematicMobile from "@/components/CinematicMobile";

/**
 * Chooses the desktop scrubber or the mobile scroll layout at runtime. Only one
 * ever mounts, so the desktop scroll-lock never runs on phones. Renders a dark
 * shell until the viewport is known to avoid a hydration mismatch / flash.
 */
export default function HomeExperience() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isMobile === null) {
    return <div className="fixed inset-0 bg-[#0f0e0b]" aria-hidden />;
  }

  return isMobile ? <CinematicMobile /> : <Cinematic />;
}
