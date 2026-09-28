"use client";

import { MotionConfig } from "framer-motion";
import AnnouncementBar from "@/components/landing/announcement-bar";
import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import LogoMarquee from "@/components/landing/logo-marquee";
import Stats from "@/components/landing/stats";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import TemplateShowcase from "@/components/landing/template-showcase";
import AtsDemo from "@/components/landing/ats-demo";
import Comparison from "@/components/landing/comparison";
import Testimonials from "@/components/landing/testimonials";
import PricingFunnel from "@/components/landing/pricing-funnel";
import Faq from "@/components/landing/faq";
import TrustBand from "@/components/landing/trust-band";
import FinalCtaFunnel from "@/components/landing/final-cta-funnel";
import BackToTop from "@/components/landing/back-to-top";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <AnnouncementBar />
        <Navbar />
        <div className="flex-1">
          <main>
            <Hero />
            <LogoMarquee />
            {/* Vertical-rhythm fix: stats.tsx carries py-16 sm:py-20 while every
                other content section on the page uses py-20 sm:py-28 — normalize
                it from the page level (stats.tsx itself is not edited; the
                arbitrary-variant selector outspecifies the child utilities).
                LogoMarquee's py-9 is intentional: it's a compact bordered band,
                not a full section. */}
            <div className="[&>section]:py-20 sm:[&>section]:py-28">
              <Stats />
            </div>
            <Features />
            <HowItWorks />
            <TemplateShowcase />
            <AtsDemo />
            <Comparison />
            <Testimonials />
            <PricingFunnel />
            <Faq />
            <TrustBand />
            <FinalCtaFunnel />
          </main>
        </div>
        <Footer />
        <BackToTop />
      </div>
    </MotionConfig>
  );
}
