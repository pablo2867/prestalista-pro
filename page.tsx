import Hero from './components/Hero'
import Features from './components/Features'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import Pricing from './components/Pricing'
import Footer from './components/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Testimonials />
      <FAQ />
      <Pricing />
      <Footer />
    </main>
  )
}