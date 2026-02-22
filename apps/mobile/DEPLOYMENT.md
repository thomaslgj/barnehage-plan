# 🚀 Deployment Guide - Flyt Mobile App

## CI/CD Overview

Vi bruker **EAS (Expo Application Services)** for bygging og deployment av mobilappen.

## 📱 Deployment Typer

### 1. **EAS Update (Over-The-Air)** - Anbefalt for de fleste oppdateringer
For endringer i JavaScript, TypeScript, styling eller assets (ingen native kode):

```bash
# Manuell deployment til production
eas update --branch production --message "Din commit-melding"

# Manuell deployment til preview
eas update --branch preview --message "Test ny feature"
```

**Automatisk:** GitHub Actions deployer automatisk til production når du merger til `main`.

✅ **Fordeler:**
- Rask deployment (1-5 minutter)
- Ingen app store review
- Brukere får oppdateringen neste gang de starter appen
- Gratis (ubegrenset)

❌ **Begrensninger:**
- Kan ikke endre native kode (expo config plugins, dependencies med native modules)
- Kan ikke endre app ikon, splash screen eller permissions

### 2. **Full Native Build** - For større endringer
For endringer som inkluderer:
- Nye expo plugins
- Oppdatert Expo SDK versjon
- Native modules (nye dependencies med native kode)
- App ikon, splash screen, permissions

```bash
# Build begge platformer for preview
eas build --platform all --profile preview

# Build for production (iOS)
eas build --platform ios --profile production

# Build for production (Android)
eas build --platform android --profile production

# Build og submit automatisk til App Store/Play Store
eas build --platform all --profile production --auto-submit
```

**Automatisk:**
- Preview builds kjører på pull requests
- Production builds må triggres manuelt via GitHub Actions

## 🔧 Setup (Engangsoppsett)

### 1. Installer EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login til Expo
```bash
eas login
```

### 3. Setup GitHub Secrets
Gå til GitHub repo → Settings → Secrets and variables → Actions, og legg til:

```
EXPO_TOKEN = <din-expo-access-token>
```

Få token her:
```bash
eas whoami
# Følg instruksjoner for å generere Personal Access Token på expo.dev
```

### 4. (Første gang) Configure credentials
```bash
# For iOS (trenger Apple Developer Account)
eas credentials

# For Android (genereres automatisk eller bruk din egen keystore)
eas credentials
```

## 📋 Vanlige Workflows

### 🐛 Bug Fix eller Feature (kun JS/CSS)
1. Gjør endringer i koden
2. Commit og push til `main`
3. GitHub Actions deployer automatisk via EAS Update
4. ✅ Ferdig! Brukere får oppdateringen ved neste app-start

### 🔧 Endring med Native Kode
1. Gjør endringer i koden
2. Commit og push til branch
3. Opprett Pull Request
4. GitHub Actions bygger preview build
5. Test preview build
6. Merge til `main`
7. Gå til GitHub → Actions → "Mobile Release"
8. Klikk "Run workflow", velg platform og om du vil submitte
9. Vent på bygg (15-30 min)
10. ✅ Last ned IPA/APK eller vent på App Store/Play Store godkjenning

### 📤 Submit til App Stores Manuelt
```bash
# Etter at build er ferdig:
eas submit --platform ios --latest
eas submit --platform android --latest
```

## 🔄 Branch Strategi

- `main` - Production (auto-deploy med EAS Update)
- `v2` - Staging/Development
- Feature branches → Pull Request → `main`

## 📊 Monitoring

- **Build status:** https://expo.dev/accounts/[username]/projects/flyt/builds
- **Update status:** https://expo.dev/accounts/[username]/projects/flyt/updates
- **GitHub Actions:** https://github.com/thomaslgj/flyt/actions

## 🆘 Troubleshooting

### "Build failed" på iOS
- Sjekk at bundle identifier `com.thomaslg.flyt` er unik
- Sjekk Apple Developer credentials i `eas credentials`
- Sjekk at du har gyldig provisioning profile

### "Update not appearing" for brukere
- Sjekk at branch name matcher i eas.json og app config
- Brukere må restarte appen for å få oppdateringen
- Sjekk at det ikke er native endringer (krever full build)

### "Build taking too long"
- iOS builds tar vanligvis 20-30 min
- Android builds tar 15-25 min
- Priority builds (paid plans) er raskere

## 💰 EAS Pricing

- **Free tier:**
  - Ubegrenset EAS Update (OTA)
  - 30 builds per måned
  - Standard build hastighet

- **Production tier ($29/mnd):**
  - 100+ builds per måned
  - Priority builds (raskere)
  - Bedre support

For Flyt: **Free tier er nok** siden vi bruker EAS Update for de fleste deployments.

## 🔗 Nyttige Lenker

- [EAS Documentation](https://docs.expo.dev/eas/)
- [EAS Update Guide](https://docs.expo.dev/eas-update/introduction/)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Expo Project Dashboard](https://expo.dev/accounts/[username]/projects/flyt)
