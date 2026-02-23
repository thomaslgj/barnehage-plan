# TODO & Feature Roadmap

Denne filen inneholder forslag til forbedringer og nye features for Flyt-prosjektet.

## 🎯 Prioritert

### Kritiske oppgaver
- [ ] Oppdater placeholder-URLer til faktiske domener:
  - `https://flytfamilie.no/privacy` → faktisk URL
  - `https://flytfamilie.no/terms` → faktisk URL
  - `privacy@flytfamilie.no` → faktisk e-post
  - `support@flytfamilie.no` → faktisk e-post

### GDPR & Compliance
- [x] Privacy policy side
- [x] Terms of service side
- [x] Data eksport funksjonalitet
- [x] Konto sletting funksjonalitet
- [x] Analytics samtykke toggle
- [x] Consent under onboarding
- [ ] App Store privacy labels dokumentasjon
- [ ] Cookie consent banner (for web)
- [ ] Logging av GDPR-requests (for audit trail)

## 📊 Admin Dashboard

### Implementert
- [x] Grunnleggende dashboard
- [x] Bruker-oversikt
- [x] Activity metrics (DAU/WAU/MAU)
- [x] Premium management
- [x] Last active tracking
- [x] Delete user funksjonalitet

### Foreslåtte forbedringer
- [ ] **User engagement metrics**
  - Gjennomsnittlig session-lengde
  - Mest brukte features
  - Retention rate (7-dag, 30-dag)
  - Churn rate

- [ ] **Advanced analytics**
  - Grafer/charts for aktivitet over tid
  - Cohort analysis (bruker-kohorter)
  - Funnel analysis (onboarding completion rate)
  - Feature adoption rates

- [ ] **Email & kommunikasjon**
  - Send e-post til brukere direkte fra dashboard
  - Broadcast-meldinger til alle brukere
  - Targeted emails (f.eks. inactive users)
  - Email templates

- [ ] **Support tools**
  - Søk etter bruker (e-post, navn)
  - Impersonate user (for debugging)
  - View user's data/activity log
  - Support ticket system

- [ ] **Revenue & business metrics**
  - MRR (Monthly Recurring Revenue)
  - Conversion rate (free → premium)
  - Lifetime value (LTV)
  - Prognose/forecasting

- [ ] **System health**
  - Error rate monitoring
  - API response times
  - Database query performance
  - Crash reports

## 📱 Mobile App Features

### Planlagt / Foreslått
- [ ] **Push notifications forbedringer**
  - Reminder før henting (konfigurerbar tid)
  - Notification ved endring i ukeplan
  - Notification når noen legger til notat

- [ ] **Kalender-integrasjon**
  - Eksporter til Apple Calendar / Google Calendar
  - Sync assignments automatisk
  - iCal feed

- [ ] **Widgets**
  - iOS home screen widget (dagens plan)
  - Android widget
  - Lock screen widget

- [ ] **Offline mode**
  - Cache mer data lokalt
  - Offline editing med sync når online
  - Indikator for offline/online status

- [ ] **Familiemedlem-funksjoner**
  - Profilbilder (upload egne bilder, ikke bare avatarer)
  - Fargekobling per familiemedlem
  - Notifikasjons-preferanser per medlem

- [ ] **Ukeplan forbedringer**
  - Bulk assign (sett hele uken på en gang)
  - Templating (lagre ukeplaner som templates)
  - Kopier forrige uke
  - Automatisk rotasjon

- [ ] **Notater-funksjonalitet**
  - ✅ Implementert: Notater per dag
  - [ ] Attach bilder til notater
  - [ ] Kategorisering av notater (påminnelse, info, medisinsk, etc.)
  - [ ] Recurring notes (f.eks. "Husk laken hver fredag")

- [ ] **Equipment tracking forbedringer**
  - Påminnelser om manglende utstyr
  - Historikk (når ble bleiepakke sist sjekket?)
  - Custom equipment items
  - Foto av utstyr (for nye barnehager)

- [ ] **Multi-child support**
  - Bytt mellom barn enklere (dropdown i header)
  - Side-by-side view for flere barn
  - Separate utstyr og notater per barn

## 🌐 Web / Landing Page

### Foreslåtte forbedringer
- [ ] **Marketing**
  - Bedre hero section med screenshots
  - Testimonials / anmeldelser
  - Pricing page (for fremtidig premium)
  - FAQ section
  - Blog (for SEO)

- [ ] **Web app**
  - Full web-versjon av appen (ikke bare landing)
  - Responsive design
  - PWA support (installable web app)

- [ ] **SEO & Analytics**
  - Meta tags optimalisering
  - Sitemap
  - Google Analytics / Plausible
  - Structured data (schema.org)

## 🔐 Sikkerhet & Infrastruktur

### Foreslått
- [x] **Sikkerhet**
  - Rate limiting på API (✅ Implementert - se /supabase/RATE_LIMITING.md)
  - CAPTCHA på registrering (hvis spam blir problem)
  - 2FA (Two-Factor Authentication)
  - Session management (force logout all devices)
  - Security audit

- [ ] **Backup & Recovery**
  - Automated backups (Supabase har dette, men verifiser)
  - Backup verification
  - Disaster recovery plan
  - Point-in-time recovery

- [ ] **Monitoring & Alerting**
  - Error tracking (Sentry)
  - Uptime monitoring
  - Performance monitoring (APM)
  - Alerting ved kritiske feil

- [ ] **Infrastructure**
  - CI/CD pipeline
  - Automated testing
  - Staging environment
  - Load testing

## 💰 Premium Features (Fremtidig)

### Potensielle premium-features
- [ ] Unlimited households
- [ ] Unlimited children
- [ ] Advanced analytics for families
- [ ] Custom themes/colors
- [ ] Export til PDF (ukesplan som PDF)
- [ ] Familiekalender (felles kalender med events)
- [ ] Shopping lists (handletur før barnehagen)
- [ ] Meal planning integration
- [ ] Custom notifications
- [ ] API access

## 🐛 Bugs & Fixes

### Kjente issues
- [ ] (Ingen kjente bugs for øyeblikket)

## 📚 Dokumentasjon

### Mangler
- [ ] Developer documentation
- [ ] API documentation (hvis vi lager API)
- [ ] Architecture decision records (ADRs)
- [ ] Deployment guide
- [ ] Contributing guide
- [ ] Code of conduct

## 🧪 Testing

### Implementert
- [x] Unit tests setup (Jest + React Native Testing Library)
- [x] Test examples for utility functions
- [x] Test examples for components
- [x] Testing documentation (TESTING.md)
- [x] Coverage thresholds configured

### Foreslått
- [ ] Integration tests
- [ ] E2E tests (Detox for React Native)
- [ ] Manual QA checklist
- [ ] Beta testing program
- [ ] CI/CD pipeline with automated tests

## 📊 Analytics & Metrics å tracke

### Foreslåtte events (hvis analytics_events brukes)
- [ ] User events:
  - `user_signed_up`
  - `user_completed_onboarding`
  - `user_invited_member`
  - `user_upgraded_premium`

- [ ] App usage:
  - `assignment_created`
  - `assignment_updated`
  - `note_added`
  - `note_deleted`
  - `equipment_status_changed`

- [ ] Feature usage:
  - `biometric_login_enabled`
  - `notifications_enabled`
  - `calendar_viewed`
  - `profile_updated`

## 🎨 Design & UX

### Foreslåtte forbedringer
- [ ] Onboarding flow forbedring (bedre forklaring av features)
- [ ] Dark mode support
- [ ] Accessibility audit (WCAG)
- [ ] Haptic feedback (mer i appen)
- [ ] Animations og transitions
- [ ] Custom illustrations
- [ ] Tutorial/help system (tooltips, guide)

## 🌍 Internasjonalisering

### Fremtidig
- [ ] Multi-language support (dansk, svensk?)
- [ ] i18n infrastructure
- [ ] Date/time localization
- [ ] Currency support (hvis premium)

---

## Notater

### Prioritering
- 🔴 **Kritisk**: Må gjøres før launch
- 🟡 **Viktig**: Bør gjøres snart
- 🟢 **Nice to have**: Kan vente

### Hvordan bruke denne filen
1. Legg til nye ideer under riktig kategori
2. Marker som [x] når fullført
3. Kommenter ut eller flytt til "Completed" section når ferdig
4. Prioriter med emojis eller labels

### Completed Features
- ✅ Biometric authentication
- ✅ Admin dashboard (basic)
- ✅ GDPR compliance (basic)
- ✅ Activity tracking
- ✅ Equipment bottom sheet
- ✅ Avatar picker grid layout
- ✅ Day notes feature (implementert i plan mode)
