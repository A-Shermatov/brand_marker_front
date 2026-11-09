import { Suspense } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import {
  LandingHero,
  LandingRibbon,
  LandingLiveRequests,
  LandingHowItWorks,
  LandingAbout,
  LandingPopular,
  LandingPricing,
  LandingMarks,
  LandingFaq,
} from "@/components/landing"

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas">
      <Suspense fallback={<div className="h-16 border-b border-line bg-card" />}>
        <Header />
      </Suspense>
      <LandingHero />
      <LandingRibbon />
      <LandingLiveRequests />
      <LandingHowItWorks />
      <LandingAbout />
      <LandingPopular />
      <LandingPricing />
      <LandingMarks />
      <LandingFaq />
      <Footer />
    </main>
  )
}
