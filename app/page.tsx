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
            <h1 ref={heroLogoRef} className="text-2xl font-medium text-[#EDE7DF] mb-20" style={{ fontFamily: 'Plus Jakarta Sans', letterSpacing: '8px', opacity: 0, transform: 'translateY(20px)' }}>
              flyt
            </h1>

            <h2 ref={heroTitleRef} className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#f5f1ed] mb-10 leading-snug max-w-3xl mx-auto" style={{ opacity: 0, transform: 'translateY(20px)' }}>
              Slipp å holde alt i hodet.
            </h2>

            <p ref={heroSubtextRef} className="text-lg sm:text-xl text-[#d4c5b9] max-w-3xl mx-auto mb-16 leading-relaxed" style={{ opacity: 0, transform: 'translateY(20px)' }}>
              Flyt samler henting, levering og det som mangler – så dere alltid vet hvem som gjør hva.
            </p>

            <div ref={heroButtonsRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ opacity: 0, transform: 'translateY(20px)' }}>
              <button className="group relative px-8 py-4 bg-[#6b8e6f] hover:bg-transparent text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl border-[3px] border-transparent hover:border-[#6b8e6f] focus:bg-transparent focus:border-[#6b8e6f] outline-none focus:ring-2 focus:ring-[#6b8e6f] focus:ring-offset-2 focus:ring-offset-[#2d2520] w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Last ned for iOS
                </span>
              </button>
              <button className="group relative px-8 py-4 bg-[#e8c96f] hover:bg-transparent text-[#2d2520] hover:text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl border-[3px] border-transparent hover:border-[#e8c96f] focus:bg-transparent focus:border-[#e8c96f] focus:text-white outline-none focus:ring-2 focus:ring-[#e8c96f] focus:ring-offset-2 focus:ring-offset-[#2d2520] w-full sm:w-auto">
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

            {/* Right Column - Today Card UI Mockup (App Style) - Avatar Display */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-lg bg-[#3d332d] rounded-3xl p-7 shadow-2xl border border-[#4a3f38]">
                <p className="text-xs text-[#a89985] mb-8 font-semibold tracking-widest uppercase">I dag</p>

                {/* Avatar Display */}
                <div className="relative flex items-center justify-center gap-16 py-8">
                  {/* Left Avatar (Levering) */}
                  <div className="flex flex-row-reverse items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full border-4 border-[#6b8e6f] flex items-center justify-center z-20" style={{ backgroundColor: 'rgba(45, 37, 32, 1)' }}>
                      <svg width="100%" height="100%" viewBox="0 0 290 374" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M96.7594 16.2329C98.1395 14.9 99.5617 13.6101 101.023 12.3717C112.511 2.72305 136.726 -1.21554 151.367 0.323775C181.591 3.5056 208.565 16.0093 228.152 39.5807C249.485 65.2417 257.009 102.357 253.965 134.898C251.342 162.855 243.733 203.135 221.127 221.788L221.54 228.96C218.255 234.764 212.434 239.013 205.598 235.917C204.781 234.747 203.706 233.664 202.743 232.597C198.135 234.274 193.629 234.962 188.719 234.902L188.229 235.005C188.332 237.275 189.012 244.92 187.851 246.253C158.837 265.215 135.253 267.357 105.508 247.216C105.657 243.433 105.608 239.227 105.646 235.401C102.606 233.595 102.545 231.927 97.5866 229.467C96.9297 229.338 96.2762 229.209 95.6244 229.063C79.8057 225.571 71.815 212.105 63.8975 199.67C66.7986 210.462 68.7256 213.162 74.0162 222.949C42.2833 194.733 32.2746 108.988 46.7047 69.4125C55.5689 45.1016 69.3791 21.0315 96.7594 16.2329Z" fill="#F9DBB7"/>
                        <path d="M103.964 63.2723C109.241 89.1311 115.5 98.7367 139.041 111.395C129.366 101.05 127.289 95.7527 123.325 82.2428C139.975 105.599 156.224 110.69 181.324 120.115C175.073 114.362 170.851 110.2 165.169 103.905C188.014 117.071 185.357 119.298 214.154 127.614C217.137 139.731 219.665 146.946 218.341 159.441C221.05 152.269 226.088 134.752 232.142 131.449C249.176 131.14 244.025 183.528 213.543 189.763C209.08 203.849 204.386 216.636 194.016 227.584C192.09 229.613 189.312 232.219 188.719 234.902L188.229 235.005C188.332 237.275 189.011 244.92 187.851 246.253C158.837 265.215 135.253 267.356 105.508 247.216C105.657 243.432 105.608 239.227 105.646 235.401C102.606 233.595 102.545 231.926 97.5866 229.467C96.547 226.165 94.1153 223.181 92.16 220.291C85.6767 210.72 81.8607 200.529 78.1925 189.634C50.0701 183.958 43.4871 133.315 59.256 134.184C66.8786 138.131 70.8795 151.667 73.5743 159.725C73.944 138.08 73.5175 123.658 86.8771 105.728C96.2401 93.1643 101.454 78.7171 103.964 63.2723Z" fill="#F1B48E"/>
                        <path d="M105.646 235.401C126.267 250.011 148.149 257.923 171.986 244.602C176.397 242.126 183.689 236.028 188.229 235.005C188.332 237.275 189.011 244.92 187.851 246.253C158.837 265.215 135.253 267.356 105.508 247.216C105.657 243.433 105.608 239.227 105.646 235.401Z" fill="#8A6A48"/>
                        <path d="M202.743 232.597C203.044 222.002 212.056 214.349 221.127 221.788L221.54 228.959C218.255 234.764 212.434 239.012 205.598 235.917C204.781 234.747 203.706 233.663 202.743 232.597Z" fill="#E9BD71"/>
                        <path d="M187.851 246.253C188.435 249.375 188.668 253.202 190.293 255.635C189.785 282.758 200.92 282.578 223.947 288.64L257.06 297.937C266.691 301.935 281.334 307.405 289.477 313.287C209.949 393.297 80.8392 394.363 0 315.677C16.6115 307.534 30.9367 299.011 49.3728 295.038C55.3987 293.749 64.0248 290.524 70.0403 290.558C99.9271 283.033 103.301 276.283 105.508 247.216C135.253 267.356 158.837 265.215 187.851 246.253Z" fill="#9C7056"/>
                        <path d="M187.851 246.253C188.435 249.375 188.668 253.202 190.293 255.635C189.785 282.758 200.92 282.578 223.947 288.64C220.568 290.033 219.614 291.796 216.656 293.594C211.041 297.016 205.134 300.121 199.132 302.838C168.04 315.953 130.691 317.337 98.8033 306.029C90.442 303.062 75.6629 296.948 70.0403 290.558C99.9271 283.033 103.301 276.283 105.508 247.216C135.253 267.356 158.837 265.215 187.851 246.253Z" fill="#F1B48E"/>
                        <path d="M221.54 228.96C222.735 224.952 224.051 223.636 227.817 221.753C245.298 212.982 266.046 227.472 273.613 243.011C278.582 253.219 278.668 260.098 277.147 270.289C273.243 262.635 271.678 259.419 266.39 252.574C272.899 269.954 275.074 287.015 257.06 297.936L223.947 288.64C200.92 282.578 189.785 282.758 190.293 255.635C188.667 253.202 188.435 249.375 187.851 246.253C189.011 244.92 188.332 237.275 188.229 235.005L188.719 234.902C193.629 234.962 198.134 234.274 202.743 232.597C203.706 233.663 204.781 234.747 205.598 235.917C212.434 239.012 218.255 234.764 221.54 228.96Z" fill="#F9DBB7"/>
                        <path d="M202.743 232.597C203.706 233.663 204.781 234.747 205.598 235.917C196.931 239.073 192.236 246.984 190.293 255.635C188.667 253.202 188.435 249.375 187.851 246.253C189.011 244.92 188.332 237.275 188.229 235.005L188.719 234.902C193.629 234.962 198.134 234.274 202.743 232.597Z" fill="#E9BD71"/>
                      </svg>
                    </div>
                    <p className="text-lg text-white font-semibold">Emma</p>
                  </div>

                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5 bg-[#746558] z-0" />

                  {/* Right Avatar (Henting) */}
                  <div className="flex flex-row items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full border-4 border-[#e8c96f] flex items-center justify-center z-20" style={{ backgroundColor: 'rgba(45, 37, 32, 1)' }}>
                      <svg width="100%" height="100%" viewBox="0 0 260 365" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M76.4226 21.0988C82.9177 10.457 93.5178 5.04577 105.498 2.37877C137.223 -4.68473 175.423 4.64752 202.647 21.5855C212.932 27.9853 221.582 36.077 232.039 42.1258C225.13 43.7675 221.604 44.2865 214.485 44.1883C232.174 61.4113 232.969 76.2125 225.28 98.5513C225.07 93.6433 224.957 88.352 224.597 83.4853C223.645 88.073 223.442 91.997 222.579 96.4318C220.921 104.94 218.228 113.647 215.618 121.938C227.23 122.953 227.868 134.86 226.563 143.925C223.892 162.557 215.805 178.072 197.531 184.421C193.375 197.196 189.016 207.664 180.997 218.551C179.706 220.301 176.541 224.023 175.67 225.559C173.255 227.344 170.652 229.866 168.228 231.781C139.556 254.449 110.134 250.529 84.7481 225.598C74.1616 213.97 66.6004 199.912 62.7355 184.669C42.3913 176.474 34.4304 159.899 32.8775 138.647C32.2181 129.634 35.6877 122.266 45.6524 122.183C39.2525 100.49 39.6546 99.4453 36.8564 78.2083C36.0597 85.1308 35.8062 89.4478 35.7499 96.4183C27.8325 72.191 30.6224 45.9928 56.7551 33.0155C58.3537 32.222 61.767 31.0025 62.758 29.8003C57.2727 27.053 52.8354 28.2688 47.2937 30.0965C45.9419 23.4545 61.833 20.6908 66.4204 20.3293C69.1728 20.1118 73.6147 20.7028 76.4226 21.0988Z" fill="#F1B48E"/>
                        <path d="M76.4226 21.0988C82.9177 10.457 93.5178 5.04577 105.498 2.37877C137.223 -4.68473 175.423 4.64752 202.647 21.5855C212.932 27.9853 221.582 36.077 232.039 42.1258C225.13 43.7675 221.604 44.2865 214.485 44.1883C232.174 61.4113 232.969 76.2125 225.28 98.5513C225.07 93.6433 224.957 88.352 224.597 83.4853C223.645 88.073 223.442 91.997 222.579 96.4318C220.921 104.94 218.228 113.647 215.618 121.938C207.448 128.767 205.213 140.765 202.182 151.083C202.692 139.104 197.598 95.6833 189.279 88.0865L188.401 88.3633L189.451 92.5385C189.286 92.6098 146.706 75.4895 141.162 73.8253C146.226 78.9043 149.676 82.472 155.37 86.8048C136.196 83.4965 119.054 72.0155 103.045 61.2785C109.212 71.0795 116.398 76.517 125.221 83.6548C108.589 80.3758 98.2364 76.9483 85.4083 65.1995C62.6928 94.1045 57.2074 114.277 57.5742 150.513C54.8278 140.313 52.4633 130.385 45.6524 122.183C39.2525 100.49 39.6546 99.4453 36.8564 78.2083C36.0597 85.1308 35.8062 89.4478 35.7499 96.4183C27.8325 72.191 30.6224 45.9928 56.7551 33.0155C58.3537 32.222 61.767 31.0025 62.758 29.8003C57.2727 27.053 52.8354 28.2688 47.2937 30.0965C45.9419 23.4545 61.833 20.6908 66.4204 20.3293C69.1728 20.1118 73.6147 20.7028 76.4226 21.0988Z" fill="#593B2F"/>
                        <path d="M68.5375 47.006C71.5232 46.8448 73.1946 46.5073 75.2306 48.2098C74.788 50.381 72.893 51.9035 71.3522 53.4943C62.4505 62.6855 56.1257 71.3795 51.6801 83.5138L50.2293 86.6863L49.3868 86.651C47.8181 81.038 49.6434 66.8015 52.5076 61.241C56.7153 53.072 60.2854 50.0323 68.5375 47.006Z" fill="#593B2F"/>
                        <path d="M84.7482 225.598C110.134 250.529 139.557 254.448 168.229 231.781C170.652 229.866 173.255 227.344 175.67 225.559L175.46 227.687C175.49 232.05 175.565 236.781 175.595 241.1C175.828 269.79 176.278 278.049 203.6 289.584C223.307 296.532 240.689 302.157 259.646 311.202C198.746 382.688 60.7258 383.197 0 311.159C18.9264 302.335 37.3652 296.303 56.9892 289.42C84.4632 277.137 83.2854 270.897 84.7932 242.069L84.7482 225.598Z" fill="#9C7056"/>
                        <path d="M84.7482 225.598C110.134 250.529 139.557 254.448 168.229 231.781C170.652 229.866 173.255 227.344 175.67 225.559L175.46 227.687C175.49 232.05 175.565 236.781 175.595 241.1C175.828 269.79 176.278 278.049 203.6 289.584C159.699 317.955 100.57 319.06 56.9892 289.42C84.4632 277.137 83.2854 270.897 84.7932 242.069L84.7482 225.598Z" fill="#F1B48E"/>
                        <path d="M84.7482 225.598C110.134 250.529 139.557 254.448 168.229 231.781C170.652 229.866 173.255 227.344 175.67 225.559L175.46 227.687C174.868 232.871 174.943 236.87 174.988 242.042C142.805 262.136 116.676 265.609 84.7932 242.069L84.7482 225.598Z" fill="#9C7056"/>
                      </svg>
                    </div>
                    <p className="text-lg text-white font-semibold">Jonas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Benefits */}
      <section ref={benefitsRef} className="py-48 bg-[#3a322c]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f1ed] mb-6 leading-snug">
              Mindre å huske. Mer oversikt.
            </h2>
            <p className="text-lg text-[#a89985] max-w-3xl mx-auto leading-relaxed">
              Når begge vet hva som skjer, blir hverdagen enklere.
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
              Alt på ett sted. For begge.
            </h2>
            <p className="text-lg text-[#a89985] max-w-3xl mx-auto leading-relaxed">
              En felles oversikt over det som skal skje – og det som mangler.
            </p>
          </div>

          {/* Mobile phone mockup with scrolling screenshot */}
          <div className="flex items-center justify-center">
            <div
              className="relative w-[400px] h-[650px] bg-[#1a1614] rounded-[3rem] border-[14px] border-[#1a1614] shadow-2xl overflow-hidden"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(107, 142, 111, 0.2)'
              }}
            >
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#1a1614] rounded-b-3xl z-10" />

              {/* Screenshot container with scroll animation */}
              <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                <img
                  src="/screenshot.jpg"
                  alt="Flyt app screenshot"
                  className="w-full h-auto screenshot-scroll"
                  style={{
                    minHeight: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top'
                  }}
                />
              </div>
            </div>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f1ed] mb-14 leading-snug">
            Få en enklere hverdag.
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group relative px-8 py-4 bg-[#6b8e6f] hover:bg-transparent text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl border-[3px] border-transparent hover:border-[#6b8e6f] focus:bg-transparent focus:border-[#6b8e6f] outline-none focus:ring-2 focus:ring-[#6b8e6f] focus:ring-offset-2 focus:ring-offset-[#2d2520] w-full sm:w-auto">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Last ned for iOS
              </span>
            </button>

            <button className="group relative px-8 py-4 bg-[#e8c96f] hover:bg-transparent text-[#2d2520] hover:text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl border-[3px] border-transparent hover:border-[#e8c96f] focus:bg-transparent focus:border-[#e8c96f] focus:text-white outline-none focus:ring-2 focus:ring-[#e8c96f] focus:ring-offset-2 focus:ring-offset-[#2d2520] w-full sm:w-auto">
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

      {/* Footer - About */}
      <footer className="py-16 border-t border-[#4a3f38]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Intro */}
            <p className="text-sm text-[#a89985] uppercase tracking-wider mb-6">Laget av</p>

            {/* Avatar */}
            <div className="mb-6">
              <div className="relative w-20 h-20 rounded-full border-4 border-[#6b8e6f] flex items-center justify-center" style={{ backgroundColor: 'rgba(45, 37, 32, 1)' }}>
                <svg width="100%" height="100%" viewBox="0 0 290 374" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96.7594 16.2329C98.1395 14.9 99.5617 13.6101 101.023 12.3717C112.511 2.72305 136.726 -1.21554 151.367 0.323775C181.591 3.5056 208.565 16.0093 228.152 39.5807C249.485 65.2417 257.009 102.357 253.965 134.898C251.342 162.855 243.733 203.135 221.127 221.788L221.54 228.96C218.255 234.764 212.434 239.013 205.598 235.917C204.781 234.747 203.706 233.664 202.743 232.597C198.135 234.274 193.629 234.962 188.719 234.902L188.229 235.005C188.332 237.275 189.012 244.92 187.851 246.253C158.837 265.215 135.253 267.357 105.508 247.216C105.657 243.433 105.608 239.227 105.646 235.401C102.606 233.595 102.545 231.927 97.5866 229.467C96.9297 229.338 96.2762 229.209 95.6244 229.063C79.8057 225.571 71.815 212.105 63.8975 199.67C66.7986 210.462 68.7256 213.162 74.0162 222.949C42.2833 194.733 32.2746 108.988 46.7047 69.4125C55.5689 45.1016 69.3791 21.0315 96.7594 16.2329Z" fill="#F9DBB7"/>
                  <path d="M103.964 63.2723C109.241 89.1311 115.5 98.7367 139.041 111.395C129.366 101.05 127.289 95.7527 123.325 82.2428C139.975 105.599 156.224 110.69 181.324 120.115C175.073 114.362 170.851 110.2 165.169 103.905C188.014 117.071 185.357 119.298 214.154 127.614C217.137 139.731 219.665 146.946 218.341 159.441C221.05 152.269 226.088 134.752 232.142 131.449C249.176 131.14 244.025 183.528 213.543 189.763C209.08 203.849 204.386 216.636 194.016 227.584C192.09 229.613 189.312 232.219 188.719 234.902L188.229 235.005C188.332 237.275 189.011 244.92 187.851 246.253C158.837 265.215 135.253 267.356 105.508 247.216C105.657 243.432 105.608 239.227 105.646 235.401C102.606 233.595 102.545 231.926 97.5866 229.467C96.547 226.165 94.1153 223.181 92.16 220.291C85.6767 210.72 81.8607 200.529 78.1925 189.634C50.0701 183.958 43.4871 133.315 59.256 134.184C66.8786 138.131 70.8795 151.667 73.5743 159.725C73.944 138.08 73.5175 123.658 86.8771 105.728C96.2401 93.1643 101.454 78.7171 103.964 63.2723Z" fill="#F1B48E"/>
                  <path d="M105.646 235.401C126.267 250.011 148.149 257.923 171.986 244.602C176.397 242.126 183.689 236.028 188.229 235.005C188.332 237.275 189.011 244.92 187.851 246.253C158.837 265.215 135.253 267.356 105.508 247.216C105.657 243.433 105.608 239.227 105.646 235.401Z" fill="#8A6A48"/>
                  <path d="M202.743 232.597C203.044 222.002 212.056 214.349 221.127 221.788L221.54 228.959C218.255 234.764 212.434 239.012 205.598 235.917C204.781 234.747 203.706 233.663 202.743 232.597Z" fill="#E9BD71"/>
                  <path d="M187.851 246.253C188.435 249.375 188.668 253.202 190.293 255.635C189.785 282.758 200.92 282.578 223.947 288.64L257.06 297.937C266.691 301.935 281.334 307.405 289.477 313.287C209.949 393.297 80.8392 394.363 0 315.677C16.6115 307.534 30.9367 299.011 49.3728 295.038C55.3987 293.749 64.0248 290.524 70.0403 290.558C99.9271 283.033 103.301 276.283 105.508 247.216C135.253 267.356 158.837 265.215 187.851 246.253Z" fill="#9C7056"/>
                  <path d="M187.851 246.253C188.435 249.375 188.668 253.202 190.293 255.635C189.785 282.758 200.92 282.578 223.947 288.64C220.568 290.033 219.614 291.796 216.656 293.594C211.041 297.016 205.134 300.121 199.132 302.838C168.04 315.953 130.691 317.337 98.8033 306.029C90.442 303.062 75.6629 296.948 70.0403 290.558C99.9271 283.033 103.301 276.283 105.508 247.216C135.253 267.356 158.837 265.215 187.851 246.253Z" fill="#F1B48E"/>
                  <path d="M221.54 228.96C222.735 224.952 224.051 223.636 227.817 221.753C245.298 212.982 266.046 227.472 273.613 243.011C278.582 253.219 278.668 260.098 277.147 270.289C273.243 262.635 271.678 259.419 266.39 252.574C272.899 269.954 275.074 287.015 257.06 297.936L223.947 288.64C200.92 282.578 189.785 282.758 190.293 255.635C188.667 253.202 188.435 249.375 187.851 246.253C189.011 244.92 188.332 237.275 188.229 235.005L188.719 234.902C193.629 234.962 198.134 234.274 202.743 232.597C203.706 233.663 204.781 234.747 205.598 235.917C212.434 239.012 218.255 234.764 221.54 228.96Z" fill="#F9DBB7"/>
                  <path d="M202.743 232.597C203.706 233.663 204.781 234.747 205.598 235.917C196.931 239.073 192.236 246.984 190.293 255.635C188.667 253.202 188.435 249.375 187.851 246.253C189.011 244.92 188.332 237.275 188.229 235.005L188.719 234.902C193.629 234.962 198.134 234.274 202.743 232.597Z" fill="#E9BD71"/>
                </svg>
              </div>
            </div>

            {/* Name */}
            <h3 className="text-xl font-semibold text-[#f5f1ed] mb-3">Thomas</h3>

            {/* Bio */}
            <p className="text-base text-[#a89985] max-w-xl mb-4 leading-relaxed">
              Jeg er en småbarnsfar som bygger verktøy for å gjøre hverdagen enklere.<br />
              Flyt kom fra et personlig behov – og nå håper jeg det kan hjelpe andre familier også.
            </p>

            {/* Email */}
            <a
              href="mailto:flyt-app@gmail.com"
              className="flex items-center gap-2 text-[#7fa884] hover:text-[#6b8e6f] underline hover:no-underline focus:no-underline transition-all duration-200 outline-none focus:ring-2 focus:ring-[#6b8e6f] focus:ring-offset-2 focus:ring-offset-[#2d2520] rounded"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8L10.89 13.26C11.23 13.47 11.61 13.59 12 13.59C12.39 13.59 12.77 13.47 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              flyt-app@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
