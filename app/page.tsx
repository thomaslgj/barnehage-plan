"use client";

import { useEffect, useRef } from "react";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtextRef = useRef<HTMLParagraphElement>(null);
  const heroLogoRef = useRef<HTMLHeadingElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const screenshotRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Hero staggered animation sequence
    const heroElements = [
      { ref: heroTitleRef, delay: 200 },
      { ref: heroSubtextRef, delay: 400 },
      { ref: heroLogoRef, delay: 2000 },
      { ref: heroButtonsRef, delay: 2300 },
    ];

    heroElements.forEach(({ ref, delay }) => {
      if (ref.current) {
        ref.current.style.opacity = "0";
        ref.current.style.transform = "translateY(20px)";
        setTimeout(() => {
          if (ref.current) {
            ref.current.style.transition = "opacity 600ms ease-out, transform 600ms ease-out";
            ref.current.style.opacity = "1";
            ref.current.style.transform = "translateY(0)";
          }
        }, delay);
      }
    });

    // Intersection Observer for scroll-based reveals
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px",
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.transition = "opacity 500ms ease-out, transform 500ms ease-out";
          target.style.opacity = "1";
          target.style.transform = "translateY(0)";
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = [problemRef, benefitsRef, screenshotRef, howItWorksRef, ctaRef];
    sections.forEach((ref) => {
      if (ref.current) {
        ref.current.style.opacity = "0";
        ref.current.style.transform = "translateY(30px)";
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-[#2d2520]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-40 sm:pt-48 sm:pb-48">
          <div className="text-center">
            <h1 ref={heroLogoRef} className="text-3xl font-medium text-[#d4c5b9] mb-20" style={{ letterSpacing: '0.3em' }}>
              FLYT
            </h1>

            <h2 ref={heroTitleRef} className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#f5f1ed] mb-10 leading-snug max-w-3xl mx-auto">
              Slipp å holde alt i hodet.
            </h2>

            <p ref={heroSubtextRef} className="text-lg sm:text-xl text-[#d4c5b9] max-w-3xl mx-auto mb-16 leading-relaxed">
              Flyt samler henting, levering og det som mangler – så avtalen er synlig for begge.
            </p>

            <div ref={heroButtonsRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group relative px-8 py-4 bg-[#6b8e6f] hover:bg-[#7fa884] text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Last ned for iOS
                </span>
              </button>
              <button className="group relative px-8 py-4 bg-[#e8c96f] hover:bg-[#f0d689] text-[#2d2520] rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Last ned for Android
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-radial from-[#6b8e6f]/10 to-transparent blur-3xl -z-10" />
      </section>

      {/* Problem Section - Two Column Layout */}
      <section ref={problemRef} className="py-40 bg-[#2d2520]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Column - Text */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f5f1ed] mb-8 leading-snug">
                Hverdagen består av små avtaler.
              </h2>

              <p className="text-lg sm:text-xl text-[#a89985] mb-12 leading-relaxed max-w-xl">
                De fleste av dem skjer i farten.
              </p>

              <div className="space-y-4 mb-12 text-lg text-[#a89985] max-w-xl">
                <p>Hvem som leverer.</p>
                <p>Hvem som henter.</p>
                <p>Om det er turdag.</p>
                <p>Om regntøyet mangler.</p>
              </div>

              <p className="text-xl text-[#d4c5b9] font-normal max-w-xl">
                Flyt gjør det synlig.
              </p>
            </div>

            {/* Right Column - Today Card UI Mockup (App Style) - 30% larger */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-lg bg-[#3d332d] rounded-3xl p-7 shadow-2xl border border-[#4a3f38]">
                <p className="text-xs text-[#a89985] mb-8 font-semibold tracking-widest uppercase">I dag</p>
                <div className="space-y-4">
                  {/* Dropoff Slot */}
                  <div className="rounded-xl bg-gradient-to-br from-[#6b8e6f] to-[#5d8a7f] p-5 flex items-center gap-4">
                    <span className="text-2xl text-white/80">▶</span>
                    <div>
                      <p className="text-sm text-white/70 mb-1">Levering</p>
                      <p className="text-2xl text-white font-semibold">Emma</p>
                    </div>
                  </div>

                  {/* Pickup Slot */}
                  <div className="rounded-xl bg-gradient-to-br from-[#e8c96f] to-[#d4b560] p-5 flex items-center gap-4">
                    <span className="text-2xl text-[#2d2520]/80">◀</span>
                    <div>
                      <p className="text-sm text-[#2d2520]/70 mb-1">Henting</p>
                      <p className="text-2xl text-[#2d2520] font-semibold">Jonas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Benefits */}
      <section ref={benefitsRef} className="py-48 bg-[#312b26]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f1ed] mb-6 leading-snug">
              Mindre å huske. Mer oversikt.
            </h2>
            <p className="text-lg text-[#a89985] max-w-3xl mx-auto leading-relaxed">
              Når avtalen er synlig for begge, blir hverdagen enklere.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16 mb-20">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#6b8e6f]/15 flex items-center justify-center mx-auto mb-6 p-3">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4" stroke="#6b8e6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="#7fa884" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#f5f1ed] mb-4">
                Begge vet.
              </h3>
              <p className="text-[#a89985] leading-relaxed max-w-xs mx-auto">
                Henting og levering er tydelig, uten å dobbeltsjekke.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#e8c96f]/15 flex items-center justify-center mx-auto mb-6 p-3">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 12h8M8 8h8M8 16h5" stroke="#e8c96f" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="#f0d689" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#f5f1ed] mb-4">
                Påminnelser når det trengs.
              </h3>
              <p className="text-[#a89985] leading-relaxed max-w-xs mx-auto">
                Hvis noe mangler, vises det med en gang.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#7fa884]/15 flex items-center justify-center mx-auto mb-6 p-3">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v4l3 3" stroke="#7fa884" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="#6b8e6f" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#f5f1ed] mb-4">
                Tydelige avtaler.
              </h3>
              <p className="text-[#a89985] leading-relaxed max-w-xs mx-auto">
                Ingen tolkning. Ingen misforståelser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Section */}
      <section ref={screenshotRef} className="py-40 bg-[#2d2520]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f1ed] mb-6 leading-snug">
              Avtalen. Synlig for begge.
            </h2>
            <p className="text-lg text-[#a89985] max-w-3xl mx-auto leading-relaxed">
              En felles oversikt over det som skal skje – og det som mangler.
            </p>
          </div>

          {/* Screenshot placeholder */}
          <div className="bg-[#2d2520] rounded-3xl border border-[#4a3f38]/50 p-12 flex items-center justify-center min-h-[500px] shadow-2xl shadow-[#6b8e6f]/5">
            <span className="text-[#a89985] text-lg">Skjermbilde av appen kommer her</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howItWorksRef} className="py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f1ed] mb-6 leading-snug">
              Enkelt å komme i gang
            </h2>
            <p className="text-lg text-[#a89985] max-w-3xl mx-auto leading-relaxed">
              Tre enkle steg til bedre familieflyt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#6b8e6f] flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-[#f5f1ed] mb-2">
                Last ned appen
              </h3>
              <p className="text-[#a89985]">
                Tilgjengelig for iOS og Android
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#6b8e6f] flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-[#f5f1ed] mb-2">
                Opprett husholdning
              </h3>
              <p className="text-[#a89985]">
                Del en invitasjonskode med partner
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#6b8e6f] flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-[#f5f1ed] mb-2">
                Begynn å planlegge
              </h3>
              <p className="text-[#a89985]">
                Få flyt i hverdagen med en gang
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={ctaRef} className="py-40 bg-gradient-to-b from-[#3d332d]/30 to-[#2d2520]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f1ed] mb-8 leading-snug">
            Klar for en enklere hverdag?
          </h2>
          <p className="text-lg text-[#a89985] mb-14 leading-relaxed">
            Start med Flyt i dag.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group relative px-8 py-4 bg-[#6b8e6f] hover:bg-[#7fa884] text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Last ned for iOS
              </span>
            </button>

            <button className="group relative px-8 py-4 bg-[#e8c96f] hover:bg-[#f0d689] text-[#2d2520] rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Last ned for Android
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#4a3f38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-[#a89985] text-sm">
            <p>© 2025 Flyt. Gjør hverdagen enklere.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
