import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FloatingSocialLinks from "@/components/FloatingSocialLinks";
import LatestJobListings from "@/components/LatestJobListings";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#e7edf8] via-[#edf3fb] to-[#dce7f6] px-3 pb-4 pt-20 sm:px-4">
      <div className="pointer-events-none absolute -left-16 top-[-9rem] h-72 w-72 rounded-full bg-sky-400/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 top-20 h-56 w-56 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-1/3 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
      <FloatingSocialLinks />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <LatestJobListings />
        <Footer />
      </div>
    </div>
  );
}
