"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

const slides: Slide[] = [
  {
    image: "/bg.jpg",
    eyebrow: "Featured Opportunity",
    title: "Build The Future Of Hiring",
    subtitle: "Discover roles that match your goals and apply in minutes.",
  },
  {
    image: "/bg.png",
    eyebrow: "New This Week",
    title: "Find Your Next Career Move",
    subtitle: "From internships to graduate programs and full-time jobs.",
  },
];

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const activeSlide = slides[safeIndex];

  if (!activeSlide) return null;

  return (
    <section className="mx-auto mt-10 w-full max-w-7xl">
      <div className="relative h-[18rem] overflow-hidden rounded-[2rem] border border-slate-200/70 shadow-[0_20px_50px_-30px_rgba(2,6,23,0.75)] sm:h-[22rem]">
        {slides.map((slide, index) => (
          <Image
            key={slide.image}
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            className={`object-cover transition-opacity duration-700 ${
              activeIndex === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-slate-900/30 to-slate-950/75" />

        <div className="absolute inset-0 flex items-center justify-end p-6 sm:p-10">
          <div className="max-w-md text-right text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
              {activeSlide.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{activeSlide.title}</h1>
            <p className="mt-4 text-sm leading-6 text-white/85 sm:text-base">{activeSlide.subtitle}</p>
          </div>
        </div>

        <div className="absolute bottom-5 right-6 flex items-center gap-2 sm:right-10">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                activeIndex === index ? "w-7 bg-white" : "w-2.5 bg-white/55"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
