import MosaicHero from "@/components/MosaicHero";
import Capability from "@/components/Capability";
import Approach from "@/components/Approach";
import ContactCta from "@/components/ContactCta";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <main id="top">
      <MosaicHero />
      <Capability />
      <Approach />
      <ContactCta />
      <SiteFooter />
    </main>
  );
}
