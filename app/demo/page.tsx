import type { Metadata } from "next";
import Demo from "@/components/Demo";

export const metadata: Metadata = {
  title: "Praxis — One capture, every modality",
  description:
    "A single residential demonstration, decomposed. Three synchronized camera streams, stereo depth, and full-hand + end-effector motion capture — the multimodal record Praxis hands to the machines that will inherit this work.",
};

export default function DemoPage() {
  return <Demo />;
}
